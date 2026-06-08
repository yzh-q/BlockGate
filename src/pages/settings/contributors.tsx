import { Avatar, Box, IconButton } from "@chakra-ui/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import { LuGithub } from "react-icons/lu";
import { CommonIconButton } from "@/components/common/common-icon-button";
import { OptionItemGroup } from "@/components/common/option-item";
import { WrapCardGroup } from "@/components/common/wrap-card";

export const CoreContributorsList = [
  {
    username: "BlockGate",
    contribution: "fullStackDev",
  },
  {
    username: "Developer",
    contribution: "fullStackDev",
  },
  {
    username: "Contributor",
    contribution: "fullStackDev",
  },
];

const ContributorsPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <OptionItemGroup
        items={[
          {
            title: t("ContributorsPage.all"),
            children: (
              <CommonIconButton
                label="https://github.com/BlockGate/BlockGate/graphs/contributors"
                icon="external"
                withTooltip
                tooltipPlacement="bottom-end"
                size="xs"
                h={18}
                onClick={() =>
                  openUrl(
                    "https://github.com/BlockGate/BlockGate/graphs/contributors"
                  )
                }
              />
            ),
          },
        ]}
      />
      <WrapCardGroup
        title={t("ContributorsPage.core")}
        items={CoreContributorsList.map((item) => {
          return {
            cardContent: {
              title: item.username,
              description: t(
                `ContributorsPage.contribution.${item.contribution}`
              ),
              image: (
                <Avatar
                  size="sm"
                  name={item.username}
                  src={`https://avatars.githubusercontent.com/${item.username}`}
                />
              ),
              extraContent: (
                <Box position="absolute" top={0.5} right={1}>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label={`${item.username}-github`}
                    icon={<LuGithub />}
                    onClick={() => {
                      openUrl(`https://github.com/${item.username}`);
                    }}
                  />
                </Box>
              ),
            },
          };
        })}
      />
    </>
  );
};
export default ContributorsPage;
