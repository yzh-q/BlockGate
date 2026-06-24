import { Badge, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ChakraColorSelector from "@/components/chakra-color-selector";
import {
  OptionItemGroup,
  OptionItemGroupProps,
} from "@/components/common/option-item";
import SegmentedControl from "@/components/common/segmented";
import { useLauncherConfig } from "@/contexts/config";
import { UtilsService } from "@/services/utils";

const AppearanceSettingsPage = () => {
  const { t } = useTranslation();
  const { config, update } = useLauncherConfig();
  const appearanceConfigs = config.appearance;
  const primaryColor = appearanceConfigs.theme.primaryColor;

  const [fonts, setFonts] = useState<string[]>([]);

  useEffect(() => {
    const handleRetrieveFontList = async () => {
      const res = await UtilsService.retrieveFontList();
      if (res.status === "success") {
        setFonts(["%built-in", ...res.data]);
      }
    };
    handleRetrieveFontList();
  }, []);

  const buildFontName = (font: string) => {
    return font === "%built-in"
      ? t("AppearanceSettingsPage.font.settings.fontFamily.default")
      : font;
  };

  const appearanceSettingGroups: OptionItemGroupProps[] = [
    {
      title: t("AppearanceSettingsPage.theme.title"),
      items: [
        {
          title: t("AppearanceSettingsPage.theme.settings.primaryColor.title"),
          children: (
            <ChakraColorSelector
              current={primaryColor}
              onColorSelect={(color) => {
                update("appearance.theme.primaryColor", color);
              }}
              size="xs"
            />
          ),
        },
        {
          title: t("AppearanceSettingsPage.theme.settings.colorMode.title"),
          children: (
            <SegmentedControl
              selected={appearanceConfigs.theme.colorMode}
              onSelectItem={(s) => {
                update("appearance.theme.colorMode", s as string);
              }}
              size="xs"
              items={["system", "light", "dark"].map((item) => ({
                label: t(
                  `AppearanceSettingsPage.theme.settings.colorMode.type.${item}`
                ),
                value: item,
              }))}
            />
          ),
        },
        {
          title: t("AppearanceSettingsPage.theme.settings.headNavStyle.title"),
          titleExtra: <Badge colorScheme="purple">Beta</Badge>,
          children: (
            <SegmentedControl
              selected={appearanceConfigs.theme.headNavStyle}
              onSelectItem={(s) => {
                update("appearance.theme.headNavStyle", s as string);
              }}
              size="xs"
              items={["standard", "simplified"].map((item) => ({
                label: t(
                  `AppearanceSettingsPage.theme.settings.headNavStyle.type.${item}`
                ),
                value: item,
              }))}
            />
          ),
        },
      ],
    },

    {
      title: t("AppearanceSettingsPage.font.title"),
      items: [
        {
          title: t("AppearanceSettingsPage.font.settings.fontFamily.title"),
          children: (
            <SegmentedControl
              selected={appearanceConfigs.font.fontFamily}
              onSelectItem={(s) => {
                update("appearance.font.fontFamily", s as string);
              }}
              size="xs"
              items={fonts.slice(0, 4).map((font) => ({
                label: buildFontName(font),
                value: font,
              }))}
            />
          ),
        },
      ],
    },
    {
      title: t("AppearanceSettingsPage.accessibility.title"),
      items: [
        {
          title: t(
            "AppearanceSettingsPage.accessibility.settings.invertColors.title"
          ),
          children: (
            <SegmentedControl
              selected={
                appearanceConfigs.accessibility.invertColors ? "on" : "off"
              }
              onSelectItem={(s) => {
                update("appearance.accessibility.invertColors", s === "on");
              }}
              size="xs"
              items={["off", "on"].map((item) => ({
                label: t(`General.${item}`),
                value: item,
              }))}
            />
          ),
        },
        {
          title: t(
            "AppearanceSettingsPage.accessibility.settings.enhanceContrast.title"
          ),
          children: (
            <SegmentedControl
              selected={
                appearanceConfigs.accessibility.enhanceContrast ? "on" : "off"
              }
              onSelectItem={(s) => {
                update("appearance.accessibility.enhanceContrast", s === "on");
              }}
              size="xs"
              items={["off", "on"].map((item) => ({
                label: t(`General.${item}`),
                value: item,
              }))}
            />
          ),
        },
      ],
    },
  ];

  return (
    <VStack align="stretch" spacing={4}>
      {appearanceSettingGroups.map((group, index) => (
        <OptionItemGroup title={group.title} items={group.items} key={index} />
      ))}
    </VStack>
  );
};

export default AppearanceSettingsPage;
