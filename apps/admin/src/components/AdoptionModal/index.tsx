import { Heart, LogOut } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogIcon,
  DialogTitle,
} from "@jaci/ui/Dialog";
import styles from "./AdoptionModal.module.css";

interface AdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (adoptedViaSite: boolean) => void;
  dogName: string;
  isSubmitting?: boolean;
}

export function AdoptionModal({
  isOpen,
  onClose,
  onConfirm,
  dogName,
  isSubmitting = false,
}: AdoptionModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogIcon tone="primary">
            <Heart />
          </DialogIcon>
          <DialogHeading>
            <DialogTitle>O destino de {dogName}</DialogTitle>
            <DialogDescription>
              Ficamos felizes em ver um animal saindo do abrigo. Informe o que
              aconteceu para manter as métricas atualizadas.
            </DialogDescription>
          </DialogHeading>
        </DialogHeader>
        <div className={styles.actionButtons}>
          <Button
            variant="success"
            disabled={isSubmitting}
            onClick={() => onConfirm(true)}
          >
            <Heart size={20} />
            {isSubmitting ? "Finalizando..." : "Adotado pelo site"}
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onConfirm(false)}
          >
            <LogOut size={20} /> Adotado por fora ou outro motivo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
