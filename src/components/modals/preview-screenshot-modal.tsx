import {
  Flex,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  ModalProps,
  Text,
} from "@chakra-ui/react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import React from "react";
import { useTranslation } from "react-i18next";
import { LuCalendarDays } from "react-icons/lu";
import { CommonIconButton } from "@/components/common/common-icon-button";
import { useLauncherConfig } from "@/contexts/config";
import { useToast } from "@/contexts/toast";
import { ScreenshotInfo } from "@/models/instance/misc";
import { UNIXToDatetime } from "@/utils/datetime";
import { shareFile } from "@/utils/share";

interface PreviewScreenshotModalProps extends Omit<ModalProps, "children"> {
  screenshot: ScreenshotInfo;
}

const PreviewScreenshotModal: React.FC<PreviewScreenshotModalProps> = ({
  screenshot,
  ...props
}) => {
  const { t } = useTranslation();
  const { config } = useLauncherConfig();
  const toast = useToast();

  const screenshotMenuOperations = [
    ...(config.basicInfo.osType === "macos"
      ? [
          {
            icon: "share",
            onClick: async () => {
              await shareFile(
                screenshot.filePath,
                "image/png",
                t("ScreenshotPreviewModal.menu.share"),
                { toast }
              );
            },
          },
        ]
      : []),
    {
      icon: "revealFile",
      label: t("ScreenshotPreviewModal.menu.revealFile"),
      onClick: () => {
        revealItemInDir(screenshot.filePath);
      },
    },
  ];

  return (
    <Modal size={{ base: "lg", lg: "2xl", xl: "4xl" }} {...props}>
      <ModalOverlay />
      <ModalContent>
        <Image
          src={convertFileSrc(screenshot.filePath)}
          alt={screenshot.fileName}
          borderRadius="md"
          objectFit="cover"
        />
        <ModalCloseButton />
        <ModalBody>
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="bold">
              {screenshot.fileName}
            </Text>
            <HStack spacing={2}>
              <Icon as={LuCalendarDays} color="gray.500" />
              <Text fontSize="xs" className="secondary-text">
                {UNIXToDatetime(screenshot.time)}
              </Text>
              <HStack spacing={0}>
                {screenshotMenuOperations.map((btn, index) => (
                  <CommonIconButton
                    key={index}
                    icon={btn.icon}
                    label={btn.label}
                    onClick={btn.onClick}
                  />
                ))}
              </HStack>
            </HStack>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PreviewScreenshotModal;
