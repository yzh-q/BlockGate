/**
 * 可折叠侧边栏组件
 * 
 * 创建 Minecraft 风格的像素化侧边栏，支持展开和折叠状态
 */

import React, { useState, useEffect } from "react";
import { Box, VStack, HStack, Text, Icon, BoxProps } from "@chakra-ui/react";
import { useRouter } from "next/router";
import {
  primaryColors,
  borderColors,
  borderConfig,
  fontConfig,
  sizeConfig,
  animationConfig,
  responsiveConfig,
} from "@/styles/pixelated-theme";
import PixelatedButton from "@/components/common/pixelated-button";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

interface PixelatedSidebarProps extends BoxProps {
  /**
   * 菜单项列表
   */
  menuItems?: MenuItem[];
  
  /**
   * 当前选中的菜单项 ID
   */
  activeItemId?: string;
  
  /**
   * 菜单项点击回调
   */
  onMenuItemClick?: (item: MenuItem) => void;
  
  /**
   * 是否自动折叠（响应式）
   */
  autoCollapse?: boolean;
  
  /**
   * 折叠状态变化回调
   */
  onCollapse?: (collapsed: boolean) => void;
}

/**
 * 可折叠侧边栏组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedSidebar
 *   menuItems={[
 *     { id: "launch", label: "启动", icon: "sword", path: "/launch" },
 *     { id: "instances", label: "游戏实例", icon: "pickaxe", path: "/instances" },
 *   ]}
 *   activeItemId="launch"
 * />
 * ```
 */
