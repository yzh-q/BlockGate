import { Box, Center, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { BeatLoader } from "react-spinners";
import HeadNavBar from "@/components/head-navbar";
import { useLauncherConfig } from "@/contexts/config";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const router = useRouter();
  const { config, update } = useLauncherConfig();

  const isStandAlone = router.pathname.startsWith("/standalone");
  const isLaunchPage = router.pathname.startsWith("/launch");

  // 更新运行次数
  useEffect(() => {
    if (!config.mocked && !isStandAlone) {
      const newCount = (config.runCount || 0) + 1;
      update("runCount", newCount);
    }
  }, [config.mocked, isStandAlone, config.runCount, update]);

  // 更新字体
  useEffect(() => {
    const body = document.body;
    const fontFamily = config.appearance.font.fontFamily;

    if (fontFamily !== "%built-in") {
      body.setAttribute("use-custom-font", "true");
      body.style.setProperty("--custom-global-font-family", fontFamily);
    } else {
      body.removeAttribute("use-custom-font");
      body.style.removeProperty("--custom-global-font-family");
    }
  }, [config.appearance.font.fontFamily]);

  // 更新字体大小
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevMd =
      parseFloat(
        getComputedStyle(root).getPropertyValue("--chakra-fontSizes-md")
      ) || 1;
    const ratio =
      Math.min(115, Math.max(85, config.appearance.font.fontSize)) /
      100 /
      prevMd;

    const computedStyle = getComputedStyle(root);
    for (let i = 0; i < computedStyle.length; i++) {
      const key = computedStyle[i];
      if (key.startsWith("--chakra-fontSizes-")) {
        const originalValue =
          parseFloat(computedStyle.getPropertyValue(key)) || 1;
        body.style.setProperty(key, `${originalValue * ratio}rem`, "important");
      }
    }
  }, [config.appearance.font.fontSize]);

  const getGlobalExtraStyle = (config: any) => {
    const isInvertColors = config.appearance.accessibility.invertColors;
    const enhanceContrast = config.appearance.accessibility.enhanceContrast;

    const filters = [];
    if (isInvertColors) filters.push("invert(1)");
    if (enhanceContrast) filters.push("contrast(1.2)");

    return {
      filter: filters.length > 0 ? filters.join(" ") : "none",
    };
  };

  if (isStandAlone) {
    return (
      <Box bg="gray.100" style={getGlobalExtraStyle(config)}>
        {children}
      </Box>
    );
  }

  if (config.mocked)
    return (
      <Center h="100vh" bg="gray.100" style={getGlobalExtraStyle(config)}>
        <BeatLoader size={14} color="#0A84FF" />
      </Center>
    );

  // 浮动光球动画样式 - 带有延迟和持续时间变化
  const floatOrbStyle = (
    delay: number,
    duration: number,
    scaleRange: [number, number]
  ): React.CSSProperties => ({
    animation: `floatOrb${scaleRange[0] * 10}${scaleRange[1] * 10} ${duration}s ease-in-out ${delay}s infinite alternate`,
    willChange: "transform, opacity",
  });

  return (
    <Box
      h="100vh"
      bgGradient="linear(to-br, #F2F8FF 0%, #FFF6F2 35%, #F5F0FF 70%, #F0FFF7 100%)"
      style={getGlobalExtraStyle(config)}
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* 全局动画定义 */}
      <style>
        {`
          @keyframes floatOrb108 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 0.85;
            }
            50% {
              transform: translate(40px, -30px) scale(1.08);
              opacity: 1;
            }
            100% {
              transform: translate(-30px, 40px) scale(0.95);
              opacity: 0.75;
            }
          }

          @keyframes floatOrb112 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 0.8;
            }
            50% {
              transform: translate(-50px, 20px) scale(1.12);
              opacity: 1;
            }
            100% {
              transform: translate(30px, -20px) scale(0.92);
              opacity: 0.7;
            }
          }

          @keyframes floatOrb106 {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 0.78;
            }
            50% {
              transform: translate(25px, 45px) scale(1.06);
              opacity: 1;
            }
            100% {
              transform: translate(-20px, -25px) scale(0.94);
              opacity: 0.68;
            }
          }

          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }

          @keyframes pulse-glow {
            0%, 100% {
              opacity: 0.5;
              transform: translate(-50%, -50%) scale(1);
            }
            50% {
              opacity: 0.85;
              transform: translate(-50%, -50%) scale(1.1);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* 自定义滚动条样式 */
        `}
      </style>

      {/* 多层柔和彩色光球 - 浮动动画装饰 */}
      <Box
        position="absolute"
        top="-20%"
        left="-10%"
        w="700px"
        h="700px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(10, 132, 255, 0.14) 0%, rgba(10, 132, 255, 0.04) 45%, transparent 75%)"
        filter="blur(80px)"
        pointerEvents="none"
        zIndex={0}
        style={floatOrbStyle(0, 12, [0.95, 1.08])}
      />
      <Box
        position="absolute"
        bottom="-25%"
        right="-10%"
        w="800px"
        h="800px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(175, 82, 222, 0.10) 0%, rgba(168, 85, 247, 0.03) 45%, transparent 75%)"
        filter="blur(100px)"
        pointerEvents="none"
        zIndex={0}
        style={floatOrbStyle(3, 16, [0.92, 1.12])}
      />
      <Box
        position="absolute"
        top="30%"
        right="15%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(48, 209, 88, 0.09) 0%, rgba(48, 209, 88, 0.02) 50%, transparent 75%)"
        filter="blur(90px)"
        pointerEvents="none"
        zIndex={0}
        style={floatOrbStyle(5, 18, [0.94, 1.06])}
      />
      <Box
        position="absolute"
        bottom="15%"
        left="-5%"
        w="600px"
        h="600px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(255, 149, 0, 0.08) 0%, rgba(255, 149, 0, 0.02) 50%, transparent 75%)"
        filter="blur(90px)"
        pointerEvents="none"
        zIndex={0}
        style={floatOrbStyle(7, 14, [0.95, 1.08])}
      />

      {/* 白色玻璃遮罩层 */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="rgba(255, 255, 255, 0.18)"
        pointerEvents="none"
        zIndex={0}
      />

      {/* 细腻噪点纹理 */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        zIndex={0}
        opacity={0.035}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
        }}
      />

      {/* 导航栏 - 固定高度，不参与伸缩 */}
      <Box position="relative" zIndex={100} flexShrink={0}>
        <HeadNavBar />
      </Box>

      {/* 主内容区 - flex=1 占满剩余空间，minH=0 允许收缩，内容溢出时内部滚动 */}
      <Box
        flex="1"
        minH="0"
        overflowY="auto"
        position="relative"
        zIndex={1}
        sx={{
          "&::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(10, 132, 255, 0.25)",
            borderRadius: "full",
            border: "2px solid transparent",
            backgroundClip: "padding-box",
            transition: "all 0.3s ease",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(10, 132, 255, 0.45)",
            backgroundClip: "padding-box",
          },
        }}
      >
        {isLaunchPage ? (
          <Box h="100%" position="relative" zIndex={1}>
            {children}
          </Box>
        ) : (
          <Flex
            justify="center"
            px={{ base: 4, md: 6, lg: 8 }}
            py={{ base: 6, md: 8, lg: 10 }}
          >
            <Box
              w="100%"
              maxW="1280px"
              mx="auto"
              style={{
                animation: "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
              }}
            >
              {children}
            </Box>
          </Flex>
        )}
      </Box>
    </Box>
  );
};

export default MainLayout;
