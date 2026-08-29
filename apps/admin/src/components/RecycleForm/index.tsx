import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Card, CardBody, CardContent, CardHeader, CardIcon } from "@jaci/ui/Card";
import { Input } from "@jaci/ui/Field";
import * as SelectComponent from "@jaci/ui/Select";
import { SuccessModal } from "../SuccessModal";
import { ErrorModal } from "../ErrorModal";
import type { RecyclePoint, RecyclePointInput } from "../../types/recycle";
import { recyclePointInputSchema } from "../../../shared/entities";
import styles from "./RecycleForm.module.css";

interface RecycleFormProps {
  initialData?: RecyclePoint;
  onSubmit: (data: RecyclePointInput) => Promise<void>;
  title: string;
  buttonLabel: string;
}

function createRecyclePointInput(initialData?: RecyclePoint): RecyclePointInput {
  return {
    zone: initialData?.zone ?? "ZONA SUL",
    neighborhood: initialData?.neighborhood ?? "",
    name: initialData?.name ?? "",
    address: initialData?.address ?? "",
    latitude: initialData?.latitude ?? "",
    longitude: initialData?.longitude ?? "",
  };
}

export function RecycleForm({ initialData, onSubmit, title, buttonLabel }: RecycleFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ show: false, message: "" });

  const [formData, setFormData] = useState<RecyclePointInput>(() =>
    createRecyclePointInput(initialData)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validatedData = recyclePointInputSchema.safeParse(formData);
    if (!validatedData.success) {
      setErrorInfo({
        show: true,
        message: validatedData.error.issues[0]?.message
          ?? "Revise os dados do ponto de coleta antes de continuar.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(validatedData.data);
      setShowSuccess(true);
    } catch (error: unknown) {
      console.error(error);
      setErrorInfo({ show: true, message: "Não foi possível salvar os dados. Verifique sua conexão." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate("/admin/recycle");
  };

  return (
    <div className={styles.container}>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        title="Tudo certo!"
        message="Os dados do ponto de coleta foram salvos com sucesso."
      />

      <ErrorModal
        isOpen={errorInfo.show}
        onClose={() => setErrorInfo({ show: false, message: "" })}
        message={errorInfo.message}
      />

      <div className={styles.headerArea}>
        <Button type="button" variant="text" leftIcon={<ArrowLeft size={20} />} onClick={() => navigate("/admin/recycle")} className={styles.backButton}>
          Voltar
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>

        <Card className={styles.section} tone="muted" size="sm">
          <CardBody className={styles.sectionBody}>
            <CardHeader className={styles.sectionHeader}>
              <CardIcon className={styles.sectionIcon}><MapPin size={24} /></CardIcon>
              <div className={styles.sectionHeading}>
                <h2>Informações do local</h2>
                <p>Endereço e coordenadas exibidos no mapa público.</p>
              </div>
            </CardHeader>
            <CardContent className={styles.sectionContent}>

              <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="recycle-zone">Zona da Cidade</label>
              <SelectComponent.Select
                value={formData.zone}
                onValueChange={zone => setFormData({...formData, zone})}
                required
              >
                <SelectComponent.SelectTrigger id="recycle-zone" className={styles.selectTrigger}>
                  <SelectComponent.SelectValue placeholder="Selecione a zona" />
                </SelectComponent.SelectTrigger>
                <SelectComponent.SelectContent>
                  <SelectComponent.SelectItem value="ZONA SUL">ZONA SUL</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="ZONA OESTE">ZONA OESTE</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="ZONA LESTE">ZONA LESTE</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="ZONA NORTE">ZONA NORTE</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="CENTRO">CENTRO</SelectComponent.SelectItem>
                </SelectComponent.SelectContent>
              </SelectComponent.Select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="recycle-neighborhood">Bairro</label>
              <Input
                id="recycle-neighborhood"
                required
                maxLength={120}
                placeholder="Ex: Vila Mariana"
                value={formData.neighborhood}
                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
              />
            </div>
              </div>

              <div className={styles.inputGroup}>
            <label htmlFor="recycle-name">Nome do Local (Opcional)</label>
            <Input
              id="recycle-name"
              maxLength={160}
              placeholder="Ex: PetShop Latmia"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
              </div>

              <div className={styles.inputGroup}>
            <label htmlFor="recycle-address">Endereço Completo e Horário</label>
            <Input
              id="recycle-address"
              required
              maxLength={300}
              placeholder="Ex: Rua Antônio de Macedo Soares, 1350 (Seg a Sex das 8h às 20h)"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
              </div>

              <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="recycle-latitude">Latitude (Opcional)</label>
              <Input
                id="recycle-latitude"
                inputMode="decimal"
                maxLength={40}
                placeholder="Ex: -23.5505"
                value={formData.latitude || ""}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="recycle-longitude">Longitude (Opcional)</label>
              <Input
                id="recycle-longitude"
                inputMode="decimal"
                maxLength={40}
                placeholder="Ex: -46.6333"
                value={formData.longitude || ""}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
              />
            </div>
              </div>

            </CardContent>
          </CardBody>
        </Card>

        <Button
          type="submit"
          size="lg"
          className={styles.submitButton}
          leftIcon={isSubmitting ? undefined : <Save size={20} />}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : buttonLabel}
        </Button>
      </form>
    </div>
  );
}
