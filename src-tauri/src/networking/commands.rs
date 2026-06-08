use crate::error::SJMCLResult;
use crate::networking::common::*;
use crate::networking::provider::*;

#[tauri::command]
pub async fn get_available_providers() -> SJMCLResult<Vec<serde_json::Value>> {
  let all_providers = get_all_providers();

  let mut result = Vec::new();

  for provider_type in all_providers {
    let provider = get_provider(provider_type);
    result.push(serde_json::json!({
        "type": provider.get_type().to_string(),
        "is_supported": provider.is_supported(),
    }));
  }

  Ok(result)
}

#[tauri::command]
pub async fn check_provider_installation(
  _provider_type: String,
) -> SJMCLResult<ProviderInstallationStatus> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  provider.check_installation().await
}

#[tauri::command]
pub async fn create_network(network_name: Option<String>) -> SJMCLResult<String> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  provider.create_network(network_name).await
}

#[tauri::command]
pub async fn join_network(network_id: String) -> SJMCLResult<NetworkConnectionInfo> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  provider.join_network(&network_id).await
}

#[tauri::command]
pub async fn leave_network(network_id: String) -> SJMCLResult<()> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  provider.leave_network(&network_id).await
}

#[tauri::command]
pub async fn get_network_status() -> SJMCLResult<Option<NetworkConnectionInfo>> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  provider.get_connection_info().await
}

#[tauri::command]
pub async fn start_network_as_host(
  network_id: String,
  game_port: u16,
) -> SJMCLResult<serde_json::Value> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  let connection_info = provider.join_network(&network_id).await?;

  Ok(serde_json::json!({
      "success": true,
      "network_id": network_id,
      "host_ip": connection_info.virtual_ip,
      "game_port": game_port,
      "server_address": format!("{}:{}", connection_info.virtual_ip.unwrap_or_else(|| "127.0.0.1".to_string()), game_port),
  }))
}

#[tauri::command]
pub async fn start_network_as_guest(
  network_id: String,
  game_port: u16,
) -> SJMCLResult<serde_json::Value> {
  let provider = get_provider(NetworkProviderType::Terracotta);
  let connection_info = provider.join_network(&network_id).await?;

  Ok(serde_json::json!({
      "success": true,
      "network_id": network_id,
      "host_ip": connection_info.virtual_ip,
      "game_port": game_port,
  }))
}
