import type { ThemeConfig } from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const colors = {
  // 主色：苹果蓝
  primary: {
    50: "#F0F7FF",
    100: "#D6E8FF",
    200: "#ADCEFF",
    300: "#6FA8FF",
    400: "#2F80FF",
    500: "#0A84FF",
    600: "#0066CC",
    700: "#004C99",
    800: "#003366",
    900: "#001A33",
  },
  // 强调色：苹果绿（用于启动按钮等正向操作）
  accent: {
    50: "#EDFFF4",
    100: "#C6F5D8",
    200: "#8EE8AE",
    300: "#5FD98B",
    400: "#38D96B",
    500: "#30D158",
    600: "#248A3D",
    700: "#1A662D",
    800: "#124420",
    900: "#0A2213",
  },
  // 语义色：危险（红）
  danger: {
    50: "#FFF1F0",
    100: "#FFD6D4",
    200: "#FFADAA",
    300: "#FF7A74",
    400: "#FF5A4F",
    500: "#FF3B30",
    600: "#D70015",
    700: "#A40010",
    800: "#6B000A",
    900: "#350005",
  },
  // 语义色：警告（橙）
  warning: {
    50: "#FFF8EC",
    100: "#FFE9BF",
    200: "#FFD380",
    300: "#FFBB40",
    400: "#FFA81A",
    500: "#FF9500",
    600: "#C76E00",
    700: "#8F4F00",
    800: "#5C3300",
    900: "#2E1900",
  },
  // 语义色：信息（蓝）
  info: {
    50: "#F0F7FF",
    100: "#D6E8FF",
    200: "#ADCEFF",
    300: "#6FA8FF",
    400: "#2F80FF",
    500: "#0A84FF",
    600: "#0066CC",
    700: "#004C99",
    800: "#003366",
    900: "#001A33",
  },
  // 语义色：成功（绿）
  success: {
    50: "#EDFFF4",
    100: "#C6F5D8",
    200: "#8EE8AE",
    300: "#5FD98B",
    400: "#38D96B",
    500: "#30D158",
    600: "#248A3D",
    700: "#1A662D",
    800: "#124420",
    900: "#0A2213",
  },
  // 灰色系：苹果 SF 配色（更自然过渡）
  gray: {
    50: "#FAFAFC",
    100: "#F5F5F7",
    200: "#ECECF0",
    300: "#DCDCE0",
    400: "#BFBFC4",
    500: "#8E8E93",
    600: "#636366",
    700: "#48484A",
    800: "#3A3A3C",
    900: "#1D1D1F",
    950: "#151517",
  },
  // 卡片 / 面板表面色（半透明白色变体）
  surface: {
    50: "rgba(255, 255, 255, 0.95)",
    100: "rgba(255, 255, 255, 0.85)",
    200: "rgba(255, 255, 255, 0.75)",
    300: "rgba(255, 255, 255, 0.65)",
    400: "rgba(255, 255, 255, 0.55)",
    500: "rgba(255, 255, 255, 0.45)",
  },
};

const fonts = {
  heading: `'-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'PingFang SC', 'Microsoft YaHei', sans-serif`,
  body: `'-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'PingFang SC', 'Microsoft YaHei', sans-serif`,
  mono: `'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace`,
};

const fontSizes = {
  xs: "12px",
  sm: "13px",
  md: "15px",
  lg: "17px",
  xl: "19px",
  "2xl": "22px",
  "3xl": "28px",
  "4xl": "34px",
  "5xl": "42px",
  "6xl": "52px",
};

const lineHeights = {
  normal: "1.55",
  tight: "1.25",
  relaxed: "1.65",
};

const letterSpacings = {
  tighter: "-0.03em",
  tight: "-0.015em",
  normal: "0.01em",
  wide: "0.03em",
};

