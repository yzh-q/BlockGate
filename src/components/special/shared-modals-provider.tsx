import { useEffect, useState } from "react";
import DownloadSpecificResourceModal from "@/components//modals/download-specific-resource-modal";
import AddAuthServerModal from "@/components/modals/add-auth-server-modal";
import AlertResourceDependencyModal from "@/components/modals/alert-resource-dependency-modal";
import CopyOrMoveModal from "@/components/modals/copy-or-move-modal";
import DeleteInstanceDialog from "@/components/modals/delete-instance-alert-dialog";
import DownloadModpackModal from "@/components/modals/download-modpack-modal";
import DownloadResourceModal from "@/components/modals/download-resource-modal";
import GenericConfirmDialog from "@/components/modals/generic-confirm-dialog";
import ImportModpackModal from "@/components/modals/import-modpack-modal";
import LaunchProcessModal from "@/components/modals/launch-process-modal";
import NotifyNewVersionModal from "@/components/modals/notify-new-version-modal";
import ReLoginPlayerModal from "@/components/modals/relogin-player-modal";
import SponsorRemindModal from "@/components/modals/sponsor-remind-modal";
import SpotlightSearchModal from "@/components/modals/spotlight-search-modal";
import { useLauncherConfig } from "@/contexts/config";
import { SharedModalContextProvider } from "@/contexts/shared-modal";
import { useSharedModals } from "@/contexts/shared-modal";

const SharedModalsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <SharedModalContextProvider>
      <SharedModals>{children}</SharedModals>
    </SharedModalContextProvider>
  );
};

const SharedModals: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { modalStates, closeSharedModal, openSharedModal } = useSharedModals();
  const { newerVersion, shouldShowSponsorRemind } = useLauncherConfig();
  const [notifiedVersion, setNotifiedVersion] = useState<string | null>(null);
  const [sponsorRemindShown, setSponsorRemindShown] = useState(false);

  // 检测到新版本时自动打开更新提示弹窗（只提示一次）
  useEffect(() => {
    if (
      newerVersion &&
      newerVersion.version &&
      newerVersion.version !== "up2date" &&
      newerVersion.version !== notifiedVersion
    ) {
      openSharedModal("notify-new-version", { newVersion: newerVersion });
      setNotifiedVersion(newerVersion.version);
    }
  }, [newerVersion, openSharedModal, notifiedVersion]);

  // 显示赞助提示
  useEffect(() => {
    if (shouldShowSponsorRemind && !sponsorRemindShown) {
      openSharedModal("sponsor-remind", {});
      setSponsorRemindShown(true);
    }
  }, [shouldShowSponsorRemind, openSharedModal, sponsorRemindShown]);

  const modals: Record<string, React.FC<any>> = {
    "add-auth-server": AddAuthServerModal,
    "alert-resource-dependency": AlertResourceDependencyModal,
    "copy-or-move": CopyOrMoveModal,
    "delete-instance-alert": DeleteInstanceDialog,
    "download-modpack": DownloadModpackModal,
    "download-resource": DownloadResourceModal,
    "download-specific-resource": DownloadSpecificResourceModal,
    "generic-confirm": GenericConfirmDialog,
    "import-modpack": ImportModpackModal,
    launch: LaunchProcessModal,
    "notify-new-version": NotifyNewVersionModal,
    relogin: ReLoginPlayerModal,
    "spotlight-search": SpotlightSearchModal,
    "sponsor-remind": SponsorRemindModal,
  };

  return (
    <>
      {children}

      {Object.keys(modals).map((key) => {
        const modalParams = modalStates[key];
        if (!modalParams) return null;

        const SpecModal = modals[key];
        return (
          <SpecModal
            key={key}
            {...modalParams}
            onClose={() => closeSharedModal(key)}
          />
        );
      })}
    </>
  );
};

export default SharedModalsProvider;
