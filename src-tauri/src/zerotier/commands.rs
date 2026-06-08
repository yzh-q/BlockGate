use crate::error::{SJMCLError, SJMCLResult};
use crate::tasks::{commands::schedule_progressive_task_group, PTaskParam};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, State, Url};

use crate::APP_DATA_DIR;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ZeroTierNetworkInfo {
  pub network_id: String,
  pub node_ip: Option<String>,
  pub is_connected: bool,
}

#[derive(Debug, Clone)]
pub struct ZeroTierState {
  pub current_network: Arc<Mutex<Option<ZeroTierNetworkInfo>>>,
  pub active_process: Arc<Mutex<Option<Child>>>,
  pub current_network_id: Arc<Mutex<Option<String>>>,
}

impl Default for ZeroTierState {
  fn default() -> Self {
    Self {
      current_network: Arc::new(Mutex::new(None)),
      active_process: Arc::new(Mutex::new(None)),
      current_network_id: Arc::new(Mutex::new(None)),
    }
  }
}

fn generate_network_id() -> String {
  let chars: Vec<char> = "0123456789abcdef".chars().collect();
  let mut rng = rand::rng();
  let parts: Vec<String> = (0..10)
    .map(|_| {
      (0..4)
        .map(|_| chars[rng.random_range(0..chars.len())])
        .collect::<String>()
    })
    .collect();
  parts.join("")
}

