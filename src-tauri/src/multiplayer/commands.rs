use crate::error::{SJMCLError, SJMCLResult};
use crate::multiplayer::{GameRoom, MultiplayerState, UserProfile, UserStatus};
use chrono::Utc;
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn login_to_multiplayer(
  username: String,
  app_handle: AppHandle,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<UserProfile> {
  let mut user = UserProfile::new(username.clone());
  user.status = UserStatus::Online;

  // 生成虚拟IP
  user.virtual_ip = Some(generate_virtual_ip());

  let mut current_user = state.current_user.lock()?;
  *current_user = Some(user.clone());

  // 添加到在线用户列表
  let mut online_users = state.online_users.lock()?;
  online_users.insert(user.user_id.clone(), user.clone());

  log::info!("用户 {} 登录联机系统", username);
  Ok(user)
}

#[tauri::command]
pub async fn logout_from_multiplayer(state: State<'_, MultiplayerState>) -> SJMCLResult<()> {
  let current_user = state.current_user.lock()?;

  if let Some(user) = &*current_user {
    // 从在线用户列表中移除
    let mut online_users = state.online_users.lock()?;
    online_users.remove(&user.user_id);

    // 如果是房主，关闭房间
    let mut active_rooms = state.active_rooms.lock()?;
    active_rooms.retain(|_, room| room.host_user_id != user.user_id);
  }

  Ok(())
}

#[tauri::command]
pub async fn get_current_user(
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<Option<UserProfile>> {
  let current_user = state.current_user.lock()?;
  Ok(current_user.clone())
}

#[tauri::command]
pub async fn get_online_users(state: State<'_, MultiplayerState>) -> SJMCLResult<Vec<UserProfile>> {
  let online_users = state.online_users.lock()?;
  Ok(online_users.values().cloned().collect())
}

#[tauri::command]
pub async fn create_game_room(
  room_name: String,
  game_port: u16,
  network_id: Option<String>,
  app_handle: AppHandle,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<GameRoom> {
  let current_user = state.current_user.lock()?;

  let user = current_user.as_ref().ok_or(SJMCLError("请先登录".into()))?;

  let virtual_ip = user
    .virtual_ip
    .as_ref()
    .ok_or(SJMCLError("虚拟IP未分配".into()))?;

  let room = GameRoom::new(
    user.user_id.clone(),
    user.username.clone(),
    room_name,
    game_port,
    virtual_ip.clone(),
    network_id,
  );

  let mut active_rooms = state.active_rooms.lock()?;
  active_rooms.insert(room.room_id.clone(), room.clone());

  // 更新用户状态为游戏中
  let mut online_users = state.online_users.lock()?;
  if let Some(user_profile) = online_users.get_mut(&user.user_id) {
    user_profile.status = UserStatus::InGame;
  }

  log::info!("用户 {} 创建了房间: {}", user.username, room.room_name);
  Ok(room)
}

#[tauri::command]
pub async fn get_active_rooms(state: State<'_, MultiplayerState>) -> SJMCLResult<Vec<GameRoom>> {
  let active_rooms = state.active_rooms.lock()?;
  Ok(active_rooms.values().cloned().collect())
}

#[tauri::command]
pub async fn join_game_room(
  room_id: String,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<GameRoom> {
  let current_user = state.current_user.lock()?;

  let user = current_user.as_ref().ok_or(SJMCLError("请先登录".into()))?;

  let mut active_rooms = state.active_rooms.lock()?;

  let room = active_rooms
    .get_mut(&room_id)
    .ok_or(SJMCLError("房间不存在".into()))?;

  if room.is_locked {
    return Err(SJMCLError("房间已锁定".into()));
  }

  if room.current_players >= room.max_players {
    return Err(SJMCLError("房间已满".into()));
  }

  room.current_players += 1;
  room.players.push(user.username.clone());

  // 更新用户状态为游戏中
  let mut online_users = state.online_users.lock()?;
  if let Some(user_profile) = online_users.get_mut(&user.user_id) {
    user_profile.status = UserStatus::InGame;
  }

  log::info!("用户 {} 加入了房间: {}", user.username, room.room_name);
  Ok(room.clone())
}

#[tauri::command]
pub async fn leave_game_room(
  room_id: String,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<()> {
  let current_user = state.current_user.lock()?;

  let user = current_user.as_ref().ok_or(SJMCLError("请先登录".into()))?;

  let user_id = user.user_id.clone();
  let username = user.username.clone();
  drop(current_user);

  let mut active_rooms = state.active_rooms.lock()?;

  // 先检查是否是房主
  let is_host = if let Some(room) = active_rooms.get(&room_id) {
    room.host_user_id == user_id
  } else {
    false
  };

  if is_host {
    if let Some(removed_room) = active_rooms.remove(&room_id) {
      log::info!("用户 {} 关闭了房间: {}", username, removed_room.room_name);
    }
  } else if let Some(room) = active_rooms.get_mut(&room_id) {
    // 否则，从玩家列表中移除
    room.players.retain(|p| p != &username);
    room.current_players -= 1;
  }

  drop(active_rooms);

  // 更新用户状态
  let mut online_users = state.online_users.lock()?;
  if let Some(user_profile) = online_users.get_mut(&user_id) {
    user_profile.status = UserStatus::Online;
  }

  Ok(())
}

#[tauri::command]
pub async fn update_room_info(
  room_id: String,
  world_name: Option<String>,
  game_mode: Option<String>,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<()> {
  let mut active_rooms = state.active_rooms.lock()?;

  if let Some(room) = active_rooms.get_mut(&room_id) {
    room.world_name = world_name;
    room.game_mode = game_mode;
  }

  Ok(())
}

#[tauri::command]
pub async fn lock_room(
  room_id: String,
  is_locked: bool,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<()> {
  let mut active_rooms = state.active_rooms.lock()?;

  if let Some(room) = active_rooms.get_mut(&room_id) {
    room.is_locked = is_locked;
  }

  Ok(())
}

#[tauri::command]
pub async fn refresh_room_list(state: State<'_, MultiplayerState>) -> SJMCLResult<()> {
  // 这里可以实现实际的网络发现逻辑
  // 目前模拟刷新
  Ok(())
}

fn generate_virtual_ip() -> String {
  use rand::Rng;
  let mut rng = rand::rng();

  format!(
    "10.{}.{}.{}",
    rng.random_range(0..256),
    rng.random_range(0..256),
    rng.random_range(1..255)
  )
}

#[tauri::command]
pub async fn initialize_multiplayer_network(
  network_name: String,
  network_secret: String,
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<()> {
  let mut state_network_name = state.network_name.lock()?;
  *state_network_name = Some(network_name);

  let mut state_network_secret = state.network_secret.lock()?;
  *state_network_secret = Some(network_secret);

  Ok(())
}

#[tauri::command]
pub async fn get_network_info(
  state: State<'_, MultiplayerState>,
) -> SJMCLResult<(Option<String>, Option<String>)> {
  let network_name = state.network_name.lock()?.clone();
  let network_secret = state.network_secret.lock()?.clone();
  Ok((network_name, network_secret))
}