// 自定义关键帧动画
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.02); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const styles = {
  global: {
    "html, body": {
      bg: "gray.50",
      color: "gray.800",
      lineHeight: "1.55",
      letterSpacing: "0.01em",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    "h1, h2, h3, h4, h5, h6": {
      letterSpacing: "-0.015em",
      lineHeight: "1.25",
      color: "gray.900",
    },
    "p, span, div": {
      lineHeight: "1.6",
    },
    a: {
      color: "primary.500",
      textDecoration: "none",
      transition: "color 0.2s ease",
      _hover: {
        color: "primary.600",
      },
    },
    "::selection": {
      bg: "rgba(10, 132, 255, 0.25)",
      color: "primary.900",
    },
    // 现代风格滚动条
    "::-webkit-scrollbar": {
      width: "10px",
      height: "10px",
    },
    "::-webkit-scrollbar-track": {
      bg: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      bg: "rgba(142, 142, 147, 0.3)",
      borderRadius: "full",
      border: "2px solid transparent",
      backgroundClip: "padding-box",
      transition: "all 0.2s ease",
    },
    "::-webkit-scrollbar-thumb:hover": {
      bg: "rgba(10, 132, 255, 0.5)",
      backgroundClip: "padding-box",
    },
  },
};

const components = {
  // 按钮：液态玻璃风格
  Button: {
    baseStyle: {
      fontWeight: "500",
      borderRadius: "2xl",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      _focus: {
        boxShadow: "none",
      },
      _focusVisible: {
        boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.25)",
        outline: "none",
      },
    },
    variants: {
      // 绿色玻璃主按钮（启动游戏）
      primary: {
        bg: "rgba(48, 209, 88, 0.95)",
        color: "white",
        fontWeight: "600",
        boxShadow: "0 4px 16px rgba(48, 209, 88, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        backdropFilter: "blur(20px) saturate(180%)",
        _hover: {
          bg: "rgba(48, 209, 88, 1)",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(48, 209, 88, 0.35)",
        },
        _active: {
          transform: "translateY(0)",
          boxShadow: "0 2px 8px rgba(48, 209, 88, 0.3)",
        },
        _disabled: {
          opacity: 0.45,
          cursor: "not-allowed",
          transform: "none",
        },
      },
      // 蓝色玻璃按钮（通用）
      secondary: {
        bg: "rgba(255, 255, 255, 0.6)",
        color: "gray.900",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        backdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05)",
        fontWeight: "500",
        _hover: {
          bg: "rgba(255, 255, 255, 0.75)",
          borderColor: "rgba(10, 132, 255, 0.3)",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
        },
        _active: {
          bg: "rgba(255, 255, 255, 0.85)",
          transform: "translateY(0)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        },
        _disabled: {
          opacity: 0.4,
          cursor: "not-allowed",
          transform: "none",
        },
      },
      // 幽灵按钮
      ghost: {
        bg: "transparent",
        color: "gray.700",
        _hover: {
          bg: "rgba(10, 132, 255, 0.08)",
          color: "primary.600",
        },
        _active: {
          bg: "rgba(10, 132, 255, 0.15)",
        },
      },
      // 破坏性按钮：红色玻璃
      danger: {
        bg: "rgba(255, 59, 48, 0.9)",
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        backdropFilter: "blur(20px) saturate(180%)",
        fontWeight: "600",
        boxShadow: "0 4px 14px rgba(255, 59, 48, 0.2)",
        _hover: {
          bg: "rgba(255, 59, 48, 1)",
          transform: "translateY(-1px)",
          boxShadow: "0 6px 20px rgba(255, 59, 48, 0.3)",
        },
        _active: {
          transform: "translateY(0)",
          boxShadow: "0 2px 8px rgba(255, 59, 48, 0.25)",
        },
      },
      // 蓝色实心主按钮（用于一般操作）
      solid: {
        bg: "primary.500",
        color: "white",
        fontWeight: "600",
        boxShadow: "0 4px 14px rgba(10, 132, 255, 0.25)",
        _hover: {
          bg: "primary.600",
          transform: "translateY(-1px)",
          boxShadow: "0 6px 20px rgba(10, 132, 255, 0.35)",
        },
        _active: {
          bg: "primary.700",
          transform: "translateY(0)",
          boxShadow: "0 2px 8px rgba(10, 132, 255, 0.25)",
        },
      },
    },
    sizes: {
      lg: {
        h: "54px",
        fontSize: "16px",
        px: "32px",
        borderRadius: "2xl",
      },
      md: {
        h: "44px",
        fontSize: "15px",
        px: "22px",
        borderRadius: "xl",
      },
      sm: {
        h: "36px",
        fontSize: "13px",
        px: "16px",
        borderRadius: "lg",
      },
    },
    defaultProps: {
      variant: "secondary",
      size: "md",
    },
  },

  // 卡片：液态玻璃
  Card: {
    baseStyle: {
      container: {
        bg: "rgba(255, 255, 255, 0.65)",
        borderRadius: "2xl",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        overflow: "hidden",
        backdropFilter: "blur(28px) saturate(180%)",
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.06)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
    variants: {
      // 玻璃变体：更强的液态玻璃效果
      glass: {
        container: {
          bg: "rgba(255, 255, 255, 0.65)",
          backdropFilter: "blur(40px) saturate(200%)",
          border: "1px solid rgba(255, 255, 255, 0.7)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.5) inset",
        },
      },
      hover: {
        container: {
          _hover: {
            borderColor: "rgba(10, 132, 255, 0.2)",
            transform: "translateY(-3px)",
            boxShadow: "0 10px 32px rgba(0, 0, 0, 0.1)",
          },
        },
      },
      solid: {
        container: {
          bg: "white",
          borderColor: "gray.200",
          backdropFilter: "none",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
        },
      },
      solidHover: {
        container: {
          bg: "white",
          borderColor: "gray.200",
          backdropFilter: "none",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
          _hover: {
            borderColor: "rgba(10, 132, 255, 0.3)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 28px rgba(0, 0, 0, 0.08)",
          },
        },
      },
    },
  },

  // 输入框：苹果风格
  Input: {
    baseStyle: {
      field: {
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
    variants: {
      outline: {
        field: {
          h: "44px",
          bg: "rgba(245, 245, 247, 0.6)",
          borderColor: "gray.200",
          borderRadius: "lg",
          color: "gray.900",
          fontSize: "15px",
          backdropFilter: "blur(20px) saturate(180%)",
          _placeholder: {
            color: "gray.500",
          },
          _hover: {
            borderColor: "gray.300",
            bg: "rgba(245, 245, 247, 0.75)",
          },
          _focus: {
            borderColor: "primary.500",
            boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.15)",
            bg: "rgba(255, 255, 255, 0.85)",
          },
        },
      },
    },
    defaultProps: {
      variant: "outline",
      size: "md",
    },
  },

  Select: {
    baseStyle: {
      field: {
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
    variants: {
      outline: {
        field: {
          h: "44px",
          bg: "rgba(245, 245, 247, 0.6)",
          borderColor: "gray.200",
          borderRadius: "lg",
          color: "gray.900",
          fontSize: "15px",
          backdropFilter: "blur(20px) saturate(180%)",
          _hover: {
            borderColor: "gray.300",
          },
          _focus: {
            borderColor: "primary.500",
            boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.15)",
          },
        },
      },
    },
    defaultProps: {
      variant: "outline",
      size: "md",
    },
  },

  Textarea: {
    baseStyle: {
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    variants: {
      outline: {
        bg: "rgba(245, 245, 247, 0.6)",
        borderColor: "gray.200",
        borderRadius: "lg",
        color: "gray.900",
        fontSize: "15px",
        backdropFilter: "blur(20px) saturate(180%)",
        _placeholder: {
          color: "gray.500",
        },
        _hover: {
          borderColor: "gray.300",
        },
        _focus: {
          borderColor: "primary.500",
          boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.15)",
          bg: "rgba(255, 255, 255, 0.85)",
        },
      },
    },
    defaultProps: {
      variant: "outline",
    },
  },

  // 标签页：分段式
  Tabs: {
    variants: {
      line: {
        tab: {
          color: "gray.600",
          fontWeight: "500",
          fontSize: "14px",
          borderRadius: "lg",
          py: 2,
          px: 4,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          _selected: {
            color: "primary.500",
            bg: "rgba(10, 132, 255, 0.1)",
          },
          _hover: {
            bg: "rgba(10, 132, 255, 0.05)",
          },
        },
      },
    },
  },

  // 模态框：液态玻璃
  Modal: {
    baseStyle: {
      dialog: {
        bg: "rgba(255, 255, 255, 0.85)",
        borderRadius: "2xl",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
        backdropFilter: "blur(30px) saturate(180%)",
      },
      header: {
        color: "gray.900",
        fontSize: "18px",
        fontWeight: "600",
        letterSpacing: "-0.015em",
      },
      body: {
        color: "gray.700",
      },
    },
  },

  // 菜单：液态玻璃
  Menu: {
    baseStyle: {
      list: {
        bg: "rgba(255, 255, 255, 0.82)",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        borderRadius: "xl",
        py: 2,
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
        backdropFilter: "blur(28px) saturate(180%)",
      },
      item: {
        bg: "transparent",
        borderRadius: "lg",
        color: "gray.800",
        fontSize: "14px",
        mx: 1,
        py: 2,
        transition: "all 0.15s ease",
        _hover: {
          bg: "rgba(10, 132, 255, 0.1)",
          color: "primary.600",
        },
        _focus: {
          bg: "rgba(10, 132, 255, 0.1)",
          color: "primary.600",
        },
      },
    },
  },

  // 工具提示
  Tooltip: {
    baseStyle: {
      bg: "rgba(29, 29, 31, 0.92)",
      color: "white",
      borderRadius: "lg",
      px: 3,
      py: 2,
      fontSize: "13px",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
      backdropFilter: "blur(20px)",
    },
  },

  // 进度条：柔和
  Progress: {
    baseStyle: {
      track: {
        bg: "rgba(0, 0, 0, 0.06)",
        borderRadius: "full",
      },
      filledTrack: {
        bg: "primary.500",
        borderRadius: "full",
        boxShadow: "0 0 8px rgba(10, 132, 255, 0.3)",
        transition: "width 0.3s ease",
      },
    },
  },

  // 徽章
  Badge: {
    baseStyle: {
      borderRadius: "full",
      px: 3,
      py: 1,
      fontSize: "12px",
      fontWeight: "600",
    },
    variants: {
      primary: {
        bg: "rgba(10, 132, 255, 0.12)",
        color: "primary.600",
      },
      secondary: {
        bg: "rgba(0, 0, 0, 0.05)",
        color: "gray.700",
      },
      success: {
        bg: "rgba(48, 209, 88, 0.15)",
        color: "success.600",
      },
      warning: {
        bg: "rgba(255, 149, 0, 0.15)",
        color: "warning.500",
      },
      danger: {
        bg: "rgba(255, 59, 48, 0.15)",
        color: "danger.500",
      },
    },
    defaultProps: {
      variant: "secondary",
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  fonts,
  fontSizes,
  lineHeights,
  letterSpacings,
  styles,
  components,
  space: {
    px: "1px",
    0.5: "2px",
    1: "4px",
    1.5: "6px",
    2: "8px",
    2.5: "10px",
    3: "12px",
    3.5: "14px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
    9: "36px",
    10: "40px",
    12: "48px",
    14: "56px",
    16: "64px",
    20: "80px",
    24: "96px",
    28: "112px",
    32: "128px",
  },
  radii: {
    none: "0",
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "18px",
    "2xl": "24px",
    "3xl": "32px",
    full: "9999px",
  },
  shadows: {
    xs: "0 1px 2px rgba(0, 0, 0, 0.03)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.04)",
    md: "0 4px 12px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 28px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 48px rgba(0, 0, 0, 0.12)",
    "2xl": "0 30px 60px rgba(0, 0, 0, 0.15)",
    glow: "0 0 32px rgba(10, 132, 255, 0.2)",
    primary: "0 4px 16px rgba(10, 132, 255, 0.25)",
    accent: "0 4px 16px rgba(48, 209, 88, 0.25)",
    danger: "0 4px 16px rgba(255, 59, 48, 0.25)",
    warning: "0 4px 16px rgba(255, 149, 0, 0.25)",
  },
  animation: {
    pulse: `${pulse} 2s ease-in-out infinite`,
    float: `${float} 3s ease-in-out infinite`,
    fadeIn: `${fadeIn} 0.4s ease-out`,
  },
});

export default theme;
