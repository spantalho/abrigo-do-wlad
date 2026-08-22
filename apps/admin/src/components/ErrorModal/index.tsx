import { X, AlertOctagon } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconArea}>
            <AlertOctagon size={32} />
          </div>
          
          <h3>{title}</h3>
          <p>{message}</p>

          <button className={styles.confirmBtn} onClick={onClose}>
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}