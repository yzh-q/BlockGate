/**
 * 像素化卡片组件
 * 
 * 创建 Minecraft 风格的像素化卡片，用于展示游戏实例、功能模块等
 */

import { Box, BoxProps, Image, Text, VStack } from "@chakra-ui/react";
import React, { useState } from "react";
import {
  backgroundColors,
  borderColors,
  borderConfig,
  fontConfig,
  sizeConfig,
  animationConfig,
} from "@/styles/pixelated-theme";
import PixelatedButton from "./pixelated-button";

interface PixelatedCardProps extends BoxProps {
  /**
   * 卡片类型
   */
  variant?: "default" | "hover" | "selected" | "disabled";
  
  /**
   * 卡片标题
   */
  title?: string;
  
  /**
   * 卡片描述
   */
  description?: string;
  
  /**
   * 卡片图标（图片 URL 或 React 元素）
   */
  icon?: string | React.ReactNode;
  
  /**
   * 是否显示悬停效果
   */
  enableHoverEffect?: boolean;
  
  /**
   * 是否显示启动按钮（悬停时）
   */
  showLaunchButton?: boolean;
  
  /**
   * 启动按钮点击回调
   */
  onLaunch?: () => void;
  
  /**
   * 子元素
   */
  children?: React.ReactNode;
}

/**
 * 像素化卡片组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedCard
 *   title="我的世界"
 *   description="版本 1.20.4"
 *   icon="/images/icons/grass-block.png"
 *   enableHoverEffect
 *   showLaunchButton
 *   onLaunch={() => console.log("启动游戏")}
 * />
 * ```
 */
const PixelatedCard: React.FC<PixelatedCardProps> = ({
  variant = "default",
  title,
  description,
  icon,
  enableHoverEffect = true,
  showLaunchButton = false,
  onLaunch,
  children,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 获取背景颜色
  const getBackgroundColor = () => {
    switch (variant) {
      case "hover":
        return backgroundColors.cardHover;
      
      case "selected":
        return backgroundColors.cardSelected;
      
      case "disabled":
        return "rgba(63, 63, 63, 0.8)";
      
      default:
        return backgroundColors.cardDefault;
    }
  };
  
  // 获取边框样式
  const getBorderStyle = () => {
    if (isHovered && enableHoverEffect) {
      return borderConfig.createHoverBorder();
    }
    
    return borderConfig.createPixelatedBorder();
  };
  
  // 获取动画样式
  const getAnimationStyles = () => {
    if (isHovered && enableHoverEffect) {
      return {
        transform: animationConfig.hoverEffect.scale,
        boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3)`,
      };
    }
    
    return {};
  };
  
  const borderStyle = getBorderStyle();
  const animationStyles = getAnimationStyles();
  
  return (
    <Box
      width={sizeConfig.card.width}
      height={sizeConfig.card.height}
      backgroundColor={getBackgroundColor()}
      borderRadius="0"
      cursor={variant === "disabled" ? "not-allowed" : "pointer"}
      position="relative"
      onMouseEnter={() => variant !== "disabled" && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={enableHoverEffect ? `all ${animationConfig.transition.normal} ${animationConfig.easing.smooth}` : "none"}
      {...borderStyle}
      {...animationStyles}
      {...props}
    >
      <VStack spacing={3} p={4} height="100%" justify="center">
        {/* 卡片图标 */}
        {icon && (
          <Box
            width={sizeConfig.card.iconSize}
            height={sizeConfig.card.iconSize}
            display="flex"
            alignItems="center"
            justifyItems="center"
          >
            {typeof icon === "string" ? (
              <Image
                src={icon}
                alt={title || "卡片图标"}
                width={sizeConfig.card.iconSize}
                height={sizeConfig.card.iconSize}
                objectFit="contain"
              />
            ) : (
              icon
            )}
          </Box>
        )}
        
        {/* 卡片标题 */}
        {title && (
          <Text
            fontFamily={fontConfig.family}
            fontSize={fontConfig.sizes.body}
            color="#FFFFFF"
            fontWeight={fontConfig.weights.normal}
            textAlign="center"
            noOfLines={1}
          >
            {title}
          </Text>
        )}
        
        {/* 卡片描述 */}
        {description && (
          <Text
            fontFamily={fontConfig.family}
            fontSize={fontConfig.sizes.small}
            color="#BFBFBF"
            fontWeight={fontConfig.weights.normal}
            textAlign="center"
            noOfLines={2}
          >
            {description}
          </Text>
        )}
        
        {/* 自定义内容 */}
        {children}
        
        {/* 启动按钮（悬停时显示） */}
        {showLaunchButton && isHovered && onLaunch && (
          <PixelatedButton
            variant="primary"
            size="small"
            onClick={onLaunch}
            position="absolute"
            bottom={4}
            left="50%"
            transform="translateX(-50%)"
          >
            启动
          </PixelatedButton>
        )}
      </VStack>
    </Box>
  );
};

export default PixelatedCard;