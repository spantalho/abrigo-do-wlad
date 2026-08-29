import { ConfirmModal } from "../ConfirmModal";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dogName: string;
  isDeleting?: boolean;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  dogName,
  isDeleting = false,
}: DeleteModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Excluir ponto de coleta?"
      message={<>Tem certeza que deseja excluir <strong>{dogName}</strong>? Essa ação não pode ser desfeita.</>}
      confirmText="Sim, excluir"
      confirmingText="Excluindo..."
      isConfirming={isDeleting}
      isDestructive
    />
  );
}
