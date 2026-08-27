import { useEffect, useState } from "react";
import { Dog, Calendar, Phone, Eye, Inbox, Printer, Check, Clock, XCircle, MessageCircle } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Badge } from "@jaci/ui/Badge";
import { Card, CardBody, CardContent, CardFooter } from "@jaci/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@jaci/ui/Dialog";
import { ScrollArea } from "@jaci/ui/ScrollArea";
import { getAdoptionApplications, updateAdoptionStatus } from "../../services/adoptions";
import { ConfirmModal } from "../../components/ConfirmModal";
import { SuccessModal } from "../../components/SuccessModal";
import styles from "./AdoptionsDashboard.module.css";

interface AdoptionRequest {
  id: string;
  nome_adotante?: string;
  telefone?: string;
  animal_especifico?: string;
  status?: string;
  submittedAt?: string;
  expiresAt?: string;
  idade?: string; estado_civil?: string; profissao?: string; empresa?: string; endereco?: string; email?: string; redes_sociais?: string;
  qtd_adultos?: string; criancas?: string; renda_mensal?: string; acordo?: string; alergia?: string;
  motivo?: string; porte?: string; sexo?: string; idade_animal?: string; personalidade?: string; atividade?: string;
  responsavel?: string; horas_sozinho?: string; passeios?: string; tipo_moradia?: string; proprietario_permite?: string; detalhes_moradia?: string; moradores?: string; areas_frequentar?: string; periodos?: string; dormir?: string; acesso?: string;
  outros_animais?: string; castrados?: string; ja_teve?: string; destino_antigos?: string; veterinario?: string; racao?: string;
  coleira?: string; ciencia_adaptacao?: string; tempo_adaptacao?: string; adestrador?: string; motivo_nao_adestrar?: string; carro?: string; financeiro_vet?: string; vacinas?: string; gasto_mensal?: string;
  divulgacao?: string; noticias?: string; visitas?: string; fotos_adocao?: string; contribuicao?: string; compromisso_vida?: string;
  gravidez?: string; viagem?: string; mudanca_menor?: string; mudanca_longe?: string; separacao?: string; falecimento?: string; perder?: string; doenca?: string; morder?: string; destruicao?: string; xixi_errado?: string;
  enxoval?: string; devolucao?: string; termo_nao_repassar?: string; obs?: string;
}

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

function DataItem({ label, value }: { label: string, value?: string }) {
  return (
    <div className={styles.dataGroup}>
      <span className={styles.dataLabel}>{label}</span>
      <span className={styles.dataValue}>{value || "Não informado"}</span>
    </div>
  );
}

