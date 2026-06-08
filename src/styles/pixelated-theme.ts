/**
 * 像素化 Minecraft 主题配置
 * 
 * 定义所有颜色、字体、边框样式等，用于创建统一的像素化 Minecraft 界面风格
 */

// ==================== 颜色方案 ====================

/**
 * 主色调 - Minecraft 经典配色
 */
export const primaryColors = {
  grassGreen: '#5D8C3E',      // 草绿色 - 主要按钮、导航菜单项悬停状态
  dirtBrown: '#8B4513',       // 泥土棕色 - 次要按钮、边框
  skyBlue: '#87CEEB',         // 天空蓝色 - 链接、高亮元素
  stoneGray: '#7F7F7F',       // 石头灰色 - 背景、禁用状态
  woodBrown: '#C4A76C',       // 木头棕色 - 卡片背景
};

/**
 * 强调色 - Minecraft 特殊颜色
 */
export const accentColors = {
  diamondBlue: '#4AEDD9',     // 钻石蓝 - 特殊功能、成就提示
  goldBlock: '#FFD700',       // 金块金 - 重要信息、警告
  redstoneRed: '#FF0000',     // 红石红 - 错误提示、删除操作
};

/**
 * 边框颜色 - 像素化边框
 */
export const borderColors = {
  darkOuter: '#3F3F3F',       // 深色外边框
  lightInner: '#BFBFBF',      // 浅色内边框
  hoverOuter: '#5D8C3E',      // 悬停外边框（草绿色）
  hoverInner: '#8BC34A',      // 悬停内边框（浅绿色）
};

/**
 * 背景颜色 - 半透明背景
 */
export const backgroundColors = {
  cardDefault: 'rgba(127, 127, 127, 0.8)',     // 卡片默认背景
  cardHover: 'rgba(139, 69, 19, 0.9)',         // 卡片悬停背景
  cardSelected: 'rgba(196, 167, 108, 0.9)',    // 卡片选中背景
  inputDefault: 'rgba(0, 0, 0, 0.5)',          // 输入框默认背景
  modalOverlay: 'rgba(0, 0, 0, 0.7)',          // 模态框背景
};

/**
 * 文字颜色
 */
export const textColors = {
  white: '#FFFFFF',           // 白色文字（深色背景）
  black: '#000000',           // 黑色文字（浅色背景）
  gold: '#FFD700',            // 金色文字（选中状态）
  disabled: '#4F4F4F',        // 禁用文字
};

// ==================== 字体配置 ====================

/**
 * 像素字体配置
 */
export const fontConfig = {
  family: '"Press Start 2P", "Courier New", monospace',  // 像素字体
  sizes: {
    title: '24px',            // 标题
    heading: '20px',          // 大标题
    body: '16px',             // 正文
    small: '12px',            // 小字
    tiny: '10px',             // 极小字
  },
  weights: {
    normal: '400',
    bold: '700',
  },
};

// ==================== 边框配置 ====================

/**
 * 像素化边框配置
 */
export const borderConfig = {
  width: '4px',               // 边框宽度（模拟 Minecraft 像素单位）
  innerWidth: '2px',          // 内边框宽度
  
  /**
   * 创建像素化边框样式
   * @param options - 边框选项
   * @returns CSS 样式对象
   */
  createPixelatedBorder: (options: {
    darkColor?: string;
    lightColor?: string;
    width?: string;
    innerWidth?: string;
  } = {}) => {
    const dark = options.darkColor || borderColors.darkOuter;
    const light = options.lightColor || borderColors.lightInner;
    const w = options.width || borderConfig.width;
    const iw = options.innerWidth || borderConfig.innerWidth;
    
    return {
      border: `${w} solid ${dark}`,
      boxShadow: `inset ${iw} ${iw} 0 ${light}, inset -${iw} -${iw} 0 ${dark}`,
    };
  },
  
  /**
   * 创建悬停边框样式
   */
  createHoverBorder: () => {
    return borderConfig.createPixelatedBorder({
      darkColor: borderColors.hoverOuter,
      lightColor: borderColors.hoverInner,
    });
  },
};

// ==================== 尺寸配置 ====================

/**
 * 组件尺寸配置
 */
export const sizeConfig = {
  sidebar: {
    expanded: '200px',        // 侧边栏展开宽度
    collapsed: '60px',        // 侧边栏折叠宽度
    logoHeight: '80px',       // Logo 区域高度
    menuItemHeight: '50px',   // 菜单项高度
    foldButtonHeight: '40px', // 折叠按钮高度
  },
  
  header: {
    height: '40px',           // 顶部状态栏高度
  },
  
  card: {
    width: '280px',           // 卡片宽度
    height: '200px',          // 卡片高度
    gap: '20px',              // 卡片间距
    iconSize: '80px',         // 卡片图标尺寸
  },
  
  button: {
    minWidth: '120px',        // 按钮最小宽度
    height: '40px',           // 按钮高度
    padding: '12px 24px',     // 按钮内边距
  },
  
  input: {
    height: '40px',           // 输入框高度
    padding: '12px 16px',     // 输入框内边距
  },
};

// ==================== 动画配置 ====================

/**
 * 动画配置
 */
export const animationConfig = {
  transition: {
    fast: '0.2s',             // 快速过渡
    normal: '0.3s',           // 正常过渡
    slow: '0.5s',             // 慢速过渡
  },
  
  easing: {
    smooth: 'ease-in-out',    // 平滑缓动
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // 弹跳缓动
  },
  
  /**
   * 悬停动画效果
   */
  hoverEffect: {
    scale: 'scale(1.05)',     // 放大 5%
    translateY: 'translateY(-2px)',  // 向上移动 2px
  },
  
  /**
   * 点击动画效果
   */
  clickEffect: {
    translateY: 'translateY(1px)',   // 向下移动 1px
  },
};

// ==================== 响应式配置 ====================

/**
 * 响应式断点配置
 */
export const responsiveConfig = {
  breakpoints: {
    mobile: '600px',          // 移动端断点
    tablet: '800px',          // 平板端断点
    desktop: '1000px',        // 桌面端断点
  },
  
  /**
   * 卡片网格列数配置
   */
  cardGridColumns: {
    desktop: 3,               // 桌面端：3 列
    tablet: 2,                // 平板端：2 列
    mobile: 1,                // 移动端：1 列
  },
};

// ==================== 完整主题对象 ====================

/**
 * 完整的像素化 Minecraft 主题配置
 */
export const pixelatedTheme = {
  colors: {
    primary: primaryColors,
    accent: accentColors,
    border: borderColors,
    background: backgroundColors,
    text: textColors,
  },
  
  fonts: fontConfig,
  
  borders: borderConfig,
  
  sizes: sizeConfig,
  
  animations: animationConfig,
  
  responsive: responsiveConfig,
  
  /**
   * 生成完整的 CSS 样式对象
   */
  generateStyles: () => {
    return {
      // 全局样式
      global: {
        fontFamily: fontConfig.family,
        fontSize: fontConfig.sizes.body,
        color: textColors.white,
        backgroundColor: primaryColors.stoneGray,
      },
      
      // 像素化边框基础样式
      pixelatedBorder: borderConfig.createPixelatedBorder(),
      
      // 像素化悬停边框
      pixelatedHoverBorder: borderConfig.createHoverBorder(),
    };
  },
};

// 导出所有配置
export default pixelatedTheme;