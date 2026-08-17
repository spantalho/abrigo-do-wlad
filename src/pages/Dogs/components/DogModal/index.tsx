import { useState } from "react";
import * as Lucide from "lucide-react";
import { Link } from "react-router";
import { type Dog, CORES_MAP } from "@/types/dogs";
import styles from "./DogModal.module.css";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { ExternalLink } from "@/components/common/ExternalLink";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import * as CardComponent from "@/components/ui/Card";
import { Carousel, type CarouselAPI } from "@/components/ui/Carousel";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { analytics } from "@/utils/analytics";

interface ModalProps {
  dog: Dog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DogModal({ dog: parentDog, isOpen, onClose }: ModalProps) {
  const isDesktop = useIsDesktop();

  const [, copyToClipboard] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const [prevParentDog, setPrevParentDog] = useState<Dog | null>(parentDog);
  const [displayedDog, setDisplayedDog] = useState<Dog | null>(parentDog);

  if (parentDog && parentDog !== prevParentDog) {
    setPrevParentDog(parentDog);
    setDisplayedDog(parentDog);
  }

  const dog = displayedDog;

  if (!dog) return null;

  const photos = dog.fotos || [];
  const hasMultipleImages = photos.length > 1;

  const handleClose = () => {
    onClose();
  };

  const handleCopyClick = (toCopy: string) => {
    copyToClipboard(toCopy);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={styles.modalContent}>
        <div
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          <DialogTitle>{dog.nome}</DialogTitle>
          <DialogDescription>
            Detalhes do cachorro {dog.nome}, {dog.idade}, {dog.sexo}.
          </DialogDescription>
        </div>

        <div className={styles.contentGrid}>
          {/* --- CARROSSEL DE IMAGENS --- */}
          <div className={styles.carouselContainer}>
            <Carousel
              render={(api: CarouselAPI) => (
                <div className={styles.carouselButtons}>
                  {!isDesktop && (
                    <div>
                      <Button
                        blur={true}
                        variant="outline"
                        onClick={handleClose}
                        size="icon"
                      >
                        <Lucide.X size={20} />
                      </Button>
                    </div>
                  )}
                  {hasMultipleImages && (
                    <div className={styles.carouselNavContainer}>
                      <div className={styles.carouselNav}>
                        <div className={styles.carouselNavButtons}>
                          <Button
                            variant="primary"
                            size="icon"
                            onClick={api.goPrev}
                          >
                            <Lucide.ChevronLeft size={24} />
                          </Button>
                          <Button
                            variant="primary"
                            size="icon"
                            onClick={api.goNext}
                          >
                            <Lucide.ChevronRight size={24} />
                          </Button>
                        </div>
                      </div>
                      <div className={styles.carouselNavDots}>
                        {photos.map((_, index) => (
                          <button
                            key={index}
                            className={`${styles.dot} ${
                              api.page === index ? styles.dotActive : ""
                            }`}
                            onClick={() => api.goTo(index)}
                            aria-label={`Ir para imagem ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            >
              {photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${dog.nome} - foto ${index + 1}`}
                  className={styles.carouselImage}
                />
              ))}
            </Carousel>
          </div>
          {/* --- DETALHES DO DOG --- */}
          <div className={styles.details}>
            <div className={styles.detailsHeader}>
              <div className={styles.titleWrapper}>
                <h2 className={styles.title}>{dog.nome}</h2>
                {isDesktop && (
                  <div className={styles.closeButton}>
                    <Button variant="ghost" onClick={handleClose} size="icon">
                      <Lucide.X size={22} />
                    </Button>
                  </div>
                )}
              </div>

              <div className={styles.badges}>
                <Badge
                  variant="secondary"
                  leftIcon={<Lucide.Calendar size={14} />}
                >
                  {dog.idade}
                </Badge>

                <Badge
                  variant="secondary"
                  leftIcon={
                    dog.sexo === "Macho" ? (
                      <Lucide.Mars size={14} />
                    ) : (
                      <Lucide.Venus size={14} />
                    )
                  }
                >
                  {dog.sexo}
                </Badge>

                <Badge
                  variant="secondary"
                  leftIcon={<Lucide.Palette size={14} />}
                >
                  {CORES_MAP[dog.cor] || dog.cor}
                </Badge>

                <Badge
                  variant="secondary"
                  leftIcon={<Lucide.BriefcaseMedical size={14} />}
                >
                  {dog.status}
                </Badge>
              </div>

              {dog.instaLink && (
                <ExternalLink
                  href={dog.instaLink as string}
                  style={{ textDecoration: "none" }}
                >
                  <div className={styles.instagramPill}>
                    <Lucide.Instagram size={18} />
                    <span>Conhecer no Instagram</span>
                  </div>
                </ExternalLink>
              )}

              <p className={styles.description}>
                {dog.descricaoCompleta ||
                  `O ${dog.nome} é um cãozinho incrível que está esperando por um lar.`}
              </p>
            </div>

            <div>
              <CardComponent.Card size="sm" color="secondary" variant="quote">
                <CardComponent.CardBody>
                  <CardComponent.CardIcon>
                    <Lucide.PawPrint size={24} />
                  </CardComponent.CardIcon>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.2rem",
                    }}
                  >
                    <CardComponent.CardTitle>
                      Temperamento
                    </CardComponent.CardTitle>
                    <CardComponent.CardContent>
                      <p>
                        Perfil{" "}
                        <strong>{dog.temperamento?.toLowerCase()}</strong>.
                        Ideal para lares com o mesmo ritmo.
                      </p>
                    </CardComponent.CardContent>
                  </div>
                </CardComponent.CardBody>
              </CardComponent.Card>
            </div>

            <div className={styles.footer}>
              <div className={styles.footerBtn}>
                <Button
                  disabled
                  onClick={() =>
                    handleCopyClick(
                      `${window.location.href}?dog=${encodeURIComponent(dog.nome)}`,
                    )
                  }
                  size={`${isDesktop ? "icon" : "lg"}`}
                  variant={isCopied ? "primary" : "outline"}
                >
                  <Lucide.Copy />
                  {!isDesktop ? "Compartilhar" : ""}
                </Button>
                <Link to={`/beta/formulario?pet=${encodeURIComponent(dog.nome)}`}>
                  <Button
                    leftIcon={<Lucide.Heart />}
                    size={`${isDesktop ? "md" : "lg"}`}
                    variant="primary"
                    onClick={() =>
                      analytics.trackConversionIntent("adopt_form")
                    }
                  >
                    Tenho Interesse
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