const PixelatedSidebar: React.FC<PixelatedSidebarProps> = ({
  menuItems = [
    { id: "launch", label: "启动", icon: "sword", path: "/launch" },
    { id: "instances", label: "游戏实例", icon: "pickaxe", path: "/instances/list" },
    { id: "downloads", label: "下载", icon: "book", path: "/downloads" },
    { id: "multiplayer", label: "联机", icon: "map", path: "/multiplayer" },
    { id: "settings", label: "设置", icon: "crafting", path: "/settings/general" },
    { id: "accounts", label: "账户", icon: "player", path: "/accounts" },
  ],
  activeItemId,
  onMenuItemClick,
  autoCollapse = true,
  onCollapse,
  ...props
}) => {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // 响应式自动折叠
  useEffect(() => {
    if (autoCollapse) {
      const handleResize = () => {
        if (window.innerWidth < parseInt(responsiveConfig.breakpoints.tablet)) {
          setIsCollapsed(true);
        }
      };
      
      handleResize();
      window.addEventListener("resize", handleResize);
      
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [autoCollapse]);
  
  // 获取当前选中的菜单项
  const getActiveItemId = () => {
    if (activeItemId) {
      return activeItemId;
    }
    
    // 根据路由路径匹配菜单项
    const currentPath = router.pathname;
    const matchedItem = menuItems.find(item => currentPath.startsWith(item.path));
    return matchedItem?.id || "launch";
  };
  
  const currentActiveId = getActiveItemId();
  
  // 获取侧边栏宽度
  const getSidebarWidth = () => {
    return isCollapsed ? sizeConfig.sidebar.collapsed : sizeConfig.sidebar.expanded;
  };
  
  // 获取菜单项样式
  const getMenuItemStyle = (itemId: string) => {
    const isActive = itemId === currentActiveId;
    const isHovered = itemId === hoveredItem;
    
    let backgroundColor = primaryColors.stoneGray;
    let textColor = "#FFFFFF";
    let borderStyle = borderConfig.createPixelatedBorder();
    
    if (isActive) {
      backgroundColor = primaryColors.dirtBrown;
      textColor = "#FFD700"; // 金色
      borderStyle = borderConfig.createPixelatedBorder({
        darkColor: borderColors.darkOuter,
        lightColor: "#FFD700",
      });
    } else if (isHovered) {
      backgroundColor = primaryColors.grassGreen;
      borderStyle = borderConfig.createHoverBorder();
    }
    
    return {
      backgroundColor,
      textColor,
      borderStyle,
    };
  };
  
  // 处理菜单项点击
  const handleMenuItemClick = (item: MenuItem) => {
    if (onMenuItemClick) {
      onMenuItemClick(item);
    } else {
      router.push(item.path);
    }
  };
  
  // 处理折叠按钮点击
  const handleCollapseClick = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapse) {
      onCollapse(newCollapsedState);
    }
  };
  
  return (
    <Box
      width={getSidebarWidth()}
      height="100vh"
      backgroundColor={primaryColors.stoneGray}
      position="fixed"
      left={0}
      top={0}
      zIndex={1000}
      transition={`width ${animationConfig.transition.normal} ${animationConfig.easing.smooth}`}
      {...borderConfig.createPixelatedBorder()}
      {...props}
    >
      <VStack spacing={0} height="100%">
        {/* Logo 区域 */}
        <Box
          width="100%"
          height={sizeConfig.sidebar.logoHeight}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderBottom={`4px solid ${borderColors.darkOuter}`}
        >
          {isCollapsed ? (
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.heading}
              color="#FFFFFF"
            >
              B
            </Text>
          ) : (
            <Text
              fontFamily={fontConfig.family}
              fontSize={fontConfig.sizes.title}
              color="#FFFFFF"
            >
              BlockGate
            </Text>
          )}
        </Box>
        
        {/* 导航菜单区域 */}
        <VStack spacing={0} width="100%" flex={1}>
          {menuItems.map((item) => {
            const style = getMenuItemStyle(item.id);
            
            return (
              <Box
                key={item.id}
                width="100%"
                height={sizeConfig.sidebar.menuItemHeight}
                display="flex"
                alignItems="center"
                cursor="pointer"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleMenuItemClick(item)}
                transition={`all ${animationConfig.transition.fast} ${animationConfig.easing.smooth}`}
                {...style.borderStyle}
                backgroundColor={style.backgroundColor}
                paddingLeft={isCollapsed ? "0" : "16px"}
                paddingRight={isCollapsed ? "0" : "16px"}
              >
                <HStack spacing={3} width="100%" justify={isCollapsed ? "center" : "flex-start"}>
                  {/* 图标 */}
                  <Box
                    width={isCollapsed ? "32px" : "24px"}
                    height={isCollapsed ? "32px" : "24px"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text
                      fontFamily={fontConfig.family}
                      fontSize={isCollapsed ? fontConfig.sizes.heading : fontConfig.sizes.body}
                      color={style.textColor}
                    >
                      {item.icon.charAt(0).toUpperCase()}
                    </Text>
                  </Box>
                  
                  {/* 文字（仅展开时显示） */}
                  {!isCollapsed && (
                    <Text
                      fontFamily={fontConfig.family}
                      fontSize={fontConfig.sizes.body}
                      color={style.textColor}
                      fontWeight={fontConfig.weights.normal}
                    >
                      {item.label}
                    </Text>
                  )}
                  
                  {/* 选中指示条（仅展开时显示） */}
                  {!isCollapsed && item.id === currentActiveId && (
                    <Box
                      width="4px"
                      height="100%"
                      backgroundColor="#FFD700"
                      position="absolute"
                      left={0}
                    />
                  )}
                </HStack>
              </Box>
            );
          })}
        </VStack>
        
        {/* 折叠按钮 */}
        <Box
          width="100%"
          height={sizeConfig.sidebar.foldButtonHeight}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderTop={`4px solid ${borderColors.darkOuter}`}
        >
          <PixelatedButton
            variant="secondary"
            size="small"
            onClick={handleCollapseClick}
            width={isCollapsed ? "40px" : "100%"}
          >
            {isCollapsed ? "→" : "←"}
          </PixelatedButton>
        </Box>
      </VStack>
    </Box>
  );
};

export default PixelatedSidebar;