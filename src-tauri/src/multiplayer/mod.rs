use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub mod commands;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
  pub user_id: String,
  pub username: String,
  pub avatar_url: Option<String>,
  pub status: UserStatus,
  pub virtual_ip: Option<String>,
  pub last_seen: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserStatus {
  Online,
  Offline,
  InGame,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameRoom {
  pub room_id: String,
  pub host_user_id: String,
  pub host_username: String,
  pub room_name: String,
  pub game_port: u16,
  pub virtual_ip: String,
  pub network_id: Option<String>,
  pub max_players: u32,
  pub current_players: u32,
  pub world_name: Option<String>,
  pub game_mode: Option<String>,
  pub is_locked: bool,
  pub created_at: DateTime<Utc>,
  pub players: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct MultiplayerState {
  pub current_user: Arc<Mutex<Option<UserProfile>>>,
  pub online_users: Arc<Mutex<HashMap<String, UserProfile>>>,
  pub active_rooms: Arc<Mutex<HashMap<String, GameRoom>>>,
  pub network_name: Arc<Mutex<Option<String>>>,
  pub network_secret: Arc<Mutex<Option<String>>>,
}

impl Default for MultiplayerState {
  fn default() -> Self {
    Self {
      current_user: Arc::new(Mutex::new(None)),
      online_users: Arc::new(Mutex::new(HashMap::new())),
      active_rooms: Arc::new(Mutex::new(HashMap::new())),
      network_name: Arc::new(Mutex::new(None)),
      network_secret: Arc::new(Mutex::new(None)),
    }
  }
}

impl UserProfile {
  pub fn new(username: String) -> Self {
    Self {
      user_id: format!(
        "user_{}",
        uuid::Uuid::new_v4().to_string().split('-').next().unwrap()
      ),
      username,
      avatar_url: None,
      status: UserStatus::Offline,
      virtual_ip: None,
      last_seen: Utc::now(),
    }
  }
}

impl GameRoom {
  pub fn new(
    host_user_id: String,
    host_username: String,
    room_name: String,
    game_port: u16,
    virtual_ip: String,
    network_id: Option<String>,
  ) -> Self {
    let room_code = generate_room_code();

    Self {
      room_id: room_code,
      host_user_id,
      host_username: host_username.clone(),
      room_name,
      game_port,
      virtual_ip,
      network_id,
      max_players: 20,
      current_players: 1,
      world_name: None,
      game_mode: None,
      is_locked: false,
      created_at: Utc::now(),
      players: vec![host_username],
    }
  }
}

fn generate_room_code() -> String {
  use rand::Rng;
  let chars: Vec<char> = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".chars().collect();
  let mut rng = rand::rng();

  (0..6)
    .map(|_| chars[rng.random_range(0..chars.len())])
    .collect()
}
