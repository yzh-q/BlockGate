/**
 * 像素化游戏实例列表页面
 * 
 * 使用新的像素化布局和组件，展示所有游戏实例
 */

import React, { useState, useEffect } from "react";
import { Box, VStack, HStack, Text, Center } from "@chakra-ui/react";
import { useRouter } from "next/router";
import PixelatedLayout from "@/layouts/pixelated-layout";
import PixelatedCardGrid from "@/components/common/pixelated-card-grid";
import PixelatedButton from "@/components/common/pixelated-button";
import PixelatedInput from "@/components/common/pixelated-input";
import {
  fontConfig,
  borderConfig,
} from "@/styles/pixelated-theme";
import { useGlobalData } from "@/contexts/global-data";
import { useSharedModals } from "@/contexts/shared-modal";
import { InstanceSummary } from "@/models/instance/misc";

/**
 * 像素化游戏实例列表页面
 */
const PixelatedInstanceListPage = () => {
  const router = useRouter();
  const { dir } = router.query;
  const { selectedPlayer, getInstanceList } = useGlobalData();
  const { openSharedModal } = useSharedModals();
  
  const [instanceList, setInstanceList] = useState<InstanceSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 获取游戏实例列表
  useEffect(() => {
    if (!router.isReady) return;
    
    setInstanceList(() => {
      const all = getInstanceList() || [];
      if (!dir) return all; // /instances/list, show all
      const dirPrefix = Array.isArray(dir) ? dir.join("/") : dir;
      return all.filter((inst) => inst.id.startsWith(`${dirPrefix}:`));
    });
  }, [dir, router.isReady, getInstanceList]);
  
  // 过滤游戏实例
  const filteredInstances = instanceList.filter((instance) =>
    instance.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
  
  // 准备游戏实例卡片列表
  const instanceCards = filteredInstances.map((instance) => ({
    id: instance.id,
    title: instance.name,
    description: instance.version || "未知版本",
    icon: instance.iconSrc || "/images/icons/grass-block.png",
    onClick: () => handleInstanceClick(instance),
    onLaunch: () => handleInstanceLaunch(instance),
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
              游戏实例
            </Text>
            
            <HStack spacing={2}>
              {/* 搜索框 */}
              <PixelatedInput
                placeholder="搜索游戏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                width="200px"
              />
              
              {/* 添加游戏按钮 */}
              <PixelatedButton
                variant="primary"
                size="small"
                onClick={() => router.push("/instances/add-import")}
              >
                + 添加
              </PixelatedButton>
            </HStack>
          </HStack>
        </Box>
        
        {/* 游戏实例列表 */}
        {instanceCards.length > 0 ? (
          <PixelatedCardGrid
            cards={instanceCards}
            showLaunchButton={true}
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
                {searchQuery ? "未找到匹配的游戏" : "暂无游戏实例"}
              </Text>
              
              {!searchQuery && (
                <PixelatedButton
                  variant="primary"
                  onClick={() => router.push("/instances/add-import")}
                >
                  添加第一个游戏
                </PixelatedButton>
              )}
            </VStack>
          </Center>
        )}
      </VStack>
    </PixelatedLayout>
  );
};

export default PixelatedInstanceListPage;