import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  HStack,
  Heading,
  IconButton,
  Input,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCopy, LuLogOut, LuUserPlus, LuPlus } from "react-icons/lu";
import { Section } from "@/components/common/section";
import { useMultiplayer } from "@/contexts/multiplayer";
import { useRoom } from "@/contexts/room";
import { useToast } from "@/contexts/toast";

type UserRole = "unselected" | "host" | "guest";

const MultiplayerLobby = () => {
  const { t } = useTranslation();
  const toast = useToast();

  const {
    currentUser,
    login,
    logout,
  } = useMultiplayer();

  const { roomState, setRoomState, clearRoomState } = useRoom();

  const [usernameInput, setUsernameInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isCheckingInstalling, setIsCheckingInstalling] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [userRole, setUserRole] = useState<UserRole>("unselected");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [gamePortInput, setGamePortInput] = useState("25565");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [actualPort, setActualPort] = useState<string>("25565");

  const boxBg = useColorModeValue("blue.50", "blue.900");

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
        setErrorMessage(resultObj.error_message || null);
      } else {
        setIsInstalled(false);
        setErrorMessage(null);
      }
    } catch (e) {
      console.error("Failed to check installation:", e);
      setIsInstalled(false);
      setErrorMessage(String(e));
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
        description: `欢迎, ${usernameInput.trim()}!`,
        status: "success",
      });
    } catch (e) {
      console.error("Failed to login:", e);
      toast({
        title: "登录失败",
        description: String(e),
        status: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (roomState.isConnected) {
      await handleLeaveRoom();
    }
    await logout();
    clearRoomState();
    setUserRole("unselected");
    setRoomNameInput("");
    setRoomCodeInput("");
  };

  const handleCreateRoom = async () => {
    if (isCreatingRoom || roomNameInput.trim() === "" || gamePortInput.trim() === "") return;

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

      const port = parseInt(gamePortInput.trim()) || 25565;

      // 获取连接信息
      const connectionInfo = (await invoke("get_network_status")) as any;

      setRoomState({
        ...roomState,
        roomCode: networkId,
        gamePort: port,
        networkId: networkId,
        hostIp: connectionInfo?.virtual_ip,
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
        description: String(e),
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

      const connectionInfo = (await invoke("join_network", {
        networkId: networkId,
      })) as any;

      setRoomState({
        ...roomState,
        roomCode: networkId,
        gamePort: 25565,
        networkId: networkId,
        hostIp: connectionInfo?.virtual_ip,
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
        description: String(e),
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
      toast({
        title: "离开房间失败",
        description: String(e),
        status: "error",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "已复制！",
        status: "success",
      });
    } catch (e) {
      toast({
        title: "复制失败",
        description: String(e),
        status: "error",
      });
    }
  };

  if (!currentUser) {
    return (
      <Section title="联机大厅" description="登录后即可与好友一起玩！">
        <VStack align="stretch" spacing={4}>
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>联机功能</AlertTitle>
              <AlertDescription>
                使用虚拟网络轻松联机玩 Minecraft！
              </AlertDescription>
            </Box>
          </Alert>

          {!isCheckingInstalling && !isInstalled && (
            <Alert status="warning">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>联机环境未配置</AlertTitle>
                <AlertDescription>
                  请在启动器同目录下创建 terracotta 文件夹，并将
                  Terracotta 程序放入其中
                </AlertDescription>
                {errorMessage && (
                  <Text fontSize="sm" mt={2} color="gray.600">
                    {errorMessage}
                  </Text>
                )}
              </Box>
            </Alert>
          )}

          <VStack align="stretch" spacing={3}>
            <Input
              placeholder="输入用户名"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <Button
              colorScheme="blue"
              onClick={handleLogin}
              isLoading={isLoggingIn}
            >
              登录
            </Button>
          </VStack>
        </VStack>
      </Section>
    );
  }

  if (roomState.isConnected) {
    const serverAddress = roomState.hostIp 
      ? `${roomState.hostIp}:${actualPort}` 
      : null;

    return (
      <Section title="联机房间" description={`欢迎, ${currentUser.username}!`}>
        <VStack align="stretch" spacing={4}>
          <Alert status="success">
            <AlertIcon />
            <Box>
              <AlertTitle>{roomState.isHost ? "房主模式" : "玩家模式"}</AlertTitle>
              <AlertDescription>
                {roomState.isHost 
                  ? "你的房间已开启，分享房间码让朋友加入！"
                  : "你已成功加入房间，快去连接服务器吧！"}
              </AlertDescription>
            </Box>
          </Alert>

          <Card bg={boxBg} p={4}>
            <CardHeader pb={2}>
              <Heading size="md">访问信息</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {roomState.isHost && roomState.roomCode && (
                  <>
                    <Text fontWeight="bold">房间码</Text>
                    <HStack>
                      <Text fontFamily="mono" fontSize="lg" flex="1">
                        {roomState.roomCode}
                      </Text>
                      <IconButton
                        icon={<LuCopy />}
                        aria-label="复制房间码"
                        size="sm"
                        onClick={() => copyToClipboard(roomState.roomCode || "")}
                      />
                    </HStack>
                    <Divider />
                  </>
                )}

                <Text fontWeight="bold">本机虚拟 IP</Text>
                <Text fontFamily="mono" fontSize="lg">
                  {roomState.hostIp || "获取中..."}
                </Text>
                <Divider />

                {roomState.isHost && (
                  <>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Minecraft 实际端口
                      </Text>
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        请在 Minecraft 中开启「对局域网开放」后，把显示的端口号填入下方：
                      </Text>
                      <HStack>
                        <Input
                          placeholder="例如：51940"
                          type="number"
                          value={actualPort}
                          onChange={(e) => setActualPort(e.target.value)}
                        />
                      </HStack>
                    </Box>
                    <Divider />
                  </>
                )}

                <Text fontWeight="bold">{roomState.isHost ? "朋友连接地址" : "服务器地址"}</Text>
                {serverAddress ? (
                  <HStack>
                    <Text fontFamily="mono" fontSize="lg" flex="1">
                      {serverAddress}
                    </Text>
                    <IconButton
                      icon={<LuCopy />}
                      aria-label="复制服务器地址"
                      size="sm"
                      onClick={() => copyToClipboard(serverAddress)}
                    />
                  </HStack>
                ) : (
                  <Text color="gray.500">正在获取服务器地址...</Text>
                )}

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    使用方法
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {roomState.isHost 
                      ? "1. 复制房间码分享给朋友\n2. 在 Minecraft 中开启「对局域网开放」\n3. 把 Minecraft 显示的端口号填入上方\n4. 朋友输入房间码加入你的房间"
                      : "1. 复制上方服务器地址\n2. 打开 Minecraft\n3. 添加服务器，粘贴地址即可连接"}
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    故障排查
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    如果无法连接，请确认：
                    <br />• 双方都以管理员权限运行启动器
                    <br />• Windows 防火墙没有阻止
                    <br />• 双方的 Terracotta 都显示已连接
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          <HStack justify="flex-end" spacing={3}>
            <Button
              colorScheme="red"
              leftIcon={<LuLogOut />}
              onClick={handleLeaveRoom}
            >
              退出房间
            </Button>
          </HStack>
        </VStack>
      </Section>
    );
  }

  if (userRole === "unselected") {
    return (
      <Section title="联机大厅" description={`欢迎, ${currentUser.username}!`}>
        <VStack align="stretch" spacing={4}>
          <Alert status="info">
            <AlertIcon />
            <Box>
              <AlertTitle>选择你的角色</AlertTitle>
              <AlertDescription>
                选择&quot;我要当房主&quot;创建房间，或选择&quot;我要当客人&quot;加入房间
              </AlertDescription>
            </Box>
          </Alert>

          {!isCheckingInstalling && !isInstalled && (
            <Alert status="warning">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>联机环境未配置</AlertTitle>
                <AlertDescription>
                  请在启动器同目录下创建 terracotta 文件夹，并将
                  Terracotta 程序放入其中
                </AlertDescription>
                {errorMessage && (
                  <Text fontSize="sm" mt={2} color="gray.600">
                    {errorMessage}
                  </Text>
                )}
              </Box>
            </Alert>
          )}

          <VStack spacing={4} mt={4}>
            <Button
              colorScheme="blue"
              size="lg"
              height="120px"
              width="100%"
              leftIcon={<LuPlus size={32} />}
              onClick={() => setUserRole("host")}
              isDisabled={!isInstalled}
            >
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="bold">我要当房主</Text>
                <Text fontSize="sm" fontWeight="normal">
                  创建房间，让朋友加入
                </Text>
              </VStack>
            </Button>

            <Button
              colorScheme="green"
              size="lg"
              height="120px"
              width="100%"
              leftIcon={<LuUserPlus size={32} />}
              onClick={() => setUserRole("guest")}
              isDisabled={!isInstalled}
            >
              <VStack spacing={1}>
                <Text fontSize="xl" fontWeight="bold">我要当客人</Text>
                <Text fontSize="sm" fontWeight="normal">
                  输入房间码，加入房间
                </Text>
              </VStack>
            </Button>
          </VStack>

          <Divider my={4} />

          <Button variant="ghost" onClick={handleLogout}>
            <LuLogOut style={{ marginRight: "8px" }} />
            登出
          </Button>
        </VStack>
      </Section>
    );
  }

  if (userRole === "host") {
    return (
      <Section title="创建房间" description="填写房间信息，创建你的专属房间">
        <VStack align="stretch" spacing={4}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUserRole("unselected")}
          >
            ← 返回选择
          </Button>

          <Card bg={boxBg} p={4}>
            <CardHeader pb={2}>
              <Heading size="md">房间设置</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="bold" mb={2}>房间名称</Text>
                  <Input
                    placeholder="例如：我的世界房间"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>网络端口</Text>
                  <Input
                    placeholder="25565"
                    type="number"
                    value={gamePortInput}
                    onChange={(e) => setGamePortInput(e.target.value)}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Minecraft 默认端口为 25565
                  </Text>
                </Box>

                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={handleCreateRoom}
                  isLoading={isCreatingRoom}
                  isDisabled={!isInstalled || roomNameInput.trim() === ""}
                >
                  创建房间
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Section>
    );
  }

  if (userRole === "guest") {
    return (
      <Section title="加入房间" description="输入房间码，加入朋友的房间">
        <VStack align="stretch" spacing={4}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUserRole("unselected")}
          >
            ← 返回选择
          </Button>

          <Card bg={boxBg} p={4}>
            <CardHeader pb={2}>
              <Heading size="md">输入房间码</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="bold" mb={2}>房间码</Text>
                  <Input
                    placeholder="请输入房主提供的房间码"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  />
                </Box>

                <Button
                  colorScheme="green"
                  size="lg"
                  onClick={handleJoinRoom}
                  isLoading={isJoiningRoom}
                  isDisabled={!isInstalled || roomCodeInput.trim() === ""}
                >
                  加入房间
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Section>
    );
  }

  return null;
};

export default MultiplayerLobby;
