/**
 * 像素化联机页面
 * 
 * 使用新的像素化布局和组件，展示联机功能
 */

import React, { useState } from "react";
import { Box, VStack, HStack, Text, Center } from "@chakra-ui/react";
import { useRouter } from "next/router";
import PixelatedLayout from "@/layouts/pixelated-layout";
import PixelatedButton from "@/components/common/pixelated-button";
import PixelatedInput from "@/components/common/pixelated-input";
import {
  fontConfig,
  borderConfig,
  primaryColors,
} from "@/styles/pixelated-theme";
import { useGlobalData } from "@/contexts/global-data";

/**
 * 像素化联机页面
 */
const PixelatedMultiplayerPage = () => {
  const router = useRouter();
  const { selectedPlayer } = useGlobalData();
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [gamePort, setGamePort] = useState("25565");
  
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
            联机大厅
          </Text>
        </Box>
        
        {/* 房主模式 */}
        <Box
          width="100%"
          padding="20px"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          {...borderConfig.createPixelatedBorder()}
        >
          <VStack spacing={3}>
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.body}
              color="#FFFFFF"
            >
              🏠 我要当房主
            </Text>
            
            <HStack spacing={2} width="100%">
              <PixelatedInput
                placeholder="房间名称..."
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                width="200px"
              />
              
              <PixelatedInput
                placeholder="游戏端口..."
                value={gamePort}
                onChange={(e) => setGamePort(e.target.value)}
                width="100px"
              />
              
              <PixelatedButton variant="primary">
                创建房间
              </PixelatedButton>
            </HStack>
          </VStack>
        </Box>
        
        {/* 客人模式 */}
        <Box
          width="100%"
          padding="20px"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          {...borderConfig.createPixelatedBorder()}
        >
          <VStack spacing={3}>
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.body}
              color="#FFFFFF"
            >
              🎮 我要当客人
            </Text>
            
            <HStack spacing={2} width="100%">
              <PixelatedInput
                placeholder="输入房间码..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                width="200px"
              />
              
              <PixelatedButton variant="secondary">
                加入房间
              </PixelatedButton>
            </HStack>
          </VStack>
        </Box>
        
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
            💡 提示：请确保 Terracotta 程序已正确配置
          </Text>
        </Box>
      </VStack>
    </PixelatedLayout>
  );
};

export default PixelatedMultiplayerPage;