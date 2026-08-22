import { Check, X } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconArea}>
            <Check size={32} />
          </div>
          
          <h3>{title}</h3>
          <p>{message}</p>

          <button className={styles.confirmBtn} onClick={onClose}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}