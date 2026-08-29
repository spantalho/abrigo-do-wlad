import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "../utils";
import styles from "./Dialog.module.css";

import { X } from "lucide-react";

export type DialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen-mobile";
export type DialogLayout = "default" | "structured";
export type DialogMobileMode = "default" | "fullscreen";
export type DialogIconTone =
  | "neutral"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger";

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: DialogSize;
  layout?: DialogLayout;
  mobileMode?: DialogMobileMode;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  "fullscreen-mobile": styles.sizeFullscreenMobile,
};

const iconToneClasses: Partial<Record<DialogIconTone, string>> = {
  primary: styles.iconPrimary,
  info: styles.iconInfo,
  success: styles.iconSuccess,
  warning: styles.iconWarning,
  danger: styles.iconDanger,
};

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(styles.overlay, className)}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, size = "md", layout = "default", mobileMode = "default", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        styles.content,
        sizeClasses[size],
        layout === "structured" && styles.structured,
        mobileMode === "fullscreen" && styles.mobileFullscreen,
        className,
      )}
      {...props}
      data-size={size}
      data-layout={layout}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.header, className)} {...props}>
    {children}
    <DialogPrimitive.Close className={styles.closeButton} aria-label="Fechar diálogo">
      <X size={20} />
    </DialogPrimitive.Close>
  </div>
);
DialogHeader.displayName = "DialogHeader";

const DialogIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tone?: DialogIconTone }
>(({ className, tone = "neutral", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(styles.icon, iconToneClasses[tone], className)}
    {...props}
    aria-hidden={props["aria-hidden"] ?? true}
  />
));
DialogIcon.displayName = "DialogIcon";

const DialogHeading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn(styles.heading, className)} {...props} />
));
DialogHeading.displayName = "DialogHeading";

const DialogBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { scrollable?: boolean }
>(({ className, scrollable = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(styles.body, scrollable && styles.bodyScrollable, className)}
    {...props}
  />
));
DialogBody.displayName = "DialogBody";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.footer, className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(styles.title, className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(styles.description, className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogIcon,
  DialogHeading,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
