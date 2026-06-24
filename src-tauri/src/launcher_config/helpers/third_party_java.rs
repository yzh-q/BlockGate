use crate::error::{SJMCLError, SJMCLResult};
use crate::launcher_config::models::LauncherConfig;
use crate::tasks::download::DownloadParam;
use crate::tasks::PTaskParam;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use tauri_plugin_http::reqwest;

/// Third-party Java vendor type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, strum_macros::Display)]
#[serde(rename_all = "camelCase")]
#[strum(serialize_all = "lowercase")]
pub enum JavaVendor {
  Zulu,
  BellSoft,
  Temurin,
}

/// Third-party Java release info
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThirdPartyJavaRelease {
  pub vendor: JavaVendor,
  pub major_version: i32,
  pub full_version: String,
  pub is_lts: bool,
  pub is_jre: bool,
  pub architecture: String,
  pub os: String,
  pub download_url: String,
  pub file_name: String,
  pub file_size: u64,
  pub sha1: Option<String>,
}

/// Fetch available Java releases from Zulu API
pub async fn fetch_zulu_java_releases(
  app: &AppHandle,
  major_version: Option<i32>,
) -> SJMCLResult<Vec<ThirdPartyJavaRelease>> {
  let config = app.state::<Mutex<LauncherConfig>>().lock()?.clone();
  let client = app.state::<reqwest::Client>();

  let os = match config.basic_info.os_type.as_str() {
    "windows" => "windows",
    "macos" => "macos",
    "linux" => "linux",
    _ => "linux",
  };

  let arch = match config.basic_info.arch.as_str() {
    "x86_64" => "x64",
    "aarch64" => "arm",
    _ => "x64",
  };

  // Zulu API endpoint
  let url = "https://api.azul.com/metadata/v1/zulu/packages";

  // Build query params
  let mut request = client.get(url).query(&[
    ("os", os),
    ("arch", arch),
    ("archive_type", "tar.gz"),
    ("java_package_type", "jre"),
    ("latest", "true"),
  ]);

  // Add version filter if specified
  if let Some(version) = major_version {
    request = request.query(&[("java_version", &version.to_string())]);
  }

  let response = request
    .send()
    .await
    .map_err(|e| SJMCLError(format!("Failed to fetch Zulu Java: {}", e)))?;

  let packages: Vec<ZuluPackage> = response
    .json()
    .await
    .map_err(|e| SJMCLError(format!("Failed to parse Zulu response: {}", e)))?;

  let releases: Vec<ThirdPartyJavaRelease> = packages
    .iter()
    .filter_map(|pkg| {
      let major_version = pkg.java_version.first().copied().unwrap_or(0);
      let is_lts = [8, 11, 17, 21, 25].contains(&major_version);

      Some(ThirdPartyJavaRelease {
        vendor: JavaVendor::Zulu,
        major_version,
        full_version: format!(
          "{}.{}.{}",
          pkg.java_version.first().unwrap_or(&0),
          pkg.java_version.get(1).unwrap_or(&0),
          pkg.java_version.get(2).unwrap_or(&0)
        ),
        is_lts,
        is_jre: pkg.name.contains("jre"),
        architecture: arch.to_string(),
        os: os.to_string(),
        download_url: pkg.download_url.clone(),
        file_name: pkg.name.clone(),
        file_size: 0, // Zulu API doesn't provide size
        sha1: None,
      })
    })
    .collect();

  Ok(releases)
}

/// Fetch available Java releases from BellSoft API
pub async fn fetch_bellsoft_java_releases(
  app: &AppHandle,
  major_version: Option<i32>,
) -> SJMCLResult<Vec<ThirdPartyJavaRelease>> {
  let config = app.state::<Mutex<LauncherConfig>>().lock()?.clone();
  let client = app.state::<reqwest::Client>();

  let os = match config.basic_info.os_type.as_str() {
    "windows" => "windows",
    "macos" => "macos",
    "linux" => "linux",
    _ => "linux",
  };

  let arch = match config.basic_info.arch.as_str() {
    "x86_64" => "x86",
    "aarch64" => "arm",
    _ => "x86",
  };

  // BellSoft API endpoint
  let url = "https://api.bell-sw.com/v1/liberica/releases";

  // Build query params
  let mut request = client.get(url).query(&[
    ("os", os),
    ("arch", arch),
    ("packageType", "tar.gz"),
    ("bitness", "64"),
    ("installationType", "archive"),
  ]);

  // Add version filter if specified
  if let Some(version) = major_version {
    request = request.query(&[("version", &format!("{}+", version))]);
  }

  let response = request
    .send()
    .await
    .map_err(|e| SJMCLError(format!("Failed to fetch BellSoft Java: {}", e)))?;

  let releases: Vec<BellSoftRelease> = response
    .json()
    .await
    .map_err(|e| SJMCLError(format!("Failed to parse BellSoft response: {}", e)))?;

  let filtered: Vec<ThirdPartyJavaRelease> = releases
    .iter()
    .filter(|r| r.bundle_type.contains("jre") || r.bundle_type.contains("jdk"))
    .filter(|r| r.ga) // Only GA releases
    .map(|r| {
      let is_lts = [8, 11, 17, 21, 25].contains(&r.feature_version);
      ThirdPartyJavaRelease {
        vendor: JavaVendor::BellSoft,
        major_version: r.feature_version,
        full_version: r.version.clone(),
        is_lts,
        is_jre: r.bundle_type.contains("jre") && !r.bundle_type.contains("jdk"),
        architecture: arch.to_string(),
        os: os.to_string(),
        download_url: r.download_url.clone(),
        file_name: r.filename.clone(),
        file_size: r.size,
        sha1: Some(r.sha1.clone()),
      }
    })
    .collect();

  Ok(filtered)
}

