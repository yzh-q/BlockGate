use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};

use async_trait::async_trait;
use reqwest::Url;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest as tauri_reqwest;
use zip::ZipArchive;

use crate::error::SJMCLResult;
use crate::instance::helpers::modpack::misc::{ModpackManifest, ModpackMetaInfo};
use crate::instance::models::misc::{InstanceError, ModLoader, ModLoaderType};
use crate::resource::models::OtherResourceSource;
use crate::tasks::download::DownloadParam;
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

async fn download_curseforge_mod(
  client: &tauri_reqwest::Client,
  file: &CurseForgeFile,
  game_version: &str,
) -> SJMCLResult<(Url, String)> {
  let bmcl_url = format!(
    "https://bmclapi2.bangbang93.com/curseforge/mods/{}/files/{}/download",
    file.project_id, file.file_id
  );

  match client.get(&bmcl_url).send().await {
    Ok(response) => {
      if response.status().is_success() {
        let url = Url::parse(&bmcl_url).map_err(|_| InstanceError::ModpackManifestParseError)?;
        if let Some(filename) = response.headers().get(tauri_reqwest::header::CONTENT_DISPOSITION) {
          if let Ok(filename_str) = filename.to_str() {
            if let Some(start) = filename_str.find("filename=") {
              let filename_clean = filename_str[start + 9..].trim_matches('"');
              return Ok((url, filename_clean.to_string()));
            }
          }
        }
        return Ok((url, format!("mod_{}_{}.jar", file.project_id, file.file_id)));
      }
    }
    Err(e) => {
      log::warn!("[CurseForge] BMCLAPI request failed: {:?}", e);
    }
  }

  let cf_url = format!(
    "https://addons-ecs.forgesvc.net/api/v2/addon/{}/file/{}/download-url",
    file.project_id, file.file_id
  );

  match client.get(&cf_url).send().await {
    Ok(response) => {
      if response.status().is_success() {
        if let Ok(download_url_str) = response.text().await {
          let download_url = Url::parse(&download_url_str.trim())
            .map_err(|_| InstanceError::ModpackManifestParseError)?;
          let filename = download_url
            .path_segments()
            .and_then(|segments| segments.last())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("mod_{}_{}.jar", file.project_id, file.file_id));
          return Ok((download_url, filename));
        }
      }
    }
    Err(e) => {
      log::warn!("[CurseForge] CurseForge API request failed: {:?}", e);
    }
  }

  Err(InstanceError::ModpackManifestParseError.into())
}

#[async_trait]
impl ModpackManifest for CurseForgeManifest {
  fn from_archive(file: &File) -> SJMCLResult<Self> {
    let mut archive = ZipArchive::new(file)?;
    log::info!("[CurseForge] Zip archive has {} files", archive.len());

    let manifest_path = find_manifest_in_archive(&mut archive);
    let manifest_path = match manifest_path {
      Some(p) => p,
      None => {
        log::info!("[CurseForge] manifest.json not found in archive, listing files:");
        for i in 0..archive.len() {
          if let Ok(file) = archive.by_index(i) {
            log::info!("[CurseForge]   - {}", file.name());
          }
        }
        return Err(InstanceError::ModpackManifestParseError.into());
      }
    };
    log::info!("[CurseForge] Found manifest.json at: {}", manifest_path);

    let mut manifest_file = archive.by_name(&manifest_path)?;
    let mut manifest_content = String::new();
    manifest_file.read_to_string(&mut manifest_content)?;
    log::info!("[CurseForge] manifest.json content: {}", manifest_content);

    let manifest: CurseForgeManifest =
      serde_json::from_str(&manifest_content).inspect_err(|e| {
        log::error!("[CurseForge] Failed to parse manifest.json: {:?}", e);
      })?;

    if manifest.manifest_type != "minecraftModpack" {
      log::error!(
        "[CurseForge] Invalid manifest type: {}, expected minecraftModpack",
        manifest.manifest_type
      );
      return Err(InstanceError::ModpackManifestParseError.into());
    }

    let overrides_path = if let Some(idx) = manifest_path.rfind('/') {
      format!("{}overrides/", &manifest_path[..idx + 1])
    } else {
      "overrides/".to_string()
    };
    log::info!("[CurseForge] Overrides path: {}", overrides_path);

    Ok(CurseForgeManifest {
      overrides_path,
      ..manifest
    })
  }

