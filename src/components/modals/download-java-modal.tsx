import {
  Box,
  Button,
  Card,
  CardBody,
  Grid,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuDownload, LuExternalLink, LuSearch, LuX } from "react-icons/lu";
import { MenuSelector } from "@/components/common/menu-selector";
import { useLauncherConfig } from "@/contexts/config";
import { useToast } from "@/contexts/toast";
import { JavaVendor, ThirdPartyJavaRelease } from "@/models/system-info";
import { ConfigService } from "@/services/config";

type VendorKey = "mojang" | "zulu" | "bellsoft" | "temurin";

const VENDOR_LABELS: Record<VendorKey, string> = {
  mojang: "Mojang",
  zulu: "Zulu",
  bellsoft: "BellSoft",
  temurin: "Temurin",
};

const JAVA_VERSIONS = ["8", "11", "17", "21", "25"];

export const DownloadJavaModal: React.FC<Omit<ModalProps, "children">> = ({
  ...props
}) => {
  const { t } = useTranslation();
  const { config } = useLauncherConfig();
  const toast = useToast();
  const router = useRouter();
  const primaryColor = config.appearance.theme.primaryColor;

  const [vendor, setVendor] = useState<VendorKey | "">("");
  const [version, setVersion] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [releases, setReleases] = useState<ThirdPartyJavaRelease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRelease, setSelectedRelease] =
    useState<ThirdPartyJavaRelease | null>(null);

  // Fetch releases when vendor or version changes
  useEffect(() => {
    if (vendor && vendor !== "mojang") {
      fetchReleases();
    } else {
      setReleases([]);
      setSelectedRelease(null);
    }
  }, [vendor, version]);

  const fetchReleases = async () => {
    if (!vendor || vendor === "mojang") return;

    setIsLoading(true);
    setReleases([]);
    setSelectedRelease(null);

    try {
      const majorVersion = version ? parseInt(version) : undefined;
      const response = await ConfigService.fetchThirdPartyJavaReleases(
        vendor as JavaVendor,
        majorVersion
      );

      if (response.status === "success" && response.data) {
        // Filter by search query if provided
        let filtered = response.data;
        if (searchQuery) {
          filtered = filtered.filter(
            (r) =>
              r.fullVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
              r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        // Sort by major version (descending), then by full version
        filtered.sort((a, b) => {
          if (a.majorVersion !== b.majorVersion) {
            return b.majorVersion - a.majorVersion;
          }
          return b.fullVersion.localeCompare(a.fullVersion);
        });
        setReleases(filtered);
      } else {
        toast({
          title: response.message || t("DownloadJavaModal.error.fetchFailed"),
          status: "error",
        });
      }
    } catch (error) {
      toast({
        title: t("DownloadJavaModal.error.fetchFailed"),
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (vendor && vendor !== "mojang") {
      fetchReleases();
    }
  };

  const handleConfirm = async () => {
    if (!vendor) return;

    if (vendor === "mojang") {
      if (!version) return;
      ConfigService.downloadMojangJava(version).then((res) => {
        if (res.status === "success") {
          router.push("/downloads");
          props.onClose?.();
        } else {
          toast({
            title: res.message,
            status: "error",
          });
        }
      });
    } else if (selectedRelease) {
      ConfigService.downloadThirdPartyJava(selectedRelease).then((res) => {
        if (res.status === "success") {
          router.push("/downloads");
          props.onClose?.();
        } else {
          toast({
            title: res.message,
            status: "error",
          });
        }
      });
    }
  };

  const handleOpenWebsite = () => {
    if (!vendor || vendor === "mojang") return;

    const urls: Record<VendorKey, string> = {
      mojang: "",
      zulu: "https://www.azul.com/downloads/",
      bellsoft: "https://bell-sw.com/pages/downloads/",
      temurin: "https://adoptium.net/",
    };

    openUrl(urls[vendor]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "Unknown";
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  return (
    <Modal size={{ base: "sm", lg: "lg" }} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("DownloadJavaModal.header.title")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {/* Vendor and Version Selection */}
            <Grid templateColumns="1fr 1fr" gap={4} w="100%">
              <MenuSelector
                options={Object.entries(VENDOR_LABELS).map(([key, label]) => ({
                  value: key,
                  label,
                }))}
                value={vendor}
                onSelect={(val) => {
                  setVendor(val as VendorKey);
                  setSelectedRelease(null);
                  if (val === "mojang") {
                    setVersion("");
                  }
                }}
                placeholder={t("DownloadJavaModal.selector.vendor")}
                size="sm"
                fontSize="sm"
              />

              <MenuSelector
                options={
                  vendor === "mojang"
                    ? JAVA_VERSIONS.filter((v) =>
                        config.basicInfo.osType === "macos" ? v !== "8" : true
                      )
                    : JAVA_VERSIONS
                }
                value={version}
                onSelect={(val) =>
                  setVersion(Array.isArray(val) ? (val[0] ?? "") : (val ?? ""))
                }
                placeholder={t("DownloadJavaModal.selector.version")}
                size="sm"
                fontSize="sm"
              />
            </Grid>

            {/* Search Box for Third-party Java */}
            {vendor && vendor !== "mojang" && (
              <InputGroup size="sm">
                <InputLeftElement>
                  <LuSearch />
                </InputLeftElement>
                <Input
                  placeholder={t("DownloadJavaModal.search.placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                {searchQuery && (
                  <IconButton
                    aria-label="Clear search"
                    icon={<LuX />}
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      fetchReleases();
                    }}
                  />
                )}
              </InputGroup>
            )}

            {/* Mojang Warning */}
            {vendor === "mojang" && (
              <Text color="gray.500" fontSize="sm">
                {t("DownloadJavaModal.warning.mojang")}
              </Text>
            )}

            {/* Third-party Java List */}
            {vendor && vendor !== "mojang" && (
              <Box maxH="300px" overflowY="auto">
                {isLoading ? (
                  <VStack py={4}>
                    <Spinner size="sm" />
                    <Text color="gray.500" fontSize="sm">
                      {t("DownloadJavaModal.loading")}
                    </Text>
                  </VStack>
                ) : releases.length > 0 ? (
                  <VStack align="stretch" spacing={2}>
                    {releases.map((release, index) => (
                      <Card
                        key={index}
                        size="sm"
                        cursor="pointer"
                        variant={
                          selectedRelease === release ? "filled" : "outline"
                        }
                        bg={
                          selectedRelease === release
                            ? `${primaryColor}.50`
                            : "white"
                        }
                        borderColor={
                          selectedRelease === release
                            ? `${primaryColor}.500`
                            : "gray.200"
                        }
                        onClick={() => setSelectedRelease(release)}
                        _hover={{ borderColor: `${primaryColor}.300` }}
                      >
                        <CardBody py={2}>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" fontSize="sm">
                                {release.isJre ? "JRE" : "JDK"}{" "}
                                {release.majorVersion}
                                {release.isLts && " (LTS)"}
                              </Text>
                              <Text color="gray.500" fontSize="xs">
                                {release.fullVersion}
                              </Text>
                            </VStack>
                            <VStack align="end" spacing={0}>
                              <Text fontSize="sm">
                                {formatFileSize(release.fileSize)}
                              </Text>
                              <Text color="gray.500" fontSize="xs">
                                {release.architecture}
                              </Text>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                ) : (
                  <Text
                    color="gray.500"
                    fontSize="sm"
                    textAlign="center"
                    py={4}
                  >
                    {t("DownloadJavaModal.noReleases")}
                  </Text>
                )}
              </Box>
            )}

            {/* External Link for Third-party */}
            {vendor && vendor !== "mojang" && (
              <Button
                size="sm"
                variant="ghost"
                rightIcon={<LuExternalLink />}
                onClick={handleOpenWebsite}
              >
                {t("DownloadJavaModal.openWebsite", {
                  vendor: VENDOR_LABELS[vendor],
                })}
              </Button>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={props.onClose}>
            {t("General.cancel")}
          </Button>
          <Button
            colorScheme={primaryColor}
            leftIcon={<LuDownload />}
            isDisabled={
              !vendor ||
              (vendor === "mojang" && !version) ||
              (vendor !== "mojang" && !selectedRelease)
            }
            onClick={handleConfirm}
          >
            {t("General.download")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
