import * as Lucide from "lucide-react";

import type { DogTombstone } from "@/types/dogs";
import { Button } from "@jaci/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@jaci/ui/Dialog";
import styles from "./DogRouteStatusModal.module.css";

export type DogRouteNotice =
  | { kind: "tombstone"; tombstone: DogTombstone }
  | { kind: "not-found" }
  | { kind: "error" };

interface DogRouteStatusModalProps {
  notice: DogRouteNotice | null;
  onClose: () => void;
}

function noticeContent(notice: DogRouteNotice) {
  if (notice.kind === "tombstone") {
    const adopted = notice.tombstone.status === "adopted";
    return {
      icon: adopted ? <Lucide.HeartHandshake size={36} /> : <Lucide.PawPrint size={36} />,
      title: adopted
        ? `${notice.tombstone.nome} encontrou uma família!`
        : `${notice.tombstone.nome} não está mais disponível`,
      description: adopted
        ? "Que notícia boa! Você ainda pode conhecer outros doguinhos que estão esperando por um lar."
        : "Este perfil não está mais disponível, mas há outros doguinhos esperando para conhecer você.",
    };
  }
  if (notice.kind === "not-found") {
    return {
      icon: <Lucide.SearchX size={36} />,
      title: "Doguinho não encontrado",
      description: "Este endereço não corresponde a um cão disponível no momento.",
    };
  }
  return {
    icon: <Lucide.WifiOff size={36} />,
    title: "Não conseguimos carregar este perfil",
    description: "Tente novamente em alguns instantes ou conheça os doguinhos exibidos nesta página.",
  };
}

export function DogRouteStatusModal({ notice, onClose }: DogRouteStatusModalProps) {
  if (!notice) return null;
  const content = noticeContent(notice);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" className={styles.modal}>
        <DialogHeader>
          <div className={styles.icon}>{content.icon}</div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className={styles.footer}>
          <Button variant="primary" onClick={onClose}>
            Conhecer outros doguinhos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