  async fn get_meta_info(&self, app: &AppHandle) -> SJMCLResult<ModpackMetaInfo> {
    log::info!("[CurseForge] Getting meta info for modpack: {}", self.name);
    let client_version = self.get_client_version()?;
    log::info!("[CurseForge] Client version: {}", client_version);

    let mod_loader_result = self.get_mod_loader_type_version();
    let mod_loader = match mod_loader_result {
      Ok((loader_type, version)) => {
        log::info!(
          "[CurseForge] Mod loader: {:?} version: {}",
          loader_type,
          version
        );
        let loader = ModLoader {
          loader_type,
          version,
          ..Default::default()
        };
        match loader.with_branch(app, client_version.clone()).await {
          Ok(l) => Some(l),
          Err(e) => {
            log::error!("[CurseForge] Failed to get mod loader branch: {:?}", e);
            return Err(e);
          }
        }
      }
      Err(e) => {
        log::warn!("[CurseForge] No mod loader found: {:?}", e);
        None
      }
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
    if let Some(loader) = self.minecraft.mod_loaders.first() {
      return Self::parse_mod_loader(&loader.id);
    }
    Err(InstanceError::ModpackManifestParseError.into())
  }

  async fn get_download_params(
    &self,
    app: &AppHandle,
    instance_path: &Path,
  ) -> SJMCLResult<Vec<PTaskParam>> {
    let client = app.state::<tauri_reqwest::Client>();
    let mut params = Vec::new();

    log::info!("[CurseForge] Found {} files in manifest, trying to download...", self.files.len());

    for (idx, file) in self.files.iter().enumerate() {
      log::info!("[CurseForge] Processing file {}/{}: projectID={}, fileID={}", idx + 1, self.files.len(), file.project_id, file.file_id);

      match download_curseforge_mod(&client, file, &self.minecraft.version).await {
        Ok((download_url, file_name)) => {
          log::info!("[CurseForge] Found download URL for {}: {}", file_name, download_url);
          let mod_path = instance_path.join("mods");
          params.push(PTaskParam::Download(DownloadParam {
            src: download_url,
            dest: mod_path,
            filename: Some(file_name),
            sha1: None,
          }));
        }
        Err(e) => {
          log::warn!("[CurseForge] Failed to download mod projectID={}, fileID={}: {:?}", file.project_id, file.file_id, e);
        }
      }
    }

    log::info!("[CurseForge] Successfully added {} download tasks", params.len());
    Ok(params)
  }

  fn get_overrides_path(&self) -> String {
    self.overrides_path.clone()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs::File;

  #[test]
  fn test_parse_curseforge_manifest_json() {
    let json = r#"
    {
      "manifestType": "minecraftModpack",
      "manifestVersion": 1,
      "name": "测试整合包",
      "version": "1.0",
      "author": "测试作者",
      "minecraft": {
        "version": "1.20.1",
        "modLoaders": [
          {"id": "forge-47.2.0", "primary": true}
        ]
      },
      "files": [
        {"projectID": 123, "fileID": 456}
      ]
    }
    "#;
    let manifest: CurseForgeManifest = serde_json::from_str(json).unwrap();
    assert_eq!(manifest.name, "测试整合包");
    assert_eq!(manifest.manifest_type, "minecraftModpack");
    assert_eq!(manifest.minecraft.version, "1.20.1");
    assert_eq!(manifest.minecraft.mod_loaders[0].id, "forge-47.2.0");
    assert!(manifest.minecraft.mod_loaders[0].is_primary);
  }

  #[test]
  fn test_parse_real_modpack_jian_yu_wang_guo() {
    let zip_path = r#"C:\Users\sadas\Desktop\剑与王国-1.19.zip"#;
    let file = File::open(zip_path).expect("Failed to open zip file");
    let manifest = CurseForgeManifest::from_archive(&file).expect("Failed to parse manifest");
    assert_eq!(manifest.name, "剑与王国");
    assert_eq!(manifest.manifest_type, "minecraftModpack");
    assert_eq!(manifest.minecraft.version, "1.20.1");
    assert!(!manifest.files.is_empty());
  }
}
