export const CORES_MAP: Record<string, string> = {
  caramelo: "Caramelo (Patrimônio Nacional)",
  pretinho: "Pretinho (Nada Básico)",
  fiapoManga: "Fiapo de Manga (Arrepiados)",
  peludinhos: "Peludinhos",
  BrasilEgito: "Mistura do Brasil com Egito",
};

export const TAGS_MAP: Record<string, string> = {
  docil: "Dócil",
  ativo: "Ativo",
  tranquilo: "Tranquilo",
  sociavel: "Sociável",
  resiliente: "Resiliente",
  carinhoso: "Carinhoso",
  amavel: "Amável",
};

export const DOG_HEALTH_STATUSES = [
  "Vacinado e Castrado",
  "Apenas Castrado",
  "Em Protocolo Vacinal",
] as const;

export type DogHealthStatus = (typeof DOG_HEALTH_STATUSES)[number];

export interface Dog {
  id: string;
  nome: string;
  idade: string;
  cateIdade: "filhote" | "adulto" | "idoso";
  sexo: string;
  temperamento: string;
  tags: string[];
  status: DogHealthStatus;
  fotos: string[];
  cor: string;
  instaLink?: string;
  descricaoCompleta?: string;
  createdAt?: Date;
}

export interface DogTombstone {
  schemaVersion: 1;
  id: string;
  nome: string;
  status: "adopted" | "unavailable";
  removedAt: string;
}

export type DogProfile =
  | { state: "available"; dog: Dog }
  | { state: "unavailable"; tombstone: DogTombstone };

type FilterValue<T> = T | "all";

export type DogFilters = {
  cateIdade?: FilterValue<Dog["cateIdade"]>;
  cor?: FilterValue<Dog["cor"]>;
  tags?: string;
};
