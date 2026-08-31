import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeading,
  DialogIcon,
  DialogTitle,
} from "@jaci/ui/Dialog";
import styles from "./ConfirmModal.module.css";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmingText?: string;
  isConfirming?: boolean;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmingText = "Confirmando...",
  isConfirming = false,
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isConfirming && onClose()}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogIcon tone={isDestructive ? "danger" : "success"}>
            {isDestructive ? <AlertTriangle /> : <CheckCircle />}
          </DialogIcon>
          <DialogHeading>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeading>
        </DialogHeader>
        <DialogFooter className={styles.actions}>
          <Button variant="outline" disabled={isConfirming} onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant={isDestructive ? "danger" : "success"}
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? confirmingText : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
