import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dog, Recycle, ClipboardList, AlertTriangle, Clock, ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Card, CardBody, CardContent, CardFooter } from "@jaci/ui/Card";
import { apiRequest } from "../../services/api";

import styles from "./Dashboard.module.css";

interface ExpiringAlert {
  id: string;
  nome: string;
  daysLeft: number;
}

interface DashboardResponse {
  metrics: {
    dogs: number;
    recycles: number;
    adoptions: number;
    adoptionsViaSite: number;
  };
  expiringAdoptions: ExpiringAlert[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    dogs: 0,
    recycles: 0,
    adoptions: 0,
    adoptionsViaSite: 0,
  });

  const [expiringAdoptions, setExpiringAdoptions] = useState<ExpiringAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data = await apiRequest<DashboardResponse>("/api/admin/dashboard");
        setMetrics(data.metrics);
        setExpiringAdoptions(data.expiringAdoptions);

      } catch (error) {
        console.error("Erro ao buscar métricas principais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Visão Geral</h1>
      <p className={styles.subtitle}>Acompanhe os números do Abrigo do Wlad em tempo real.</p>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando dados...</p>
      ) : (
        <div className={styles.metricsGrid}>
          <Card variant="default" size="sm" className={styles.metricCard}>
            <CardBody className={styles.metricBody}>
              <div className={styles.metricSummary}>
                <div className={styles.iconWrapper}><Dog size={28} /></div>
                <CardContent className={styles.metricInfo}>
                  <span className={styles.metricValue}>{metrics.dogs}</span>
                  <span className={styles.metricLabel}>Cães cadastrados</span>
                </CardContent>
              </div>
            </CardBody>
            <CardFooter className={styles.metricFooter}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate("/admin/dog")}
              >
                Ver cães
              </Button>
            </CardFooter>
          </Card>

          <Card variant="default" size="sm" className={styles.metricCard}>
            <CardBody className={styles.metricBody}>
              <div className={styles.metricSummary}>
                <div className={styles.iconWrapper}><Recycle size={28} /></div>
                <CardContent className={styles.metricInfo}>
                  <span className={styles.metricValue}>{metrics.recycles}</span>
                  <span className={styles.metricLabel}>Pontos de coleta</span>
                </CardContent>
              </div>
            </CardBody>
            <CardFooter className={styles.metricFooter}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate("/admin/recycle")}
              >
                Ver pontos
              </Button>
            </CardFooter>
          </Card>

          <Card variant="default" size="sm" className={styles.metricCard}>
            <CardBody className={styles.metricBody}>
              <div className={styles.metricSummary}>
                <div className={styles.iconWrapper}><ClipboardList size={28} /></div>
                <CardContent className={styles.metricInfo}>
                  <span className={styles.metricValue}>{metrics.adoptions}</span>
                  <span className={styles.metricLabel}>Solicitações de adoção</span>
                </CardContent>
              </div>
            </CardBody>
            <CardFooter className={styles.metricFooter}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate("/admin/adoptions")}
              >
                Ver solicitações
              </Button>
            </CardFooter>
          </Card>

          <Card variant="default" size="sm" className={styles.metricCard}>
            <CardBody className={styles.metricBody}>
              <div className={styles.metricSummary}>
                <div className={`${styles.iconWrapper} ${styles.adoptedIcon}`}>
                  <HeartHandshake size={28} />
                </div>
                <CardContent className={styles.metricInfo}>
                  <span className={styles.metricValue}>{metrics.adoptionsViaSite}</span>
                  <span className={styles.metricLabel}>Adotados pelo site</span>
                </CardContent>
              </div>
            </CardBody>
            <CardFooter className={styles.metricFooter}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => navigate("/admin/adoptions")}
              >
                Acompanhar adoções
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Seção de Alertas Inteligentes */}
      <div className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <h3>Avisos e Pendências</h3>
        </div>

        {expiringAdoptions.length > 0 ? (
          <div className={styles.alertList}>
            {expiringAdoptions.map(alert => (
              <div key={alert.id} className={`${styles.alertItem} ${alert.daysLeft <= 2 ? styles.alertUrgent : ''}`}>
                <div className={styles.alertIcon}>
                  {alert.daysLeft <= 2 ? <AlertTriangle size={20} /> : <Clock size={20} />}
                </div>
                <div className={styles.alertContent}>
                  <p className={styles.alertText}>
                    A ficha de adoção de <strong>{alert.nome}</strong> expira e será apagada em <strong>{alert.daysLeft} {alert.daysLeft === 1 ? 'dia' : 'dias'}</strong>.
                  </p>
                </div>
                <Link to="/admin/adoptions" className={styles.alertLink}>
                  Ver ficha <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyRecent}>Nenhum aviso no momento. Tudo em ordem!</p>
        )}
      </div>
    </div>
  );
}
