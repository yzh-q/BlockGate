use crate::error::SJMCLResult;
use crate::launcher_config::commands::retrieve_custom_background_list;
use crate::launcher_config::models::{BasicInfo, GameConfig, GameDirectory, LauncherConfig};
use crate::partial::{PartialAccess, PartialUpdate};
use crate::utils::portable::extract_assets;
use crate::{APP_DATA_DIR, IS_PORTABLE};
use rand::Rng;
use semver::Version;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

impl LauncherConfig {
  pub fn setup_with_app(&mut self, app: &AppHandle) -> SJMCLResult<()> {
    // same as lib.rs
    let is_dev = cfg!(debug_assertions);
    let version = match (is_dev, app.package_info().version.to_string().as_str()) {
      (true, _) => "dev".to_string(),
      (false, "0.0.0") => "nightly".to_string(),
      (false, v) => v.to_string(),
    };

    // Set the default download cache directory if unset or not writable, and create it
    if self.download.cache.directory.as_os_str().is_empty()
      || fs::create_dir_all(&self.download.cache.directory).is_err()
    {
      self.download.cache.directory = app
        .path()
        .resolve::<PathBuf>("Download".into(), BaseDirectory::AppCache)?;
      fs::create_dir_all(&self.download.cache.directory)?;
    }

    // Random pick custom background image if enabled
    if self.appearance.background.random_custom {
      let app_handle = app.clone();
      match retrieve_custom_background_list(app_handle) {
        Ok(backgrounds) if !backgrounds.is_empty() => {
          let mut rng = rand::rng();
          let random_index = rng.random_range(0..backgrounds.len());
          self.appearance.background.choice = backgrounds[random_index].clone();
        }
        _ => {
          self.appearance.background.random_custom = false;
        }
      }
    }

    // Set default local game directories
    if self.local_game_directories.is_empty() {
      let mut dirs = Vec::new();

      #[cfg(target_os = "macos")]
      {
        if let Some(app_data_dir) = APP_DATA_DIR.get() {
          let app_data_subdir = app_data_dir.join("minecraft");
          dirs.push(GameDirectory {
            name: "APP_DATA_SUBDIR".to_string(),
            dir: app_data_subdir,
          });
        }
      }

      #[cfg(not(target_os = "macos"))]
      {
        if *IS_PORTABLE || cfg!(debug_assertions) {
          dirs.push(GameDirectory {
            name: "CURRENT_DIR".to_string(),
            dir: PathBuf::new(), // place holder, will be set later
          });
        } else {
          dirs.push(GameDirectory {
            name: "APP_DATA_SUBDIR".to_string(),
            dir: APP_DATA_DIR.get().unwrap().join(".minecraft"),
          });
        }
      }

      dirs.push(get_official_minecraft_directory(app));
      self.local_game_directories = dirs;
    }

    for game_dir in &mut self.local_game_directories {
      if game_dir.name == "CURRENT_DIR" {
        game_dir.dir = crate::EXE_DIR.join(".minecraft");
      }
      if (game_dir.name == "CURRENT_DIR" || game_dir.name == "APP_DATA_SUBDIR")
        && !game_dir.dir.exists()
      {
        let _ = fs::create_dir_all(&game_dir.dir);
      }
    }

    // Extract assets if the application is portable
    if *IS_PORTABLE {
      let _ = extract_assets(app);
    }

    self.basic_info = BasicInfo {
      launcher_version: version,
      platform: tauri_plugin_os::platform().to_string(),
      arch: tauri_plugin_os::arch().to_string(),
      os_type: tauri_plugin_os::type_().to_string(),
      platform_version: tauri_plugin_os::version().to_string(),
      is_portable: *IS_PORTABLE,
      // below set to default, will be updated later in first time calling `check_full_login_availability`
      is_china_mainland_ip: false,
      allow_full_login_feature: false,
    };

    // Cleanup old launcher versions on startup (for portable mode)
    if *IS_PORTABLE {
      if let Ok(cur_exe) = std::env::current_exe() {
        cleanup_old_launcher_versions(&self.basic_info.launcher_version, &cur_exe);
      }
    }

    Ok(())
  }

