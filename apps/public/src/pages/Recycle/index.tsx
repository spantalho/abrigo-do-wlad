import { useState, useEffect, useRef } from "react";
import * as CardComponent from "@jaci/ui/Card";
import Banner from "@/components/Banner";
import { Button } from "@jaci/ui/Button";
import * as Dialog from "@jaci/ui/Dialog";
import { ScrollIndicators } from "@/components/ScrollIndicators";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@jaci/ui/Accordion";

import { getThirdPartyImage } from "@/utils/common";
import { analytics } from "@/utils/analytics";
import * as Lucide from "lucide-react";

// Adicionamos as importações do Firebase e do Tipo
import { getRecyclePoints } from "../../services/recycleService";
import type { RecyclePoint } from "../../types/recycle";

import styles from "./Recycle.module.css";
import { Badge } from "@jaci/ui/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@jaci/ui/Tooltip";
import { PageFeedback } from "@/components/PageFeedback";

interface GroupedPoints {
  zone: string;
  locations: RecyclePoint[];
}

interface MapModalState {
  isOpen: boolean;
  location: RecyclePoint | null;
}

export default function Recycle() {
  const heroImage = getThirdPartyImage("recycle")?.url;
  const containerRef = useRef<HTMLDivElement>(null!);
  const section1Ref = useRef<HTMLElement>(null!);
  const section2Ref = useRef<HTMLElement>(null!);
  const sectionLabels = ["O que doar?", "Pontos de coleta"];

  const [collectionPoints, setCollectionPoints] = useState<GroupedPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapModal, setMapModal] = useState<MapModalState>({
    isOpen: false,
    location: null,
  });

  // Busca na base de dados quando a página carrega
  useEffect(() => {
    async function fetchPoints() {
      try {
        const rawPoints = await getRecyclePoints();

        // Agrupa a lista que vem reta do banco pelo campo "zone"
        const grouped = rawPoints.reduce((acc, point) => {
          const existingZone = acc.find((item) => item.zone === point.zone);
          if (existingZone) {
            existingZone.locations.push(point);
          } else {
            acc.push({ zone: point.zone, locations: [point] });
          }
          return acc;
        }, [] as GroupedPoints[]);

        // Ordena as zonas em ordem alfabética
        grouped.sort((a, b) => a.zone.localeCompare(b.zone));

        // Ordena os bairros dentro de cada zona em ordem alfabética
        grouped.forEach((group) => {
          group.locations.sort((a, b) =>
            a.neighborhood.localeCompare(b.neighborhood),
          );
        });

        setCollectionPoints(grouped);
      } catch (error) {
        console.error("Erro ao buscar pontos do Firebase", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPoints();
  }, []);

  // Track when no results are found
  useEffect(() => {
    if (!loading && collectionPoints.length === 0) {
      analytics.trackNoResults("recycle_page");
    }
  }, [loading, collectionPoints.length]);

  return (
    <>
      <ScrollIndicators
        containerRef={containerRef}
        sectionCount={2}
        labels={sectionLabels}
      />
      <Banner
        image={heroImage as string}
        badge="Reciclagem solidária"
        title="Sua tampinha vale vidas"
        description="Transformamos plástico em ração e medicamentos. Descubra como um gesto simples pode salvar nossos animais."
      />

      <div className={styles.mainContainer} ref={containerRef}>
        <section className="container" ref={section1Ref}>
          <div className={styles.recycleTextContainer}>
            <h2 className="section-title">O que doar?</h2>
            <p>
              Aceitamos qualquer tampinha de{" "}
              <strong>plástico duro e lacres de alumínio</strong>. O material é
              vendido para reciclagem e 100% do valor é revertido para o abrigo.
            </p>

            <ul className={styles.checklist}>
              <li>
                <Lucide.CheckCircle className={styles.checklistIcon} />
                <span>Tampas de garrafa PET (água/refri)</span>
              </li>
              <li>
                <Lucide.CheckCircle className={styles.checklistIcon} />
                <span>Tampas de shampoo, detergente e amaciante</span>
              </li>
              <li>
                <Lucide.CheckCircle className={styles.checklistIcon} />
                <span>Tampas de caneta, creme e maionese</span>
              </li>
              <li>
                <Lucide.CheckCircle className={styles.checklistIcon} />
                <span>Lacres de latinhas de alumínio</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="container" ref={section2Ref}>
          <div style={{ width: "100%" }}>
            <div style={{ marginBottom: "2rem" }}>
              <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
                Pontos de coleta
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                Encontre o local mais próximo de você e saiba como contribuir.{" "}
                <strong>
                  {" "}
                  Se possível, entregue as tampinhas lavadas e separadas por
                  cor. Isso agiliza muito nosso trabalho!
                </strong>
              </p>
            </div>

            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 2rem",
                  color: "var(--text-muted)",
                }}
              >
                <Lucide.Loader2
                  size={32}
                  className="animate-spin"
                  style={{ margin: "0 auto 1rem" }}
                />
                <p>Carregando pontos de coleta...</p>
              </div>
            ) : collectionPoints.length === 0 ? (
              <CardComponent.Card>
                <CardComponent.CardBody>
                  <CardComponent.CardContent>
                    <p
                      style={{
                        textAlign: "center",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Nenhum ponto de coleta cadastrado no momento.
                    </p>
                  </CardComponent.CardContent>
                </CardComponent.CardBody>
              </CardComponent.Card>
            ) : (
              <Accordion type="single" collapsible>
                {collectionPoints.map((zone) => (
                  <AccordionItem key={zone.zone} value={zone.zone}>
                    <AccordionTrigger>
                      <div className={styles.collectionCardHeader}>
                        <Lucide.MapPin size={20} />
                        <div>
                          <p className={styles.collectionCardHeaderTitle}>
                            {zone.zone}
                          </p>
                          <p className={styles.collectionCardHeaderSubtitle}>
                            {zone.locations.length} ponto
                            {zone.locations.length !== 1 ? "s" : ""} de coleta
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className={styles.pointsGrid}>
                        {zone.locations.map((location) => (
                          <CardComponent.Card
                            key={location.id}
                            tone="info"
                            size="sm"
                          >
                            <CardComponent.CardBody>
                              <CardComponent.CardContent>
                                <div className={styles.collectionCardItem}>
                                  <Lucide.MapPin
                                    size={18}
                                    className={styles.collectionCardIcon}
                                    style={{
                                      color: "var(--primary-color)",
                                    }}
                                  />
                                  <div>
                                    <p className={styles.collectionCardLabel}>
                                      Bairro
                                    </p>
                                    <h4
                                      className={
                                        styles.collectionCardNeighborhood
                                      }
                                    >
                                      {location.neighborhood}
                                    </h4>
                                  </div>
                                </div>

                                {location.name && (
                                  <div className={styles.collectionCardItem}>
                                    <Lucide.Building2
                                      size={18}
                                      className={styles.collectionCardIcon}
                                      style={{
                                        color: "var(--text-secondary)",
                                      }}
                                    />
                                    <div>
                                      <p className={styles.collectionCardLabel}>
                                        Local
                                      </p>
                                      <p className={styles.collectionCardName}>
                                        {location.name}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className={styles.collectionCardItem}>
                                  <Lucide.Navigation
                                    size={18}
                                    className={styles.collectionCardIcon}
                                    style={{
                                      color: "var(--text-secondary)",
                                    }}
                                  />
                                  <div>
                                    <p className={styles.collectionCardLabel}>
                                      Endereço
                                    </p>
                                    <p className={styles.collectionCardAddress}>
                                      {location.address}
                                    </p>
                                  </div>
                                </div>
                              </CardComponent.CardContent>
                            </CardComponent.CardBody>
                            {location.latitude && location.longitude && (
                              <CardComponent.CardFooter
                                className={styles.cardFooter}
                              >
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    setMapModal({ isOpen: true, location })
                                  }
                                >
                                  <Lucide.Map size={16} /> Mapa
                                </Button>
                              </CardComponent.CardFooter>
                            )}
                          </CardComponent.Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          <PageFeedback pageId="tampinhas" />
        </section>
      </div>

      <Dialog.Dialog
        open={
          mapModal.isOpen &&
          !!(mapModal.location?.latitude && mapModal.location?.longitude)
        }
        onOpenChange={(isOpen) =>
          setMapModal((prev) => ({
            ...prev,
            isOpen:
              isOpen &&
              !!(mapModal.location?.latitude && mapModal.location?.longitude),
          }))
        }
      >
        <Dialog.DialogContent
          style={{ width: "90vw", maxWidth: "600px", padding: "1.5rem" }}
        >
          <Dialog.DialogHeader>
            <Dialog.DialogTitle>
              <div
                style={{
                  display: "flex",
                  gap: "0.85rem",
                  alignItems: "center",
                }}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="danger">BETA</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <strong>Recurso em fase experimental</strong>
                      <p>
                        A localização exibida pode apresentar imprecisões.
                        Consulte-nos para mais informações.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {mapModal.location?.name || "Localização no mapa"}
              </div>
            </Dialog.DialogTitle>
            <Dialog.DialogDescription>
              {mapModal.location?.address}
            </Dialog.DialogDescription>
          </Dialog.DialogHeader>
          <div
            style={{
              marginTop: "1rem",
              height: "400px",
              width: "100%",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {mapModal.isOpen &&
              mapModal.location?.latitude &&
              mapModal.location?.longitude && (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  title="Google Maps"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${mapModal.location.latitude},${mapModal.location.longitude}&output=embed`}
                />
              )}
          </div>
          <Dialog.DialogFooter style={{ marginTop: "1rem" }}>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  setMapModal((prev) => ({ ...prev, isOpen: false }))
                }
              >
                Fechar
              </Button>
              <Button
                size="md"
                rightIcon={<Lucide.ArrowUpRight size={18} />}
                onClick={() => {
                  if (mapModal.location?.address) {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapModal.location.address)}`,
                      "_blank",
                    );
                  }
                }}
              >
                Ver no Google Maps
              </Button>
            </div>
          </Dialog.DialogFooter>
        </Dialog.DialogContent>
      </Dialog.Dialog>
    </>
  );
}
