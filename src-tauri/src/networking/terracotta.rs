use crate::error::{SJMCLError, SJMCLResult};
use crate::networking::common::{
  NetworkConnectionInfo, NetworkProviderType, ProviderInstallationStatus,
};
use crate::networking::provider::NetworkProvider;
use async_trait::async_trait;
use serde_json::Value;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::Command as AsyncCommand;
use tokio::sync::Mutex;

pub struct TerracottaProvider {
  state: Arc<Mutex<TerracottaState>>,
}

#[derive(Default)]
struct TerracottaState {
  active_network_id: Option<String>,
  active_port: Option<u16>,
  active_process: Option<tokio::process::Child>,
  temp_file_path: Option<PathBuf>,
}

impl TerracottaProvider {
  pub fn new() -> Self {
    Self {
      state: Arc::new(Mutex::new(TerracottaState::default())),
    }
  }

  fn get_terracotta_folder(&self) -> Option<PathBuf> {
    let launcher_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();

    // 尝试多个可能的文件夹名称
    let possible_names = ["terracotta", "easytier-windows-x86_64", "easytier"];

    for name in possible_names.iter() {
      let folder = launcher_dir.join(name);
      if folder.exists() && folder.is_dir() {
        log::info!("Found Terracotta folder: {:?}", folder);
        return Some(folder);
      }
    }

    None
  }

