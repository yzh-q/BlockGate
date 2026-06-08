/**
 * 像素化输入框组件
 * 
 * 创建 Minecraft 风格的像素化输入框，支持聚焦效果
 */

import { Input, InputProps } from "@chakra-ui/react";
import React, { useState } from "react";
import {
  backgroundColors,
  accentColors,
  borderColors,
  borderConfig,
  fontConfig,
  sizeConfig,
  animationConfig,
} from "@/styles/pixelated-theme";

interface PixelatedInputProps extends InputProps {
  /**
   * 输入框尺寸
   */
  size?: "small" | "medium" | "large";
  
  /**
   * 是否显示像素化边框
   */
  showBorder?: boolean;
  
  /**
   * 是否启用聚焦效果
   */
  enableFocusEffect?: boolean;
}

/**
 * 像素化输入框组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedInput
 *   placeholder="输入游戏名称..."
 *   enableFocusEffect
 * />
 * ```
 */
const PixelatedInput: React.FC<PixelatedInputProps> = ({
  size = "medium",
  showBorder = true,
  enableFocusEffect = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // 根据输入框尺寸获取样式
  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          height: "32px",
          padding: "8px 12px",
          fontSize: fontConfig.sizes.small,
        };
      
      case "large":
        return {
          height: "48px",
          padding: "16px 20px",
          fontSize: fontConfig.sizes.heading,
        };
      
      default: // medium
        return {
          height: sizeConfig.input.height,
          padding: sizeConfig.input.padding,
          fontSize: fontConfig.sizes.body,
        };
    }
  };
  
  // 获取边框样式
  const getBorderStyle = () => {
    if (!showBorder) {
      return {};
    }
    
    if (isFocused && enableFocusEffect) {
      // 聚焦状态：使用钻石蓝色边框
      return borderConfig.createPixelatedBorder({
        darkColor: accentColors.diamondBlue,
        lightColor: "#7FEDD9",
      });
    }
    
    // 默认状态
    return borderConfig.createPixelatedBorder();
  };
  
  const sizeStyles = getSizeStyles();
  const borderStyle = getBorderStyle();
  
  return (
    <Input
      backgroundColor={backgroundColors.inputDefault}
      fontFamily={fontConfig.family}
      color="#FFFFFF"
      fontWeight={fontConfig.weights.normal}
      borderRadius="0"
      placeholderTextColor="#BFBFBF"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      transition={enableFocusEffect ? `all ${animationConfig.transition.fast} ${animationConfig.easing.smooth}` : "none"}
      {...sizeStyles}
      {...borderStyle}
      {...props}
    />
  );
};

export default PixelatedInput;