/**
 * 像素化账户页面
 * 
 * 使用新的像素化布局和组件，展示账户管理功能
 */

import React, { useState } from "react";
import { Box, VStack, HStack, Text, Center } from "@chakra-ui/react";
import { useRouter } from "next/router";
import PixelatedLayout from "@/layouts/pixelated-layout";
import PixelatedCardGrid from "@/components/common/pixelated-card-grid";
import PixelatedButton from "@/components/common/pixelated-button";
import {
  fontConfig,
  borderConfig,
} from "@/styles/pixelated-theme";
import { useGlobalData } from "@/contexts/global-data";
import { Player } from "@/models/account";

/**
 * 像素化账户页面
 */
const PixelatedAccountsPage = () => {
  const router = useRouter();
  const { selectedPlayer, getPlayerList } = useGlobalData();
  const [playerList, setPlayerList] = useState<Player[]>([]);
  
  // 获取玩家列表
  React.useEffect(() => {
    setPlayerList(getPlayerList() || []);
  }, [getPlayerList]);
  
  // 准备账户卡片列表
  const accountCards = playerList.map((player) => ({
    id: player.id,
    title: player.name,
    description: player.playerType,
    icon: player.avatar || "👤",
    onClick: () => console.log("Select player:", player.id),
  }));
  
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
              账户管理
            </Text>
            
            <PixelatedButton
              variant="primary"
              size="small"
              onClick={() => console.log("Add account")}
            >
              + 添加账户
            </PixelatedButton>
          </HStack>
        </Box>
        
        {/* 账户列表 */}
        {accountCards.length > 0 ? (
          <PixelatedCardGrid
            cards={accountCards}
            showLaunchButton={false}
          />
        ) : (
          <Center
            width="100%"
            height="300px"
            backgroundColor="rgba(0, 0, 0, 0.5)"
            {...borderConfig.createPixelatedBorder()}
          >
            <VStack spacing={3}>
              <Text
                fontFamily={fontConfig.family}
                fontSize={fontConfig.sizes.body}
                color="#BFBFBF"
              >
                暂无账户
              </Text>
              
              <PixelatedButton
                variant="primary"
                onClick={() => console.log("Add first account")}
              >
                添加第一个账户
              </PixelatedButton>
            </VStack>
          </Center>
        )}
      </VStack>
    </PixelatedLayout>
  );
};

export default PixelatedAccountsPage;