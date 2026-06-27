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
#[serde(rename_all = "camelCase")]
pub struct CurseForgeModLoader {
  pub id: String,
  pub primary: bool,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurseForgeMinecraft {
  pub version: String,
  pub mod_loaders: Vec<CurseForgeModLoader>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurseForgeFile {
  pub project_id: u32,
  pub file_id: u32,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurseForgeManifest {
  pub manifest_type: String,
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

#[async_trait]
impl ModpackManifest for CurseForgeManifest {
  fn from_archive(file: &File) -> SJMCLResult<Self> {
    let mut archive = ZipArchive::new(file)?;
    let mut manifest_file = archive.by_name("manifest.json")?;
    let mut manifest_content = String::new();
    manifest_file.read_to_string(&mut manifest_content)?;
    let mut manifest: CurseForgeManifest =
      serde_json::from_str(&manifest_content).inspect_err(|e| {
        eprintln!("Failed to parse CurseForge manifest.json: {:?}", e);
      })?;

    // Validate manifest type
    if manifest.manifest_type != "minecraftModpack" {
      return Err(InstanceError::ModpackManifestParseError.into());
    }

    manifest.overrides_path = "overrides/".to_string();
    Ok(manifest)
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
      if loader.primary {
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
