import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Check, Clock, Dog, Eye, Inbox, MessageCircle, Phone, Printer, XCircle } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Badge } from "@jaci/ui/Badge";
import { Card, CardBody, CardContent, CardFooter, CardHeader, CardTitle } from "@jaci/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@jaci/ui/Dialog";
import { ScrollArea } from "@jaci/ui/ScrollArea";
import { Stepper } from "@jaci/ui/Stepper";
import {
  ADOPTION_REVIEW_STEPS,
  AdoptionDetailsSection,
} from "../../components/AdoptionApplicationDetails";
import {
  getAdoptionApplication,
  getAdoptionApplications,
  updateAdoptionStatus,
} from "../../services/adoptions";
import { ConfirmModal } from "../../components/ConfirmModal";
import { SuccessModal } from "../../components/SuccessModal";
import type { AdoptionRequest, AdoptionRequestSummary } from "../../types/adoptions";
import styles from "./AdoptionsDashboard.module.css";

interface ExpirationPresentation {
  label: string;
  title: string;
  variant: "danger" | "outline";
}

const DAY_IN_MS = 86_400_000;

function getExpirationPresentation(expiresAt?: string): ExpirationPresentation | null {
  if (!expiresAt) return null;

  const expiration = new Date(expiresAt);
  const expirationTime = expiration.getTime();
  if (!Number.isFinite(expirationTime)) return null;

  const now = new Date();
  const formattedExpiration = expiration.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  if (expirationTime <= now.getTime()) {
    return {
      label: "Prazo expirado",
      title: `Expirou em ${formattedExpiration}`,
      variant: "danger",
    };
  }

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const expirationDay = Date.UTC(
    expiration.getFullYear(),
    expiration.getMonth(),
    expiration.getDate(),
  );
  const daysLeft = Math.max(0, Math.round((expirationDay - today) / DAY_IN_MS));
  const label = daysLeft === 0
    ? "Expira hoje"
    : daysLeft === 1
      ? "Expira amanhã"
      : `Expira em ${daysLeft} dias`;

  return {
    label,
    title: `Expira em ${formattedExpiration}`,
    variant: daysLeft <= 2 ? "danger" : "outline",
  };
}

