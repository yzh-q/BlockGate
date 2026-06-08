/**
 * 卡片网格组件
 * 
 * 创建 Minecraft 风格的像素化卡片网格布局，用于展示游戏实例、功能模块等
 */

import React from "react";
import { Box, BoxProps, SimpleGrid } from "@chakra-ui/react";
import {
  sizeConfig,
  responsiveConfig,
  borderConfig,
  animationConfig,
} from "@/styles/pixelated-theme";
import PixelatedCard from "@/components/common/pixelated-card";

interface CardItem {
  id: string;
  title: string;
  description?: string;
  icon?: string | React.ReactNode;
  onClick?: () => void;
  onLaunch?: () => void;
}

interface PixelatedCardGridProps extends BoxProps {
  /**
   * 卡片列表
   */
  cards?: CardItem[];
  
  /**
   * 网格列数（自动响应式）
   */
  columns?: number;
  
  /**
   * 卡片间距
   */
  gap?: string;
  
  /**
   * 是否显示启动按钮
   */
  showLaunchButton?: boolean;
}

/**
 * 卡片网格组件
 * 
 * 示例用法：
 * ```tsx
 * <PixelatedCardGrid
 *   cards={[
 *     { id: "1", title: "我的世界", description: "版本 1.20.4", icon: "/grass.png" },
 *     { id: "2", title: "模组包", description: "版本 1.19.2", icon: "/modpack.png" },
 *   ]}
 *   showLaunchButton
 * />
 * ```
 */
const PixelatedCardGrid: React.FC<PixelatedCardGridProps> = ({
  cards = [],
  columns = responsiveConfig.cardGridColumns.desktop,
  gap = sizeConfig.card.gap,
  showLaunchButton = false,
  ...props
}) => {
  // 根据屏幕宽度计算列数
  const getResponsiveColumns = () => {
    const width = window.innerWidth;
    
    if (width < parseInt(responsiveConfig.breakpoints.mobile)) {
      return responsiveConfig.cardGridColumns.mobile;
    } else if (width < parseInt(responsiveConfig.breakpoints.desktop)) {
      return responsiveConfig.cardGridColumns.tablet;
    } else {
      return columns;
    }
  };
  
  return (
    <Box
      width="100%"
      padding={gap}
      {...props}
    >
      <SimpleGrid
        columns={getResponsiveColumns()}
        spacing={gap}
        width="100%"
      >
        {cards.map((card) => (
          <PixelatedCard
            key={card.id}
            title={card.title}
            description={card.description}
            icon={card.icon}
            enableHoverEffect
            showLaunchButton={showLaunchButton}
            onLaunch={card.onLaunch}
            onClick={card.onClick}
          />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default PixelatedCardGrid;