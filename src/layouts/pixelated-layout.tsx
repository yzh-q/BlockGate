/**
 * 像素化主布局组件
 * 
 * 整合动态背景、侧边栏、顶部状态栏和主内容区域，创建完整的 Minecraft 风格界面
 */

import React, { useState, useEffect } from "react";
import { Box, VStack, BoxProps } from "@chakra-ui/react";
import { useRouter } from "next/router";
import DynamicBackground from "@/components/special/dynamic-background";
import PixelatedSidebar from "@/components/layout/pixelated-sidebar";
import PixelatedHeader from "@/components/layout/pixelated-header";
import {
  primaryColors,
  borderConfig,
  fontConfig,
  sizeConfig,
  responsiveConfig,
} from "@/styles/pixelated-theme";

interface PixelatedLayoutProps extends BoxProps {
  /**
   * 子元素（页面内容）
   */
  children?: React.ReactNode;
  
  /**
   * 是否启用动态背景
   */
  enableDynamicBackground?: boolean;
  
  /**
   * 用户名称
   */
  username?: string;
  
  /**
   * 是否显示顶部状态栏
   */
  showHeader?: boolean;
  
  /**
   * 是否显示侧边栏
   */
  showSidebar?: boolean;
}

/**
 * 像素化主布局组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedLayout
 *   enableDynamicBackground
 *   username="Player123"
 * >
 *   <YourPageContent />
 * </PixelatedLayout>
 * ```
 */
const PixelatedLayout: React.FC<PixelatedLayoutProps> = ({
  children,
  enableDynamicBackground = true,
  username = "玩家",
  showHeader = true,
  showSidebar = true,
  ...props
}) => {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(sizeConfig.sidebar.expanded);
  const [headerHeight, setHeaderHeight] = useState(sizeConfig.header.height);
  
  // 响应式调整
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < parseInt(responsiveConfig.breakpoints.tablet)) {
        setSidebarWidth(sizeConfig.sidebar.collapsed);
      } else {
        setSidebarWidth(sizeConfig.sidebar.expanded);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  // 处理侧边栏折叠
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarWidth(collapsed ? sizeConfig.sidebar.collapsed : sizeConfig.sidebar.expanded);
  };
  
  // 处理搜索
  const handleSearch = (query: string) => {
    console.log("Search:", query);
    // 可以在这里实现搜索功能
  };
  
  // 处理设置点击
  const handleSettingsClick = () => {
    router.push("/settings/general");
  };
  
  // 处理用户点击
  const handleUserClick = () => {
    router.push("/accounts");
  };
  
  return (
    <Box
      width="100vw"
      height="100vh"
      position="relative"
      overflow="hidden"
      {...props}
    >
      {/* 动态背景 */}
      {enableDynamicBackground && (
        <DynamicBackground
          enabled={enableDynamicBackground}
          cycleSpeed={60}
          cloudSpeed={30}
          cloudCount={6}
        />
      )}
      
      {/* 侧边栏 */}
      {showSidebar && (
        <PixelatedSidebar
          onCollapse={handleSidebarCollapse}
        />
      )}
      
      {/* 顶部状态栏 */}
      {showHeader && (
        <PixelatedHeader
          username={username}
          onSearch={handleSearch}
          onSettingsClick={handleSettingsClick}
          onUserClick={handleUserClick}
        />
      )}
      
      {/* 主内容区域 */}
      <Box
        position="absolute"
        top={showHeader ? headerHeight : "0"}
        left={showSidebar ? sidebarWidth : "0"}
        right="0"
        bottom="0"
        overflow="auto"
        padding="20px"
        backgroundColor="rgba(0, 0, 0, 0.3)"  // 半透明背景，让动态背景可见
        {...borderConfig.createPixelatedBorder({
          darkColor: "#3F3F3F",
          lightColor: "#BFBFBF",
        })}
      >
        {/* 页面内容 */}
        <VStack spacing={4} width="100%">
          {children}
        </VStack>
      </Box>
    </Box>
  );
};

export default PixelatedLayout;