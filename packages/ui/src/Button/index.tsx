import type { ComponentProps, ReactNode } from "react";
import style from "./Button.module.css";
import { cn } from "../utils";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "outline" | "text" | "ghost";
  size?: "sm" | "md" | "lg" | "icon" | "icon-sm";
  blur?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
} & ComponentProps<"button">;

/**
 * A customizable button ui component.
 * @returns a JSX element representing the button.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  blur,
  leftIcon,
  rightIcon,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        style.btn,
        style[variant],
        style[size],
        { [style.blur]: blur },
        className,
      )}
      {...props}
    >
      {leftIcon && <span className={style.icon}>{leftIcon}</span>}
      {children}
      {rightIcon && <span className={style.icon}>{rightIcon}</span>}
    </button>
  );
}
