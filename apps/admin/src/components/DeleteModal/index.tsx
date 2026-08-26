import { ConfirmModal } from "../ConfirmModal";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dogName: string;
}

export function DeleteModal({ isOpen, onClose, onConfirm, dogName }: DeleteModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Excluir ponto de coleta?"
      message={<>Tem certeza que deseja excluir <strong>{dogName}</strong>? Essa ação não pode ser desfeita.</>}
      confirmText="Sim, excluir"
      isDestructive
    />
  );
}