  fn get_terracotta_exe_path(&self) -> Option<PathBuf> {
    let folder = self.get_terracotta_folder()?;

    // 先尝试标准名称
    let standard_path = folder.join("terracotta.exe");
    if standard_path.exists() && standard_path.is_file() {
      return Some(standard_path);
    }

    // 尝试查找以 terracotta 开头的 exe 文件
    if let Ok(entries) = std::fs::read_dir(&folder) {
      for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
          if let Some(filename) = path.file_name() {
            let filename_str = filename.to_string_lossy().to_lowercase();
            if filename_str.starts_with("terracotta") && filename_str.ends_with(".exe") {
              return Some(path);
            }
          }
        }
      }
    }

    None
  }

  fn create_temp_file() -> SJMCLResult<PathBuf> {
    let temp_dir = std::env::temp_dir();
    let temp_file_name = format!("terracotta_port_{}.txt", std::process::id());
    Ok(temp_dir.join(temp_file_name))
  }

  async fn read_port_from_file(file_path: &PathBuf) -> SJMCLResult<u16> {
    log::info!("Waiting for port file to be created: {:?}", file_path);
    for i in 0..30 {
      if file_path.exists() {
        log::info!("Port file found on attempt {}", i + 1);
        break;
      }
      if i < 5 || i == 29 {
        log::info!("Still waiting for port file... attempt {}", i + 1);
      }
      tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    }

    if !file_path.exists() {
      log::error!("Port file was never created after 30 attempts");
      return Err(SJMCLError("Terracotta 端口文件未生成".into()));
    }

    log::info!("Reading port file content...");
    let content = tokio::fs::read_to_string(file_path).await?;
    log::info!("Port file raw content: {}", content);

    let trimmed = content.trim();

    if let Ok(port) = trimmed.parse::<u16>() {
      log::info!("Successfully extracted port (plain text): {}", port);
      return Ok(port);
    }

    if let Ok(json) = serde_json::from_str::<Value>(&content) {
      if let Some(port) = json.get("port").and_then(|p| p.as_u64()) {
        log::info!("Successfully extracted port (JSON): {}", port);
        return Ok(port as u16);
      }
    }

    Err(SJMCLError("无法从文件中获取 Terracotta 端口".into()))
  }

  async fn get_state(&self, port: u16) -> Option<Value> {
    let url = format!("http://127.0.0.1:{}/state", port);
    let client = reqwest::Client::new();

    match client.get(&url).send().await {
      Ok(response) => match response.json::<Value>().await {
        Ok(json) => Some(json),
        Err(e) => {
          log::error!("Failed to parse state JSON: {}", e);
          None
        }
      },
      Err(e) => {
        log::error!("Failed to get state: {}", e);
        None
      }
    }
  }

  async fn get_virtual_ip(&self, port: u16) -> Option<String> {
    let state = self.get_state(port).await?;

    if let Some(easytier) = state.get("easytier") {
      if let Some(peer_info) = easytier.get("peer_info") {
        if let Some(ips) = peer_info.get("virtual_ips") {
          if let Some(ip_array) = ips.as_array() {
            if let Some(ip) = ip_array.first() {
              if let Some(ip_str) = ip.as_str() {
                return Some(ip_str.to_string());
              }
            }
          }
        }
      }
    }

    None
  }

  async fn set_scanning(&self, port: u16, room: Option<String>, player: Option<String>) -> bool {
    let mut url = format!("http://127.0.0.1:{}/state/scanning", port);

    let mut has_param = false;
    if let Some(r) = room.as_deref() {
      url.push_str(&format!("?room={}", r));
      has_param = true;
    }

    if let Some(p) = player.as_deref() {
      if !has_param {
        url.push_str("?");
      } else {
        url.push_str("&");
      }
      url.push_str(&format!("player={}", p));
    }

    log::info!("Calling set_scanning with URL: {}", url);

    let client = reqwest::Client::new();
    match client.get(&url).send().await {
      Ok(response) => {
        let status = response.status();
        log::info!("set_scanning response status: {}", status);
        if let Ok(body) = response.text().await {
          log::info!("set_scanning response body: {}", body);
        }
        status.is_success()
      }
      Err(e) => {
        log::error!("Failed to set scanning: {}", e);
        false
      }
    }
  }

  async fn set_guesting(&self, port: u16, room: &str, player: Option<String>) -> bool {
    let mut url = format!("http://127.0.0.1:{}/state/guesting?room={}", port, room);

    if let Some(p) = player.as_deref() {
      url.push_str(&format!("&player={}", p));
    }

    log::info!("Calling set_guesting with URL: {}", url);

    let client = reqwest::Client::new();
    match client.get(&url).send().await {
      Ok(response) => {
        let status = response.status();
        log::info!("set_guesting response status: {}", status);
        if let Ok(body) = response.text().await {
          log::info!("set_guesting response body: {}", body);
        }
        status.is_success()
      }
      Err(e) => {
        log::error!("Failed to set guesting: {}", e);
        false
      }
    }
  }

  async fn shutdown_server(&self, port: u16) -> bool {
    let url = format!("http://127.0.0.1:{}/panic?peaceful=true", port);
    let client = reqwest::Client::new();

    match client.get(&url).send().await {
      Ok(_) => true,
      Err(e) => {
        log::warn!("Failed to shutdown gracefully: {}", e);
        false
      }
    }
  }

  async fn start_terracotta_process(
    &self,
    terracotta_exe: &PathBuf,
  ) -> SJMCLResult<(tokio::process::Child, PathBuf, u16)> {
    let temp_file = Self::create_temp_file()?;

    log::info!("Starting Terracotta with temp file: {:?}", temp_file);
    log::info!("Terracotta executable path: {:?}", terracotta_exe);

    let child = AsyncCommand::new(terracotta_exe)
      .arg("--hmcl")
      .arg(&temp_file)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .spawn()?;

    log::info!("Terracotta process spawned, PID: {:?}", child.id());

    log::info!("Waiting for Terracotta to write port...");
    let port = Self::read_port_from_file(&temp_file).await?;

    log::info!("Terracotta started successfully on port: {}", port);

    Ok((child, temp_file, port))
  }
}

#[async_trait]
impl NetworkProvider for TerracottaProvider {
  fn get_type(&self) -> NetworkProviderType {
    NetworkProviderType::Terracotta
  }

  async fn check_installation(&self) -> SJMCLResult<ProviderInstallationStatus> {
    let folder_path = self.get_terracotta_folder();
    let exe_path = self.get_terracotta_exe_path();

    let is_installed = folder_path.is_some() && exe_path.is_some();

    let error_message = if folder_path.is_none() {
      Some("未找到 terracotta 文件夹".to_string())
    } else if exe_path.is_none() {
      Some("文件夹中缺少 terracotta.exe".to_string())
    } else {
      None
    };

    Ok(ProviderInstallationStatus {
      is_installed,
      provider: NetworkProviderType::Terracotta,
      install_path: exe_path.map(|p| p.to_string_lossy().to_string()),
      error_message,
    })
  }

