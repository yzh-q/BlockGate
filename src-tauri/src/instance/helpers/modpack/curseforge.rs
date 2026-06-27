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

#[cfg(test)]
mod tests {
  use super::*;
  use std::io::{Cursor, Seek, Write};
  use tempfile::NamedTempFile;
  use zip::write::FileOptions;
  use zip::ZipWriter;

  #[test]
  fn test_parse_curseforge_manifest_json() {
    let json_str = r#"{
      "manifestType": "minecraftModpack",
      "manifestVersion": 1,
      "name": "测试整合包",
      "version": "1.0",
      "author": "测试作者",
      "minecraft": {
        "version": "1.20.1",
        "modLoaders": [
          {
            "id": "forge-47.2.0",
            "primary": true
          }
        ]
      },
      "files": [
        {
          "projectID": 123,
          "fileID": 456
        }
      ]
    }"#;

    let manifest: CurseForgeManifest = serde_json::from_str(json_str).unwrap();

    assert_eq!(manifest.manifest_type, "minecraftModpack");
    assert_eq!(manifest.manifest_version, 1);
    assert_eq!(manifest.name, "测试整合包");
    assert_eq!(manifest.version, "1.0");
    assert_eq!(manifest.author, "测试作者");
    assert_eq!(manifest.minecraft.version, "1.20.1");
    assert_eq!(manifest.minecraft.mod_loaders.len(), 1);
    assert_eq!(manifest.minecraft.mod_loaders[0].id, "forge-47.2.0");
    assert!(manifest.minecraft.mod_loaders[0].is_primary);
    assert_eq!(manifest.files.len(), 1);
    assert_eq!(manifest.files[0].project_id, 123);
    assert_eq!(manifest.files[0].file_id, 456);
  }

  #[test]
  fn test_parse_curseforge_manifest_with_multiple_loaders() {
    let json_str = r#"{
      "manifestType": "minecraftModpack",
      "manifestVersion": 1,
      "name": "Test Pack",
      "version": "2.0",
      "author": "Test Author",
      "minecraft": {
        "version": "1.19.2",
        "modLoaders": [
          {
            "id": "fabric-0.14.21",
            "primary": true
          },
          {
            "id": "forge-43.2.0",
            "primary": false
          }
        ]
      },
      "files": []
    }"#;

    let manifest: CurseForgeManifest = serde_json::from_str(json_str).unwrap();

    assert_eq!(manifest.minecraft.mod_loaders.len(), 2);
    assert_eq!(manifest.minecraft.mod_loaders[0].id, "fabric-0.14.21");
    assert!(manifest.minecraft.mod_loaders[0].is_primary);
    assert_eq!(manifest.minecraft.mod_loaders[1].id, "forge-43.2.0");
    assert!(!manifest.minecraft.mod_loaders[1].is_primary);
  }

  #[test]
  fn test_parse_mod_loader_forge() {
    let result = CurseForgeManifest::parse_mod_loader("forge-47.2.0");
    assert!(result.is_ok());
    let (loader_type, version) = result.unwrap();
    assert_eq!(loader_type, ModLoaderType::Forge);
    assert_eq!(version, "47.2.0");
  }

  #[test]
  fn test_parse_mod_loader_fabric() {
    let result = CurseForgeManifest::parse_mod_loader("fabric-0.14.21");
    assert!(result.is_ok());
    let (loader_type, version) = result.unwrap();
    assert_eq!(loader_type, ModLoaderType::Fabric);
    assert_eq!(version, "0.14.21");
  }

  #[test]
  fn test_parse_mod_loader_neoforge() {
    let result = CurseForgeManifest::parse_mod_loader("neoforge-47.1.0");
    assert!(result.is_ok());
    let (loader_type, version) = result.unwrap();
    assert_eq!(loader_type, ModLoaderType::NeoForge);
    assert_eq!(version, "47.1.0");
  }

  #[test]
  fn test_parse_mod_loader_invalid() {
    let result = CurseForgeManifest::parse_mod_loader("invalid-loader");
    assert!(result.is_err());
  }

  #[test]
  fn test_from_archive_with_valid_manifest() {
    let json_content = r#"{
      "manifestType": "minecraftModpack",
      "manifestVersion": 1,
      "name": "测试整合包",
      "version": "1.0",
      "author": "测试作者",
      "minecraft": {
        "version": "1.20.1",
        "modLoaders": [
          {
            "id": "forge-47.2.0",
            "primary": true
          }
        ]
      },
      "files": [
        {
          "projectID": 123,
          "fileID": 456
        }
      ]
    }"#;

    // 创建临时 zip 文件
    let mut temp_file = NamedTempFile::new().unwrap();
    let cursor = Cursor::new(Vec::new());
    let mut zip_writer = ZipWriter::new(cursor);
    let options: FileOptions<()> = FileOptions::default();

    // 在 zip 根目录添加 manifest.json
    zip_writer.start_file("manifest.json", options).unwrap();
    zip_writer.write_all(json_content.as_bytes()).unwrap();
    let zip_data = zip_writer.finish().unwrap().into_inner();

    // 将 zip 数据写入临时文件
    temp_file.write_all(&zip_data).unwrap();
    temp_file.flush().unwrap();
    temp_file.seek(std::io::SeekFrom::Start(0)).unwrap();

    // 测试 from_archive
    let file = temp_file.reopen().unwrap();
    let manifest = CurseForgeManifest::from_archive(&file).unwrap();

    assert_eq!(manifest.manifest_type, "minecraftModpack");
    assert_eq!(manifest.name, "测试整合包");
    assert_eq!(manifest.version, "1.0");
    assert_eq!(manifest.author, "测试作者");
    assert_eq!(manifest.minecraft.version, "1.20.1");
    assert_eq!(manifest.overrides_path, "overrides/");
  }

  #[test]
  fn test_from_archive_with_nested_manifest() {
    let json_content = r#"{
      "manifestType": "minecraftModpack",
      "manifestVersion": 1,
      "name": "Nested Pack",
      "version": "1.0",
      "author": "Test",
      "minecraft": {
        "version": "1.20.1",
        "modLoaders": []
      },
      "files": []
    }"#;

    // 创建临时 zip 文件，manifest 在子目录中
    let mut temp_file = NamedTempFile::new().unwrap();
    let cursor = Cursor::new(Vec::new());
    let mut zip_writer = ZipWriter::new(cursor);
    let options: FileOptions<()> = FileOptions::default();

    // 在子目录中添加 manifest.json
    zip_writer
      .start_file("subfolder/manifest.json", options)
      .unwrap();
    zip_writer.write_all(json_content.as_bytes()).unwrap();
    let zip_data = zip_writer.finish().unwrap().into_inner();

    // 将 zip 数据写入临时文件
    temp_file.write_all(&zip_data).unwrap();
    temp_file.flush().unwrap();
    temp_file.seek(std::io::SeekFrom::Start(0)).unwrap();

    // 测试 from_archive
    let file = temp_file.reopen().unwrap();
    let manifest = CurseForgeManifest::from_archive(&file).unwrap();

    assert_eq!(manifest.name, "Nested Pack");
    assert_eq!(manifest.overrides_path, "subfolder/overrides/");
  }

  #[test]
  fn test_from_archive_missing_manifest() {
    // 创建没有 manifest.json 的空 zip 文件
    let mut temp_file = NamedTempFile::new().unwrap();
    let cursor = Cursor::new(Vec::new());
    let mut zip_writer = ZipWriter::new(cursor);
    let options: FileOptions<()> = FileOptions::default();

    zip_writer.start_file("other.txt", options).unwrap();
    zip_writer.write_all(b"test content").unwrap();
    let zip_data = zip_writer.finish().unwrap().into_inner();

    // 将 zip 数据写入临时文件
    temp_file.write_all(&zip_data).unwrap();
    temp_file.flush().unwrap();
    temp_file.seek(std::io::SeekFrom::Start(0)).unwrap();

    // 测试 from_archive 应该失败
    let file = temp_file.reopen().unwrap();
    let result = CurseForgeManifest::from_archive(&file);
    assert!(result.is_err());
  }

  #[test]
  fn test_from_archive_invalid_manifest_type() {
    let json_content = r#"{
      "manifestType": "invalidType",
      "manifestVersion": 1,
      "name": "Test",
      "version": "1.0",
      "author": "Test",
      "minecraft": {
        "version": "1.20.1",
        "modLoaders": []
      },
      "files": []
    }"#;

    // 创建临时 zip 文件
    let mut temp_file = NamedTempFile::new().unwrap();
    let cursor = Cursor::new(Vec::new());
    let mut zip_writer = ZipWriter::new(cursor);
    let options: FileOptions<()> = FileOptions::default();

    zip_writer.start_file("manifest.json", options).unwrap();
    zip_writer.write_all(json_content.as_bytes()).unwrap();
    let zip_data = zip_writer.finish().unwrap().into_inner();

    // 将 zip 数据写入临时文件
    temp_file.write_all(&zip_data).unwrap();
    temp_file.flush().unwrap();
    temp_file.seek(std::io::SeekFrom::Start(0)).unwrap();

    // 测试 from_archive 应该失败（manifest type 不是 minecraftModpack）
    let file = temp_file.reopen().unwrap();
    let result = CurseForgeManifest::from_archive(&file);
    assert!(result.is_err());
  }

  #[test]
  fn test_parse_real_modpack_jian_yu_wang_guo() {
    // 测试真实的整合包文件: 剑与王国-1.19.zip
    let zip_path = r#"C:\Users\sadas\Desktop\剑与王国-1.19.zip"#;
    let file = std::fs::File::open(zip_path).expect("Failed to open zip file");

    let manifest = CurseForgeManifest::from_archive(&file).expect("Failed to parse manifest");

    // 验证 manifestType 是否为 "minecraftModpack"
    assert_eq!(manifest.manifest_type, "minecraftModpack");

    // 验证 name 是否为 "剑与王国"
    // 注意：由于 zip 文件名是 "剑与王国-1.19.zip"，manifest 中应该是对应的中文名称
    assert_eq!(manifest.name, "剑与王国");

    // 验证 minecraft.version 是否为 "1.20.1"
    assert_eq!(manifest.minecraft.version, "1.20.1");

    // 验证 modLoaders 是否包含 forge-47.4.20
    let has_forge_47_4_20 = manifest
      .minecraft
      .mod_loaders
      .iter()
      .any(|loader| loader.id == "forge-47.4.20");
    assert!(
      has_forge_47_4_20,
      "Expected modLoaders to contain forge-47.4.20"
    );

    // 验证 primary modLoader
    let primary_loader = manifest
      .minecraft
      .mod_loaders
      .iter()
      .find(|loader| loader.is_primary);
    assert!(primary_loader.is_some());
    assert_eq!(primary_loader.unwrap().id, "forge-47.4.20");

    println!("Successfully parsed modpack: {}", manifest.name);
    println!("Minecraft version: {}", manifest.minecraft.version);
    println!("Mod loaders: {:?}", manifest.minecraft.mod_loaders);
    println!("Overrides path: {}", manifest.overrides_path);
    println!("Files count: {}", manifest.files.len());
  }
}
