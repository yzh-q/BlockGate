/**
 * 像素化启动页面（主页）
 * 
 * 使用新的像素化布局和组件，展示欢迎信息、最近游戏和快速启动功能
 */

import React, { useState, useEffect } from "react";
import { Box, VStack, HStack, Text, Center } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import PixelatedLayout from "@/layouts/pixelated-layout";
import PixelatedCard from "@/components/common/pixelated-card";
import PixelatedButton from "@/components/common/pixelated-button";
import PixelatedCardGrid from "@/components/common/pixelated-card-grid";
import {
  primaryColors,
  fontConfig,
  borderConfig,
} from "@/styles/pixelated-theme";
import { useGlobalData } from "@/contexts/global-data";
import { useSharedModals } from "@/contexts/shared-modal";
import { InstanceSummary } from "@/models/instance/misc";
import { Player } from "@/models/account";

/**
 * 像素化启动页面
 */
const PixelatedLaunchPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedPlayer, getInstanceList, selectedInstance } = useGlobalData();
  const { openSharedModal } = useSharedModals();
  
  const [instanceList, setInstanceList] = useState<InstanceSummary[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  
  // 获取游戏实例列表
  useEffect(() => {
    setInstanceList(getInstanceList() || []);
  }, [getInstanceList]);
  
  // 获取当前玩家
  useEffect(() => {
    setPlayer(selectedPlayer);
  }, [selectedPlayer]);
  
  // 处理启动按钮点击
  const handleLaunch = () => {
    if (selectedInstance) {
      openSharedModal("launch", {
        instanceId: selectedInstance.id,
      });
    }
  };
  
  // 处理游戏实例点击
  const handleInstanceClick = (instance: InstanceSummary) => {
    router.push(`/instances/details/${encodeURIComponent(instance.id)}`);
  };
  
  // 处理游戏实例启动
  const handleInstanceLaunch = (instance: InstanceSummary) => {
    openSharedModal("launch", {
      instanceId: instance.id,
    });
  };
  
  // 准备最近游戏卡片列表
  const recentGameCards = instanceList.slice(0, 6).map((instance) => ({
    id: instance.id,
    title: instance.name,
    description: instance.version || "未知版本",
    icon: instance.icon || "/images/icons/grass-block.png",
    onClick: () => handleInstanceClick(instance),
    onLaunch: () => handleInstanceLaunch(instance),
  }));
  
  return (
    <PixelatedLayout
      enableDynamicBackground={true}
      username={player?.name || "玩家"}
    >
      <VStack spacing={6} width="100%" height="100%">
        {/* 欢迎信息 */}
        <Box
          width="100%"
          padding="20px"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          {...borderConfig.createPixelatedBorder()}
        >
          <VStack spacing={2}>
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.title}
              color="#FFFFFF"
              fontWeight={fontConfig.weights.normal}
            >
              欢迎回来，{player?.name || "玩家"}！
            </Text>
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.body}
              color="#BFBFBF"
              fontWeight={fontConfig.weights.normal}
            >
              准备开始你的 Minecraft 之旅吗？
            </Text>
          </VStack>
        </Box>
        
        {/* 最近游戏 */}
        <Box width="100%">
          <Text
            fontFamily={fontConfig.family}
            fontSize={fontConfig.sizes.heading}
            color="#FFFFFF"
            fontWeight={fontConfig.weights.normal}
            marginBottom="16px"
          >
            最近游戏
          </Text>
          
          {recentGameCards.length > 0 ? (
            <PixelatedCardGrid
              cards={recentGameCards}
              showLaunchButton={true}
            />
          ) : (
            <Center
              width="100%"
              height="200px"
              backgroundColor="rgba(0, 0, 0, 0.5)"
              {...borderConfig.createPixelatedBorder()}
            >
              <VStack spacing={2}>
                <Text
                  fontFamily={fontConfig.family}
                  fontSize={fontConfig.sizes.body}
                  color="#BFBFBF"
                >
                  暂无游戏实例
                </Text>
                <PixelatedButton
                  variant="primary"
                  onClick={() => router.push("/instances/add-import")}
                >
                  添加游戏
                </PixelatedButton>
              </VStack>
            </Center>
          )}
        </Box>
        
        {/* 快速启动 */}
        {selectedInstance && (
          <Box
            width="100%"
            padding="20px"
            backgroundColor="rgba(0, 0, 0, 0.5)"
            {...borderConfig.createPixelatedBorder()}
          >
            <VStack spacing={3}>
              <Text
                fontFamily={fontConfig.family}
                fontSize={fontConfig.sizes.heading}
                color="#FFFFFF"
              >
                快速启动
              </Text>
              
              <HStack spacing={4}>
                <Text
                  fontFamily={fontConfig.family}
                  fontSize={fontConfig.sizes.body}
                  color="#BFBFBF"
                >
                  {selectedInstance.name}
                </Text>
                
                <PixelatedButton
                  variant="primary"
                  size="large"
                  onClick={handleLaunch}
                >
                  🎮 立即启动
                </PixelatedButton>
              </HStack>
            </VStack>
          </Box>
        )}
        
        {/* 功能快捷入口 */}
        <HStack spacing={4} width="100%">
          <PixelatedButton
            variant="secondary"
            onClick={() => router.push("/downloads")}
          >
            📥 下载
          </PixelatedButton>
          
          <PixelatedButton
            variant="secondary"
            onClick={() => router.push("/multiplayer")}
          >
            🌐 联机
          </PixelatedButton>
          
          <PixelatedButton
            variant="secondary"
            onClick={() => router.push("/settings/general")}
          >
            ⚙️ 设置
          </PixelatedButton>
        </HStack>
      </VStack>
    </PixelatedLayout>
  );
};

export default PixelatedLaunchPage;