  async fn create_network(&self, name: Option<String>) -> SJMCLResult<String> {
    log::info!("Creating Terracotta network (host mode)...");

    let terracotta_exe = self
      .get_terracotta_exe_path()
      .ok_or_else(|| SJMCLError("未找到 terracotta.exe".into()))?;

    let (child, temp_file, port) = self.start_terracotta_process(&terracotta_exe).await?;

    let room_id: String = name.unwrap_or_else(|| {
      use rand::Rng;
      let mut rng = rand::rng();
      (0..8)
        .map(|_| rng.random_range(b'a'..=b'z') as char)
        .collect()
    });

    log::info!("Setting host mode with room ID: {}", room_id);
    let success = self.set_scanning(port, Some(room_id.clone()), None).await;
    if !success {
      return Err(SJMCLError("设置房主模式失败".into()));
    }

    log::info!("Waiting for network to connect...");
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

    let virtual_ip = self.get_virtual_ip(port).await;

    if let Some(ip) = &virtual_ip {
      log::info!("Got virtual IP: {}", ip);
    } else {
      log::warn!("Could not get virtual IP, but continuing anyway");
    }

    {
      let mut state = self.state.lock().await;
      state.active_process = Some(child);
      state.active_port = Some(port);
      state.active_network_id = Some(room_id.clone());
      state.temp_file_path = Some(temp_file);
    }

    log::info!("Terracotta host mode ready, room ID: {}", room_id);

    Ok(room_id)
  }

  async fn join_network(&self, room_id: &str) -> SJMCLResult<NetworkConnectionInfo> {
    log::info!("Joining Terracotta network with room ID: {}", room_id);

    let terracotta_exe = self
      .get_terracotta_exe_path()
      .ok_or_else(|| SJMCLError("未找到 terracotta.exe".into()))?;

    let (child, temp_file, port) = self.start_terracotta_process(&terracotta_exe).await?;

    log::info!("Setting guest mode for room ID: {}", room_id);
    let success = self.set_guesting(port, room_id, None).await;
    if !success {
      return Err(SJMCLError("加入房间失败".into()));
    }

    log::info!("Waiting for network to connect...");
    tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;

    let virtual_ip = self.get_virtual_ip(port).await;

    if let Some(ip) = &virtual_ip {
      log::info!("Got virtual IP: {}", ip);
    } else {
      log::warn!("Could not get virtual IP, but continuing anyway");
    }

    {
      let mut state = self.state.lock().await;
      state.active_process = Some(child);
      state.active_port = Some(port);
      state.active_network_id = Some(room_id.to_string());
      state.temp_file_path = Some(temp_file);
    }

    log::info!("Successfully joined room: {}", room_id);

    Ok(NetworkConnectionInfo {
      is_connected: true,
      network_id: Some(room_id.to_string()),
      virtual_ip,
      provider: NetworkProviderType::Terracotta,
    })
  }

  async fn leave_network(&self, _network_id: &str) -> SJMCLResult<()> {
    log::info!("Leaving Terracotta network...");

    let mut state = self.state.lock().await;

    if let Some(port) = state.active_port {
      log::info!("Shutting down Terracotta server on port: {}", port);
      let _ = self.shutdown_server(port).await;
    }

    if let Some(mut child) = state.active_process.take() {
      log::info!("Killing Terracotta process...");
      let _ = child.kill().await;
    }

    if let Some(temp_file) = state.temp_file_path.take() {
      log::info!("Cleaning up temp file: {:?}", temp_file);
      let _ = tokio::fs::remove_file(temp_file).await;
    }

    state.active_network_id = None;
    state.active_port = None;

    log::info!("Left network successfully");
    Ok(())
  }

  async fn get_connection_info(&self) -> SJMCLResult<Option<NetworkConnectionInfo>> {
    let state = self.state.lock().await;

    if let (Some(network_id), Some(port)) = (&state.active_network_id, state.active_port) {
      let virtual_ip = self.get_virtual_ip(port).await;

      Ok(Some(NetworkConnectionInfo {
        is_connected: true,
        network_id: Some(network_id.clone()),
        virtual_ip,
        provider: NetworkProviderType::Terracotta,
      }))
    } else {
      Ok(None)
    }
  }

  fn is_supported(&self) -> bool {
    true
  }
}
