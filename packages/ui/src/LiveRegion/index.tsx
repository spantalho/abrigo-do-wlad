import * as React from "react";

import { cn } from "../utils";
import styles from "./LiveRegion.module.css";

export interface LiveRegionProps extends React.ComponentProps<"div"> {
  politeness?: "polite" | "assertive";
  atomic?: boolean;
  visuallyHidden?: boolean;
}

export const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  (
    {
      politeness = "polite",
      atomic = true,
      visuallyHidden = true,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      {...props}
      ref={ref}
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic={atomic}
      className={cn(visuallyHidden && styles.visuallyHidden, className)}
    />
  ),
);
LiveRegion.displayName = "LiveRegion";
