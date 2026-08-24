import { useNavigate } from "react-router";
import { Pencil, HeartHandshake, Dog } from "lucide-react";
import { Badge } from "@jaci/ui/Badge";
import { Button } from "@jaci/ui/Button";
import { Card } from "@jaci/ui/Card";
import type { DogProps } from "../../types/dogs";
import styles from "./DogCard.module.css";

interface DogCardProps {
  dog: DogProps;
  onDelete: (id: number, nome: string) => void;
}

export function DogCard({ dog, onDelete }: DogCardProps) {
  const navigate = useNavigate();
  const statusVariant = dog.status === "Em tratamento"
    ? "danger"
    : dog.status === "Adotado"
      ? "success"
      : "secondary";

  return (
    <Card className={styles.card} interactive>

      {/* Imagem */}
      <div className={styles.cardImage}>
        {dog.fotos && dog.fotos.length > 0 ? (
          <img src={dog.fotos[0]} alt={dog.nome} />
        ) : (
          <div className={styles.noImage}>
            <Dog size={40} />
          </div>
        )}

        <Badge className={styles.statusBadge} variant={statusVariant} size="sm">
          {dog.status}
        </Badge>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{dog.nome}</h3>
          <Badge className={styles.sexoTag} variant={dog.sexo === "Macho" ? "secondary" : "danger"} size="sm">
            {dog.sexo}
          </Badge>
        </div>

        <div className={styles.cardInfo}>
          <span className={styles.category}>{dog.cateIdade}</span>
          <span className={styles.separator}>•</span>
          <span>{dog.idade}</span>
        </div>

        <div className={styles.cardActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/dog/edit/${dog.id}`)}
            className={styles.actionBtn}
            title="Editar"
          >
            <Pencil size={18} /> Editar
          </Button>

          <Button
            variant="danger"
            size="icon-sm"
            aria-label={`Finalizar jornada de ${dog.nome}`}
            onClick={() => onDelete(dog.id, dog.nome)}
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            title="Excluir"
          >
            <HeartHandshake size={18} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