#[cfg(target_os = "windows")]
fn get_zerotier_install_path_from_registry() -> Option<PathBuf> {
  use winreg::enums::*;
  use winreg::RegKey;
  
  log::info!("Starting registry-based ZeroTier detection...");
  
  // 更全面的注册表路径列表
  let registry_paths = vec![
    (HKEY_LOCAL_MACHINE, r"SOFTWARE\ZeroTier, Inc.\ZeroTier One"),
    (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\ZeroTier, Inc.\ZeroTier One"),
    (HKEY_LOCAL_MACHINE, r"SOFTWARE\ZeroTier, Inc"),
    (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\ZeroTier, Inc"),
  ];
  
  for (root_key, path) in registry_paths.iter() {
    log::info!("Checking registry key: {:?} at path: {:?}", root_key, path);
    
    match RegKey::predef(*root_key).open_subkey(path) {
      Ok(key) => {
        log::info!("Successfully opened registry key: {:?}", path);
        
        // 尝试获取安装目录
        if let Ok(install_path) = key.get_value::<String, _>("InstallPath") {
          log::info!("Found InstallPath in registry: {}", install_path);
          
          let path = PathBuf::from(&install_path);
          // 尝试添加常见的可执行文件名
          for exe_name in &["zerotier-cli.exe", "zerotier-one.exe", "ZeroTier One.exe"] {
            let full_path = path.join(exe_name);
            if full_path.exists() {
              log::info!("Found executable at registry path: {}", full_path.display());
              return Some(full_path);
            } else {
              log::debug!("Not found at: {:?}", full_path);
            }
          }
          
          // 尝试直接读取目录内容
          if let Ok(entries) = fs::read_dir(&path) {
            log::info!("Scanning directory for executables: {:?}", path);
            for entry in entries.flatten() {
              let file_path = entry.path();
              if let Some(ext) = file_path.extension() {
                if ext == "exe" {
                  log::debug!("Found exe file: {:?}", file_path);
                  let file_name = file_path.file_name().unwrap_or_default().to_str();
                  if let Some(name) = file_name {
                    if name.to_lowercase().contains("zerotier") {
                      log::info!("Found ZeroTier exe in directory: {:?}", file_path);
                      return Some(file_path);
                    }
                  }
                }
              }
            }
          }
        }
        
        // 尝试获取 EXE 路径
        if let Ok(exe_path) = key.get_value::<String, _>("ExePath") {
          log::info!("Found ExePath in registry: {}", exe_path);
          let full_path = PathBuf::from(exe_path);
          if full_path.exists() {
            log::info!("Found ZeroTier EXE path in registry: {}", full_path.display());
            return Some(full_path);
          }
        }
        
        // 尝试枚举所有值看看有没有可用的
        for (name, value) in key.enum_values().flatten() {
          log::debug!("Registry value: {:?} -> {:?}", name, value);
        }
      }
      Err(e) => {
        log::debug!("Failed to open registry key {:?}: {:?}", path, e);
      }
    }
  }
  
  // 另外尝试查找卸载程序信息
  let uninstall_paths = vec![
    (HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
    (HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
  ];
  
  for (root_key, path) in uninstall_paths.iter() {
    if let Ok(keys) = RegKey::predef(*root_key).open_subkey(path) {
      for subkey in keys.enum_keys().flatten() {
        if subkey.to_lowercase().contains("zerotier") {
          if let Ok(key) = keys.open_subkey(&subkey) {
            if let Ok(install_loc) = key.get_value::<String, _>("InstallLocation") {
              log::info!("Found InstallLocation in Uninstall: {}", install_loc);
              let path = PathBuf::from(install_loc);
              for exe_name in &["zerotier-cli.exe", "zerotier-one.exe", "ZeroTier One.exe"] {
                let full_path = path.join(exe_name);
                if full_path.exists() {
                  log::info!("Found from uninstall info: {:?}", full_path);
                  return Some(full_path);
                }
              }
            }
          }
        }
      }
    }
  }
  
  log::info!("Registry-based detection complete, found nothing");
  None
}

#[cfg(target_os = "windows")]
fn get_zerotier_install_path() -> SJMCLResult<PathBuf> {
  log::info!("Starting ZeroTier comprehensive detection...");
  
  // 1. 首先尝试从注册表获取（最可靠）
  if let Some(path) = get_zerotier_install_path_from_registry() {
    log::info!("Registry detection succeeded! Found: {:?}", path);
    return Ok(path);
  } else {
    log::warn!("Registry detection failed, trying file system search");
  }
  
  // 2. 如果注册表没有，尝试常规路径
  let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
  let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
  let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| "".to_string());
  
  let mut paths: Vec<PathBuf> = Vec::new();
  
  // 添加所有可能的路径组合
  let program_dirs = vec![&program_files, &program_files_x86, "C:\\Program Files", "C:\\Program Files (x86)"];
  let subdirs = vec!["ZeroTier\\ZeroTier One", "ZeroTier One", "ZeroTier", "ZeroTier, Inc\\ZeroTier One"];
  let executables = vec!["zerotier-cli.exe", "zerotier-one.exe", "ZeroTier One.exe", "zerotier-cli.bat"];
  
  for dir in program_dirs.iter() {
    for subdir in subdirs.iter() {
      for exe in executables.iter() {
        paths.push(PathBuf::from(dir).join(subdir).join(exe));
      }
    }
  }
  
  // 也检查 LocalAppData
  if !local_app_data.is_empty() {
    for subdir in subdirs.iter() {
      for exe in executables.iter() {
        paths.push(PathBuf::from(&local_app_data).join(subdir).join(exe));
      }
    }
  }
  
  // 记录所有尝试的路径以便调试
  log::info!("Checking for ZeroTier installation in paths (will only list first 20 for brevity):");
  let paths_to_log = std::cmp::min(paths.len(), 20);
  for (i, path) in paths.iter().enumerate().take(paths_to_log) {
    let exists = path.exists();
    log::info!("  [{}] {}: {}", i, path.display(), if exists { "EXISTS" } else { "not found" });
  }
  
  for path in paths {
    if path.exists() {
      log::info!("Found ZeroTier at filesystem location: {}", path.display());
      return Ok(path);
    }
  }
  
  log::warn!("ZeroTier not found in any of the expected paths");
  Err(SJMCLError("ZeroTier not found".into()))
}

#[cfg(target_os = "windows")]
fn get_zerotier_service_path() -> SJMCLResult<PathBuf> {
  // 首先尝试从注册表获取，这是最可靠的方式
  if let Some(path) = get_zerotier_install_path_from_registry() {
    return Ok(path);
  }
  
  let program_files = std::env::var("ProgramFiles").unwrap_or_else(|_| "C:\\Program Files".to_string());
  let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_else(|_| "C:\\Program Files (x86)".to_string());
  
  let mut paths = Vec::new();
  
  let program_dirs = vec![&program_files, &program_files_x86, "C:\\Program Files", "C:\\Program Files (x86)"];
  let subdirs = vec!["ZeroTier\\ZeroTier One", "ZeroTier One", "ZeroTier"];
  let executables = vec!["ZeroTier One.exe", "zerotier-one.exe"];
  
  for dir in program_dirs {
    for subdir in subdirs.iter() {
      for exe in executables.iter() {
        paths.push(PathBuf::from(dir).join(subdir).join(exe));
      }
    }
  }
  
  for path in paths {
    if path.exists() {
      log::info!("Found ZeroTier service at: {}", path.display());
      return Ok(path);
    }
  }
  
  log::warn!("ZeroTier service not found");
  Err(SJMCLError("ZeroTier service not found".into()))
}

fn get_download_url() -> String {
  "https://download.zerotier.com/RELEASES/1.16.1/dist/ZeroTier%20One.msi".to_string()
}

#[cfg(target_os = "windows")]
fn is_admin() -> bool {
  use std::process::Command;
  match Command::new("net").arg("session").output() {
    Ok(output) => output.status.success(),
    Err(_) => false,
  }
}

#[tauri::command]
pub async fn check_zerotier_installation(
  _state: State<'_, ZeroTierState>,
  _app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  #[cfg(target_os = "windows")]
  {
    match get_zerotier_install_path() {
      Ok(path) => {
        log::info!("check_zerotier_installation: found installed at {:?}", path);
        let version_output = Command::new(&path)
          .arg("-v")
          .output();
        
        let version = version_output
          .ok()
          .and_then(|o| String::from_utf8(o.stdout).ok())
          .unwrap_or_else(|| "unknown".to_string());
        
        let service_path = get_zerotier_service_path();
        
        Ok(serde_json::json!({
          "is_installed": true,
          "version": version.trim(),
          "path": path.to_string_lossy(),
          "service_exists": service_path.is_ok(),
          "is_admin": is_admin(),
        }))
      }
      Err(_) => {
        log::info!("check_zerotier_installation: NOT installed");
        Ok(serde_json::json!({
          "is_installed": false,
          "version": null,
          "path": null,
          "service_exists": false,
          "is_admin": false,
        }))
      }
    }
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    Ok(serde_json::json!({
      "is_installed": false,
      "version": null,
      "path": null,
      "service_exists": false,
      "is_admin": false,
      "error": "ZeroTier is only supported on Windows"
    }))
  }
}

#[tauri::command]
pub async fn get_zerotier_download_info(
  _state: State<'_, ZeroTierState>,
  _app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  let app_data_dir = APP_DATA_DIR.get().ok_or(SJMCLError("APP_DATA_DIR not initialized".into()))?;
  let zerotier_dir = app_data_dir.join("zerotier");
  
  let filename = "ZeroTier One.msi";
  let dest_path = zerotier_dir.join(filename);
  
  Ok(serde_json::json!({
    "url": get_download_url(),
    "mirrors": vec![get_download_url()],
    "dest_dir": zerotier_dir.to_string_lossy().to_string(),
    "filename": filename,
    "full_dest": dest_path.to_string_lossy().to_string(),
    "version": "1.16.1"
  }))
}

#[tauri::command]
pub async fn schedule_zerotier_download(
  _state: State<'_, ZeroTierState>,
  app_handle: AppHandle,
) -> SJMCLResult<()> {
  let download_info = get_zerotier_download_info(_state.clone(), app_handle.clone()).await?;
  let src_url = download_info["url"].as_str().ok_or(SJMCLError("Invalid download info".into()))?;
  let dest_dir = download_info["dest_dir"].as_str().ok_or(SJMCLError("Invalid download info".into()))?;
  let filename = download_info["filename"].as_str().ok_or(SJMCLError("Invalid download info".into()))?;
  let full_dest = download_info["full_dest"].as_str().ok_or(SJMCLError("Invalid download info".into()))?;
  
  if !PathBuf::from(dest_dir).exists() {
    fs::create_dir_all(dest_dir)?;
  }
  
  let src_url = Url::parse(src_url).map_err(|e| SJMCLError(format!("Invalid URL: {}", e)))?;
  
  let params = vec![PTaskParam::Download(
    crate::tasks::download::DownloadParam {
      src: src_url,
      dest: PathBuf::from(full_dest),
      filename: Some(filename.to_string()),
      sha1: None,
    }
  )];
  
  schedule_progressive_task_group(
    app_handle,
    "zerotier".to_string(),
    params,
    true
  ).await?;
  
  Ok(())
}

#[cfg(target_os = "windows")]
fn install_zerotier_msi(msi_path: &PathBuf) -> SJMCLResult<()> {
  use std::process::Command;
  
  // 首先检查是否有管理员权限
  if !is_admin() {
    log::info!("Not running as admin, attempting to run MSI with elevated privileges");
    
    // 构建 msiexec 命令行
    let msi_str = msi_path.to_str().ok_or(SJMCLError("Invalid path".to_string()))?;
    let args = format!("/i \"{}\" /quiet /norestart", msi_str);
    
    // 以管理员权限运行 msiexec
    let status = Command::new("powershell")
      .args(&[
        "-Command", 
        &format!("Start-Process -FilePath 'msiexec.exe' -ArgumentList '{}' -Verb RunAs -Wait", args)
      ])
      .status()?;
    
    if !status.success() {
      return Err(SJMCLError("Failed to install with admin privileges".to_string()));
    }
    
    // 等待安装完成
    std::thread::sleep(std::time::Duration::from_secs(15));
    return Ok(());
  }
  
  // 如果已经有管理员权限，直接运行静默安装
  let output = Command::new("msiexec")
    .args(&["/i", msi_path.to_str().unwrap(), "/quiet", "/norestart"])
    .output()?;
  
  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    log::error!("Install failed: stderr={}, stdout={}", stderr, stdout);
    return Err(SJMCLError(format!("Failed to install: {}", stderr)));
  }
  
  std::thread::sleep(std::time::Duration::from_secs(15));
  
  Ok(())
}

#[tauri::command]
pub async fn install_zerotier(
  _state: State<'_, ZeroTierState>,
  _app_handle: AppHandle,
) -> SJMCLResult<()> {
  let download_info = get_zerotier_download_info(_state.clone(), _app_handle.clone()).await?;
  let full_dest = download_info["full_dest"].as_str().ok_or(SJMCLError("Invalid download info".into()))?;
  let full_dest = PathBuf::from(full_dest);
  
  if !full_dest.exists() {
    return Err(SJMCLError("Installer not found. Please download first.".into()));
  }
  
  #[cfg(target_os = "windows")]
  {
    install_zerotier_msi(&full_dest)?;
    // 不删除文件，让用户可以自己找到它
    log::info!("ZeroTier installer opened");
    Ok(())
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    Err(SJMCLError("Installation is only supported on Windows".into()))
  }
}

#[tauri::command]
pub async fn download_and_install_zerotier(
  _state: State<'_, ZeroTierState>,
  app_handle: AppHandle,
) -> SJMCLResult<()> {
  schedule_zerotier_download(_state.clone(), app_handle.clone()).await?;
  
  tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
  
  install_zerotier(_state, app_handle).await
}

#[tauri::command]
pub async fn join_network(
  network_id: String,
  state: State<'_, ZeroTierState>,
  app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  #[cfg(target_os = "windows")]
  {
    let zerotier_cli = get_zerotier_install_path()?;
    
    stop_network(state.clone()).await.ok();
    
    let output = Command::new(&zerotier_cli)
      .arg("join")
      .arg(&network_id)
      .arg("-o")
      .output()?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    
    if !output.status.success() && !stdout.contains("already") {
      log::error!("Failed to join network: {} {}", stdout, stderr);
      return Err(SJMCLError(format!("Failed to join network: {} {}", stdout, stderr)));
    }
    
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
    
    let status = get_network_status(state.clone(), app_handle).await?;
    
    let node_ip = if status["is_connected"] == serde_json::json!(true) {
      get_node_ip(&network_id).ok()
    } else {
      None
    };
    
    let network_info = ZeroTierNetworkInfo {
      network_id: network_id.clone(),
      node_ip: node_ip.clone(),
      is_connected: status["is_connected"] == serde_json::json!(true),
    };
    
    *state.current_network.lock()? = Some(network_info);
    *state.current_network_id.lock()? = Some(network_id.clone());
    
    Ok(serde_json::json!({
      "success": true,
      "network_id": network_id,
      "node_ip": node_ip,
      "is_connected": status["is_connected"]
    }))
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    Err(SJMCLError("ZeroTier join network is only supported on Windows".into()))
  }
}

#[tauri::command]
pub async fn leave_network(
  network_id: String,
  state: State<'_, ZeroTierState>,
  _app_handle: AppHandle,
) -> SJMCLResult<()> {
  #[cfg(target_os = "windows")]
  {
    let zerotier_cli = get_zerotier_install_path()?;
    
    let output = Command::new(&zerotier_cli)
      .arg("leave")
      .arg(&network_id)
      .output()?;
    
    if !output.status.success() {
      log::warn!("Failed to leave network: {}", String::from_utf8_lossy(&output.stderr));
    }
    
    *state.current_network.lock()? = None;
    *state.current_network_id.lock()? = None;
    
    Ok(())
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    Err(SJMCLError("ZeroTier leave network is only supported on Windows".into()))
  }
}

#[tauri::command]
pub async fn get_network_status(
  state: State<'_, ZeroTierState>,
  _app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  let current_network = state.current_network.lock()?;
  let current_network_id = state.current_network_id.lock()?;
  
  #[cfg(target_os = "windows")]
  {
    if let Some(network_id) = current_network_id.as_ref() {
      let zerotier_cli = get_zerotier_install_path();
      
      if let Ok(cli_path) = zerotier_cli {
        let output = Command::new(&cli_path)
          .arg("listnetworks")
          .output()?;
        
        let stdout = String::from_utf8_lossy(&output.stdout);
        
        let is_connected = stdout.contains(network_id) && stdout.contains("OK");
        
        let node_ip = if is_connected {
          get_node_ip(network_id).ok()
        } else {
          None
        };
        
        return Ok(serde_json::json!({
          "is_running": true,
          "network_id": network_id,
          "is_connected": is_connected,
          "node_ip": node_ip,
          "current_network": (*current_network).clone(),
        }));
      }
    }
  }
  
  Ok(serde_json::json!({
    "is_running": false,
    "network_id": null,
    "is_connected": false,
    "node_ip": null,
    "current_network": null,
  }))
}

#[cfg(target_os = "windows")]
fn get_node_ip(network_id: &str) -> SJMCLResult<String> {
  let zerotier_cli = get_zerotier_install_path()?;
  
  let output = Command::new(&zerotier_cli)
    .arg("listnetworks")
    .output()?;
  
  let stdout = String::from_utf8_lossy(&output.stdout);
  
  for line in stdout.lines() {
    if line.contains(network_id) {
      let parts: Vec<&str> = line.split_whitespace().collect();
      if parts.len() >= 4 {
        return Ok(parts[3].to_string());
      }
    }
  }
  
  Err(SJMCLError("Failed to get node IP".into()))
}

#[tauri::command]
pub async fn create_zerotier_network(
  _state: State<'_, ZeroTierState>,
  _app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  let network_id = generate_network_id();
  
  Ok(serde_json::json!({
    "network_id": network_id,
    "url": format!("https://my.zerotier.com/network/{}", network_id),
    "instructions": "请访问上面的链接，在ZeroTier网络管理页面中授权此设备"
  }))
}

#[tauri::command]
pub async fn start_network_as_host(
  network_id: String,
  game_port: u16,
  state: State<'_, ZeroTierState>,
  app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  let result = join_network(network_id.clone(), state.clone(), app_handle.clone()).await?;
  
  tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
  
  let status = get_network_status(state.clone(), app_handle.clone()).await?;
  
  let node_ip = status["node_ip"].as_str().map(|s| s.to_string());
  
  Ok(serde_json::json!({
    "success": result["success"].as_bool().unwrap_or(false),
    "network_id": network_id,
    "host_ip": node_ip.clone(),
    "game_port": game_port,
    "server_address": node_ip.as_ref().map(|ip| format!("{}:{}", ip, game_port)),
  }))
}

#[tauri::command]
pub async fn start_network_as_guest(
  network_id: String,
  game_port: u16,
  state: State<'_, ZeroTierState>,
  app_handle: AppHandle,
) -> SJMCLResult<serde_json::Value> {
  let result = join_network(network_id.clone(), state.clone(), app_handle.clone()).await?;
  
  tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
  
  let status = get_network_status(state.clone(), app_handle.clone()).await?;
  
  let node_ip = status["node_ip"].as_str().map(|s| s.to_string());
  
  Ok(serde_json::json!({
    "success": result["success"].as_bool().unwrap_or(false),
    "network_id": network_id,
    "guest_ip": node_ip,
    "game_port": game_port,
  }))
}

#[tauri::command]
pub async fn stop_network(
  state: State<'_, ZeroTierState>,
) -> SJMCLResult<()> {
  let current_network_id = state.current_network_id.lock()?;
  
  if let Some(network_id) = current_network_id.as_ref() {
    #[cfg(target_os = "windows")]
    {
      let zerotier_cli = get_zerotier_install_path();
      if let Ok(cli_path) = zerotier_cli {
        let _ = Command::new(&cli_path)
          .arg("leave")
          .arg(network_id)
          .output();
      }
    }
  }
  
  *state.current_network.lock()? = None;
  *state.current_network_id.lock()? = None;
  
  Ok(())
}
