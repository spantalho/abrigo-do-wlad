import { AlertOctagon } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@jaci/ui/Dialog";
import styles from "./ErrorModal.module.css";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function ErrorModal({
  isOpen,
  onClose,
  title = "Ops! Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente."
}: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={styles.modal}>
        <DialogHeader className={styles.header}>
          <div className={styles.iconArea}>
            <AlertOctagon size={30} />
          </div>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription className={styles.description}>{message}</DialogDescription>
        <Button variant="danger" className={styles.confirmBtn} onClick={onClose}>Tentar novamente</Button>
      </DialogContent>
    </Dialog>
  );
}
