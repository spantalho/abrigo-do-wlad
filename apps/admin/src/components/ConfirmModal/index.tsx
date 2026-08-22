import { X, AlertTriangle, CheckCircle } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={`${styles.iconArea} ${isDestructive ? styles.iconDestructive : styles.iconConfirm}`}>
            {isDestructive ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
          </div>
          
          <h3>{title}</h3>
          <p>{message}</p>

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button 
              className={`${isDestructive ? styles.btnDestructive : styles.btnConfirm}`} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}