use std::fs::File;
use std::io::Read;
use std::path::Path;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use zip::ZipArchive;

use crate::error::SJMCLResult;
use crate::instance::helpers::modpack::misc::{ModpackManifest, ModpackMetaInfo};
use crate::instance::models::misc::{InstanceError, ModLoader, ModLoaderType};
use crate::resource::models::OtherResourceSource;
use crate::tasks::PTaskParam;

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CurseForgeModLoader {
  pub id: String,
  #[serde(rename = "primary")]
  pub is_primary: bool,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CurseForgeMinecraft {
  pub version: String,
  #[serde(rename = "modLoaders")]
  pub mod_loaders: Vec<CurseForgeModLoader>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CurseForgeFile {
  #[serde(rename = "projectID")]
  pub project_id: u32,
  #[serde(rename = "fileID")]
  pub file_id: u32,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct CurseForgeManifest {
  #[serde(rename = "manifestType")]
  pub manifest_type: String,
  #[serde(rename = "manifestVersion")]
  pub manifest_version: u32,
  pub name: String,
  pub version: String,
  pub author: String,
  pub minecraft: CurseForgeMinecraft,
  pub files: Vec<CurseForgeFile>,
  #[serde(skip)]
  pub overrides_path: String,
}

impl CurseForgeManifest {
  fn parse_mod_loader(loader_id: &str) -> SJMCLResult<(ModLoaderType, String)> {
    if let Some(stripped) = loader_id.strip_prefix("forge-") {
      Ok((ModLoaderType::Forge, stripped.to_string()))
    } else if let Some(stripped) = loader_id.strip_prefix("fabric-") {
      Ok((ModLoaderType::Fabric, stripped.to_string()))
    } else if let Some(stripped) = loader_id.strip_prefix("neoforge-") {
      Ok((ModLoaderType::NeoForge, stripped.to_string()))
    } else {
      Err(InstanceError::UnsupportedModLoader.into())
    }
  }
}

fn find_manifest_in_archive<R: std::io::Read + std::io::Seek>(
  archive: &mut ZipArchive<R>,
) -> Option<String> {
  for i in 0..archive.len() {
    if let Ok(file) = archive.by_index(i) {
      let name = file.name().to_string();
      if name.ends_with("manifest.json") && !name.contains('/') {
        return Some(name);
      }
    }
  }
  for i in 0..archive.len() {
    if let Ok(file) = archive.by_index(i) {
      let name = file.name().to_string();
      if name.ends_with("manifest.json") {
        return Some(name);
      }
    }
  }
  None
}

#[async_trait]
impl ModpackManifest for CurseForgeManifest {
  fn from_archive(file: &File) -> SJMCLResult<Self> {
    let mut archive = ZipArchive::new(file)?;
    log::debug!("Zip archive has {} files", archive.len());

    let manifest_path = find_manifest_in_archive(&mut archive);
    let manifest_path = match manifest_path {
      Some(p) => p,
      None => {
        log::debug!("manifest.json not found in archive, listing files:");
        for i in 0..archive.len() {
          if let Ok(file) = archive.by_index(i) {
            log::debug!("  - {}", file.name());
          }
        }
        return Err(InstanceError::ModpackManifestParseError.into());
      }
    };
    log::debug!("Found manifest.json at: {}", manifest_path);

    let mut manifest_file = archive.by_name(&manifest_path)?;
    let mut manifest_content = String::new();
    manifest_file.read_to_string(&mut manifest_content)?;
    log::debug!("manifest.json content: {}", manifest_content);

    let manifest: CurseForgeManifest =
      serde_json::from_str(&manifest_content).inspect_err(|e| {
        log::error!("Failed to parse CurseForge manifest.json: {:?}", e);
      })?;

    if manifest.manifest_type != "minecraftModpack" {
      log::error!(
        "Invalid manifest type: {}, expected minecraftModpack",
        manifest.manifest_type
      );
      return Err(InstanceError::ModpackManifestParseError.into());
    }

    let overrides_path = if let Some(idx) = manifest_path.rfind('/') {
      format!("{}overrides/", &manifest_path[..idx + 1])
    } else {
      "overrides/".to_string()
    };
    log::debug!("Overrides path: {}", overrides_path);

    Ok(CurseForgeManifest {
      overrides_path,
      ..manifest
    })
  }

  async fn get_meta_info(&self, app: &AppHandle) -> SJMCLResult<ModpackMetaInfo> {
    let client_version = self.get_client_version()?;
    let mod_loader = if let Ok((loader_type, version)) = self.get_mod_loader_type_version() {
      Some(
        ModLoader {
          loader_type,
          version,
          ..Default::default()
        }
        .with_branch(app, client_version.clone())
        .await?,
      )
    } else {
      None
    };
    Ok(ModpackMetaInfo {
      name: self.name.clone(),
      version: self.version.clone(),
      description: None,
      author: Some(self.author.clone()),
      modpack_source: OtherResourceSource::CurseForge,
      client_version,
      mod_loader,
    })
  }

  fn get_client_version(&self) -> SJMCLResult<String> {
    Ok(self.minecraft.version.clone())
  }

  fn get_mod_loader_type_version(&self) -> SJMCLResult<(ModLoaderType, String)> {
    for loader in &self.minecraft.mod_loaders {
      if loader.is_primary {
        return Self::parse_mod_loader(&loader.id);
      }
    }
    // If no primary loader found, try the first one
    if let Some(loader) = self.minecraft.mod_loaders.first() {
      return Self::parse_mod_loader(&loader.id);
    }
    Err(InstanceError::ModpackManifestParseError.into())
  }

  async fn get_download_params(
    &self,
    _app: &AppHandle,
    _instance_path: &Path,
  ) -> SJMCLResult<Vec<PTaskParam>> {
    // CurseForge modpacks require API access to download mods
    // Since we removed CurseForge source, we cannot automatically download mods
    // The mods should be included in the overrides folder or user needs to manually download
    log::warn!(
      "CurseForge modpack detected with {} files. Automatic mod download requires CurseForge API access.",
      self.files.len()
    );
    Ok(Vec::new())
  }

  fn get_overrides_path(&self) -> String {
    self.overrides_path.clone()
  }
}
