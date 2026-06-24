import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuArrowLeftRight,
  LuChevronDown,
  LuHardDrive,
  LuPlay,
  LuSettings,
  LuUsers,
} from "react-icons/lu";
import PlayerAvatar from "@/components/player-avatar";
import { useLauncherConfig } from "@/contexts/config";
import { useGlobalData } from "@/contexts/global-data";
import { useSharedModals } from "@/contexts/shared-modal";
import { PlayerType } from "@/enums/account";
import type { Player } from "@/models/account";
import type { InstanceSummary } from "@/models/instance/misc";

const easeOutCubic = "cubic-bezier(0.4, 0, 0.2, 1)";

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.85; transform: translate(-50%, -50%) scale(1.08); }
`;

const pulseGlowInner = keyframes`
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.12); }
`;

const onlinePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0.55); }
  70% { box-shadow: 0 0 0 8px rgba(48, 209, 88, 0); }
  100% { box-shadow: 0 0 0 0 rgba(48, 209, 88, 0); }
`;

const menuFadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
`;

const LaunchPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { update } = useLauncherConfig();
  const { openSharedModal } = useSharedModals();
  const { selectedPlayer, getPlayerList, getInstanceList, selectedInstance } =
    useGlobalData();

  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [instanceList, setInstanceList] = useState<InstanceSummary[]>([]);
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [showInstanceMenu, setShowInstanceMenu] = useState(false);

  useEffect(() => {
    setPlayerList(getPlayerList() || []);
  }, [getPlayerList]);

  useEffect(() => {
    setInstanceList(getInstanceList() || []);
  }, [getInstanceList]);

  const handleLaunch = () => {
    if (selectedInstance) {
      openSharedModal("launch", {
        instanceId: selectedInstance.id,
      });
    }
  };

  return (
    <Flex
      h="100%"
      direction="column"
      justify="space-between"
      position="relative"
      px={12}
      py={12}
    >
      {/* 顶部：玩家信息卡片 - 液态玻璃 */}
      <Flex justify="flex-start" align="flex-start">
        <Box
          bg="rgba(255, 255, 255, 0.72)"
          border="1px solid rgba(255, 255, 255, 0.75)"
          borderRadius="2xl"
          backdropFilter="blur(40px) saturate(200%)"
          boxShadow="0 10px 40px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255,255,255,0.6) inset"
          p={6}
          minW="360px"
          position="relative"
          overflow="hidden"
          transition={`all 0.3s ${easeOutCubic}`}
          _hover={{
            transform: "translateY(-2px)",
            boxShadow:
              "0 16px 56px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255,255,255,0.7) inset",
          }}
          style={{
            animation:
              "fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.05s both",
          }}
        >
          <HStack spacing={4} align="center">
            {selectedPlayer ? (
              <>
                <Box position="relative">
                  <PlayerAvatar boxSize="58px" avatar={selectedPlayer.avatar} />
                  <Box
                    position="absolute"
                    bottom={-1}
                    right={-1}
                    w="15px"
                    h="15px"
                    borderRadius="full"
                    bg="#30D158"
                    border="2.5px solid rgba(255, 255, 255, 1)"
                    boxShadow="0 0 0 1px rgba(48, 209, 88, 0.35), 0 1px 3px rgba(0,0,0,0.15)"
                    animation={`${onlinePulse} 2s infinite`}
                  />
                </Box>
                <VStack spacing={1.5} align="flex-start" flex="1">
                  <Text
                    fontSize="16.5px"
                    fontWeight="700"
                    color="gray.900"
                    maxW="100%"
                    isTruncated
                    lineHeight="1.2"
                    letterSpacing="-0.01em"
                  >
                    {selectedPlayer.name}
                  </Text>
                  <Badge
                    bg="rgba(10, 132, 255, 0.12)"
                    color="primary.600"
                    px={2.5}
                    py={1}
                    fontSize="11.5px"
                    fontWeight="600"
                    borderRadius="full"
                  >
                    {t(
                      `Enums.playerTypes.${
                        selectedPlayer.playerType === PlayerType.ThirdParty
                          ? "3rdpartyShort"
                          : selectedPlayer.playerType
                      }`
                    )}
                  </Badge>
                </VStack>
                <Tooltip label="切换玩家" placement="bottom" borderRadius="lg">
                  <IconButton
                    aria-label="切换玩家"
                    icon={<LuArrowLeftRight size={16} strokeWidth={2.2} />}
                    bg="rgba(255, 255, 255, 0.7)"
                    color="gray.700"
                    border="1px solid rgba(0, 0, 0, 0.06)"
                    borderRadius="xl"
                    size="sm"
                    h="36px"
                    w="36px"
                    minW="36px"
                    transition={`all 0.2s ${easeOutCubic}`}
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.95)",
                      color: "gray.900",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                      borderColor: "rgba(0, 0, 0, 0.1)",
                    }}
                    _active={{
                      transform: "translateY(0)",
                      bg: "rgba(245, 245, 247, 0.95)",
                    }}
                    onClick={() => setShowPlayerMenu(!showPlayerMenu)}
                  />
                </Tooltip>
              </>
            ) : (
              <>
                <Box
                  w="58px"
                  h="58px"
                  bg="rgba(245, 245, 247, 0.85)"
                  border="1px solid rgba(0, 0, 0, 0.06)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  backdropFilter="blur(20px) saturate(180%)"
                >
                  <LuUsers size={24} color="#6E6E73" />
                </Box>
                <VStack spacing={1.5} align="flex-start" flex="1">
                  <Text fontSize="15px" color="gray.900" fontWeight="600">
                    未选择玩家
                  </Text>
                  <Button
                    bg="rgba(10, 132, 255, 0.95)"
                    color="white"
                    borderRadius="xl"
                    size="sm"
                    boxShadow="0 4px 14px rgba(10, 132, 255, 0.28)"
                    transition={`all 0.2s ${easeOutCubic}`}
                    _hover={{
                      bg: "primary.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 18px rgba(10, 132, 255, 0.35)",
                    }}
                    _active={{ transform: "translateY(0)" }}
                    onClick={() => router.push("/accounts")}
                  >
                    去选择
                  </Button>
                </VStack>
              </>
            )}
          </HStack>

          {/* 玩家下拉菜单 */}
          {showPlayerMenu && playerList.length > 0 && (
            <Box
              mt={5}
              pt={4}
              borderTop="1px solid rgba(0, 0, 0, 0.05)"
              animation={`${menuFadeIn} 0.2s ${easeOutCubic}`}
            >
              <VStack spacing={1} align="stretch">
                {playerList.slice(0, 5).map((player) => {
                  const isSelected = player.id === selectedPlayer?.id;
                  return (
                    <Box
                      key={player.id}
                      cursor="pointer"
                      px={3.5}
                      py={2.5}
                      borderRadius="lg"
                      bg={
                        isSelected ? "rgba(10, 132, 255, 0.10)" : "transparent"
                      }
                      transition={`all 0.2s ${easeOutCubic}`}
                      _hover={{
                        bg: isSelected
                          ? "rgba(10, 132, 255, 0.16)"
                          : "rgba(0, 0, 0, 0.035)",
                        transform: "translateX(2px)",
                      }}
                      _active={{ bg: "rgba(0, 0, 0, 0.06)" }}
                      onClick={() => {
                        update("states.shared.selectedPlayerId", player.id);
                        setShowPlayerMenu(false);
                      }}
                    >
                      <HStack spacing={3}>
                        <PlayerAvatar boxSize="28px" avatar={player.avatar} />
                        <Text
                          fontSize="13.5px"
                          color={isSelected ? "primary.700" : "gray.900"}
                          fontWeight={isSelected ? 600 : 500}
                          flex="1"
                          isTruncated
                        >
                          {player.name}
                        </Text>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          )}
        </Box>
      </Flex>

      {/* 底部中央：大型启动按钮 + 实例信息 */}
      <Flex justify="center" align="center" direction="column" pb={4}>
        <VStack spacing={10} align="center">
          {/* 实例名称显示 */}
          <VStack spacing={3} align="center">
            <Text
              fontSize="11.5px"
              color="gray.500"
              letterSpacing="0.14em"
              textTransform="uppercase"
              fontWeight="600"
              style={{
                animation:
                  "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both",
              }}
            >
              当前实例
            </Text>
            <HStack
              spacing={3}
              cursor="pointer"
              onClick={() => setShowInstanceMenu(!showInstanceMenu)}
              transition={`all 0.2s ${easeOutCubic}`}
              _hover={{ opacity: 1, transform: "translateY(-1px)" }}
              _active={{ transform: "translateY(0)" }}
              px={3}
              py={2}
              borderRadius="xl"
              style={{
                animation:
                  "fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both",
              }}
            >
              <Text
                fontSize="32px"
                fontWeight="700"
                color="gray.900"
                letterSpacing="-0.02em"
                lineHeight="1.1"
                maxW="600px"
                isTruncated
              >
                {selectedInstance ? selectedInstance.name : "未选择游戏实例"}
              </Text>
              <Box
                as={LuChevronDown}
                size={20}
                color="#6E6E73"
                transition={`transform 0.2s ${easeOutCubic}`}
                transform={showInstanceMenu ? "rotate(180deg)" : "rotate(0deg)"}
              />
            </HStack>

            {/* 实例下拉菜单 */}
            {showInstanceMenu && instanceList.length > 0 && (
              <Box
                mt={2}
                bg="rgba(255, 255, 255, 0.82)"
                border="1px solid rgba(255, 255, 255, 0.75)"
                borderRadius="2xl"
                backdropFilter="blur(40px) saturate(200%)"
                boxShadow="0 20px 60px rgba(0, 0, 0, 0.14), 0 1px 0 rgba(255,255,255,0.6) inset"
                p={2}
                maxH="340px"
                overflowY="auto"
                minW="380px"
                animation={`${menuFadeIn} 0.22s ${easeOutCubic}`}
                sx={{
                  "&::-webkit-scrollbar": { width: "6px" },
                  "&::-webkit-scrollbar-thumb": {
                    bg: "rgba(0,0,0,0.15)",
                    borderRadius: "3px",
                  },
                }}
              >
                <VStack spacing={1} align="stretch">
                  {instanceList.slice(0, 8).map((instance) => {
                    const isSelected = instance.id === selectedInstance?.id;
                    return (
                      <Box
                        key={instance.id}
                        cursor="pointer"
                        px={4}
                        py={3}
                        borderRadius="xl"
                        bg={
                          isSelected
                            ? "rgba(10, 132, 255, 0.10)"
                            : "transparent"
                        }
                        transition={`all 0.2s ${easeOutCubic}`}
                        _hover={{
                          bg: isSelected
                            ? "rgba(10, 132, 255, 0.16)"
                            : "rgba(0, 0, 0, 0.035)",
                          transform: "translateX(2px)",
                        }}
                        _active={{ bg: "rgba(0, 0, 0, 0.06)" }}
                        onClick={() => {
                          update(
                            "states.shared.selectedInstanceId",
                            instance.id
                          );
                          setShowInstanceMenu(false);
                        }}
                      >
                        <HStack spacing={3}>
                          <Box
                            w="34px"
                            h="34px"
                            bg={
                              isSelected
                                ? "rgba(10, 132, 255, 1)"
                                : "rgba(10, 132, 255, 0.92)"
                            }
                            borderRadius="lg"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            boxShadow="0 2px 8px rgba(10, 132, 255, 0.3)"
                            transition={`all 0.2s ${easeOutCubic}`}
                          >
                            <LuHardDrive
                              size={15}
                              color="white"
                              strokeWidth={2.2}
                            />
                          </Box>
                          <VStack spacing={0} align="flex-start" flex="1">
                            <Text
                              fontSize="14px"
                              color="gray.900"
                              fontWeight={isSelected ? 700 : 600}
                              isTruncated
                            >
                              {instance.name}
                            </Text>
                            <Text fontSize="11.5px" color="gray.500">
                              {instance.version || "未知版本"}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            )}
          </VStack>

          {/* 大型启动按钮 - 绿色液态玻璃 */}
          <Box
            position="relative"
            style={{
              animation: "fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both",
            }}
          >
            {/* 外层柔和光晕 */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              w="360px"
              h="180px"
              bg="radial-gradient(ellipse, rgba(48, 209, 88, 0.28), transparent 72%)"
              filter="blur(40px)"
              pointerEvents="none"
              zIndex={-1}
              transform="translate(-50%, -50%)"
              animation={`${pulseGlow} 3s ease-in-out infinite`}
            />
            {/* 内层亮光晕 */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              w="240px"
              h="120px"
              bg="radial-gradient(ellipse, rgba(120, 230, 150, 0.4), transparent 70%)"
              filter="blur(24px)"
              pointerEvents="none"
              zIndex={-1}
              transform="translate(-50%, -50%)"
              animation={`${pulseGlowInner} 2.5s ease-in-out infinite`}
            />
            <Button
              onClick={handleLaunch}
              size="lg"
              px={20}
              py={9}
              h="80px"
              fontSize="18px"
              fontWeight="700"
              borderRadius="2xl"
              bg="rgba(48, 209, 88, 0.95)"
              color="white"
              boxShadow="0 10px 32px rgba(48, 209, 88, 0.4), 0 2px 6px rgba(48, 209, 88, 0.25), 0 1px 0 rgba(255,255,255,0.3) inset"
              border="1px solid rgba(255, 255, 255, 0.35)"
              backdropFilter="blur(24px) saturate(200%)"
              position="relative"
              overflow="hidden"
              _hover={{
                bg: "rgba(52, 219, 94, 1)",
                transform: "translateY(-5px)",
                boxShadow:
                  "0 22px 60px rgba(48, 209, 88, 0.5), 0 6px 14px rgba(48, 209, 88, 0.3), 0 1px 0 rgba(255,255,255,0.5) inset",
              }}
              _active={{
                transform: "translateY(-1px)",
                bg: "rgba(40, 196, 80, 1)",
                boxShadow:
                  "0 6px 18px rgba(48, 209, 88, 0.35), 0 1px 0 rgba(255,255,255,0.2) inset",
              }}
              transition={`all 0.25s ${easeOutCubic}`}
              letterSpacing="0.03em"
            >
              <HStack spacing={3}>
                <LuPlay size={22} strokeWidth="2.5" />
                <Text>启动游戏</Text>
              </HStack>
            </Button>
          </Box>

          {/* 实例操作按钮组 */}
          <HStack
            spacing={3}
            style={{
              animation: "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both",
            }}
          >
            <Tooltip label="切换实例" placement="bottom" borderRadius="lg">
              <IconButton
                aria-label="选择游戏"
                icon={<LuArrowLeftRight size={18} strokeWidth={2.2} />}
                bg="rgba(255, 255, 255, 0.72)"
                color="gray.700"
                border="1px solid rgba(0, 0, 0, 0.06)"
                borderRadius="xl"
                size="md"
                h="44px"
                w="44px"
                minW="44px"
                backdropFilter="blur(24px) saturate(180%)"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255,255,255,0.6) inset"
                transition={`all 0.2s ${easeOutCubic}`}
                _hover={{
                  bg: "rgba(255, 255, 255, 0.95)",
                  color: "gray.900",
                  transform: "translateY(-2px)",
                  boxShadow:
                    "0 6px 16px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255,255,255,0.7) inset",
                  borderColor: "rgba(0, 0, 0, 0.1)",
                }}
                _active={{
                  transform: "translateY(0)",
                  bg: "rgba(245, 245, 247, 0.95)",
                  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
                }}
                onClick={() => setShowInstanceMenu(!showInstanceMenu)}
              />
            </Tooltip>
            {selectedInstance && (
              <Tooltip label="实例设置" placement="bottom" borderRadius="lg">
                <IconButton
                  aria-label="设置"
                  icon={<LuSettings size={18} strokeWidth={2.2} />}
                  bg="rgba(255, 255, 255, 0.72)"
                  color="gray.700"
                  border="1px solid rgba(0, 0, 0, 0.06)"
                  borderRadius="xl"
                  size="md"
                  h="44px"
                  w="44px"
                  minW="44px"
                  backdropFilter="blur(24px) saturate(180%)"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 0 rgba(255,255,255,0.6) inset"
                  transition={`all 0.2s ${easeOutCubic}`}
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.95)",
                    color: "gray.900",
                    transform: "translateY(-2px)",
                    boxShadow:
                      "0 6px 16px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255,255,255,0.7) inset",
                    borderColor: "rgba(0, 0, 0, 0.1)",
                  }}
                  _active={{
                    transform: "translateY(0)",
                    bg: "rgba(245, 245, 247, 0.95)",
                    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
                  }}
                  onClick={() =>
                    router.push(
                      `/instances/details/${encodeURIComponent(
                        selectedInstance.id
                      )}/settings`
                    )
                  }
                />
              </Tooltip>
            )}
          </HStack>
        </VStack>
      </Flex>
    </Flex>
  );
};

export default LaunchPage;