export default function AdoptionsDashboard() {
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<AdoptionRequest | null>(null);

  const [actionModal, setActionModal] = useState<{ isOpen: boolean, type: 'approved' | 'rejected', req: AdoptionRequest | null }>({
    isOpen: false, type: 'approved', req: null
  });

  const [successInfo, setSuccessInfo] = useState<{ isOpen: boolean, title: string, message: string }>({
    isOpen: false, title: "", message: ""
  });

  useEffect(() => {
    async function fetchRequests() {
      const data = await getAdoptionApplications<AdoptionRequest>();
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
                  <Button
                    variant="secondary"
                    size="sm"
                    className={styles.viewButton}
                    leftIcon={<Eye size={18} />}
                    onClick={() => setSelectedReq(req)}
                  >
                    Ver ficha
                  </Button>

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

      <Dialog open={Boolean(selectedReq)} onOpenChange={(open) => !open && setSelectedReq(null)}>
        {selectedReq && (
          <DialogContent className={`${styles.modalContainer} ${styles.printArea}`}>

            <div className={`${styles.modalHeader} ${styles.noPrint}`}>
              <DialogHeader>
                <DialogTitle>Ficha de Adoção</DialogTitle>
              </DialogHeader>
              <div className={styles.modalActions}>
                <Button className={styles.printBtn} onClick={() => window.print()}>
                  <Printer size={18} /> Imprimir Ficha
                </Button>
              </div>
            </div>

            <ScrollArea className={styles.modalScrollArea} showScrollShadows>
              <div className={styles.modalBody}>
                <div className={styles.printHeader}>
                  <h1 style={{ marginBottom: '5px' }}>Abrigo do Wlad - Solicitação de Adoção</h1>
                  <p><strong>Data de Envio:</strong> {formatDate(selectedReq.submittedAt)}</p>
                  <hr style={{ margin: '20px 0' }} />
                </div>

                <h3 className={styles.sectionTitle}>1. Dados Pessoais</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Nome Completo" value={selectedReq.nome_adotante} />
                  <DataItem label="Idade" value={selectedReq.idade} />
                  <DataItem label="Estado Civil" value={selectedReq.estado_civil} />
                  <DataItem label="Profissão" value={selectedReq.profissao} />
                  <DataItem label="Empresa" value={selectedReq.empresa} />
                  <DataItem label="Telefone" value={selectedReq.telefone} />
                  <DataItem label="E-mail" value={selectedReq.email} />
                  <DataItem label="Redes Sociais" value={selectedReq.redes_sociais} />
                  <DataItem label="Endereço Completo" value={selectedReq.endereco} />
                </div>

                <h3 className={styles.sectionTitle}>2. Família e Moradia</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Qtd. Adultos" value={selectedReq.qtd_adultos} />
                  <DataItem label="Crianças/Visitas" value={selectedReq.criancas} />
                  <DataItem label="Renda Mensal" value={selectedReq.renda_mensal} />
                  <DataItem label="Todos de Acordo?" value={selectedReq.acordo} />
                  <DataItem label="Alergias na família?" value={selectedReq.alergia} />
                </div>

                <h3 className={styles.sectionTitle}>3. Informações da Residência</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Tipo de Moradia" value={selectedReq.tipo_moradia} />
                  <DataItem label="Detalhes Moradia" value={selectedReq.detalhes_moradia} />
                  <DataItem label="Proprietário Permite?" value={selectedReq.proprietario_permite} />
                  <DataItem label="Quem mora junto?" value={selectedReq.moradores} />
                  <DataItem label="Onde irá dormir?" value={selectedReq.dormir} />
                  <DataItem label="Acesso aos Cômodos" value={selectedReq.acesso} />
                  <DataItem label="Áreas p/ frequentar" value={selectedReq.areas_frequentar} />
                  <DataItem label="Períodos de acesso" value={selectedReq.periodos} />
                </div>

                <h3 className={styles.sectionTitle}>4. Perfil da Adoção</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Motivo da Adoção" value={selectedReq.motivo} />
                  <DataItem label="Animal Específico" value={selectedReq.animal_especifico} />
                  <DataItem label="Porte Desejado" value={selectedReq.porte} />
                  <DataItem label="Sexo Desejado" value={selectedReq.sexo} />
                  <DataItem label="Idade Desejada" value={selectedReq.idade_animal} />
                  <DataItem label="Personalidade" value={selectedReq.personalidade} />
                  <DataItem label="Atividade Principal" value={selectedReq.atividade} />
                </div>

                <h3 className={styles.sectionTitle}>5. Rotina e Responsabilidades</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Responsável Principal" value={selectedReq.responsavel} />
                  <DataItem label="Tempo Sozinho" value={selectedReq.horas_sozinho} />
                  <DataItem label="Rotina de Passeios" value={selectedReq.passeios} />
                  <DataItem label="Possui Carro?" value={selectedReq.carro} />
                  <DataItem label="Previsão de Gasto Mensal" value={selectedReq.gasto_mensal} />
                  <DataItem label="Contrataria Adestrador?" value={selectedReq.adestrador} />
                  <DataItem label="Concorda com Coleira/Placa?" value={selectedReq.coleira} />
                  <DataItem label="Vacinação/Vermífugo?" value={selectedReq.vacinas} />
                </div>

                <h3 className={styles.sectionTitle}>6. Histórico Animal e Veterinário</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Tem outros animais?" value={selectedReq.outros_animais} />
                  <DataItem label="Estão castrados?" value={selectedReq.castrados} />
                  <DataItem label="Já teve animais antes?" value={selectedReq.ja_teve} />
                  <DataItem label="Destino dos antigos" value={selectedReq.destino_antigos} />
                  <DataItem label="Veterinário/Clínica" value={selectedReq.veterinario} />
                  <DataItem label="Emergência Financeira Vet." value={selectedReq.financeiro_vet} />
                  <DataItem label="Ração pretendida" value={selectedReq.racao} />
                </div>

                <h3 className={styles.sectionTitle}>7. Situações e Hipóteses</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Ciente da Adaptação?" value={selectedReq.ciencia_adaptacao} />
                  <DataItem label="Tempo de adaptação esperado" value={selectedReq.tempo_adaptacao} />
                  <DataItem label="E se alguém engravidar?" value={selectedReq.gravidez} />
                  <DataItem label="E em caso de viagem?" value={selectedReq.viagem} />
                  <DataItem label="E se mudar para casa menor?" value={selectedReq.mudanca_menor} />
                  <DataItem label="E se mudar de cidade/país?" value={selectedReq.mudanca_longe} />
                  <DataItem label="E em caso de separação?" value={selectedReq.separacao} />
                  <DataItem label="Falecimento do responsável?" value={selectedReq.falecimento} />
                  <DataItem label="E se o animal fugir/perder?" value={selectedReq.perder} />
                  <DataItem label="E se o animal adoecer?" value={selectedReq.doenca} />
                  <DataItem label="E se o animal morder alguém?" value={selectedReq.morder} />
                  <DataItem label="E se destruir objetos?" value={selectedReq.destruicao} />
                  <DataItem label="E se fizer xixi no lugar errado?" value={selectedReq.xixi_errado} />
                </div>

                <h3 className={styles.sectionTitle}>8. Termos Finais</h3>
                <div className={styles.dataGrid}>
                  <DataItem label="Onde viu a divulgação?" value={selectedReq.divulgacao} />
                  <DataItem label="Aceita mandar notícias?" value={selectedReq.noticias} />
                  <DataItem label="Aceita visitas do abrigo?" value={selectedReq.visitas} />
                  <DataItem label="Permite foto da adoção?" value={selectedReq.fotos_adocao} />
                  <DataItem label="Contribuição de R$300?" value={selectedReq.contribuicao} />
                  <DataItem label="Ciente que vivem 15+ anos?" value={selectedReq.compromisso_vida} />
                  <DataItem label="O que vai comprar de enxoval?" value={selectedReq.enxoval} />
                  <DataItem label="Concorda em NÃO repassar?" value={selectedReq.termo_nao_repassar} />
                  <DataItem label="Condição extrema para devolução" value={selectedReq.devolucao} />
                  <DataItem label="Observações Livres" value={selectedReq.obs} />
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        )}
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
