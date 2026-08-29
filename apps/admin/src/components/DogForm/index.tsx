import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, Images, PawPrint, Save, Tags, UploadCloud, X } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Card, CardBody, CardContent, CardHeader, CardIcon } from "@jaci/ui/Card";
import { Input, Textarea } from "@jaci/ui/Field";
import * as SelectComponent from "@jaci/ui/Select";
import {
  CORES_MAP,
  DOG_HEALTH_STATUSES,
  DOG_TAGS,
  MAX_DOG_PHOTOS,
  MAX_DOG_TAGS,
  MAX_DOG_TEMPERAMENT_LENGTH,
  type DogDetailsInput,
  type DogAgeUnit,
  type DogInput,
  type DogProps,
} from "../../types/dogs";
import {
  dogAgeCategorySchema,
  dogDetailsSchema,
  dogHealthStatusSchema,
  dogInputSchema,
  dogSexSchema,
  formatDogAge,
  parseDogAge,
} from "../../../shared/entities";
import {
  deleteUploadedCloudinaryImage,
  DOG_IMAGE_ACCEPT,
  MAX_SOURCE_DOG_IMAGE_BYTES,
  uploadImageToCloudinary,
} from "../../services/cloudinary";
import { SuccessModal } from "../SuccessModal";
import { ErrorModal } from "../ErrorModal"; // <-- Importação do ErrorModal
import { ConfirmModal } from "../ConfirmModal";
import styles from "./DogForm.module.css";

type DogPhoto =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "local"; file: File; previewUrl: string };

interface DogFormProps {
  initialData?: DogProps;
  onSubmit: (data: DogInput) => Promise<void>;
  title: string;
  buttonLabel: string;
}

function createDogDetailsInput(initialData?: DogProps): DogDetailsInput {
  return {
    nome: initialData?.nome ?? "",
    idade: initialData?.idade ?? "",
    cateIdade: initialData?.cateIdade ?? "adulto",
    sexo: initialData?.sexo ?? "Macho",
    temperamento: initialData?.temperamento ?? "",
    tags: initialData?.tags ?? [],
    status: initialData?.status ?? DOG_HEALTH_STATUSES[0],
    cor: initialData?.cor ?? "caramelo",
    instaLink: initialData?.instaLink ?? "",
    descricaoCompleta: initialData?.descricaoCompleta ?? "",
  };
}

function sanitizeAgeRange(value: string): string {
  const sanitized = value.replace(/[^\d-]/g, "");
  const separatorIndex = sanitized.indexOf("-");
  if (separatorIndex === -1) return sanitized.slice(0, 3);

  const minimum = sanitized.slice(0, separatorIndex).slice(0, 3);
  const maximum = sanitized.slice(separatorIndex + 1).replaceAll("-", "").slice(0, 3);
  return `${minimum}-${maximum}`;
}

