import {
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  useToast,
} from "@chakra-ui/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLauncherConfig } from "@/contexts/config";

interface SponsorRemindModalProps extends Omit<ModalProps, "children"> {}

const SponsorRemindModal: React.FC<SponsorRemindModalProps> = ({
  ...props
}) => {
  const toast = useToast();
  const { t } = useTranslation();
  const { config, update, markSponsorRemindShown } = useLauncherConfig();
  const primaryColor = config.appearance.theme.primaryColor;

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [sponsorKey, setSponsorKey] = useState("");
  const [verifying, setVerifying] = useState(false);

  // 打开赞助页面
  const handleSponsor = () => {
    openUrl("http://qdq.shenkongyun.cn/sponsor");
    markSponsorRemindShown();
    props.onClose?.();
  };

  // 下次再说
  const handleLater = () => {
    markSponsorRemindShown();
    props.onClose?.();
  };

  // 验证赞助密钥
  const handleVerifyKey = async () => {
    if (!sponsorKey.trim()) {
      toast({
        title: "请输入赞助密钥",
        status: "error",
      });
      return;
    }

    setVerifying(true);
    try {
      const response = await fetch(
        "http://qdq.shenkongyun.cn/api/verify-sponsor-key",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: sponsorKey.trim() }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "验证成功！",
          description: result.message,
          status: "success",
        });
        update("sponsor.verified", true);
        update("sponsor.key", sponsorKey.trim());
        props.onClose?.();
      } else {
        toast({
          title: "验证失败",
          description: result.message,
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: "验证失败",
        description: "网络错误，请稍后重试",
        status: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal scrollBehavior="inside" size="xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>💖 感谢使用 BlockGate</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!showKeyInput ? (
            <>
              <p style={{ marginBottom: "16px", fontSize: "16px" }}>
                如果 BlockGate 对你有帮助，欢迎赞助我们以支持后续的开发和维护！
              </p>
              <p style={{ marginBottom: "16px", color: "#666" }}>
                您的每一份支持都是我们继续前进的动力。
              </p>
            </>
          ) : (
            <>
              <p style={{ marginBottom: "16px", fontSize: "16px" }}>
                请输入您的赞助密钥：
              </p>
              <InputGroup>
                <Input
                  placeholder="请输入赞助密钥"
                  value={sponsorKey}
                  onChange={(e) => setSponsorKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyKey()}
                />
                <InputRightElement width="auto">
                  <Button
                    size="sm"
                    colorScheme={primaryColor}
                    onClick={handleVerifyKey}
                    isLoading={verifying}
                  >
                    验证
                  </Button>
                </InputRightElement>
              </InputGroup>
            </>
          )}
        </ModalBody>
        <ModalFooter gap="2">
          {!showKeyInput ? (
            <>
              <Button variant="ghost" onClick={handleLater}>
                下次再说
              </Button>
              <Button variant="outline" onClick={() => setShowKeyInput(true)}>
                我不想再被打扰
              </Button>
              <Button
                variant="solid"
                colorScheme={primaryColor}
                onClick={handleSponsor}
              >
                前往赞助
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setShowKeyInput(false)}>
                返回
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SponsorRemindModal;
