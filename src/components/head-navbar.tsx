import { Box, Flex, HStack, Text, Tooltip } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import {
  LuBox,
  LuCircleUserRound,
  LuGamepad2,
  LuNetwork,
  LuSearch,
  LuSettings,
  LuSparkles,
} from "react-icons/lu";
import { DownloadIndicator } from "@/components/download-indicator";
import { useSharedModals } from "@/contexts/shared-modal";

const HeadNavBar = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { openSharedModal } = useSharedModals();

  const navList = [
    { icon: LuGamepad2, label: "launch", path: "/launch" },
    { icon: LuBox, label: "instances", path: "/instances" },
    { icon: LuCircleUserRound, label: "accounts", path: "/accounts" },
    { icon: LuNetwork, label: "multiplayer", path: "/multiplayer" },
    { icon: LuSettings, label: "settings", path: "/settings" },
  ];

  const selectedIndex = navList.findIndex((item) =>
    router.pathname.startsWith(item.path)
  );

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  return (
    <Box position="relative" zIndex={100}>
      <Flex
        justify="space-between"
        align="center"
        px={{ base: 4, md: 6, lg: 8 }}
        py={3}
        h="64px"
        bg="rgba(255, 255, 255, 0.65)"
        borderBottom="1px solid rgba(255, 255, 255, 0.6)"
        backdropFilter="blur(30px) saturate(200%)"
        boxShadow="0 1px 0 rgba(255, 255, 255, 0.5) inset, 0 8px 24px rgba(0, 0, 0, 0.04)"
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
      >
        {/* Logo 区域 */}
        <HStack spacing={3}>
          <Box
            w="40px"
            h="40px"
            bg="rgba(10, 132, 255, 0.95)"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 16px rgba(10, 132, 255, 0.35), 0 1px 0 rgba(255, 255, 255, 0.5) inset"
            position="relative"
            cursor="pointer"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              transform: "scale(1.06) translateY(-1px)",
              boxShadow:
                "0 6px 20px rgba(10, 132, 255, 0.45), 0 1px 0 rgba(255, 255, 255, 0.6) inset",
              bg: "rgba(10, 132, 255, 1)",
            }}
            _active={{
              transform: "scale(0.98)",
            }}
            onClick={() => handleNavClick("/launch")}
          >
            <LuSparkles size={19} color="#ffffff" />
          </Box>
          <Text
            fontSize="15.5px"
            fontWeight="700"
            color="gray.900"
            letterSpacing="0.01em"
          >
            BlockGate
          </Text>
        </HStack>

        {/* 导航区域 - 分段式胶囊 */}
        <HStack
          spacing={1}
          bg="rgba(245, 245, 247, 0.55)"
          borderRadius="full"
          p={1.5}
          border="1px solid rgba(255, 255, 255, 0.6)"
          backdropFilter="blur(24px) saturate(200%)"
          boxShadow="0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255, 255, 255, 0.5) inset"
        >
          {navList.map((item, index) => {
            const Icon = item.icon;
            const isActive = selectedIndex === index;

            return (
              <Tooltip
                key={item.path}
                label={t(`HeadNavBar.navList.${item.label}`)}
                placement="bottom"
                hasArrow
                bg="rgba(29, 29, 31, 0.92)"
                color="white"
                borderRadius="lg"
                px={3}
                py={2}
                fontSize="12px"
                boxShadow="0 6px 20px rgba(0, 0, 0, 0.15)"
                backdropFilter="blur(20px)"
              >
                <Box
                  onClick={() => handleNavClick(item.path)}
                  cursor="pointer"
                  px={{ base: 3, md: 4 }}
                  py={2}
                  borderRadius="full"
                  bg={isActive ? "white" : "transparent"}
                  color={isActive ? "primary.500" : "gray.600"}
                  fontWeight={isActive ? "600" : "500"}
                  fontSize="13.5px"
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  transform={isActive ? "scale(1)" : "scale(0.98)"}
                  boxShadow={
                    isActive
                      ? "0 2px 10px rgba(10, 132, 255, 0.12), 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255, 255, 255, 0.8) inset"
                      : "none"
                  }
                  _hover={{
                    bg: isActive ? "white" : "rgba(0, 0, 0, 0.05)",
                    color: isActive ? "primary.500" : "gray.800",
                    transform: isActive ? "scale(1)" : "scale(1)",
                    boxShadow: isActive
                      ? "0 2px 10px rgba(10, 132, 255, 0.18), 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.8) inset"
                      : "none",
                  }}
                  _active={{
                    transform: "scale(0.97)",
                  }}
                  display="flex"
                  alignItems="center"
                >
                  <HStack spacing={2}>
                    <Icon
                      size={15.5}
                      style={{
                        transition:
                          "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                    <Text>{t(`HeadNavBar.navList.${item.label}`)}</Text>
                  </HStack>
                </Box>
              </Tooltip>
            );
          })}

          {/* 搜索按钮 */}
          <Box
            onClick={() => openSharedModal("spotlight-search")}
            cursor="pointer"
            px={{ base: 3, md: 3 }}
            py={2}
            borderRadius="full"
            color="gray.600"
            fontSize="13px"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              bg: "rgba(10, 132, 255, 0.08)",
              color: "primary.500",
              boxShadow: "0 2px 8px rgba(10, 132, 255, 0.1)",
            }}
            _active={{
              transform: "scale(0.95)",
            }}
            display="flex"
            alignItems="center"
            borderLeft="1px solid rgba(0, 0, 0, 0.06)"
            ml={1}
          >
            <LuSearch size={17} />
          </Box>
        </HStack>

        {/* 状态区域 */}
        <HStack spacing={3}>
          <DownloadIndicator />
        </HStack>
      </Flex>
    </Box>
  );
};

export default HeadNavBar;
