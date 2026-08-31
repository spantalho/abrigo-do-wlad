import { AlertOctagon } from "lucide-react";
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
  message = "Ocorreu um erro inesperado. Tente novamente.",
}: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogIcon tone="danger">
            <AlertOctagon />
          </DialogIcon>
          <DialogHeading>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeading>
        </DialogHeader>
        <Button variant="danger" onClick={onClose}>
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
