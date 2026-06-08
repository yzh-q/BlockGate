/**
 * 像素化设置页面
 * 
 * 使用新的像素化布局和组件，展示设置功能
 */

import React from "react";
import { Box, VStack, HStack, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import PixelatedLayout from "@/layouts/pixelated-layout";
import PixelatedCardGrid from "@/components/common/pixelated-card-grid";
import {
  fontConfig,
  borderConfig,
} from "@/styles/pixelated-theme";
import { useGlobalData } from "@/contexts/global-data";

/**
 * 像素化设置页面
 */
const PixelatedSettingsPage = () => {
  const router = useRouter();
  const { selectedPlayer } = useGlobalData();
  
  // 设置分类卡片
  const settingsCategories = [
    {
      id: "general",
      title: "通用设置",
      description: "基本配置选项",
      icon: "⚙️",
      onClick: () => router.push("/settings/general"),
    },
    {
      id: "appearance",
      title: "外观设置",
      description: "界面主题和样式",
      icon: "🎨",
      onClick: () => router.push("/settings/appearance"),
    },
    {
      id: "download",
      title: "下载设置",
      description: "下载源和路径",
      icon: "📥",
      onClick: () => router.push("/settings/download"),
    },
    {
      id: "java",
      title: "Java 设置",
      description: "Java 运行环境",
      icon: "☕",
      onClick: () => router.push("/settings/java"),
    },
    {
      id: "game",
      title: "游戏设置",
      description: "全局游戏配置",
      icon: "🎮",
      onClick: () => router.push("/settings/global-game"),
    },
    {
      id: "accounts",
      title: "账户管理",
      description: "登录账户设置",
      icon: "👤",
      onClick: () => router.push("/accounts"),
    },
  ];
  
  return (
    <PixelatedLayout
      enableDynamicBackground={true}
      username={selectedPlayer?.name || "玩家"}
    >
      <VStack spacing={4} width="100%" height="100%">
        {/* 页面标题 */}
        <Box
          width="100%"
          padding="16px"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          {...borderConfig.createPixelatedBorder()}
        >
          <Text
            fontFamily={fontConfig.family}
            fontSize={fontConfig.sizes.heading}
            color="#FFFFFF"
          >
            设置中心
          </Text>
        </Box>
        
        {/* 设置分类 */}
        <PixelatedCardGrid
          cards={settingsCategories}
          showLaunchButton={false}
        />
      </VStack>
    </PixelatedLayout>
  );
};

export default PixelatedSettingsPage;