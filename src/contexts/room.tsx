import { invoke } from "@tauri-apps/api/core";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

interface RoomInfo {
  roomCode: string | null;
  gamePort: number | null;
  networkName: string | null;
  networkSecret: string | null;
  isHost: boolean;
  isConnected: boolean;
  hostIp: string | null;
  networkId: string | null;
}

interface RoomContextType {
  roomState: RoomInfo;
  setRoomState: React.Dispatch<React.SetStateAction<RoomInfo>>;
  clearRoomState: () => void;
  startNetworkAsHost: (networkId: string) => Promise<void>;
  startNetworkAsGuest: (networkId: string) => Promise<void>;
  stopNetwork: () => Promise<void>;
}

const defaultRoomState: RoomInfo = {
  roomCode: null,
  gamePort: null,
  networkName: null,
  networkSecret: null,
  isHost: false,
  isConnected: false,
  hostIp: null,
  networkId: null,
};

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [roomState, setRoomState] = useState<RoomInfo>(defaultRoomState);

  const clearRoomState = useCallback(() => {
    setRoomState(defaultRoomState);
  }, []);

  const startNetworkAsHost = useCallback(
    async (networkId: string) => {
      try {
        const result = await invoke<{
          success: boolean;
          network_id: string;
          host_ip: string;
          game_port: number;
        }>("start_network_as_host", {
          networkId,
          gamePort: roomState.gamePort || 25565,
        });

        if (result.success) {
          setRoomState((prev) => ({
            ...prev,
            isConnected: true,
            hostIp: result.host_ip,
            networkId: result.network_id,
          }));
        }
      } catch (error) {
        console.error("Failed to start virtual network as host:", error);
        throw error;
      }
    },
    [roomState.gamePort]
  );

  const startNetworkAsGuest = useCallback(
    async (networkId: string) => {
      try {
        const result = await invoke<{
          success: boolean;
          network_id: string;
          game_port: number;
        }>("start_network_as_guest", {
          networkId,
          gamePort: roomState.gamePort || 25565,
        });

        if (result.success) {
          setRoomState((prev) => ({
            ...prev,
            isConnected: true,
          }));
        }
      } catch (error) {
        console.error("Failed to join virtual network as guest:", error);
        throw error;
      }
    },
    [roomState.gamePort]
  );

  const stopNetwork = useCallback(async () => {
    try {
      await invoke("stop_network");
      setRoomState((prev) => ({
        ...prev,
        isConnected: false,
      }));
    } catch (error) {
      console.error("Failed to stop network:", error);
      throw error;
    }
  }, []);

  const providerValue = useMemo(
    () => ({
      roomState,
      setRoomState,
      clearRoomState,
      startNetworkAsHost,
      startNetworkAsGuest,
      stopNetwork,
    }),
    [
      roomState,
      clearRoomState,
      startNetworkAsHost,
      startNetworkAsGuest,
      stopNetwork,
    ]
  );

  return (
    <RoomContext.Provider value={providerValue}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
