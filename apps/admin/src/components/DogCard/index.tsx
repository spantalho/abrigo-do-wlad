import { useNavigate } from "react-router-dom";
import { Pencil, HeartHandshake, Dog } from "lucide-react";
import type { DogProps } from "../../types/dogs"; 
import styles from "./DogCard.module.css";

interface DogCardProps {
  dog: DogProps;
  onDelete: (id: number, nome: string) => void;
}

export function DogCard({ dog, onDelete }: DogCardProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.card}>
      
      {/* Imagem */}
      <div className={styles.cardImage}>
        {dog.fotos && dog.fotos.length > 0 ? (
          <img src={dog.fotos[0]} alt={dog.nome} />
        ) : (
          <div className={styles.noImage}>
            <Dog size={40} />
          </div>
        )}
        
        <span className={styles.statusBadge} data-status={dog.status}>
          {dog.status}
        </span>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{dog.nome}</h3>
          <span className={styles.sexoTag} data-sexo={dog.sexo}>
            {dog.sexo}
          </span>
        </div>
        
        <div className={styles.cardInfo}>
          <span className={styles.category}>{dog.cateIdade}</span>
          <span className={styles.separator}>•</span>
          <span>{dog.idade}</span>
        </div>

        <div className={styles.cardActions}>
          <button 
            onClick={() => navigate(`/admin/dog/edit/${dog.id}`)} 
            className={styles.actionBtn} 
            title="Editar"
          >
            <Pencil size={18} /> Editar
          </button>

          <button 
            onClick={() => onDelete(dog.id, dog.nome)}
            className={`${styles.actionBtn} ${styles.deleteBtn}`} 
            title="Excluir"
          >
            <HeartHandshake size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}