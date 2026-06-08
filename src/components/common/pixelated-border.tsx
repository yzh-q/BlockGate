/**
 * 像素化边框组件
 * 
 * 创建 Minecraft 风格的像素化边框效果，支持不同颜色和状态
 */

import { Box, BoxProps } from "@chakra-ui/react";
import React, { useState } from "react";
import { borderColors, borderConfig } from "@/styles/pixelated-theme";

interface PixelatedBorderProps extends BoxProps {
  /**
   * 边框类型
   */
  variant?: "default" | "hover" | "selected" | "disabled" | "custom";
  
  /**
   * 自定义外边框颜色（仅 variant="custom" 时有效）
   */
  customOuterColor?: string;
  
  /**
   * 自定义内边框颜色（仅 variant="custom" 时有效）
   */
  customInnerColor?: string;
  
  /**
   * 是否显示悬停效果
   */
  enableHover?: boolean;
  
  /**
   * 子元素
   */
  children?: React.ReactNode;
}

/**
 * 像素化边框组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedBorder variant="default" enableHover>
 *   <Box>内容</Box>
 * </PixelatedBorder>
 * ```
 */
const PixelatedBorder: React.FC<PixelatedBorderProps> = ({
  variant = "default",
  customOuterColor,
  customInnerColor,
  enableHover = false,
  children,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 根据边框类型获取边框样式
  const getBorderStyle = () => {
    if (variant === "custom") {
      return borderConfig.createPixelatedBorder({
        darkColor: customOuterColor || borderColors.darkOuter,
        lightColor: customInnerColor || borderColors.lightInner,
      });
    }
    
    if (isHovered && enableHover) {
      return borderConfig.createHoverBorder();
    }
    
    switch (variant) {
      case "hover":
        return borderConfig.createHoverBorder();
      
      case "selected":
        return borderConfig.createPixelatedBorder({
          darkColor: borderColors.darkOuter,
          lightColor: "#FFD700",  // 金色内边框
        });
      
      case "disabled":
        return borderConfig.createPixelatedBorder({
          darkColor: "#4F4F4F",
          lightColor: "#6F6F6F",
        });
      
      default:
        return borderConfig.createPixelatedBorder();
    }
  };
  
  const borderStyle = getBorderStyle();
  
  return (
    <Box
      {...borderStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      transition={enableHover ? "all 0.2s ease-in-out" : "none"}
      {...props}
    >
      {children}
    </Box>
  );
};

export default PixelatedBorder;