/// Fetch available Java releases from Temurin (Adoptium) API
pub async fn fetch_temurin_java_releases(
  app: &AppHandle,
  major_version: Option<i32>,
) -> SJMCLResult<Vec<ThirdPartyJavaRelease>> {
  let config = app.state::<Mutex<LauncherConfig>>().lock()?.clone();
  let client = app.state::<reqwest::Client>();

  let os = match config.basic_info.os_type.as_str() {
    "windows" => "windows",
    "macos" => "mac",
    "linux" => "linux",
    _ => "linux",
  };

  let arch = match config.basic_info.arch.as_str() {
    "x86_64" => "x64",
    "aarch64" => "aarch64",
    _ => "x64",
  };

  // Temurin API endpoint - get latest releases
  let version = major_version.unwrap_or(17);
  let url = format!(
    "https://api.adoptium.net/v3/assets/latest/{}/hotspot",
    version
  );

  let response = client
    .get(&url)
    .query(&[("architecture", arch), ("os", os), ("image_type", "jre")])
    .send()
    .await
    .map_err(|e| SJMCLError(format!("Failed to fetch Temurin Java: {}", e)))?;

  let assets: Vec<TemurinAsset> = response
    .json()
    .await
    .map_err(|e| SJMCLError(format!("Failed to parse Temurin response: {}", e)))?;

  let releases: Vec<ThirdPartyJavaRelease> = assets
    .iter()
    .filter_map(|asset| {
      let binary = &asset.binary;
      let package = &binary.package;

      Some(ThirdPartyJavaRelease {
        vendor: JavaVendor::Temurin,
        major_version: asset.version.major,
        full_version: asset.release_name.clone(),
        is_lts: [8, 11, 17, 21, 25].contains(&asset.version.major),
        is_jre: binary.image_type == "jre",
        architecture: arch.to_string(),
        os: os.to_string(),
        download_url: package.link.clone(),
        file_name: package.name.clone(),
        file_size: package.size,
        sha1: Some(package.checksum.clone()),
      })
    })
    .collect();

  Ok(releases)
}

/// Build download params for third-party Java
pub async fn build_third_party_java_download_params(
  app: &AppHandle,
  release: &ThirdPartyJavaRelease,
) -> SJMCLResult<Vec<PTaskParam>> {
  let runtime_dir = app.path().resolve(
    format!(
      "runtime/java-{}-{}",
      release.major_version,
      release.vendor.to_string().to_lowercase()
    ),
    tauri::path::BaseDirectory::AppData,
  )?;

  // Download the archive file
  let archive_path = runtime_dir.join(&release.file_name);

  Ok(vec![
    PTaskParam::Download(DownloadParam {
      src: release
        .download_url
        .parse()
        .map_err(|_| SJMCLError(format!("Invalid download URL: {}", release.download_url)))?,
      dest: archive_path.clone(),
      filename: Some(release.file_name.clone()),
      sha1: release.sha1.clone(),
    }),
    // Note: Extraction will be handled separately after download completes
  ])
}

// --- API Response Types ---

#[derive(Debug, Deserialize)]
struct ZuluPackage {
  download_url: String,
  name: String,
  java_version: Vec<i32>,
}

#[derive(Debug, Deserialize)]
struct BellSoftRelease {
  download_url: String,
  filename: String,
  version: String,
  feature_version: i32,
  bundle_type: String,
  size: u64,
  sha1: String,
  ga: bool,
}

#[derive(Debug, Deserialize)]
struct TemurinAsset {
  release_name: String,
  version: TemurinVersion,
  binary: TemurinBinary,
}

#[derive(Debug, Deserialize)]
struct TemurinVersion {
  major: i32,
}

#[derive(Debug, Deserialize)]
struct TemurinBinary {
  image_type: String,
  package: TemurinPackage,
}

#[derive(Debug, Deserialize)]
struct TemurinPackage {
  link: String,
  name: String,
  size: u64,
  checksum: String,
}
