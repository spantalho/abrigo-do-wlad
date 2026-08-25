import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Input, NativeSelect } from "@jaci/ui/Field";
import { SuccessModal } from "../SuccessModal";
import { ErrorModal } from "../ErrorModal";
import type { RecyclePoint } from "../../types/recycle";
import styles from "./RecycleForm.module.css";

interface RecycleFormProps {
  initialData?: Partial<RecyclePoint>;
  onSubmit: (data: Omit<RecyclePoint, "id">) => Promise<void>;
  title: string;
  buttonLabel: string;
}

export function RecycleForm({ initialData, onSubmit, title, buttonLabel }: RecycleFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ show: false, message: "" });

  const [formData, setFormData] = useState<Partial<RecyclePoint>>({
    zone: "ZONA SUL",
    neighborhood: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    ...initialData
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData as Omit<RecyclePoint, "id">);
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
        <Button type="button" variant="text" onClick={() => navigate("/admin/recycle")} className={styles.backButton}>
          <ArrowLeft size={20} /> Voltar
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>

        <div className={styles.section}>
          <h2>Informações do Local</h2>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Zona da Cidade</label>
              <NativeSelect
                value={formData.zone}
                onChange={e => setFormData({...formData, zone: e.target.value})}
                required
              >
                <option value="ZONA SUL">ZONA SUL</option>
                <option value="ZONA OESTE">ZONA OESTE</option>
                <option value="ZONA LESTE">ZONA LESTE</option>
                <option value="ZONA NORTE">ZONA NORTE</option>
                <option value="CENTRO">CENTRO</option>
              </NativeSelect>
            </div>

            <div className={styles.inputGroup}>
              <label>Bairro</label>
              <Input
                required
                maxLength={120}
                placeholder="Ex: Vila Mariana"
                value={formData.neighborhood}
                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Nome do Local (Opcional)</label>
            <Input
              placeholder="Ex: PetShop Latmia"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Endereço Completo e Horário</label>
            <Input
              required
              placeholder="Ex: Rua Antônio de Macedo Soares, 1350 (Seg a Sex das 8h às 20h)"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Latitude (Opcional)</label>
              <Input
                placeholder="Ex: -23.5505"
                value={formData.latitude || ""}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Longitude (Opcional)</label>
              <Input
                placeholder="Ex: -46.6333"
                value={formData.longitude || ""}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
              />
            </div>
          </div>

        </div>

        <Button type="submit" size="lg" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? <span>Salvando...</span> : <><Save size={20} /> {buttonLabel}</>}
        </Button>
      </form>
    </div>
  );
}
