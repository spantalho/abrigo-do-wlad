import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, X, Save, UploadCloud } from "lucide-react";
import { Button } from "@jaci/ui/Button";
import { Input, NativeSelect, Textarea } from "@jaci/ui/Field";
import { CORES_MAP, type DogProps } from "../../types/dogs";
import { uploadImageToCloudinary } from "../../services/cloudinary";
import { SuccessModal } from "../SuccessModal";
import { ErrorModal } from "../ErrorModal"; // <-- Importação do ErrorModal
import styles from "./DogForm.module.css";

const COMMON_TAGS = ["Dócil", "Ativo", "Tranquilo", "Sociável", "Resiliente", "Carinhoso", "Amável"];

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

  // ESTADOS PARA OS MODAIS
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ show: false, message: "" });

  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<DogProps>>({
    nome: "",
    idade: "",
    cateIdade: "adulto",
    sexo: "Macho",
    temperamento: "",
    tags: [],
    status: "Vacinado e Castrado",
    fotos: [],
    cor: "caramelo",
    instaLink: "",
    descricaoCompleta: "",
    ...initialData
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setLocalFiles(prev => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  const removeLocalFile = (indexToRemove: number) => {
    setLocalFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const removeExistingPhoto = (urlToRemove: string) => {
    if(!window.confirm("Remover esta foto do cadastro?")) return;
    setFormData(prev => ({
      ...prev,
      fotos: prev.fotos?.filter(url => url !== urlToRemove) || []
    }));
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

    try {
      const newUploadedUrls: string[] = [];
      if (localFiles.length > 0) {
        setUploadProgress("Enviando novas fotos...");
        for (let i = 0; i < localFiles.length; i++) {
          const url = await uploadImageToCloudinary(localFiles[i]);
          newUploadedUrls.push(url);
        }
      }

      const finalPhotos = [...(formData.fotos || []), ...newUploadedUrls];

      const finalData = {
        ...formData,
        fotos: finalPhotos
      };

      setUploadProgress("Salvando dados...");
      await onSubmit(finalData as Omit<DogProps, "id">);

      setShowSuccess(true);

    } catch (error: unknown) {
      console.error(error);
      setErrorInfo({ show: true, message: "Erro ao salvar os dados do cachorro. Verifique sua conexão." });
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
              <NativeSelect value={formData.cateIdade} onChange={e => setFormData({...formData, cateIdade: e.target.value as DogProps["cateIdade"]})}>
                <option value="filhote">Filhote</option>
                <option value="adulto">Adulto</option>
                <option value="idoso">Idoso</option>
              </NativeSelect>
            </div>
            <div className={styles.inputGroup}>
              <label>Sexo</label>
              <NativeSelect
                value={formData.sexo}
                onChange={e => setFormData({...formData, sexo: e.target.value as DogProps["sexo"]})}
              >
                <option value="Macho">Macho</option>
                <option value="Fêmea">Fêmea</option>
              </NativeSelect>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Fotos</h2>
          {formData.fotos && formData.fotos.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{display:'block', marginBottom:'0.5rem', fontWeight:600, color:'var(--text-secondary)'}}>
                Fotos Salvas (Clique no X para excluir)
              </label>
              <div className={styles.previewGrid}>
                {formData.fotos.map((url, index) => (
                  <div key={url} className={styles.previewCard}>
                    <img src={url} alt="Foto salva" />
                    <Button type="button" variant="outline" size="icon-sm" aria-label={`Remover foto ${index + 1}`} className={styles.removePhotoBtn} onClick={() => removeExistingPhoto(url)}>
                      <X size={14} />
                    </Button>
                    {index === 0 && <span className={styles.mainBadge}>Capa Atual</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''}`}>
            <input {...getInputProps()} />
            <div className={styles.dropContent}>
              <UploadCloud size={40} color={isDragActive ? "var(--primary)" : "var(--text-muted)"} />
              {isDragActive ? <p>Solte aqui...</p> : <p>Arraste novas fotos aqui</p>}
              <span>(Clique para selecionar)</span>
            </div>
          </div>

          {previews.length > 0 && (
            <div className={styles.previewGrid}>
              {previews.map((url, index) => (
                <div key={index} className={styles.previewCard} style={{ borderColor: 'var(--primary)' }}>
                  <img src={url} alt="Nova foto" />
                  <Button type="button" variant="outline" size="icon-sm" aria-label={`Remover nova foto ${index + 1}`} className={styles.removePhotoBtn} onClick={() => removeLocalFile(index)}>
                    <X size={14} />
                  </Button>
                  <span className={styles.mainBadge} style={{background:'var(--primary)'}}>Nova</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h2>Detalhes</h2>
          <div className={styles.row}>
             <div className={styles.inputGroup}>
              <label>Cor</label>
              <NativeSelect value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})}>
                {Object.entries(CORES_MAP).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </NativeSelect>
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
            <NativeSelect value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
               <option value="Vacinado e Castrado">Vacinado e Castrado</option>
              <option value="Disponível para adoção">Disponível para adoção</option>
              <option value="Vacinado">Apenas Vacinado</option>
              <option value="Castrado">Apenas Castrado</option>
              <option value="Em tratamento">Em tratamento</option>
              <option value="Adotado">Adotado</option>
            </NativeSelect>
          </div>
        </div>

        <Button type="submit" size="lg" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? <span>{uploadProgress}</span> : <><Save size={20} /> {buttonLabel}</>}
        </Button>
      </form>
    </div>
  );
}
