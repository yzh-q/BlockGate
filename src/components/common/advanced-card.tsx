import { Box, BoxProps } from "@chakra-ui/react";
import React, { forwardRef } from "react";
import { useThemedCSSStyle } from "@/hooks/themed-css";

interface AdvancedCardProps extends Omit<BoxProps, "children"> {
  variant?: string;
  level?: "back" | "front";
  children?: React.ReactNode;
}

const AdvancedCard = forwardRef<HTMLDivElement, AdvancedCardProps>(
  ({ variant = "liquid-glass", level = "back", children, ...props }, ref) => {
    const themedStyles = useThemedCSSStyle();

    if (variant === "liquid-glass") {
      return (
        <Box
          ref={ref}
          {...props}
          className={`${themedStyles.liquidGlass["wrapper"]} ${props.className || ""}`}
        >
          <div className={themedStyles.liquidGlass["effect"]} />
          <div className={themedStyles.liquidGlass["shine"]} />
          <Box position="relative" zIndex={3} height="100%" width="100%">
            {children}
          </Box>
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        {...props}
        className={`${themedStyles.card[`card-${level}`]} ${props.className || ""}`}
      >
        {children}
      </Box>
    );
  }
);

AdvancedCard.displayName = "AdvancedCard";

export default AdvancedCard;
