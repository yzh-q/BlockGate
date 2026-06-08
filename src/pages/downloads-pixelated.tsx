/**
 * 像素化下载页面
 * 
 * 使用新的像素化布局和组件，展示下载功能
 */

import React, { useState } from "react";
import { Box, VStack, HStack, Text, Center } from "@chakra-ui/react";
import { useRouter } from "next/router";
import PixelatedLayout from "@/layouts/pixelated-layout";
import PixelatedCardGrid from "@/components/common/pixelated-card-grid";
import PixelatedButton from "@/components/common/pixelated-button";
import PixelatedInput from "@/components/common/pixelated-input";
import {
  fontConfig,
  borderConfig,
  primaryColors,
} from "@/styles/pixelated-theme";
import { useGlobalData } from "@/contexts/global-data";

/**
 * 像素化下载页面
 */
const PixelatedDownloadsPage = () => {
  const router = useRouter();
  const { selectedPlayer } = useGlobalData();
  const [searchQuery, setSearchQuery] = useState("");
  
  // 下载分类卡片
  const downloadCategories = [
    {
      id: "game-versions",
      title: "游戏版本",
      description: "下载 Minecraft 各版本",
      icon: "🎮",
      onClick: () => router.push("/downloads/game-versions"),
    },
    {
      id: "modpacks",
      title: "模组包",
      description: "下载整合包",
      icon: "📦",
      onClick: () => router.push("/downloads/modpacks"),
    },
    {
      id: "mods",
      title: "模组",
      description: "下载单个模组",
      icon: "🔧",
      onClick: () => router.push("/downloads/mods"),
    },
    {
      id: "resourcepacks",
      title: "资源包",
      description: "下载材质包",
      icon: "🎨",
      onClick: () => router.push("/downloads/resourcepacks"),
    },
    {
      id: "worlds",
      title: "世界存档",
      description: "下载地图存档",
      icon: "🌍",
      onClick: () => router.push("/downloads/worlds"),
    },
    {
      id: "shaders",
      title: "光影包",
      description: "下载光影",
      icon: "✨",
      onClick: () => router.push("/downloads/shaders"),
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
          <HStack spacing={4} width="100%" justify="space-between">
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.heading}
              color="#FFFFFF"
            >
              下载中心
            </Text>
            
            {/* 搜索框 */}
            <PixelatedInput
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              width="300px"
            />
          </HStack>
        </Box>
        
        {/* 下载分类 */}
        <PixelatedCardGrid
          cards={downloadCategories}
          showLaunchButton={false}
        />
        
        {/* 提示信息 */}
        <Box
          width="100%"
          padding="16px"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          {...borderConfig.createPixelatedBorder()}
        >
          <Text
            fontFamily={fontConfig.family}
            fontSize={fontConfig.sizes.small}
            color="#BFBFBF"
          >
            💡 提示：点击分类卡片进入对应的下载页面
          </Text>
        </Box>
      </VStack>
    </PixelatedLayout>
  );
};

export default PixelatedDownloadsPage;