/**
 * 动态背景组件
 * 
 * 使用 Canvas 实现 Minecraft 风格的动态背景，包括移动的云朵和昼夜循环效果
 */

import React, { useEffect, useRef, useCallback } from "react";
import { Box, BoxProps } from "@chakra-ui/react";
import { primaryColors } from "@/styles/pixelated-theme";

interface DynamicBackgroundProps extends BoxProps {
  /**
   * 是否启用动态背景
   */
  enabled?: boolean;
  
  /**
   * 昼夜循环速度（秒）
   */
  cycleSpeed?: number;
  
  /**
   * 云朵移动速度（像素/秒）
   */
  cloudSpeed?: number;
  
  /**
   * 云朵数量
   */
  cloudCount?: number;
}

/**
 * 动态背景组件
 * 
 * 示例用法：
 * ```tsx
 * <DynamicBackground
 *   enabled={true}
 *   cycleSpeed={60}
 *   cloudSpeed={30}
 *   cloudCount={6}
 * />
 * ```
 */
const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  enabled = true,
  cycleSpeed = 60,
  cloudSpeed = 30,
  cloudCount = 6,
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const cloudsRef = useRef<any[]>([]);
  const starsRef = useRef<any[]>([]);
  const groundRef = useRef<any[]>([]);
  const timeRef = useRef<number>(0);
  
  // 初始化云朵
  const initClouds = useCallback((width: number, height: number) => {
    const clouds: any[] = [];
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.4) + 50,
        width: Math.random() * 100 + 50,
        height: Math.random() * 30 + 20,
        speed: Math.random() * cloudSpeed + cloudSpeed * 0.5,
      });
    }
    cloudsRef.current = clouds;
  }, [cloudCount, cloudSpeed]);
  
  // 初始化星星
  const initStars = useCallback((width: number, height: number) => {
    const stars: any[] = [];
    const starCount = 50;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.6),
        size: Math.random() * 3 + 1,
        brightness: Math.random(),
        twinkleSpeed: Math.random() * 2 + 1,
      });
    }
    starsRef.current = stars;
  }, []);
  
  // 初始化地面
  const initGround = useCallback((width: number, height: number) => {
    const ground: any[] = [];
    const groundHeight = height * 0.2;
    const blockSize = 16;
    
    for (let x = 0; x < width; x += blockSize) {
      const blockType = Math.random() > 0.5 ? 'grass' : 'dirt';
      const blockHeight = groundHeight + Math.random() * 20 - 10;
      
      ground.push({
        x,
        y: height - blockHeight,
        width: blockSize,
        height: blockHeight,
        type: blockType,
      });
    }
    
    groundRef.current = ground;
  }, []);
  
  // 绘制天空（昼夜循环）
  const drawSky = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const cycleTime = (time / 1000) % cycleSpeed;
    const cycleProgress = cycleTime / cycleSpeed;
    
    let skyColor: string;
    
    if (cycleProgress < 0.25) {
      // 白天
      skyColor = primaryColors.skyBlue;
    } else if (cycleProgress < 0.35) {
      // 黄昏
      const progress = (cycleProgress - 0.25) / 0.1;
      skyColor = interpolateColor(primaryColors.skyBlue, '#FF6B6B', progress);
    } else if (cycleProgress < 0.65) {
      // 夜晚
      skyColor = '#191970';
    } else if (cycleProgress < 0.75) {
      // 黎明
      const progress = (cycleProgress - 0.65) / 0.1;
      skyColor = interpolateColor('#191970', '#FFB6C1', progress);
    } else {
      // 白天
      const progress = (cycleProgress - 0.75) / 0.25;
      skyColor = interpolateColor('#FFB6C1', primaryColors.skyBlue, progress);
    }
    
    // 绘制天空背景
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, width, height);
    
    // 夜晚时绘制星星
    if (cycleProgress >= 0.35 && cycleProgress < 0.75) {
      drawStars(ctx, width, height, time);
    }
  }, [cycleSpeed]);
  
  // 绘制星星
  const drawStars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    starsRef.current.forEach((star) => {
      const twinkle = Math.sin((time / 1000) * star.twinkleSpeed) * 0.5 + 0.5;
      const brightness = star.brightness * twinkle;
      
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }, []);
  
  // 绘制云朵
  const drawClouds = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, deltaTime: number) => {
    cloudsRef.current.forEach((cloud) => {
      // 移动云朵
      cloud.x += cloud.speed * deltaTime / 1000;
      
      // 循环云朵
      if (cloud.x > width) {
        cloud.x = -cloud.width;
      }
      
      // 绘制像素化云朵
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      
      // 云朵由多个方块组成
      const blockSize = 8;
      for (let x = 0; x < cloud.width; x += blockSize) {
        for (let y = 0; y < cloud.height; y += blockSize) {
          // 随机跳过一些方块，创建像素化效果
          if (Math.random() > 0.3) {
            ctx.fillRect(cloud.x + x, cloud.y + y, blockSize, blockSize);
          }
        }
      }
    });
  }, []);
  
  // 绘制地面
  const drawGround = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    groundRef.current.forEach((block) => {
      let color: string;
      
      switch (block.type) {
        case 'grass':
          color = primaryColors.grassGreen;
          break;
        case 'dirt':
          color = primaryColors.dirtBrown;
          break;
        default:
          color = primaryColors.stoneGray;
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(block.x, block.y, block.width, block.height);
      
      // 添加像素化边框
      ctx.strokeStyle = '#3F3F3F';
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x, block.y, block.width, block.height);
    });
  }, []);
  
  // 颜色插值函数
  const interpolateColor = (color1: string, color2: string, progress: number): string => {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // 动画循环
  const animate = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    let lastTime = performance.now();
    
    const loop = (currentTime: number) => {
      if (!enabled) {
        return;
      }
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      timeRef.current += deltaTime;
      
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      
      // 绘制各个元素
      drawSky(ctx, width, height, timeRef.current);
      drawClouds(ctx, width, height, deltaTime);
      drawGround(ctx, width, height);
      
      // 继续动画
      animationRef.current = requestAnimationFrame(loop);
    };
    
    animationRef.current = requestAnimationFrame(loop);
  }, [enabled, drawSky, drawClouds, drawGround]);
  
  // 初始化和清理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    
    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // 初始化元素
      initClouds(canvas.width, canvas.height);
      initStars(canvas.width, canvas.height);
      initGround(canvas.width, canvas.height);
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 开始动画
    animate(ctx, canvas.width, canvas.height);
    
    // 清理
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, initClouds, initStars, initGround, animate]);
  
  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      zIndex={-1}
      {...props}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: enabled ? 'block' : 'none',
        }}
      />
      
      {/* 禁用时显示静态背景 */}
      {!enabled && (
        <Box
          width="100%"
          height="100%"
          backgroundColor={primaryColors.skyBlue}
        />
      )}
    </Box>
  );
};

export default DynamicBackground;