/**
 * 顶部状态栏组件
 * 
 * 创建 Minecraft 风格的像素化顶部状态栏，显示用户信息、搜索、设置等快捷功能
 */

import React, { useState } from "react";
import { Box, HStack, Text, BoxProps } from "@chakra-ui/react";
import {
  primaryColors,
  borderColors,
  borderConfig,
  fontConfig,
  sizeConfig,
  animationConfig,
} from "@/styles/pixelated-theme";
import PixelatedButton from "@/components/common/pixelated-button";
import PixelatedInput from "@/components/common/pixelated-input";

interface PixelatedHeaderProps extends BoxProps {
  /**
   * 用户名称
   */
  username?: string;
  
  /**
   * 搜索回调
   */
  onSearch?: (query: string) => void;
  
  /**
   * 设置按钮点击回调
   */
  onSettingsClick?: () => void;
  
  /**
   * 用户头像点击回调
   */
  onUserClick?: () => void;
}

/**
 * 顶部状态栏组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedHeader
 *   username="Player123"
 *   onSearch={(query) => console.log("Search:", query)}
 *   onSettingsClick={() => console.log("Settings clicked")}
 * />
 * ```
 */
const PixelatedHeader: React.FC<PixelatedHeaderProps> = ({
  username = "玩家",
  onSearch,
  onSettingsClick,
  onUserClick,
  ...props
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // 处理搜索
  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };
  
  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  return (
    <Box
      width="100%"
      height={sizeConfig.header.height}
      backgroundColor={primaryColors.stoneGray}
      position="fixed"
      top={0}
      left={0}
      zIndex={999}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      paddingLeft={sizeConfig.sidebar.expanded} // 为侧边栏留出空间
      paddingRight="16px"
      borderBottom={`4px solid ${borderColors.darkOuter}`}
      {...props}
    >
      <HStack spacing={4} width="100%" justify="space-between">
        {/* 左侧：搜索栏 */}
        <HStack spacing={2} flex={1} maxW="400px">
          <PixelatedInput
            placeholder="搜索游戏..."
            value={searchQuery}
            onChange={handleSearchChange}
            width="100%"
            enableFocusEffect
          />
          <PixelatedButton
            variant="secondary"
            size="small"
            onClick={handleSearch}
          >
            🔍
          </PixelatedButton>
        </HStack>
        
        {/* 右侧：用户信息和快捷功能 */}
        <HStack spacing={3}>
          {/* 设置按钮 */}
          <PixelatedButton
            variant="secondary"
            size="small"
            onClick={onSettingsClick}
          >
            ⚙️
          </PixelatedButton>
          
          {/* 用户信息 */}
          <Box
            display="flex"
            alignItems="center"
            cursor="pointer"
            onClick={onUserClick}
            padding="8px 16px"
            backgroundColor={primaryColors.dirtBrown}
            borderRadius="0"
            {...borderConfig.createPixelatedBorder()}
            transition={`all ${animationConfig.transition.fast} ${animationConfig.easing.smooth}`}
            _hover={{
              backgroundColor: primaryColors.grassGreen,
              ...borderConfig.createHoverBorder(),
            }}
          >
            <HStack spacing={2}>
              {/* 用户头像（像素化方块） */}
              <Box
                width="24px"
                height="24px"
                backgroundColor={primaryColors.grassGreen}
                {...borderConfig.createPixelatedBorder()}
              />
              
              {/* 用户名称 */}
              <Text
                fontFamily={fontConfig.family}
                fontSize={fontConfig.sizes.small}
                color="#FFFFFF"
                fontWeight={fontConfig.weights.normal}
              >
                {username}
              </Text>
            </HStack>
          </Box>
        </HStack>
      </HStack>
    </Box>
  );
};

export default PixelatedHeader;