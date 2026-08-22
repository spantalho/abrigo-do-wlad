import { Badge } from "@abrigo/ui/Badge";
import { Button } from "@abrigo/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@abrigo/ui/Card";
import { KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ConfirmModal } from "../../components/ConfirmModal";
import { useAuth } from "../../contexts/AuthContext";
import { getSystemKeys, rotateSystemKey } from "../../services/systemKeys";
import type { SystemKey } from "../../types/systemKeys";
import styles from "./SystemKeys.module.css";

function formatDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Data desconhecida";
  return date.toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function SystemKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<SystemKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKeys(await getSystemKeys());
    } catch (cause) {
      console.error("Erro ao carregar metadados das chaves:", cause);
      setError("Não foi possível carregar as chaves do sistema.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    getSystemKeys()
      .then((loadedKeys) => {
        if (active) setKeys(loadedKeys);
      })
      .catch((cause: unknown) => {
        console.error("Erro ao carregar metadados das chaves:", cause);
        if (active) setError("Não foi possível carregar as chaves do sistema.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleRotate() {
    setConfirming(false);
    setRotating(true);
    setError(null);
    setNotice(null);
    try {
      const created = await rotateSystemKey();
      setNotice(`A chave ${created.version} foi criada e ativada.`);
      await loadKeys();
    } catch (cause) {
      console.error("Erro ao rotacionar chave do sistema:", cause);
      setError("A rotação não foi concluída. Nenhuma confirmação de alteração foi recebida.");
    } finally {
      setRotating(false);
    }
  }

  const activeKey = keys.find((key) => key.active);

  return (
    <main className={styles.container}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.eyebrow}><ShieldCheck size={18} /> Área de desenvolvedor</div>
          <h1 className={styles.title}>Chaves do sistema</h1>
          <p className={styles.subtitle}>
            Rotacione a chave usada para novos dados sensíveis sem invalidar os registros anteriores.
          </p>
        </div>
        <Button
          type="button"
          leftIcon={<RefreshCw size={18} />}
          disabled={loading || rotating}
          onClick={() => setConfirming(true)}
        >
          {rotating ? "Rotacionando..." : "Rotacionar chave"}
        </Button>
      </div>

      <div className={styles.feedback} aria-live="polite">
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}
      </div>

      <Card className={styles.summary} tone="info" layout="inline">
        <div className={styles.summaryIcon}><KeyRound size={28} /></div>
        <CardContent className={styles.summaryContent}>
          <span className={styles.summaryLabel}>Chave ativa</span>
          <strong>{activeKey?.version ?? (loading ? "Carregando..." : "Nenhuma")}</strong>
          <span className={styles.summaryDetail}>
            Acesso concedido a {user?.email ?? "desenvolvedor autenticado"}
          </span>
        </CardContent>
      </Card>

      <section className={styles.listSection} aria-busy={loading}>
        <h2>Histórico de chaves</h2>
        {loading ? (
          <p className={styles.empty}>Carregando metadados...</p>
        ) : keys.length === 0 ? (
          <p className={styles.empty}>Nenhuma chave foi encontrada.</p>
        ) : (
          <div className={styles.list}>
            {keys.map((key) => (
              <Card
                key={key.id}
                className={`${styles.keyCard} ${key.active ? styles.activeKey : ""}`}
              >
                <CardHeader className={styles.keyHeader}>
                  <CardTitle>{key.version}</CardTitle>
                  <Badge variant={key.active ? "success" : "outline"} size="sm">
                    {key.active ? "Ativa" : "Arquivada"}
                  </Badge>
                </CardHeader>
                <CardContent className={styles.keyDetails}>
                  <dl>
                    <div><dt>Criada em</dt><dd>{formatDate(key.createdAt)}</dd></div>
                    <div><dt>Autor</dt><dd>{key.author ?? "Não informado"}</dd></div>
                    <div><dt>Itens criptografados</dt><dd>{key.counter}</dd></div>
                  </dl>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => void handleRotate()}
        title="Rotacionar a chave ativa?"
        message="Novos dados passarão a usar uma nova chave. As chaves anteriores serão preservadas para leitura dos registros já armazenados."
        confirmText="Rotacionar"
      />
    </main>
  );
}
