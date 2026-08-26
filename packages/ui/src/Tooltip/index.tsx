import * as React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import styles from "./Tooltip.module.css";

const TooltipProvider = Tooltip.Provider;

interface TooltipRootProps extends Tooltip.TooltipProps {
  alwaysOpen?: boolean;
}

const TooltipRoot: React.FC<TooltipRootProps> = ({ alwaysOpen, ...props }) => {
  return <Tooltip.Root {...props} open={alwaysOpen} />;
};

const TooltipTrigger = Tooltip.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof Tooltip.Content>,
  React.ComponentPropsWithoutRef<typeof Tooltip.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <Tooltip.Portal>
    <Tooltip.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`${styles.TooltipContent} ${className || ""}`}
      {...props}
    >
      {props.children}
      <Tooltip.Arrow className={styles.TooltipArrow} />
    </Tooltip.Content>
  </Tooltip.Portal>
));
TooltipContent.displayName = Tooltip.Content.displayName;

export {
  TooltipRoot as Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};
