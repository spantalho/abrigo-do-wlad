import * as React from "react";
import { cn } from "../utils";
import styles from "./Field.module.css";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(styles.control, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(styles.control, styles.select, className)} {...props} />
  ),
);
NativeSelect.displayName = "NativeSelect";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(styles.control, styles.textarea, className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
