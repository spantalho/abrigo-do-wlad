import { X, Heart, LogOut } from "lucide-react";
import styles from "./AdoptionModal.module.css"; 

interface AdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (adoptedViaSite: boolean) => void;
  dogName: string;
}

export function AdoptionModal({ isOpen, onClose, onConfirm, dogName }: AdoptionModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.iconArea}>
            <Heart size={32} />
          </div>
          
          <h3>O destino de {dogName}</h3>
          <p>Ficamos felizes em ver um animal saindo do abrigo! Nos conte o que aconteceu para mantermos nossas métricas atualizadas:</p>

          <div className={styles.actionButtons}>
            <button onClick={() => onConfirm(true)} className={styles.btnSite}>
              <Heart size={20} /> Adotado pelo Site!
            </button>

            <button onClick={() => onConfirm(false)} className={styles.btnOutside}>
              <LogOut size={20} /> Adotado por fora / Outro motivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}