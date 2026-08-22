export const CORES_MAP: Record<string, string> = {
  caramelo: "Caramelo (Patrimônio Nacional)",
  pretinho: "Pretinho (Nada Básico)",
  fiapoManga: "Fiapo de Manga (Arrepiados)",
  peludinhos: "Peludinhos",
  BrasilEgito: "Mistura do Brasil com Egito",
};

export interface DogProps {
  id: number;
  nome: string;
  idade: string;
  cateIdade: "filhote" | "adulto" | "idoso";
  sexo: 'Macho' | 'Fêmea';
  temperamento: string;
  tags: string[];
  status: string;
  fotos: string[];
  cor: string;
  instaLink?: string;
  descricaoCompleta?: string;
}