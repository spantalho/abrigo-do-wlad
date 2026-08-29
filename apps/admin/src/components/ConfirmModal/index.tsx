import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  confirmingText = "Confirmando...",
  isConfirming = false,
  isDestructive = false,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isConfirming && onClose()}
    >
      <DialogContent className={styles.modal}>
        <DialogHeader className={styles.header}>
          <div className={`${styles.iconArea} ${isDestructive ? styles.iconDestructive : styles.iconConfirm}`}>
            {isDestructive ? <AlertTriangle size={30} /> : <CheckCircle size={30} />}
          </div>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className={styles.description}>{message}</DialogDescription>
        <DialogFooter className={styles.actions}>
          <Button variant="outline" disabled={isConfirming} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={isDestructive ? "danger" : "success"}
            className={isDestructive ? styles.btnDestructive : styles.btnConfirm}
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
