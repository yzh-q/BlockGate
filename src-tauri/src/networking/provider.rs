use super::common::*;
use super::terracotta::TerracottaProvider;
use crate::error::SJMCLResult;
use async_trait::async_trait;

#[async_trait]
pub trait NetworkProvider: Send + Sync {
  fn get_type(&self) -> NetworkProviderType;

  async fn check_installation(&self) -> SJMCLResult<ProviderInstallationStatus>;

  async fn create_network(&self, name: Option<String>) -> SJMCLResult<String>;
  async fn join_network(&self, network_id: &str) -> SJMCLResult<NetworkConnectionInfo>;
  async fn leave_network(&self, network_id: &str) -> SJMCLResult<()>;
  async fn get_connection_info(&self) -> SJMCLResult<Option<NetworkConnectionInfo>>;

  fn is_supported(&self) -> bool;
}

pub fn get_provider(_provider_type: NetworkProviderType) -> Box<dyn NetworkProvider> {
  Box::new(TerracottaProvider::new())
}

pub fn get_all_providers() -> Vec<NetworkProviderType> {
  vec![NetworkProviderType::Terracotta]
}
