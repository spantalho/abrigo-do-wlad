export const CORES_MAP: Record<string, string> = {
  caramelo: "Caramelo (Patrimônio Nacional)",
  pretinho: "Pretinho (Nada Básico)",
  fiapoManga: "Fiapo de Manga (Arrepiados)",
  peludinhos: "Peludinhos",
  BrasilEgito: "Mistura do Brasil com Egito",
};

export const DOG_HEALTH_STATUSES = [
  "Vacinado e Castrado",
  "Apenas Castrado",
  "Em Protocolo Vacinal",
] as const;

export type DogHealthStatus = (typeof DOG_HEALTH_STATUSES)[number];

export interface DogProps {
  id: number;
  nome: string;
  idade: string;
  cateIdade: "filhote" | "adulto" | "idoso";
  sexo: 'Macho' | 'Fêmea';
  temperamento: string;
  tags: string[];
  status: DogHealthStatus;
  fotos: string[];
  cor: string;
  instaLink?: string;
  descricaoCompleta?: string;
}