  pub fn replace_with_preserved(&mut self, new_config: LauncherConfig, preserved_fields: &[&str]) {
    // Preserve some fields when restore or import
    let mut backup_values = Vec::new();
    for key in preserved_fields {
      if let Ok(value) = self.access(key) {
        backup_values.push((key, value));
      }
    }

    *self = new_config;

    for (key, value) in backup_values {
      let _ = self.update(key, &value);
    }
  }
}

/// Cleanup old launcher versions on startup
/// Scans the launcher directory for older BlockGate versions and removes them
pub fn cleanup_old_launcher_versions(current_version: &str, current_exe: &PathBuf) {
  let current = match Version::parse(current_version) {
    Ok(v) => v,
    Err(_) => return, // Skip cleanup if current version can't be parsed
  };

  let exe_dir = match current_exe.parent() {
    Some(dir) => dir,
    None => return,
  };

  // Scan for BlockGate_*.exe files (excluding current exe and installer files)
  if let Ok(entries) = fs::read_dir(exe_dir) {
    for entry in entries.flatten() {
      let path = entry.path();
      if path.extension().and_then(|s| s.to_str()) != Some("exe") {
        continue;
      }

      // Skip if it's the current running exe
      if path == *current_exe {
        continue;
      }

      let filename = match path.file_name().and_then(|s| s.to_str()) {
        Some(name) => name,
        None => continue,
      };

      // Only process BlockGate_*.exe files (not BlockGate_setup.exe or BlockGate_portable.exe)
      if !filename.starts_with("BlockGate_")
        || filename.contains("_setup")
        || filename.contains("_portable")
      {
        continue;
      }

      // Extract version from filename: BlockGate_1.2.5.exe -> 1.2.5
      let version_str = if let Some(stripped) = filename.strip_prefix("BlockGate_") {
        stripped.trim_end_matches(".exe")
      } else {
        continue;
      };

      if let Ok(ver) = Version::parse(version_str) {
        if ver < current {
          log::info!(
            "Removing old launcher version: {} (current: {})",
            path.display(),
            current
          );
          if let Err(e) = fs::remove_file(&path) {
            log::warn!("Failed to remove old launcher {}: {}", path.display(), e);
          }
        }
      }
    }
  }
}

fn get_official_minecraft_directory(app: &AppHandle) -> GameDirectory {
  let minecraft_dir: PathBuf;

  #[cfg(target_os = "windows")]
  {
    // Windows: {FOLDERID_RoamingAppData}\.minecraft
    minecraft_dir = app
      .path()
      .resolve::<PathBuf>(".minecraft".into(), BaseDirectory::Data)
      .unwrap_or_else(|_| PathBuf::from(r"C:\Users\Default\AppData\Roaming\.minecraft"));
  }

  #[cfg(target_os = "macos")]
  {
    // macOS: ~/Library/Application Support/minecraft
    minecraft_dir = app
      .path()
      .resolve::<PathBuf>("minecraft".into(), BaseDirectory::Data)
      .unwrap_or_else(|_| PathBuf::from("/Users/Shared/Library/Application Support/minecraft"));
  }

  #[cfg(target_os = "linux")]
  {
    // Linux: ~/.minecraft
    minecraft_dir = app
      .path()
      .resolve::<PathBuf>(".minecraft".into(), BaseDirectory::Home)
      .unwrap_or_else(|_| PathBuf::from("/home/user/.minecraft"));
  }

  GameDirectory {
    name: "OFFICIAL_DIR".to_string(),
    dir: minecraft_dir,
  }
}

pub fn get_global_game_config(app: &AppHandle) -> GameConfig {
  app
    .state::<Mutex<LauncherConfig>>()
    .lock()
    .unwrap()
    .global_game_config
    .clone()
}
