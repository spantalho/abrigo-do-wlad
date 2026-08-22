import { X, AlertTriangle } from "lucide-react";
import styles from "./DeleteModal.module.css";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  dogName: string;
}

export function DeleteModal({ isOpen, onClose, onConfirm, dogName }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconArea}>
            <AlertTriangle size={32} />
          </div>
          
          <h3>Excluir Ponto de Coleta</h3>
          <p>
            Tem certeza que deseja excluir <strong>{dogName}</strong>? 
            <br />
            Essa ação não pode ser desfeita.
          </p>

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button className={styles.confirmBtn} onClick={onConfirm}>
              Sim, Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}