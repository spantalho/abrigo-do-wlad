import { useState } from "react";
import { useNavigate } from "react-router";
import { MapPin } from "lucide-react";
import { Field, Input } from "@jaci/ui/Field";
import * as SelectComponent from "@jaci/ui/Select";
import { SuccessModal } from "../SuccessModal";
import { ErrorModal } from "../ErrorModal";
import {
  FormRow,
  FormSection,
  FormShell,
} from "../FormShell";
import { areFormValuesEqual } from "../FormShell/changes";
import type { RecyclePoint, RecyclePointInput } from "../../types/recycle";
import { recyclePointInputSchema } from "../../../shared/entities";

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
    googleMapsUrl: initialData?.googleMapsUrl ?? "",
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
  const isDirty = !areFormValuesEqual(createRecyclePointInput(initialData), formData);

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
    <>

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

      <FormShell
        title={title}
        backTo="/admin/recycle"
        isDirty={isDirty && !showSuccess}
        isSubmitting={isSubmitting}
        submitLabel={buttonLabel}
        onSubmit={handleSubmit}
      >
        <FormSection
          icon={<MapPin size={24} />}
          title="Informações do local"
          description="Endereço e link do local exibidos no site público."
        >
          <FormRow>
            <Field controlId="recycle-zone" label="Zona da cidade" required>
              <SelectComponent.Select
                value={formData.zone}
                onValueChange={zone => setFormData({...formData, zone})}
                required
              >
                <SelectComponent.SelectTrigger id="recycle-zone">
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
            </Field>

            <Field controlId="recycle-neighborhood" label="Bairro" required>
              <Input
                maxLength={120}
                placeholder="Ex: Vila Mariana"
                value={formData.neighborhood}
                onChange={e => setFormData({...formData, neighborhood: e.target.value})}
              />
            </Field>
          </FormRow>

          <Field controlId="recycle-name" label="Nome do local (opcional)">
            <Input
              maxLength={160}
              placeholder="Ex: PetShop Latmia"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </Field>

          <Field
            controlId="recycle-address"
            label="Endereço completo e horário"
            required
          >
            <Input
              maxLength={300}
              placeholder="Ex: Rua Antônio de Macedo Soares, 1350 (Seg a Sex das 8h às 20h)"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </Field>

          <Field
            controlId="recycle-google-maps-url"
            label="Link do Google Maps (opcional)"
            description="No Google Maps, abra o local, selecione Compartilhar e copie o link."
          >
            <Input
              type="url"
              inputMode="url"
              maxLength={2_048}
              placeholder="Ex: https://maps.app.goo.gl/..."
              value={formData.googleMapsUrl}
              onChange={e => setFormData({...formData, googleMapsUrl: e.target.value})}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Field>
        </FormSection>
      </FormShell>
    </>
  );
}
