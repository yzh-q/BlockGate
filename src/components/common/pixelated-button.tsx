/**
 * 像素化按钮组件
 * 
 * 创建 Minecraft 菜单风格的像素化按钮，支持悬停和点击效果
 */

import { Button, ButtonProps } from "@chakra-ui/react";
import React, { useState } from "react";
import {
  primaryColors,
  accentColors,
  borderColors,
  borderConfig,
  fontConfig,
  sizeConfig,
  animationConfig,
} from "@/styles/pixelated-theme";

interface PixelatedButtonProps extends ButtonProps {
  /**
   * 按钮类型
   */
  variant?: "primary" | "secondary" | "danger" | "success" | "disabled" | "custom";
  
  /**
   * 自定义背景颜色（仅 variant="custom" 时有效）
   */
  customBackgroundColor?: string;
  
  /**
   * 按钮尺寸
   */
  size?: "small" | "medium" | "large";
  
  /**
   * 是否显示像素化边框
   */
  showBorder?: boolean;
  
  /**
   * 是否启用悬停动画
   */
  enableHoverAnimation?: boolean;
  
  /**
   * 是否启用点击动画
   */
  enableClickAnimation?: boolean;
}

/**
 * 像素化按钮组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedButton variant="primary" enableHoverAnimation>
 *   启动游戏
 * </PixelatedButton>
 * ```
 */
const PixelatedButton: React.FC<PixelatedButtonProps> = ({
  variant = "primary",
  customBackgroundColor,
  size = "medium",
  showBorder = true,
  enableHoverAnimation = true,
  enableClickAnimation = true,
  children,
  isDisabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // 根据按钮类型获取背景颜色
  const getBackgroundColor = () => {
    if (isDisabled) {
      return "#4F4F4F";
    }
    
    if (variant === "custom") {
      return customBackgroundColor || primaryColors.stoneGray;
    }
    
    switch (variant) {
      case "primary":
        return isHovered ? "#6B9E4E" : primaryColors.grassGreen;
      
      case "secondary":
        return isHovered ? "#9B5523" : primaryColors.dirtBrown;
      
      case "danger":
        return isHovered ? "#FF3333" : accentColors.redstoneRed;
      
      case "success":
        return isHovered ? "#5BEDDA" : accentColors.diamondBlue;
      
      case "disabled":
        return "#4F4F4F";
      
      default:
        return primaryColors.stoneGray;
    }
  };
  
  // 根据按钮尺寸获取样式
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          height: "32px",
          minWidth: "80px",
          padding: "8px 16px",
          fontSize: fontConfig.sizes.small,
        };
      
      case "large":
        return {
          height: "48px",
          minWidth: "160px",
          padding: "16px 32px",
          fontSize: fontConfig.sizes.heading,
        };
      
      default: // medium
        return {
          height: sizeConfig.button.height,
          minWidth: sizeConfig.button.minWidth,
          padding: sizeConfig.button.padding,
          fontSize: fontConfig.sizes.body,
        };
    }
  };
  
  // 获取边框样式
  const getBorderStyle = () => {
    if (!showBorder) {
      return {};
    }
    
    if (isPressed) {
      // 点击状态：边框反转
      return {
        border: `4px solid ${borderColors.lightInner}`,
        boxShadow: `inset 2px 2px 0 ${borderColors.darkOuter}, inset -2px -2px 0 ${borderColors.lightInner}`,
      };
    }
    
    if (isHovered && enableHoverAnimation) {
      // 悬停状态：使用悬停边框
      return borderConfig.createHoverBorder();
    }
    
    // 默认状态
    return borderConfig.createPixelatedBorder();
  };
  
  // 获取动画样式
  const getAnimationStyles = () => {
    const styles: any = {};
    
    if (isHovered && enableHoverAnimation && !isPressed) {
      styles.transform = animationConfig.hoverEffect.translateY;
    }
    
    if (isPressed && enableClickAnimation) {
      styles.transform = animationConfig.clickEffect.translateY;
    }
    
    return styles;
  };
  
  const sizeStyles = getSizeStyles();
  const borderStyle = getBorderStyle();
  const animationStyles = getAnimationStyles();
  
  return (
    <Button
      backgroundColor={getBackgroundColor()}
      fontFamily={fontConfig.family}
      color="#FFFFFF"
      fontWeight={fontConfig.weights.normal}
      borderRadius="0"
      cursor={isDisabled ? "not-allowed" : "pointer"}
      opacity={isDisabled ? 0.6 : 1}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !isDisabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      transition={enableHoverAnimation ? `all ${animationConfig.transition.fast} ${animationConfig.easing.smooth}` : "none"}
      {...sizeStyles}
      {...borderStyle}
      {...animationStyles}
      {...props}
      isDisabled={isDisabled}
    >
      {children}
    </Button>
  );
};

export default PixelatedButton;