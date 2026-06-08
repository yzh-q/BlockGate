use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProviderInstallationStatus {
  pub is_installed: bool,
  pub provider: NetworkProviderType,
  pub install_path: Option<String>,
  pub error_message: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NetworkConnectionInfo {
  pub is_connected: bool,
  pub network_id: Option<String>,
  pub virtual_ip: Option<String>,
  pub provider: NetworkProviderType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NetworkProviderType {
  Terracotta,
}

impl fmt::Display for NetworkProviderType {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      NetworkProviderType::Terracotta => write!(f, "Terracotta"),
    }
  }
}

impl Default for NetworkConnectionInfo {
  fn default() -> Self {
    Self {
      is_connected: false,
      network_id: None,
      virtual_ip: None,
      provider: NetworkProviderType::Terracotta,
    }
  }
}
