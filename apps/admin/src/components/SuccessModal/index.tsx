import { Check } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@jaci/ui/Dialog";
import styles from "./SuccessModal.module.css";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title = "Sucesso!",
  message = "Operação realizada com sucesso."
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modal}>
        <DialogHeader className={styles.header}>
          <div className={styles.iconArea}>
            <Check size={30} />
          </div>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className={styles.description}>{message}</DialogDescription>
        <Button variant="success" onClick={onClose}>Continuar</Button>
      </DialogContent>
    </Dialog>
  );
}
