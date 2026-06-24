import {
  Box,
  BoxProps,
  Button,
  Divider,
  Flex,
  HStack,
  Skeleton,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Section, SectionProps } from "@/components/common/section";
import { useLauncherConfig } from "@/contexts/config";

export interface OptionItemProps extends Omit<BoxProps, "title"> {
  prefixElement?: React.ReactNode;
  title: React.ReactNode;
  titleExtra?: React.ReactNode;
  titleLineWrap?: boolean;
  description?: React.ReactNode;
  isLoading?: boolean;
  isFullClickZone?: boolean;
  children?: React.ReactNode;
  childrenOnHover?: boolean;
  isChildrenIndependent?: boolean;
  maxTitleLines?: number;
  maxDescriptionLines?: number;
}

export interface OptionItemGroupProps extends SectionProps {
  items: (OptionItemProps | React.ReactNode)[];
  withInCard?: boolean;
  withDivider?: boolean;
  maxFirstVisibleItems?: number;
  enableShowAll?: boolean;
}

export const OptionItem: React.FC<OptionItemProps> = ({
  prefixElement,
  title,
  titleExtra,
  titleLineWrap = true,
  description,
  isLoading = false,
  isFullClickZone = false,
  children,
  childrenOnHover = false,
  isChildrenIndependent = false,
  maxTitleLines = undefined,
  maxDescriptionLines = undefined,
  ...boxProps
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const titleProps = maxTitleLines
    ? { noOfLines: maxTitleLines, sx: { wordBreak: "break-all" as const } }
    : {};
  const descriptionProps = maxDescriptionLines
    ? {
        noOfLines: maxDescriptionLines,
        sx: { wordBreak: "break-all" as const },
      }
    : {};

  const _title =
    typeof title === "string" ? (
      <Skeleton isLoaded={!isLoading}>
        <Text fontSize="xs-sm" color="gray.800" {...titleProps}>
          {title}
        </Text>
      </Skeleton>
    ) : (
      title
    );

  const _titleExtra =
    titleExtra &&
    (isLoading ? (
      <Skeleton isLoaded={!isLoading}>
        <Text fontSize="xs-sm" color="gray.500">
          PLACEHOLDER
        </Text>
      </Skeleton>
    ) : (
      titleExtra
    ));

  const wrappedChildren =
    (childrenOnHover ? isHovered : true) &&
    (typeof children === "string" ? (
      <Skeleton isLoaded={!isLoading}>
        <Text fontSize="xs-sm" color="gray.500">
          {children}
        </Text>
      </Skeleton>
    ) : (
      children
    ));

  return (
    <Flex justify="space-between" alignItems="center">
      <Flex
        flex={1}
        justify="space-between"
        alignItems="center"
        overflow="hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        borderRadius="lg"
        p={isFullClickZone ? 2 : 0.5}
        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          bg: isFullClickZone ? "rgba(10, 132, 255, 0.06)" : "inherit",
          transform: isFullClickZone ? "translateX(2px)" : "none",
        }}
        _active={{
          bg: isFullClickZone ? "rgba(10, 132, 255, 0.12)" : "inherit",
        }}
        cursor={isFullClickZone ? "pointer" : "default"}
        {...boxProps}
      >
        <HStack spacing={2.5} overflow="hidden">
          {prefixElement && (
            <Skeleton isLoaded={!isLoading} flex="0 0 auto">
              {prefixElement}
            </Skeleton>
          )}
          <VStack
            spacing={0}
            mr={2}
            alignItems="stretch"
            overflow="hidden"
            flex={"1 1 auto"}
          >
            {titleLineWrap ? (
              <Wrap spacingX={2} spacingY={0.5}>
                {_title}
                {titleExtra && _titleExtra}
              </Wrap>
            ) : (
              <HStack spacing={2} flexWrap="nowrap">
                {_title}
                {titleExtra && _titleExtra}
              </HStack>
            )}

            {description &&
              (typeof description === "string" ? (
                <Skeleton isLoaded={!isLoading}>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    lineHeight="1.5"
                    {...descriptionProps}
                  >
                    {description}
                  </Text>
                </Skeleton>
              ) : (
                description
              ))}
          </VStack>
        </HStack>
        {!isChildrenIndependent && wrappedChildren}
      </Flex>
      {isChildrenIndependent && wrappedChildren}
    </Flex>
  );
};

export const OptionItemGroup: React.FC<OptionItemGroupProps> = ({
  items,
  withInCard = true,
  withDivider = true,
  maxFirstVisibleItems,
  enableShowAll = true,
  ...props
}) => {
  const { t } = useTranslation();
  const { config } = useLauncherConfig();
  const primaryColor = config.appearance.theme.primaryColor;
  const [showAll, setShowAll] = useState(false);

  function isOptionItemProps(item: any): item is OptionItemProps {
    return (
      (item as OptionItemProps)?.title != null &&
      (item as OptionItemProps)?.children != null
    );
  }

  const hasShowAllBtn = !(
    !maxFirstVisibleItems ||
    showAll ||
    items.length <= maxFirstVisibleItems
  );

  const visibleItems = hasShowAllBtn
    ? [...items.slice(0, maxFirstVisibleItems)]
    : items;

  const renderItems = () => (
    <>
      {[...visibleItems].map((item, index) => (
        <React.Fragment key={index}>
          {isOptionItemProps(item) ? <OptionItem {...item} /> : item}
          {index !== visibleItems.length - 1 &&
            (withDivider ? (
              <Divider
                my={1.5}
                borderColor="rgba(0, 0, 0, 0.06)"
                borderWidth="1px"
              />
            ) : (
              <Box h={1.5} />
            ))}
        </React.Fragment>
      ))}
      {hasShowAllBtn && (
        <Box>
          <Button
            key="show-all"
            size="xs"
            colorScheme={primaryColor}
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            mt={1.5}
            ml={-1.5}
            disabled={!enableShowAll}
            borderRadius="lg"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              bg: `rgba(10, 132, 255, 0.08)`,
              transform: "translateY(-1px)",
            }}
            _active={{
              bg: `rgba(10, 132, 255, 0.15)`,
              transform: "translateY(0)",
            }}
          >
            {t("OptionItemGroup.button.showAll", {
              left: items.length - maxFirstVisibleItems,
            })}
          </Button>
        </Box>
      )}
    </>
  );

  return (
    <Section {...props}>
      {items.length > 0 &&
        (withInCard ? (
          <Box
            bg="rgba(255, 255, 255, 0.65)"
            border="1px solid rgba(255, 255, 255, 0.7)"
            borderRadius="2xl"
            backdropFilter="blur(40px) saturate(200%)"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.5) inset"
            py={3}
            px={4}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            {renderItems()}
          </Box>
        ) : (
          renderItems()
        ))}
    </Section>
  );
};
