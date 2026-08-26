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
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", isDestructive = false
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modal}>
        <DialogHeader className={styles.header}>
          <div className={`${styles.iconArea} ${isDestructive ? styles.iconDestructive : styles.iconConfirm}`}>
            {isDestructive ? <AlertTriangle size={30} /> : <CheckCircle size={30} />}
          </div>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className={styles.description}>{message}</DialogDescription>
        <DialogFooter className={styles.actions}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            variant={isDestructive ? "danger" : "success"}
            className={isDestructive ? styles.btnDestructive : styles.btnConfirm}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
