import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";

export interface UserProfile {
  user_id: string;
  username: string;
  avatar_url?: string;
  status: "online" | "offline" | "in_game";
  virtual_ip?: string;
  last_seen: string;
}

export interface GameRoom {
  room_id: string;
  host_user_id: string;
  host_username: string;
  room_name: string;
  game_port: number;
  virtual_ip: string;
  network_id?: string;
  max_players: number;
  current_players: number;
  world_name?: string;
  game_mode?: string;
  is_locked: boolean;
  created_at: string;
  players: string[];
}

interface MultiplayerContextType {
  currentUser: UserProfile | null;
  onlineUsers: UserProfile[];
  activeRooms: GameRoom[];
  isLoggedIn: boolean;
  currentRoom: GameRoom | null;
  isHost: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshRoomList: () => Promise<void>;
  createRoom: (
    roomName: string,
    gamePort: number,
    networkId?: string
  ) => Promise<GameRoom>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updateRoomInfo: (worldName?: string, gameMode?: string) => Promise<void>;
  lockRoom: (isLocked: boolean) => Promise<void>;
  refreshOnlineUsers: () => Promise<void>;
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(
  undefined
);

interface MultiplayerProviderProps {
  children: ReactNode;
}

export function MultiplayerProvider({ children }: MultiplayerProviderProps) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);

  const isLoggedIn = currentUser !== null;
  const isHost =
    currentRoom !== null && currentRoom.host_user_id === currentUser?.user_id;

  useEffect(() => {
    // 检查是否已有登录用户
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const user = await invoke<UserProfile | null>("get_current_user");
      if (user) {
        setCurrentUser(user);
        await refreshRoomList();
        await refreshOnlineUsers();
      }
    } catch (error) {
      console.error("Failed to check current user:", error);
    }
  };

  const login = async (username: string) => {
    try {
      const user = await invoke<UserProfile>("login_to_multiplayer", {
        username,
      });
      setCurrentUser(user);
      await refreshRoomList();
      await refreshOnlineUsers();
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await invoke("logout_from_multiplayer");
      setCurrentUser(null);
      setCurrentRoom(null);
      setOnlineUsers([]);
      setActiveRooms([]);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const refreshRoomList = async () => {
    try {
      const rooms = await invoke<GameRoom[]>("get_active_rooms");
      setActiveRooms(rooms);
    } catch (error) {
      console.error("Failed to refresh room list:", error);
    }
  };

  const createRoom = async (
    roomName: string,
    gamePort: number,
    networkId?: string
  ): Promise<GameRoom> => {
    try {
      const room = await invoke<GameRoom>("create_game_room", {
        roomName,
        gamePort,
        networkId,
      });

      if (networkId) {
        (room as any).network_id = networkId;
      }

      setCurrentRoom(room);
      await refreshRoomList();
      await refreshOnlineUsers();
      return room;
    } catch (error) {
      console.error("Failed to create room:", error);
      throw error;
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const room = await invoke<GameRoom>("join_game_room", { roomId });
      setCurrentRoom(room);
      await refreshRoomList();
      await refreshOnlineUsers();
    } catch (error) {
      console.error("Failed to join room:", error);
      throw error;
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom) return;

    try {
      await invoke("leave_game_room", { roomId: currentRoom.room_id });
      setCurrentRoom(null);
      await refreshRoomList();
      await refreshOnlineUsers();
    } catch (error) {
      console.error("Failed to leave room:", error);
      throw error;
    }
  };

  const updateRoomInfo = async (worldName?: string, gameMode?: string) => {
    if (!currentRoom) return;

    try {
      await invoke("update_room_info", {
        roomId: currentRoom.room_id,
        worldName,
        gameMode,
      });
      await refreshRoomList();
    } catch (error) {
      console.error("Failed to update room info:", error);
      throw error;
    }
  };

  const lockRoom = async (isLocked: boolean) => {
    if (!currentRoom) return;

    try {
      await invoke("lock_room", {
        roomId: currentRoom.room_id,
        isLocked,
      });
      await refreshRoomList();
    } catch (error) {
      console.error("Failed to lock room:", error);
      throw error;
    }
  };

  const refreshOnlineUsers = async () => {
    try {
      const users = await invoke<UserProfile[]>("get_online_users");
      setOnlineUsers(users);
    } catch (error) {
      console.error("Failed to refresh online users:", error);
    }
  };

  return (
    <MultiplayerContext.Provider
      value={{
        currentUser,
        onlineUsers,
        activeRooms,
        isLoggedIn,
        currentRoom,
        isHost,
        login,
        logout,
        refreshRoomList,
        createRoom,
        joinRoom,
        leaveRoom,
        updateRoomInfo,
        lockRoom,
        refreshOnlineUsers,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (context === undefined) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
}
