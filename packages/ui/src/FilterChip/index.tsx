import * as React from "react";
import { X } from "lucide-react";

import { cn } from "../utils";
import styles from "./FilterChip.module.css";

export interface FilterChipProps
  extends Omit<React.ComponentProps<"button">, "onClick"> {
  onRemove: () => void;
  removeLabel: string;
  size?: "sm" | "md";
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    {
      children,
      onRemove,
      removeLabel,
      size = "md",
      className,
      ...props
    },
    ref,
  ) => (
    <button
      {...props}
      ref={ref}
      type="button"
      aria-label={removeLabel}
      className={cn(styles.root, styles[size], className)}
      onClick={onRemove}
    >
      <span>{children}</span>
      <X className={styles.icon} aria-hidden="true" />
    </button>
  ),
);
FilterChip.displayName = "FilterChip";