export default function AdoptionsDashboard() {
  const [requests, setRequests] = useState<AdoptionRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] = useState<AdoptionRequestSummary | null>(null);
  const [selectedReq, setSelectedReq] = useState<AdoptionRequest | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [activeReviewStep, setActiveReviewStep] = useState(0);
  const detailsCache = useRef(new Map<string, AdoptionRequest>());
  const detailRequestToken = useRef(0);

  const [actionModal, setActionModal] = useState<{ isOpen: boolean, type: 'approved' | 'rejected', req: AdoptionRequestSummary | null }>({
    isOpen: false, type: 'approved', req: null
  });

  const [successInfo, setSuccessInfo] = useState<{ isOpen: boolean, title: string, message: string }>({
    isOpen: false, title: "", message: ""
  });

  useEffect(() => {
    async function fetchRequests() {
      const data = await getAdoptionApplications<AdoptionRequestSummary>();
      const sortedData = data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        const timeA = a.submittedAt ? Date.parse(a.submittedAt) : 0;
        const timeB = b.submittedAt ? Date.parse(b.submittedAt) : 0;
        return timeB - timeA;
      });
      setRequests(sortedData);
      setLoading(false);
    }
    fetchRequests();
  }, []);

  const handleConfirmAction = async () => {
    if (!actionModal.req || !actionModal.req.id) return;
    const { id, nome_adotante } = actionModal.req;
    const { type } = actionModal;

    try {
      await updateAdoptionStatus(id, type);

      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: type } : r));
      const cached = detailsCache.current.get(id);
      if (cached) detailsCache.current.set(id, { ...cached, status: type });
      setSelectedReq((current) => current?.id === id ? { ...current, status: type } : current);
      setActionModal({ isOpen: false, type: 'approved', req: null });

      setSuccessInfo({
        isOpen: true,
        title: type === 'approved' ? "Adoção Aprovada!" : "Solicitação Reprovada",
        message: type === 'approved'
          ? `O status de ${nome_adotante} foi alterado para Aprovado.`
          : `O status de ${nome_adotante} foi alterado para Reprovado.`
      });

    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o status. Verifique o console.");
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'approved') return <Badge variant="success" size="sm">Aprovado</Badge>;
    if (status === 'rejected') return <Badge variant="danger" size="sm">Reprovado</Badge>;
    return <Badge variant="outline" size="sm">Pendente</Badge>;
  };

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return "Data desconhecida";
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
      }).format(new Date(timestamp));
    } catch {
      return "Data inválida";
    }
  };

  const getWhatsAppLink = (phone?: string, name?: string) => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\D/g, '');

    let finalPhone = cleanPhone;
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      finalPhone = `55${cleanPhone}`;
    }

    const message = encodeURIComponent(`Olá ${name || 'Candidato'}, sou do Abrigo do Wlad e estou entrando em contato sobre a sua solicitação de adoção.`);
    return `https://wa.me/${finalPhone}?text=${message}`;
  };

  const openReview = async (requestSummary: AdoptionRequestSummary) => {
    const requestToken = ++detailRequestToken.current;
    setSelectedSummary(requestSummary);
    setSelectedReq(null);
    setDetailError(null);
    setActiveReviewStep(0);

    const cached = detailsCache.current.get(requestSummary.id);
    if (cached) {
      setSelectedReq(cached);
      return;
    }

    try {
      const detail = await getAdoptionApplication<AdoptionRequest>(requestSummary.id);
      detailsCache.current.set(requestSummary.id, detail);
      if (detailRequestToken.current === requestToken) setSelectedReq(detail);
    } catch (requestError: unknown) {
      if (detailRequestToken.current !== requestToken) return;
      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar a ficha.",
      );
    }
  };

  const closeReview = () => {
    detailRequestToken.current += 1;
    setSelectedSummary(null);
    setSelectedReq(null);
    setDetailError(null);
    setActiveReviewStep(0);
  };

  const openPrintView = (id: string) => {
    window.open(
      `/admin/adoptions/${encodeURIComponent(id)}/print`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>Solicitações de Adoção</h1>
          <p className={styles.subtitle}>Gerencie e avalie os formulários dos candidatos a adotantes.</p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Buscando solicitações...</p>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <Inbox size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
          <p>Nenhuma solicitação de adoção pendente.</p>
        </div>
      ) : (
        <div className={styles.listContainer}>
          {requests.map((req) => {
            const expiration = getExpirationPresentation(req.expiresAt);

            return (
              <Card key={req.id} size="sm" className={styles.card}>
                <CardBody className={styles.cardBody}>
                  <CardContent className={styles.cardInfo}>
                    <div className={styles.cardHeading}>
                      <div className={styles.applicantName}>
                        {req.nome_adotante || "Candidato Sem Nome"}
                        {getStatusBadge(req.status)}
                      </div>
                      {expiration && (
                        <Badge
                          className={styles.expirationBadge}
                          variant={expiration.variant}
                          size="sm"
                          leftIcon={<Clock size={14} />}
                          title={expiration.title}
                        >
                          {expiration.label}
                        </Badge>
                      )}
                    </div>
                    <div className={styles.detailsRow}>
                      <div className={styles.detailItem}>
                        <Dog size={16} />
                        <span>{req.animal_especifico || "Qualquer cãozinho"}</span>
                      </div>

                      {/* Link para o whatsapp no telefone */}
                      {req.telefone ? (
                        <a
                          href={getWhatsAppLink(req.telefone, req.nome_adotante)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.detailItem} ${styles.wppLink}`}
                          title="Chamar no WhatsApp"
                        >
                          <MessageCircle size={16} />
                          <span>{req.telefone}</span>
                        </a>
                      ) : (
                        <div className={styles.detailItem}>
                          <Phone size={16} />
                          <span>Sem telefone</span>
                        </div>
                      )}

                      <div className={styles.detailItem}>
                        <Calendar size={16} />
                        <span>{formatDate(req.submittedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </CardBody>

                <CardFooter className={styles.cardActions}>
                  <div className={styles.utilityActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className={styles.viewButton}
                      leftIcon={<Eye size={18} />}
                      onClick={() => void openReview(req)}
                    >
                      Ver ficha
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className={styles.printCardButton}
                      onClick={() => openPrintView(req.id)}
                      aria-label={`Imprimir ficha de ${req.nome_adotante || "candidato"}`}
                      title="Imprimir ficha"
                    >
                      <Printer size={17} />
                    </Button>
                  </div>

                  {req.status === 'pending' && (
                    <div className={styles.decisionActions}>
                      <Button
                        size="sm"
                        variant="success"
                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                        leftIcon={<Check size={16} />}
                        onClick={() => setActionModal({ isOpen: true, type: 'approved', req })}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className={`${styles.actionBtn} ${styles.rejectBtn}`}
                        leftIcon={<XCircle size={16} />}
                        onClick={() => setActionModal({ isOpen: true, type: 'rejected', req })}
                      >
                        Reprovar
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(selectedSummary)} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <DialogHeader>
              <DialogTitle>Ficha de Adoção</DialogTitle>
            </DialogHeader>
            <p className={styles.modalSubtitle}>
              {selectedSummary?.nome_adotante || "Candidato sem nome"}
              {selectedReq && ` · Seção ${activeReviewStep + 1} de ${ADOPTION_REVIEW_STEPS.length}`}
            </p>
          </div>

          <div className={styles.reviewContent}>
            {detailError && selectedSummary ? (
              <div className={styles.detailState}>
                <Card variant="callout" tone="danger" size="sm">
                  <CardBody>
                    <CardHeader><CardTitle>Não foi possível carregar a ficha</CardTitle></CardHeader>
                    <CardContent><p>{detailError}</p></CardContent>
                  </CardBody>
                </Card>
                <Button variant="secondary" onClick={() => void openReview(selectedSummary)}>
                  Tentar novamente
                </Button>
              </div>
            ) : !selectedReq ? (
              <div className={styles.detailState}>Carregando respostas...</div>
            ) : (
              <Stepper
                className={styles.reviewStepper}
                panelClassName={styles.reviewPanel}
                size="sm"
                steps={ADOPTION_REVIEW_STEPS.map(({ label, icon: Icon }) => ({
                  label,
                  icon: <Icon size={17} />,
                }))}
                activeStep={activeReviewStep}
                onStepChange={setActiveReviewStep}
                navigationLabel="Seções da ficha de adoção"
              >
                <ScrollArea className={styles.stepScrollArea} showScrollShadows>
                  <div className={styles.stepBody}>
                    <AdoptionDetailsSection
                      application={selectedReq}
                      step={ADOPTION_REVIEW_STEPS[activeReviewStep] ?? ADOPTION_REVIEW_STEPS[0]}
                    />
                  </div>
                </ScrollArea>

                <div className={styles.stepNavigation}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={<ArrowLeft size={17} />}
                    disabled={activeReviewStep === 0}
                    onClick={() => setActiveReviewStep((step) => Math.max(0, step - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    rightIcon={<ArrowRight size={17} />}
                    disabled={activeReviewStep === ADOPTION_REVIEW_STEPS.length - 1}
                    onClick={() => setActiveReviewStep((step) => Math.min(ADOPTION_REVIEW_STEPS.length - 1, step + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </Stepper>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, type: 'approved', req: null })}
        onConfirm={handleConfirmAction}
        title={actionModal.type === 'approved' ? "Aprovar Solicitação" : "Reprovar Solicitação"}
        confirmText={actionModal.type === 'approved' ? "Sim, Aprovar" : "Sim, Reprovar"}
        isDestructive={actionModal.type === 'rejected'}
        message={
          <>
            Tem certeza que deseja <strong>{actionModal.type === 'approved' ? 'APROVAR' : 'REPROVAR'}</strong> a
            solicitação de <strong>{actionModal.req?.nome_adotante}</strong>?
          </>
        }
      />

      <SuccessModal
        isOpen={successInfo.isOpen}
        onClose={() => setSuccessInfo({ isOpen: false, title: "", message: "" })}
        title={successInfo.title}
        message={successInfo.message}
      />
    </div>
  );
}
