import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@jaci/ui/Button";
import { Card, CardBody, CardContent, CardHeader, CardTitle } from "@jaci/ui/Card";
import {
  ADOPTION_REVIEW_STEPS,
  AdoptionDetailsSection,
} from "../../components/AdoptionApplicationDetails";
import { getAdoptionApplication } from "../../services/adoptions";
import type { AdoptionRequest } from "../../types/adoptions";
import styles from "./AdoptionPrint.module.css";

function formatDate(timestamp?: string): string {
  if (!timestamp) return "Data desconhecida";
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "Data inválida";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function AdoptionPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<AdoptionRequest | null>(null);
  const [error, setError] = useState<string | null>(
    id ? null : "Solicitação inválida.",
  );

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };

    getAdoptionApplication<AdoptionRequest>(id)
      .then((data) => {
        if (active) setApplication(data);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar a ficha.",
        );
      });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!application) return;
    let cancelled = false;
    const previousTitle = document.title;
    document.title = `Ficha de adoção - ${application.nome_adotante || application.id}`;

    void document.fonts.ready.then(() => {
      if (!cancelled) requestAnimationFrame(() => window.print());
    });

    return () => {
      cancelled = true;
      document.title = previousTitle;
    };
  }, [application]);

  const goBack = () => {
    window.close();
    if (!window.closed) navigate("/admin/adoptions");
  };

  if (error) {
    return (
      <main className={styles.statePage}>
        <Card variant="callout" tone="danger" size="sm">
          <CardBody>
            <CardHeader><CardTitle>Não foi possível imprimir</CardTitle></CardHeader>
            <CardContent><p>{error}</p></CardContent>
          </CardBody>
        </Card>
        <Button variant="secondary" leftIcon={<ArrowLeft size={18} />} onClick={goBack}>
          Voltar
        </Button>
      </main>
    );
  }

  if (!application) {
    return <main className={styles.statePage}>Preparando ficha para impressão...</main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.actions}>
        <Button variant="secondary" leftIcon={<ArrowLeft size={18} />} onClick={goBack}>
          Voltar
        </Button>
        <Button leftIcon={<Printer size={18} />} onClick={() => window.print()}>
          Imprimir novamente
        </Button>
      </div>

      <article className={styles.sheet}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Abrigo do Wlad</span>
            <h1>Solicitação de Adoção</h1>
          </div>
          <dl className={styles.metadata}>
            <div>
              <dt>Candidato</dt>
              <dd>{application.nome_adotante || "Não informado"}</dd>
            </div>
            <div>
              <dt>Data de envio</dt>
              <dd>{formatDate(application.submittedAt)}</dd>
            </div>
            <div>
              <dt>Identificador</dt>
              <dd>{application.id}</dd>
            </div>
          </dl>
        </header>

        <div className={styles.sections}>
          {ADOPTION_REVIEW_STEPS.map((step) => (
            <AdoptionDetailsSection
              key={step.label}
              application={application}
              step={step}
              showTitle
            />
          ))}
        </div>
      </article>
    </main>
  );
}
