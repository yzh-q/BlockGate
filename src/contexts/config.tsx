import { ColorModeScript, useColorMode } from "@chakra-ui/react";
import i18n from "i18next";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useToast } from "@/contexts/toast";
import { useGetState } from "@/hooks/get-state";
import {
  LauncherConfig,
  VersionMetaInfo,
  defaultConfig,
  defaultVersionMetaInfo,
} from "@/models/config";
import { JavaInfo } from "@/models/system-info";
import { ConfigService } from "@/services/config";
import { updateByKeyPath } from "@/utils/partial";

interface LauncherConfigContextType {
  config: LauncherConfig;
  setConfig: React.Dispatch<React.SetStateAction<LauncherConfig>>;
  update: (path: string, value: any) => void;
  newerVersion: VersionMetaInfo;
  // other shared data associated with the launcher config.
  getJavaInfos: (sync?: boolean) => JavaInfo[] | undefined;
  // shared service handlers
  handleCheckLauncherUpdate: () => Promise<VersionMetaInfo>;
  shouldShowSponsorRemind: boolean;
  markSponsorRemindShown: () => void;
}

const LauncherConfigContext = createContext<
  LauncherConfigContextType | undefined
>(undefined);

export const LauncherConfigContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  const [config, setConfig] = useState<LauncherConfig>(defaultConfig);
  const userSelectedColorMode = config.appearance.theme.colorMode;

  const [javaInfos, setJavaInfos] = useState<JavaInfo[]>();
  const [newerVersion, setNewerVersion] = useState<VersionMetaInfo>(
    defaultVersionMetaInfo
  );

  // 判断是否应该显示赞助提示
  const shouldShowSponsorRemind =
    config.sponsor &&
    !config.sponsor.verified &&
    config.runCount >= 3 &&
    config.sponsor.lastRemindRunCount !== undefined &&
    config.runCount - config.sponsor.lastRemindRunCount >= 3;

  // 标记赞助提示已显示
  const markSponsorRemindShown = useCallback(() => {
    if (config.sponsor) {
      handleUpdateLauncherConfig("sponsor.lastRemindRunCount", config.runCount);
    }
  }, [config.runCount, config.sponsor]);

  // 增加启动计数
  const incrementRunCount = useCallback(() => {
    const newCount = config.runCount + 1;
    handleUpdateLauncherConfig("runCount", newCount);
  }, [config.runCount]);

  const handleRetrieveLauncherConfig = useCallback(() => {
    ConfigService.retrieveLauncherConfig().then((response) => {
      if (response.status === "success") {
        setConfig(response.data);
      } else {
        toast({
          title: response.message,
          description: response.details,
          status: "error",
        });
      }
    });
  }, [setConfig, toast]);

  useEffect(() => {
    handleRetrieveLauncherConfig();
  }, [handleRetrieveLauncherConfig]);

  // 启动时增加计数
  useEffect(() => {
    if (config.runCount !== -1) {
      incrementRunCount();
    }
  }, []);

  useEffect(() => {
    i18n.changeLanguage(config.general.general.language);
  }, [config.general.general.language]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyColorMode = () => {
      let target: "light" | "dark";
      if (userSelectedColorMode === "system") {
        target = media.matches ? "dark" : "light";
      } else {
        target = userSelectedColorMode;
      }
      if (target !== colorMode) toggleColorMode();
    };

    applyColorMode();

    if (userSelectedColorMode === "system") {
      media.addEventListener("change", applyColorMode);
      return () => media.removeEventListener("change", applyColorMode);
    }
  }, [userSelectedColorMode, colorMode, toggleColorMode]);

  // from frontend to call backend update
  const handleUpdateLauncherConfig = (path: string, value: any) => {
    // Save to the backend
    ConfigService.updateLauncherConfig(path, value).then((response) => {
      // if success, backend will emit signal, the logic below will be executed
      if (response.status !== "success") {
        toast({
          title: response.message,
          description: response.details,
          status: "error",
        });
      }
    });
  };

  // listen from backend to update frontend's config state
  const handleConfigPartialUpdate = useCallback((payload: any) => {
    const { path, value } = payload;
    setConfig((prevConfig) => {
      const newConfig = { ...prevConfig };
      updateByKeyPath(newConfig, path, JSON.parse(value));
      return newConfig;
    });
  }, []);

  useEffect(() => {
    const unlisten = ConfigService.onConfigPartialUpdate(
      handleConfigPartialUpdate
    );
    return () => unlisten();
  }, [handleConfigPartialUpdate]);

  // java list cache and retriever
  const handleRetrieveJavaList = useCallback(() => {
    ConfigService.retrieveJavaList().then((response) => {
      if (response.status === "success") {
        setJavaInfos(response.data);
      } else {
        toast({
          title: response.message,
          description: response.details,
          status: "error",
        });
        setJavaInfos([]);
      }
    });
  }, [toast]);

  const getJavaInfos = useGetState(javaInfos, handleRetrieveJavaList);

  // check launcher update
  const handleCheckLauncherUpdate =
    useCallback(async (): Promise<VersionMetaInfo> => {
      try {
        const response = await ConfigService.checkLauncherUpdate();
        if (response.status === "success") {
          setNewerVersion(
            response.data.version == "up2date"
              ? defaultVersionMetaInfo
              : response.data
          );
          return response.data;
        }
      } catch (e) {
        console.error("Failed to check launcher update:", e);
      }
      return defaultVersionMetaInfo;
    }, []);

  // 启动3秒后自动检查更新
  useEffect(() => {
    const timer = setTimeout(() => {
      handleCheckLauncherUpdate();
    }, 3000);
    return () => clearTimeout(timer);
  }, [handleCheckLauncherUpdate]);

  return (
    <LauncherConfigContext.Provider
      value={{
        config,
        setConfig,
        update: handleUpdateLauncherConfig,
        newerVersion,
        getJavaInfos,
        handleCheckLauncherUpdate,
        shouldShowSponsorRemind,
        markSponsorRemindShown,
      }}
    >
      <ColorModeScript initialColorMode={userSelectedColorMode} />
      {children}
    </LauncherConfigContext.Provider>
  );
};

export const useLauncherConfig = (): LauncherConfigContextType => {
  const context = useContext(LauncherConfigContext);
  if (!context) {
    throw new Error(
      "useLauncherConfig must be used within a LauncherConfigContextProvider"
    );
  }
  return context;
};
