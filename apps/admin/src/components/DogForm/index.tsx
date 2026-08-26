import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, X, Save, UploadCloud } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Input, Textarea } from "@jaci/ui/Field";
import * as SelectComponent from "@jaci/ui/Select";
import { CORES_MAP, DOG_HEALTH_STATUSES, type DogProps } from "../../types/dogs";
import {
  deleteUploadedCloudinaryImage,
  DOG_IMAGE_ACCEPT,
  MAX_SOURCE_DOG_IMAGE_BYTES,
  uploadImageToCloudinary,
} from "../../services/cloudinary";
import { SuccessModal } from "../SuccessModal";
import { ErrorModal } from "../ErrorModal"; // <-- Importação do ErrorModal
import styles from "./DogForm.module.css";

const COMMON_TAGS = ["Dócil", "Ativo", "Tranquilo", "Sociável", "Resiliente", "Carinhoso", "Amável"];
const MAX_DOG_PHOTOS = 6;
type DogPhoto =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "local"; file: File; previewUrl: string };

interface DogFormProps {
  initialData?: Partial<DogProps>;
  onSubmit: (data: Omit<DogProps, "id">) => Promise<void>;
  title: string;
  buttonLabel: string;
}

export function DogForm({ initialData, onSubmit, title, buttonLabel }: DogFormProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const initialStatus = initialData?.status;
  const normalizedInitialStatus = initialStatus !== undefined
    && DOG_HEALTH_STATUSES.includes(initialStatus)
    ? initialStatus
    : DOG_HEALTH_STATUSES[0];

  // ESTADOS PARA OS MODAIS
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ show: false, message: "" });

  const localPreviewUrls = useRef(new Set<string>());
  const [photos, setPhotos] = useState<DogPhoto[]>(() =>
    (initialData?.fotos || []).map((url, index) => ({
      id: `existing-${index}-${url}`,
      kind: "existing",
      url,
    })),
  );

  const [formData, setFormData] = useState<Partial<DogProps>>({
    nome: "",
    idade: "",
    cateIdade: "adulto",
    sexo: "Macho",
    temperamento: "",
    tags: [],
    fotos: [],
    cor: "caramelo",
    instaLink: "",
    descricaoCompleta: "",
    ...initialData,
    status: normalizedInitialStatus,
  });

  const photoLimitReached = photos.length >= MAX_DOG_PHOTOS;
  const remainingPhotoSlots = Math.max(0, MAX_DOG_PHOTOS - photos.length);

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
      message: "Use imagens JPEG, PNG ou WebP de até 20 MB. A otimização é automática.",
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
    if (photoToRemove.kind === "existing" && !window.confirm("Remover esta foto do cadastro?")) {
      return;
    }
    if (photoToRemove.kind === "local") {
      URL.revokeObjectURL(photoToRemove.previewUrl);
      localPreviewUrls.current.delete(photoToRemove.previewUrl);
    }
    setPhotos(prev => prev.filter(photo => photo.id !== photoToRemove.id));
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
      const tags = prev.tags || [];
      return tags.includes(tag)
        ? { ...prev, tags: tags.filter(t => t !== tag) }
        : { ...prev, tags: [...tags, tag] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const finalData = {
        ...formData,
        fotos: finalPhotos
      };

      setUploadProgress("Salvando dados...");
      await onSubmit(finalData as Omit<DogProps, "id">);

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

      <div className={styles.headerArea}>
        <Button type="button" variant="text" onClick={() => navigate("/admin/dog")} className={styles.backButton}>
          <ArrowLeft size={20} /> Voltar
        </Button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>

        <div className={styles.section}>
          <h2>Dados Principais</h2>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Nome</label>
              <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
            </div>
            <div className={styles.inputGroup}>
              <label>Idade (ex: "2 anos")</label>
              <Input required value={formData.idade} onChange={e => setFormData({...formData, idade: e.target.value})} />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Categoria</label>
              <SelectComponent.Select
                value={formData.cateIdade}
                onValueChange={value => setFormData({...formData, cateIdade: value as DogProps["cateIdade"]})}
              >
                <SelectComponent.SelectTrigger>
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
              <label>Sexo</label>
              <SelectComponent.Select
                value={formData.sexo}
                onValueChange={value => setFormData({...formData, sexo: value as DogProps["sexo"]})}
              >
                <SelectComponent.SelectTrigger>
                  <SelectComponent.SelectValue placeholder="Selecione o sexo" />
                </SelectComponent.SelectTrigger>
                <SelectComponent.SelectContent>
                  <SelectComponent.SelectItem value="Macho">Macho</SelectComponent.SelectItem>
                  <SelectComponent.SelectItem value="Fêmea">Fêmea</SelectComponent.SelectItem>
                </SelectComponent.SelectContent>
              </SelectComponent.Select>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Fotos ({photos.length}/{MAX_DOG_PHOTOS})</h2>
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
                    Clique para selecionar — até 20 MB; otimização automática — restam {remainingPhotoSlots}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Detalhes</h2>
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label>Cor</label>
              <SelectComponent.Select
                value={formData.cor}
                onValueChange={value => setFormData({...formData, cor: value})}
              >
                <SelectComponent.SelectTrigger>
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
              <label>Temperamento</label>
              <Input value={formData.temperamento} onChange={e => setFormData({...formData, temperamento: e.target.value})} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Tags</label>
            <div className={styles.tagsContainer}>
              {COMMON_TAGS.map(tag => (
                <Button
                  type="button"
                  size="sm"
                  variant={formData.tags?.includes(tag) ? "primary" : "outline"}
                  key={tag}
                  className={`${styles.tagButton} ${formData.tags?.includes(tag) ? styles.active : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Link Instagram</label>
            <Input value={formData.instaLink} onChange={e => setFormData({...formData, instaLink: e.target.value})} />
          </div>

          <div className={styles.inputGroup}>
            <label>Descrição</label>
            <Textarea rows={5} value={formData.descricaoCompleta} onChange={e => setFormData({...formData, descricaoCompleta: e.target.value})} />
          </div>

          <div className={styles.inputGroup}>
            <label>Status</label>
            <SelectComponent.Select
              required
              value={formData.status}
              onValueChange={value => setFormData({
                ...formData,
                status: value as DogProps["status"],
              })}
            >
              <SelectComponent.SelectTrigger>
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
        </div>

        <Button type="submit" size="lg" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? <span>{uploadProgress}</span> : <><Save size={20} /> {buttonLabel}</>}
        </Button>
      </form>
    </div>
  );
}
