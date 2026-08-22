import type { ComponentProps, ReactNode } from "react";
import styles from "./Badge.module.css";
import { cn } from "../utils";

type BadgeProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  blur?: boolean;
} & ComponentProps<"div">;

/**
 * A badge component to display small pieces of information.
 * @returns a JSX element representing the badge.
 */
export function Badge({
  children,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  blur,
  className,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        styles.badge,
        styles[variant],
        styles[size],
        { [styles.blur]: blur },
        className,
      )}
      {...props}
    >
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span className={styles.content}>{children}</span>
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </div>
  );
}
