import {
  Badge,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuCheck,
  LuCopy,
  LuCpu,
  LuGlobe,
  LuLogOut,
  LuNetwork,
  LuPlus,
  LuUser,
  LuUsers,
} from "react-icons/lu";
import { useMultiplayer } from "@/contexts/multiplayer";
import { useRoom } from "@/contexts/room";
import { useToast } from "@/contexts/toast";

type UserRole = "unselected" | "host" | "guest";

const MultiplayerLobby = () => {
  const toast = useToast();
  const { currentUser, login, logout } = useMultiplayer();
  const { roomState, setRoomState, clearRoomState } = useRoom();

  const [usernameInput, setUsernameInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isCheckingInstalling, setIsCheckingInstalling] = useState(true);

  const [userRole, setUserRole] = useState<UserRole>("unselected");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [gamePortInput, setGamePortInput] = useState("25565");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [actualPort, setActualPort] = useState<string>("25565");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    checkInstallation();
  }, []);

  const checkInstallation = async () => {
    try {
      const result = await invoke("check_provider_installation", {
        providerType: "",
      });
      if (typeof result === "object" && result !== null) {
        const resultObj = result as any;
        setIsInstalled(resultObj.is_installed === true);
      } else {
        setIsInstalled(false);
      }
    } catch (e) {
      console.error("Failed to check installation:", e);
      setIsInstalled(false);
    } finally {
      setIsCheckingInstalling(false);
    }
  };

  const handleLogin = async () => {
    if (isLoggingIn || usernameInput.trim() === "") return;

    setIsLoggingIn(true);
    try {
      await login(usernameInput.trim());
      toast({
        title: "登录成功！",
        status: "success",
      });
    } catch (e) {
      console.error("Failed to login:", e);
      toast({
        title: "登录失败",
        status: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    clearRoomState();
    setUserRole("unselected");
    setRoomNameInput("");
    setRoomCodeInput("");
  };

  const handleCreateRoom = async () => {
    if (
      isCreatingRoom ||
      roomNameInput.trim() === "" ||
      gamePortInput.trim() === ""
    )
      return;

    if (!isInstalled) {
      toast({
        title: "请先配置联机环境",
        status: "warning",
      });
      return;
    }

    setIsCreatingRoom(true);
    try {
      const networkId = (await invoke("create_network")) as string;

      setRoomState({
        ...roomState,
        roomCode: networkId,
        gamePort: parseInt(gamePortInput.trim()) || 25565,
        networkId: networkId,
        isHost: true,
        isConnected: true,
      });

      toast({
        title: "房间创建成功！",
        description: `房间码: ${networkId}`,
        status: "success",
      });
    } catch (e) {
      console.error("Failed to create room:", e);
      toast({
        title: "创建房间失败",
        status: "error",
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = async () => {
    if (isJoiningRoom || roomCodeInput.trim() === "") return;

    if (!isInstalled) {
      toast({
        title: "请先配置联机环境",
        status: "warning",
      });
      return;
    }

    setIsJoiningRoom(true);
    try {
      const networkId = roomCodeInput.trim();
      await invoke("join_network", {
        networkId: networkId,
      });

      setRoomState({
        ...roomState,
        roomCode: networkId,
        gamePort: 25565,
        networkId: networkId,
        isHost: false,
        isConnected: true,
      });

      toast({
        title: "已加入房间！",
        status: "success",
      });
    } catch (e) {
      console.error("Failed to join room:", e);
      toast({
        title: "加入房间失败",
        status: "error",
      });
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (roomState.isConnected && roomState.networkId) {
        await invoke("leave_network", {
          networkId: roomState.networkId,
        });
      }
      clearRoomState();
      setUserRole("unselected");
      setRoomNameInput("");
      setRoomCodeInput("");
      toast({
        title: "已离开房间",
        status: "info",
      });
    } catch (e) {
      console.error("Failed to leave room:", e);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "已复制！",
        status: "success",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      toast({
        title: "复制失败",
        status: "error",
      });
    }
  };

  // 页面标题组件
  const PageHeader = ({
    title,
    subtitle,
    onBack,
  }: {
    title: string;
    subtitle?: string;
    onBack?: () => void;
  }) => (
    <VStack
      spacing={3}
      align="flex-start"
      w="100%"
      mb={8}
      style={{
        animation: "fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
      }}
    >
      {onBack && (
        <IconButton
          aria-label="返回"
          icon={<LuArrowLeft size={18} />}
          bg="rgba(255, 255, 255, 0.65)"
          color="gray.700"
          border="1px solid rgba(255, 255, 255, 0.75)"
          borderRadius="xl"
          size="sm"
          backdropFilter="blur(40px) saturate(200%)"
          boxShadow="0 6px 20px rgba(0, 0, 0, 0.06)"
          transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            bg: "rgba(255, 255, 255, 0.9)",
            color: "gray.900",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
          }}
          _active={{
            transform: "translateY(0)",
            bg: "rgba(255, 255, 255, 0.95)",
          }}
          onClick={onBack}
        />
      )}
      <Text
        fontSize="32px"
        fontWeight="800"
        color="gray.900"
        letterSpacing="-0.02em"
        lineHeight="1.2"
      >
        {title}
      </Text>
      {subtitle && (
        <Text fontSize="15px" color="gray.500" lineHeight="1.5">
          {subtitle}
        </Text>
      )}
    </VStack>
  );

  // 环境警告组件
  const EnvironmentWarning = () => (
    <Flex
      bg="rgba(255, 149, 0, 0.08)"
      border="1px solid rgba(255, 149, 0, 0.25)"
      borderRadius="2xl"
      p={5}
      align="flex-start"
      mb={6}
      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      <Box
        w="40px"
        h="40px"
        bg="rgba(255, 149, 0, 0.15)"
        borderRadius="xl"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        mr={3.5}
      >
        <LuCpu size={20} color="#FF9500" />
      </Box>
      <VStack spacing={0.5} align="flex-start">
        <Text fontSize="14px" color="rgb(140, 80, 0)" fontWeight="600">
          联机环境未配置
        </Text>
        <Text fontSize="12.5px" color="rgba(140, 80, 0, 0.75)" lineHeight="1.5">
          请在启动器同目录下配置 Terracotta 联机工具
        </Text>
      </VStack>
    </Flex>
  );

  // 登录界面
  if (!currentUser) {
    return (
      <Box>
        <PageHeader
          title="联机大厅"
          subtitle="登录后即可与好友一起畅玩 Minecraft"
        />

        {!isCheckingInstalling && !isInstalled && <EnvironmentWarning />}

        <Center>
          <Box
            w="100%"
            maxW="440px"
            bg="rgba(255, 255, 255, 0.65)"
            border="1px solid rgba(255, 255, 255, 0.75)"
            borderRadius="2xl"
            backdropFilter="blur(40px) saturate(200%)"
            boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
            p={8}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            style={{
              animation:
                "fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both",
            }}
          >
            <VStack spacing={6} align="center">
              {/* 图标 */}
              <Box
                w="56px"
                h="56px"
                bg="rgba(10, 132, 255, 0.95)"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 6px 24px rgba(10, 132, 255, 0.35)"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                <LuUsers size={28} color="white" />
              </Box>

              <VStack spacing={1} align="center">
                <Text fontSize="20px" fontWeight="700" color="gray.900">
                  欢迎回来
                </Text>
                <Text fontSize="13px" color="gray.500">
                  输入你的用户名以继续
                </Text>
              </VStack>

              <VStack w="100%" spacing={4}>
                <Box w="100%">
                  <Text
                    fontSize="13px"
                    color="gray.600"
                    mb={2}
                    fontWeight="500"
                  >
                    用户名
                  </Text>
                  <Input
                    placeholder="请输入用户名"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    h="52px"
                    fontSize="15px"
                    borderRadius="xl"
                    bg="rgba(245, 245, 247, 0.8)"
                    borderColor="rgba(0, 0, 0, 0.08)"
                    color="gray.900"
                    _placeholder={{ color: "gray.400" }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _focus={{
                      borderColor: "primary.500",
                      bg: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.18)",
                    }}
                  />
                </Box>
                <Button
                  w="100%"
                  size="lg"
                  h="56px"
                  fontSize="15px"
                  fontWeight="600"
                  bg="rgba(10, 132, 255, 0.95)"
                  color="white"
                  border="1px solid rgba(255, 255, 255, 0.35)"
                  borderRadius="xl"
                  boxShadow="0 4px 16px rgba(10, 132, 255, 0.28)"
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    bg: "rgba(10, 132, 255, 1)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(10, 132, 255, 0.38)",
                  }}
                  _active={{
                    transform: "translateY(0)",
                    boxShadow: "0 2px 8px rgba(10, 132, 255, 0.2)",
                  }}
                  onClick={handleLogin}
                  isLoading={isLoggingIn}
                  isDisabled={!isInstalled}
                >
                  <HStack spacing={2}>
                    <LuGlobe size={18} />
                    <Text>进入联机大厅</Text>
                  </HStack>
                </Button>
              </VStack>
            </VStack>
          </Box>
        </Center>
      </Box>
    );
  }

  // 房间连接成功界面
  if (roomState.isConnected) {
    const serverAddress = roomState.hostIp
      ? `${roomState.hostIp}:${actualPort}`
      : null;

    return (
      <Box>
        <PageHeader
          title={roomState.isHost ? "房间已创建" : "已加入房间"}
          subtitle={
            roomState.isHost ? "分享房间码给朋友加入" : "使用以下地址连接到游戏"
          }
        />

        <Center>
          <VStack spacing={6} align="stretch" maxW="520px" w="100%">
            {/* 状态卡片 */}
            <Flex
              bg="rgba(255, 255, 255, 0.65)"
              border="1px solid rgba(255, 255, 255, 0.75)"
              borderRadius="2xl"
              backdropFilter="blur(40px) saturate(200%)"
              boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
              p={6}
              align="center"
              justify="space-between"
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <HStack spacing={4}>
                <Box
                  w="48px"
                  h="48px"
                  bg="rgba(48, 209, 88, 0.15)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  <LuCheck size={24} color="rgb(36, 138, 61)" />
                </Box>
                <VStack spacing={0} align="flex-start">
                  <Text fontSize="16px" fontWeight="700" color="gray.900">
                    {roomState.isHost ? "房主在线" : "连接成功"}
                  </Text>
                  <Text fontSize="13px" color="gray.500">
                    {currentUser?.username}
                  </Text>
                </VStack>
              </HStack>
              <Badge
                bg="rgba(10, 132, 255, 0.12)"
                color="primary.600"
                px={3}
                py={1.5}
                fontSize="12px"
                fontWeight="600"
                borderRadius="full"
                border="1px solid rgba(10, 132, 255, 0.18)"
              >
                {roomState.isHost ? "HOST" : "GUEST"}
              </Badge>
            </Flex>

            {/* 房间码（仅房主） */}
            {roomState.isHost && roomState.roomCode && (
              <Box
                bg="rgba(255, 255, 255, 0.65)"
                border="1px solid rgba(255, 255, 255, 0.75)"
                borderRadius="2xl"
                backdropFilter="blur(40px) saturate(200%)"
                boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
                p={6}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                <VStack spacing={4} align="stretch">
                  <VStack spacing={1} align="flex-start">
                    <HStack>
                      <LuNetwork size={16} color="#0A84FF" />
                      <Text fontSize="13px" color="gray.600" fontWeight="600">
                        房间码
                      </Text>
                    </HStack>
                    <Text fontSize="12.5px" color="gray.500">
                      分享给朋友以加入你的房间
                    </Text>
                  </VStack>

                  <Flex
                    bg="rgba(10, 132, 255, 0.06)"
                    border="1px solid rgba(10, 132, 255, 0.25)"
                    borderRadius="xl"
                    p={4}
                    align="center"
                    justify="space-between"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      bg: "rgba(10, 132, 255, 0.1)",
                    }}
                  >
                    <Text
                      fontFamily="monospace"
                      fontSize="18px"
                      fontWeight="700"
                      color="primary.700"
                      letterSpacing="2px"
                    >
                      {roomState.roomCode}
                    </Text>
                    <IconButton
                      aria-label="复制房间码"
                      icon={
                        copiedField === "roomCode" ? (
                          <LuCheck size={18} />
                        ) : (
                          <LuCopy size={18} />
                        )
                      }
                      bg={
                        copiedField === "roomCode"
                          ? "rgba(48, 209, 88, 0.15)"
                          : "rgba(255, 255, 255, 0.5)"
                      }
                      color={
                        copiedField === "roomCode"
                          ? "rgb(36, 138, 61)"
                          : "gray.700"
                      }
                      border="1px solid rgba(255, 255, 255, 0.75)"
                      borderRadius="xl"
                      size="md"
                      backdropFilter="blur(20px) saturate(180%)"
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        bg:
                          copiedField === "roomCode"
                            ? "rgba(48, 209, 88, 0.22)"
                            : "rgba(10, 132, 255, 0.1)",
                        color:
                          copiedField === "roomCode"
                            ? "rgb(36, 138, 61)"
                            : "primary.600",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(10, 132, 255, 0.18)",
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                      onClick={() =>
                        copyToClipboard(roomState.roomCode || "", "roomCode")
                      }
                    />
                  </Flex>
                </VStack>
              </Box>
            )}

            {/* 本机虚拟 IP */}
            <Box
              bg="rgba(255, 255, 255, 0.65)"
              border="1px solid rgba(255, 255, 255, 0.75)"
              borderRadius="2xl"
              backdropFilter="blur(40px) saturate(200%)"
              boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
              p={6}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <VStack spacing={4} align="stretch">
                <VStack spacing={1} align="flex-start">
                  <Text fontSize="13px" color="gray.600" fontWeight="600">
                    本机虚拟 IP
                  </Text>
                </VStack>
                <Box
                  bg="rgba(245, 245, 247, 0.9)"
                  border="1px solid rgba(0, 0, 0, 0.06)"
                  borderRadius="xl"
                  p={4}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  <Text
                    fontFamily="monospace"
                    fontSize="17px"
                    fontWeight="700"
                    color="gray.800"
                  >
                    {roomState.hostIp || "获取中..."}
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* 端口设置（仅房主） */}
            {roomState.isHost && (
              <Box
                bg="rgba(255, 255, 255, 0.65)"
                border="1px solid rgba(255, 255, 255, 0.75)"
                borderRadius="2xl"
                backdropFilter="blur(40px) saturate(200%)"
                boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
                p={6}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                <VStack spacing={4} align="stretch">
                  <VStack spacing={1} align="flex-start">
                    <Text fontSize="13px" color="gray.600" fontWeight="600">
                      Minecraft 端口
                    </Text>
                    <Text fontSize="12.5px" color="gray.500">
                      在游戏中开启「对局域网开放」后填入显示的端口
                    </Text>
                  </VStack>
                  <Input
                    type="number"
                    value={actualPort}
                    onChange={(e) => setActualPort(e.target.value)}
                    placeholder="输入游戏端口"
                    h="52px"
                    fontSize="15px"
                    borderRadius="xl"
                    fontFamily="monospace"
                    bg="rgba(245, 245, 247, 0.8)"
                    borderColor="rgba(0, 0, 0, 0.08)"
                    color="gray.900"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _focus={{
                      borderColor: "primary.500",
                      bg: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.18)",
                    }}
                  />
                </VStack>
              </Box>
            )}

            {/* 服务器地址 */}
            <Box
              bg="rgba(255, 255, 255, 0.65)"
              border="1px solid rgba(255, 255, 255, 0.75)"
              borderRadius="2xl"
              backdropFilter="blur(40px) saturate(200%)"
              boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
              p={6}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <VStack spacing={4} align="stretch">
                <VStack spacing={1} align="flex-start">
                  <Text fontSize="13px" color="gray.600" fontWeight="600">
                    {roomState.isHost ? "朋友连接地址" : "服务器地址"}
                  </Text>
                </VStack>

                {serverAddress ? (
                  <Flex
                    bg="rgba(245, 245, 247, 0.9)"
                    border="1px solid rgba(0, 0, 0, 0.06)"
                    borderRadius="xl"
                    p={4}
                    align="center"
                    justify="space-between"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    <Text
                      fontFamily="monospace"
                      fontSize="17px"
                      fontWeight="700"
                      color="gray.800"
                    >
                      {serverAddress}
                    </Text>
                    <IconButton
                      aria-label="复制地址"
                      icon={
                        copiedField === "address" ? (
                          <LuCheck size={18} />
                        ) : (
                          <LuCopy size={18} />
                        )
                      }
                      bg={
                        copiedField === "address"
                          ? "rgba(48, 209, 88, 0.15)"
                          : "rgba(255, 255, 255, 0.5)"
                      }
                      color={
                        copiedField === "address"
                          ? "rgb(36, 138, 61)"
                          : "gray.700"
                      }
                      border="1px solid rgba(255, 255, 255, 0.75)"
                      borderRadius="xl"
                      size="md"
                      backdropFilter="blur(20px) saturate(180%)"
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        bg:
                          copiedField === "address"
                            ? "rgba(48, 209, 88, 0.22)"
                            : "rgba(10, 132, 255, 0.1)",
                        color:
                          copiedField === "address"
                            ? "rgb(36, 138, 61)"
                            : "primary.600",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(10, 132, 255, 0.18)",
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                      onClick={() => copyToClipboard(serverAddress, "address")}
                    />
                  </Flex>
                ) : (
                  <Text fontSize="14px" color="gray.500">
                    正在获取服务器地址...
                  </Text>
                )}
              </VStack>
            </Box>

            {/* 使用说明 */}
            <Box
              bg="rgba(245, 245, 247, 0.9)"
              border="1px solid rgba(0, 0, 0, 0.06)"
              borderRadius="2xl"
              p={5}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <Text
                fontSize="13px"
                color="gray.700"
                lineHeight="1.8"
                whiteSpace="pre-line"
              >
                {roomState.isHost
                  ? "1. 打开 Minecraft 并进入游戏\n2. 按 ESC 键，选择「对局域网开放」\n3. 将游戏显示的端口号填入上方输入框\n4. 分享房间码给朋友加入"
                  : "1. 复制上方服务器地址\n2. 打开 Minecraft\n3. 进入「多人游戏」\n4. 点击「添加服务器」并粘贴地址\n5. 连接到服务器即可开始游戏"}
              </Text>
            </Box>

            <Divider borderColor="rgba(0, 0, 0, 0.08)" />

            {/* 离开按钮 */}
            <Button
              w="100%"
              size="lg"
              h="56px"
              fontSize="15px"
              fontWeight="600"
              bg="rgba(255, 59, 48, 0.9)"
              color="white"
              border="1px solid rgba(255, 255, 255, 0.35)"
              borderRadius="xl"
              boxShadow="0 4px 16px rgba(255, 59, 48, 0.22)"
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                bg: "rgba(255, 59, 48, 1)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(255, 59, 48, 0.35)",
              }}
              _active={{
                transform: "translateY(0)",
                boxShadow: "0 2px 8px rgba(255, 59, 48, 0.18)",
              }}
              onClick={handleLeaveRoom}
            >
              <HStack spacing={2}>
                <LuLogOut size={18} />
                <Text>离开房间</Text>
              </HStack>
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  // 选择角色界面
  if (userRole === "unselected") {
    return (
      <Box>
        <PageHeader
          title="联机大厅"
          subtitle={`当前用户：${currentUser?.username}`}
        />

        {!isCheckingInstalling && !isInstalled && <EnvironmentWarning />}

        <Center>
          <VStack spacing={8} maxW="720px" w="100%" align="stretch">
            {/* 两大选项 */}
            <HStack spacing={5} w="100%">
              {/* 创建房间 */}
              <Box
                as="button"
                onClick={() => isInstalled && setUserRole("host")}
                flex="1"
                cursor={isInstalled ? "pointer" : "not-allowed"}
                opacity={isInstalled ? 1 : 0.5}
                bg="rgba(255, 255, 255, 0.65)"
                border="1px solid rgba(255, 255, 255, 0.75)"
                borderRadius="2xl"
                backdropFilter="blur(40px) saturate(200%)"
                boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
                p={8}
                textAlign="left"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  borderColor: isInstalled
                    ? "rgba(10, 132, 255, 0.35)"
                    : "rgba(255, 255, 255, 0.75)",
                  bg: isInstalled
                    ? "rgba(10, 132, 255, 0.08)"
                    : "rgba(255, 255, 255, 0.65)",
                  transform: isInstalled ? "translateY(-6px)" : "none",
                  boxShadow: isInstalled
                    ? "0 20px 56px rgba(10, 132, 255, 0.22)"
                    : "0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset",
                }}
                _active={{
                  transform: isInstalled ? "translateY(-2px)" : "none",
                }}
              >
                <VStack spacing={5} align="flex-start">
                  <Box
                    w="56px"
                    h="56px"
                    bg="rgba(10, 132, 255, 0.95)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 6px 24px rgba(10, 132, 255, 0.35)"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    <LuPlus size={28} color="white" strokeWidth="2.5" />
                  </Box>
                  <VStack spacing={1} align="flex-start">
                    <Text fontSize="18px" fontWeight="700" color="gray.900">
                      创建房间
                    </Text>
                    <Text fontSize="13.5px" color="gray.500" lineHeight="1.6">
                      作为房主，创建一个房间并邀请朋友加入
                    </Text>
                  </VStack>
                </VStack>
              </Box>

              {/* 加入房间 */}
              <Box
                as="button"
                onClick={() => isInstalled && setUserRole("guest")}
                flex="1"
                cursor={isInstalled ? "pointer" : "not-allowed"}
                opacity={isInstalled ? 1 : 0.5}
                bg="rgba(255, 255, 255, 0.65)"
                border="1px solid rgba(255, 255, 255, 0.75)"
                borderRadius="2xl"
                backdropFilter="blur(40px) saturate(200%)"
                boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
                p={8}
                textAlign="left"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  borderColor: isInstalled
                    ? "rgba(48, 209, 88, 0.35)"
                    : "rgba(255, 255, 255, 0.75)",
                  bg: isInstalled
                    ? "rgba(48, 209, 88, 0.08)"
                    : "rgba(255, 255, 255, 0.65)",
                  transform: isInstalled ? "translateY(-6px)" : "none",
                  boxShadow: isInstalled
                    ? "0 20px 56px rgba(48, 209, 88, 0.22)"
                    : "0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset",
                }}
                _active={{
                  transform: isInstalled ? "translateY(-2px)" : "none",
                }}
              >
                <VStack spacing={5} align="flex-start">
                  <Box
                    w="56px"
                    h="56px"
                    bg="rgba(48, 209, 88, 0.95)"
                    borderRadius="xl"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 6px 24px rgba(48, 209, 88, 0.35)"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    <LuUser size={28} color="white" strokeWidth="2.5" />
                  </Box>
                  <VStack spacing={1} align="flex-start">
                    <Text fontSize="18px" fontWeight="700" color="gray.900">
                      加入房间
                    </Text>
                    <Text fontSize="13.5px" color="gray.500" lineHeight="1.6">
                      输入朋友分享的房间码，快速加入游戏
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            </HStack>

            {/* 退出登录 */}
            <Center>
              <Button
                variant="ghost"
                onClick={handleLogout}
                color="gray.600"
                size="md"
                bg="transparent"
                border="none"
                borderRadius="xl"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: "rgba(0, 0, 0, 0.05)",
                  color: "gray.900",
                  transform: "translateY(-2px)",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
              >
                <HStack spacing={2}>
                  <LuLogOut size={16} />
                  <Text>退出登录</Text>
                </HStack>
              </Button>
            </Center>
          </VStack>
        </Center>
      </Box>
    );
  }

  // 创建房间界面
  if (userRole === "host") {
    return (
      <Box>
        <PageHeader
          title="创建房间"
          subtitle="设置房间信息，然后创建房间邀请朋友加入"
          onBack={() => setUserRole("unselected")}
        />

        {!isCheckingInstalling && !isInstalled && <EnvironmentWarning />}

        <Center>
          <Box
            w="100%"
            maxW="520px"
            bg="rgba(255, 255, 255, 0.65)"
            border="1px solid rgba(255, 255, 255, 0.75)"
            borderRadius="2xl"
            backdropFilter="blur(40px) saturate(200%)"
            boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
            p={8}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontSize="13px" color="gray.600" mb={2} fontWeight="600">
                  房间名称
                </Text>
                <Input
                  placeholder="给你的房间起个名字"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  h="52px"
                  fontSize="15px"
                  borderRadius="xl"
                  bg="rgba(245, 245, 247, 0.8)"
                  borderColor="rgba(0, 0, 0, 0.08)"
                  color="gray.900"
                  _placeholder={{ color: "gray.400" }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  _focus={{
                    borderColor: "primary.500",
                    bg: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.18)",
                  }}
                />
              </Box>

              <Box>
                <Text fontSize="13px" color="gray.600" mb={2} fontWeight="600">
                  游戏端口
                </Text>
                <Input
                  type="number"
                  placeholder="25565"
                  value={gamePortInput}
                  onChange={(e) => setGamePortInput(e.target.value)}
                  h="52px"
                  fontSize="15px"
                  borderRadius="xl"
                  fontFamily="monospace"
                  bg="rgba(245, 245, 247, 0.8)"
                  borderColor="rgba(0, 0, 0, 0.08)"
                  color="gray.900"
                  _placeholder={{ color: "gray.400" }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  _focus={{
                    borderColor: "primary.500",
                    bg: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.18)",
                  }}
                />
                <Text
                  fontSize="12.5px"
                  color="gray.500"
                  mt={2}
                  lineHeight="1.6"
                >
                  Minecraft 默认端口为
                  25565，在游戏中开启局域网开放后会显示端口号
                </Text>
              </Box>

              <Button
                size="lg"
                h="56px"
                fontSize="15px"
                fontWeight="600"
                bg="rgba(10, 132, 255, 0.95)"
                color="white"
                border="1px solid rgba(255, 255, 255, 0.35)"
                borderRadius="xl"
                boxShadow="0 4px 16px rgba(10, 132, 255, 0.28)"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: "rgba(10, 132, 255, 1)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(10, 132, 255, 0.38)",
                }}
                _active={{
                  transform: "translateY(0)",
                  boxShadow: "0 2px 8px rgba(10, 132, 255, 0.2)",
                }}
                onClick={handleCreateRoom}
                isLoading={isCreatingRoom}
                isDisabled={!isInstalled || roomNameInput.trim() === ""}
                mt={2}
              >
                <HStack spacing={2}>
                  <LuPlus size={20} />
                  <Text>创建房间</Text>
                </HStack>
              </Button>
            </VStack>
          </Box>
        </Center>
      </Box>
    );
  }

  // 加入房间界面
  if (userRole === "guest") {
    return (
      <Box>
        <PageHeader
          title="加入房间"
          subtitle="输入房主提供的房间码加入游戏"
          onBack={() => setUserRole("unselected")}
        />

        {!isCheckingInstalling && !isInstalled && <EnvironmentWarning />}

        <Center>
          <Box
            w="100%"
            maxW="520px"
            bg="rgba(255, 255, 255, 0.65)"
            border="1px solid rgba(255, 255, 255, 0.75)"
            borderRadius="2xl"
            backdropFilter="blur(40px) saturate(200%)"
            boxShadow="0 12px 48px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.6) inset"
            p={8}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontSize="13px" color="gray.600" mb={2} fontWeight="600">
                  房间码
                </Text>
                <Input
                  placeholder="输入房间码"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  h="52px"
                  fontSize="15px"
                  borderRadius="xl"
                  fontFamily="monospace"
                  letterSpacing="2px"
                  textTransform="uppercase"
                  bg="rgba(245, 245, 247, 0.8)"
                  borderColor="rgba(0, 0, 0, 0.08)"
                  color="gray.900"
                  _placeholder={{ color: "gray.400" }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  _focus={{
                    borderColor: "primary.500",
                    bg: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 0 0 4px rgba(10, 132, 255, 0.18)",
                  }}
                />
              </Box>

              <Button
                size="lg"
                h="56px"
                fontSize="15px"
                fontWeight="600"
                bg="rgba(48, 209, 88, 0.95)"
                color="white"
                border="1px solid rgba(255, 255, 255, 0.35)"
                borderRadius="xl"
                boxShadow="0 4px 16px rgba(48, 209, 88, 0.28)"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  bg: "rgba(48, 209, 88, 1)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 24px rgba(48, 209, 88, 0.38)",
                }}
                _active={{
                  transform: "translateY(0)",
                  boxShadow: "0 2px 8px rgba(48, 209, 88, 0.2)",
                }}
                onClick={handleJoinRoom}
                isLoading={isJoiningRoom}
                isDisabled={!isInstalled || roomCodeInput.trim() === ""}
                mt={2}
              >
                <HStack spacing={2}>
                  <LuUsers size={20} />
                  <Text>加入房间</Text>
                </HStack>
              </Button>
            </VStack>
          </Box>
        </Center>
      </Box>
    );
  }

  return null;
};

export default MultiplayerLobby;
