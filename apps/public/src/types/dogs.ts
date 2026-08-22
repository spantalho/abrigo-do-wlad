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

export interface Dog {
  id: string;
  nome: string;
  idade: string;
  cateIdade: "filhote" | "adulto" | "idoso";
  sexo: string;
  temperamento: string;
  tags: string[];
  status:
    | "Vacinado e Castrado"
    | "Apenas Vacinado"
    | "Apenas Castrado"
    | "Em Tratamento"
    | "Disponível para Adoção";
  fotos: string[];
  cor: string;
  instaLink?: string;
  descricaoCompleta?: string;
  createdAt?: Date;
}

type FilterValue<T> = T | "all";

export type DogFilters = {
  cateIdade?: FilterValue<Dog["cateIdade"]>;
  cor?: FilterValue<Dog["cor"]>;
  tags?: string;
};