export function DogForm({ initialData, onSubmit, title, buttonLabel }: DogFormProps) {
  const navigate = useNavigate();
  const initialAge = parseDogAge(initialData?.idade ?? "");
  const [ageRange, setAgeRange] = useState(initialAge?.range ?? "");
  const [ageUnit, setAgeUnit] = useState<DogAgeUnit>(initialAge?.unit ?? "anos");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // ESTADOS PARA OS MODAIS
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ show: false, message: "" });
  const [photoPendingRemoval, setPhotoPendingRemoval] = useState<DogPhoto | null>(null);

  const localPreviewUrls = useRef(new Set<string>());
  const [photos, setPhotos] = useState<DogPhoto[]>(() =>
    (initialData?.fotos || []).map((url, index) => ({
      id: `existing-${index}-${url}`,
      kind: "existing",
      url,
    })),
  );

  const [formData, setFormData] = useState<DogDetailsInput>(() =>
    createDogDetailsInput(initialData)
  );

  const photoLimitReached = photos.length >= MAX_DOG_PHOTOS;
  const remainingPhotoSlots = Math.max(0, MAX_DOG_PHOTOS - photos.length);
  const selectedTags = formData.tags;
  const tagLimitReached = selectedTags.length >= MAX_DOG_TAGS;
  const legacyAge = initialData?.idade
    && !initialAge
    && !parseDogAge(formData.idade)
    ? initialData.idade
    : null;

  const updateAge = (range: string, unit: DogAgeUnit) => {
    setFormData(prev => ({ ...prev, idade: formatDogAge(range, unit) }));
  };

  const handleAgeRangeChange = (value: string) => {
    const range = sanitizeAgeRange(value);
    setAgeRange(range);
    updateAge(range, ageUnit);
  };

  const handleAgeUnitChange = (value: string) => {
    if (value !== "anos" && value !== "meses") return;
    setAgeUnit(value);
    updateAge(ageRange, value);
  };

  const normalizeAgeRange = () => {
    const [minimum, maximum] = ageRange.split("-");
    if (minimum && maximum === minimum) {
      setAgeRange(minimum);
      updateAge(minimum, ageUnit);
    }
  };

  useEffect(() => () => {
    localPreviewUrls.current.forEach(url => URL.revokeObjectURL(url));
    localPreviewUrls.current.clear();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.slice(0, remainingPhotoSlots).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      localPreviewUrls.current.add(previewUrl);
      return { id: previewUrl, kind: "local" as const, file, previewUrl };
    });

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_DOG_PHOTOS));
    }
  }, [remainingPhotoSlots]);

  const onDropRejected = useCallback(() => {
    setErrorInfo({
      show: true,
      message: "Use imagens JPEG, PNG ou WebP de até 20 MB.",
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: DOG_IMAGE_ACCEPT,
    maxSize: MAX_SOURCE_DOG_IMAGE_BYTES,
    multiple: true,
    disabled: photoLimitReached,
  });

  const removePhoto = (photoToRemove: DogPhoto) => {
    if (photoToRemove.kind === "existing") {
      setPhotoPendingRemoval(photoToRemove);
      return;
    }

    if (photoToRemove.kind === "local") {
      URL.revokeObjectURL(photoToRemove.previewUrl);
      localPreviewUrls.current.delete(photoToRemove.previewUrl);
    }
    setPhotos(prev => prev.filter(photo => photo.id !== photoToRemove.id));
  };

  const confirmPhotoRemoval = () => {
    if (!photoPendingRemoval) return;

    setPhotos(prev => prev.filter(photo => photo.id !== photoPendingRemoval.id));
    setPhotoPendingRemoval(null);
  };

  const setCoverPhoto = (photoId: string) => {
    setPhotos(prev => {
      const selectedIndex = prev.findIndex(photo => photo.id === photoId);
      if (selectedIndex <= 0) return prev;
      const selectedPhoto = prev[selectedIndex];
      return [selectedPhoto, ...prev.filter((_, index) => index !== selectedIndex)];
    });
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => {
      const tags = prev.tags;
      if (tags.includes(tag)) {
        return { ...prev, tags: tags.filter(t => t !== tag) };
      }

      if (tags.length >= MAX_DOG_TAGS) {
        return prev;
      }

      return { ...prev, tags: [...tags, tag] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validatedDetails = dogDetailsSchema.safeParse(formData);
    if (!validatedDetails.success) {
      setErrorInfo({
        show: true,
        message: validatedDetails.error.issues[0]?.message
          ?? "Revise os dados do cachorro antes de continuar.",
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress("Processando...");
    const uploadedPhotoUrls: string[] = [];

    try {
      const localPhotoCount = photos.filter(photo => photo.kind === "local").length;
      const finalPhotos: string[] = [];
      let uploadedPhotoCount = 0;

      if (localPhotoCount > 0) {
        setUploadProgress("Enviando novas fotos...");
      }

      for (const photo of photos) {
        if (photo.kind === "existing") {
          finalPhotos.push(photo.url);
        } else {
          uploadedPhotoCount += 1;
          setUploadProgress(`Enviando foto ${uploadedPhotoCount} de ${localPhotoCount}...`);
          const uploadedUrl = await uploadImageToCloudinary(photo.file);
          uploadedPhotoUrls.push(uploadedUrl);
          finalPhotos.push(uploadedUrl);
        }
      }

      const finalData = dogInputSchema.parse({
        ...validatedDetails.data,
        fotos: finalPhotos,
      });

      setUploadProgress("Salvando dados...");
      await onSubmit(finalData);

      setShowSuccess(true);

    } catch (error: unknown) {
      await Promise.allSettled(
        uploadedPhotoUrls.map((url) => deleteUploadedCloudinaryImage(url)),
      );
      console.error(error);
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Erro ao salvar os dados do cachorro. Verifique sua conexão.";
      setErrorInfo({ show: true, message });
    } finally {
      setIsSubmitting(false);
      setUploadProgress("");
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate("/admin");
  };

  return (
    <div className={styles.container}>

      {/* Modal de Sucesso */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        title="Tudo certo!"
        message="Os dados do cachorro foram salvos com sucesso."
      />

      {/* Modal de Erro */}
      <ErrorModal
        isOpen={errorInfo.show}
        onClose={() => setErrorInfo({ show: false, message: "" })}
        message={errorInfo.message}
      />

      <ConfirmModal
        isOpen={photoPendingRemoval !== null}
        onClose={() => setPhotoPendingRemoval(null)}
        onConfirm={confirmPhotoRemoval}
        title="Remover foto?"
        message="A foto será removida do cadastro quando você salvar as alterações."
        confirmText="Remover foto"
        isDestructive
      />

      <div className={styles.headerArea}>
        <Button type="button" variant="text" leftIcon={<ArrowLeft size={20} />} onClick={() => navigate("/admin/dog")} className={styles.backButton}>
          Voltar
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>

        <Card className={styles.section} tone="muted" size="sm">
          <CardBody className={styles.sectionBody}>
            <CardHeader className={styles.sectionHeader}>
              <CardIcon className={styles.sectionIcon}><PawPrint size={24} /></CardIcon>
              <div className={styles.sectionHeading}>
                <h2>Dados principais</h2>
                <p>Identificação e perfil básico do animal.</p>
              </div>
            </CardHeader>
            <CardContent className={styles.sectionContent}>
              <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="dog-name">Nome</label>
              <Input
                id="dog-name"
                required
                maxLength={120}
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="dog-age">Idade ou faixa estimada</label>
              <div className={styles.ageControl}>
                <Input
                  id="dog-age"
                  required
                  pattern="[0-9]+(?:-[0-9]+)?"
                  maxLength={7}
                  aria-describedby="dog-age-help"
                  className={styles.ageValueInput}
                  placeholder="Ex: 2 ou 2-3"
                  value={ageRange}
                  onBlur={normalizeAgeRange}
                  onChange={event => handleAgeRangeChange(event.target.value)}
                />
                <SelectComponent.Select
                  value={ageUnit}
                  onValueChange={handleAgeUnitChange}
                >
                  <SelectComponent.SelectTrigger
                    aria-label="Unidade da idade"
                    className={styles.ageUnitTrigger}
                  >
                    <SelectComponent.SelectValue>
                      {ageUnit === "anos"
                        ? ageRange === "1" ? "ano" : "anos"
                        : ageRange === "1" ? "mês" : "meses"}
                    </SelectComponent.SelectValue>
                  </SelectComponent.SelectTrigger>
                  <SelectComponent.SelectContent className={styles.ageUnitContent}>
                    <SelectComponent.SelectItem value="anos">
                      {ageRange === "1" ? "ano" : "anos"}
                    </SelectComponent.SelectItem>
                    <SelectComponent.SelectItem value="meses">
                      {ageRange === "1" ? "mês" : "meses"}
                    </SelectComponent.SelectItem>
                  </SelectComponent.SelectContent>
                </SelectComponent.Select>
              </div>
              <p id="dog-age-help" className={styles.fieldDescription}>
                Digite somente um número ou uma faixa com hífen.
              </p>
              {legacyAge && (
                <p className={styles.legacyValue} role="status">
                  Valor anterior: “{legacyAge}”. Informe a idade no novo formato para salvar.
                </p>
              )}
            </div>
              </div>
              <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="dog-age-category">Categoria</label>
              <SelectComponent.Select
                value={formData.cateIdade}
                onValueChange={value => {
                  const category = dogAgeCategorySchema.safeParse(value);
                  if (category.success) {
                    setFormData({ ...formData, cateIdade: category.data });
                  }
                }}
              >
                <SelectComponent.SelectTrigger id="dog-age-category">
                  <SelectComponent.SelectValue placeholder="Selecione a categoria" />
                </SelectComponent.SelectTrigger>
                <SelectComponent.SelectContent>
                  <SelectComponent.SelectItem value="filhote">Filhote</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="adulto">Adulto</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="idoso">Idoso</SelectComponent.SelectItem>
                </SelectComponent.SelectContent>
              </SelectComponent.Select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="dog-sex">Sexo</label>
              <SelectComponent.Select
                value={formData.sexo}
                onValueChange={value => {
                  const sex = dogSexSchema.safeParse(value);
                  if (sex.success) {
                    setFormData({ ...formData, sexo: sex.data });
                  }
                }}
              >
                <SelectComponent.SelectTrigger id="dog-sex">
                  <SelectComponent.SelectValue placeholder="Selecione o sexo" />
                </SelectComponent.SelectTrigger>
                <SelectComponent.SelectContent>
                  <SelectComponent.SelectItem value="Macho">Macho</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="Fêmea">Fêmea</SelectComponent.SelectItem>
                </SelectComponent.SelectContent>
              </SelectComponent.Select>
            </div>
              </div>
            </CardContent>
          </CardBody>
        </Card>

        <Card className={styles.section} tone="muted" size="sm">
          <CardBody className={styles.sectionBody}>
            <CardHeader className={styles.sectionHeader}>
              <CardIcon className={styles.sectionIcon}><Images size={24} /></CardIcon>
              <div className={styles.sectionHeading}>
                <h2>Fotos ({photos.length}/{MAX_DOG_PHOTOS})</h2>
                <p>Organize a capa e as imagens exibidas no perfil do animal.</p>
              </div>
            </CardHeader>
            <CardContent className={styles.sectionContent}>
          {photos.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, color:'var(--text-secondary)'}}>
                Clique em uma foto para defini-la como capa
              </label>
              <div className={styles.previewGrid}>
                {photos.map((photo, index) => {
                  const imageUrl = photo.kind === "existing" ? photo.url : photo.previewUrl;
                  return (
                  <div key={photo.id} className={styles.previewCard}>
                    <button
                      type="button"
                      className={styles.photoButton}
                      aria-label={index === 0 ? "Foto de capa atual" : `Definir foto ${index + 1} como capa`}
                      disabled={index === 0}
                      onClick={() => setCoverPhoto(photo.id)}
                    >
                      <img src={imageUrl} alt={`Foto ${index + 1} de ${formData.nome || "cachorro"}`} />
                    </button>
                    <Button type="button" variant="outline" size="icon-sm" aria-label={`Remover foto ${index + 1}`} className={styles.removePhotoBtn} onClick={() => removePhoto(photo)}>
                      <X size={14} />
                    </Button>
                    {photo.kind === "local" && <span className={styles.newBadge}>Nova</span>}
                    {index === 0 && <span className={styles.mainBadge}>Capa Atual</span>}
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            {...getRootProps()}
            aria-disabled={photoLimitReached}
            className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''} ${photoLimitReached ? styles.dropzoneDisabled : ''}`}
          >
            <input {...getInputProps()} />
            <div className={styles.dropContent}>
              <UploadCloud size={40} color={isDragActive ? "var(--primary)" : "var(--text-muted)"} />
              {photoLimitReached ? (
                <>
                  <p>Limite de {MAX_DOG_PHOTOS} fotos atingido</p>
                  <span>Remova uma foto para adicionar outra</span>
                </>
              ) : (
                <>
                  {isDragActive ? <p>Solte aqui...</p> : <p>Arraste novas fotos aqui</p>}
                  <span>
                    Clique para selecionar — até 20 MB — restam {remainingPhotoSlots}
                  </span>
                </>
              )}
            </div>
              </div>
            </CardContent>
          </CardBody>
        </Card>

        <Card className={styles.section} tone="muted" size="sm">
          <CardBody className={styles.sectionBody}>
            <CardHeader className={styles.sectionHeader}>
              <CardIcon className={styles.sectionIcon}><Tags size={24} /></CardIcon>
              <div className={styles.sectionHeading}>
                <h2>Detalhes</h2>
                <p>Características usadas na busca e na apresentação pública.</p>
              </div>
            </CardHeader>
            <CardContent className={styles.sectionContent}>
              <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label htmlFor="dog-color">Cor</label>
              <SelectComponent.Select
                value={formData.cor}
                onValueChange={value => setFormData({...formData, cor: value})}
              >
                <SelectComponent.SelectTrigger id="dog-color">
                  <SelectComponent.SelectValue placeholder="Selecione a cor" />
                </SelectComponent.SelectTrigger>
                <SelectComponent.SelectContent>
                  {Object.entries(CORES_MAP).map(([key, label]) => (
                    <SelectComponent.SelectItem key={key} value={key}>
                      {label}
                    </SelectComponent.SelectItem>
                  ))}
                </SelectComponent.SelectContent>
              </SelectComponent.Select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="dog-temperament">Temperamento</label>
              <Input
                id="dog-temperament"
                required
                maxLength={MAX_DOG_TEMPERAMENT_LENGTH}
                aria-describedby="dog-temperament-help"
                placeholder="Ex: Dócil, tranquilo e sociável"
                value={formData.temperamento}
                onChange={e => setFormData({...formData, temperamento: e.target.value})}
              />
              <p id="dog-temperament-help" className={styles.fieldDescription}>
                Use um resumo curto exibido no card público.
                <span className={styles.selectionCount}>
                  {formData.temperamento.length}/{MAX_DOG_TEMPERAMENT_LENGTH}
                </span>
              </p>
            </div>
              </div>

              <div className={styles.inputGroup}>
            <label>Tags</label>
            <p id="tags-description" className={styles.fieldDescription}>
              Características curtas e úteis para busca e apresentação. Selecione até {MAX_DOG_TAGS}.
              <span className={styles.selectionCount}>{selectedTags.length}/{MAX_DOG_TAGS} selecionadas</span>
            </p>
            <div className={styles.tagsContainer}>
              {DOG_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);

                return (
                  <Button
                    type="button"
                    size="sm"
                    variant={isSelected ? "primary" : "outline"}
                    key={tag}
                    className={`${styles.tagButton} ${isSelected ? styles.active : ''}`}
                    aria-describedby="tags-description"
                    aria-pressed={isSelected}
                    disabled={!isSelected && tagLimitReached}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                );
              })}
            </div>
              </div>

              <div className={styles.inputGroup}>
            <label htmlFor="dog-instagram">Link Instagram</label>
            <Input
              id="dog-instagram"
              type="url"
              maxLength={2_048}
              placeholder="https://instagram.com/..."
              value={formData.instaLink}
              onChange={e => setFormData({...formData, instaLink: e.target.value})}
            />
              </div>

              <div className={styles.inputGroup}>
            <label htmlFor="dog-description">Descrição</label>
            <p id="dog-description-help" className={styles.fieldDescription}>
              Descreva a personalidade do cão, seu comportamento e outras particularidades.
            </p>
            <Textarea
              id="dog-description"
              aria-describedby="dog-description-help"
              rows={5}
              maxLength={5_000}
              value={formData.descricaoCompleta}
              onChange={e => setFormData({...formData, descricaoCompleta: e.target.value})}
            />
              </div>

              <div className={styles.inputGroup}>
            <label htmlFor="dog-status">Status</label>
            <SelectComponent.Select
              required
              value={formData.status}
              onValueChange={value => {
                const status = dogHealthStatusSchema.safeParse(value);
                if (status.success) {
                  setFormData({ ...formData, status: status.data });
                }
              }}
            >
              <SelectComponent.SelectTrigger id="dog-status">
                <SelectComponent.SelectValue placeholder="Selecione o status" />
              </SelectComponent.SelectTrigger>
              <SelectComponent.SelectContent>
                {DOG_HEALTH_STATUSES.map(status => (
                  <SelectComponent.SelectItem key={status} value={status}>
                    {status}
                  </SelectComponent.SelectItem>
                ))}
              </SelectComponent.SelectContent>
            </SelectComponent.Select>
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
          {isSubmitting ? uploadProgress : buttonLabel}
        </Button>
      </form>
    </div>
  );
}
