export {
  DOG_HEALTH_STATUSES,
  MAX_DOG_AGE_MONTHS,
  MAX_DOG_AGE_YEARS,
  MAX_DOG_PHOTOS,
  MAX_DOG_TAGS,
  MAX_DOG_TEMPERAMENT_LENGTH,
} from "../../shared/entities";
export type {
  Dog as DogProps,
  DogDetailsInput,
  DogHealthStatus,
  DogAgeParts,
  DogAgeUnit,
  DogInput,
  DogUpdate,
} from "../../shared/entities";

export const CORES_MAP: Record<string, string> = {
  caramelo: "Caramelo (Patrimônio Nacional)",
  pretinho: "Pretinho (Nada Básico)",
  fiapoManga: "Fiapo de Manga (Arrepiados)",
  peludinhos: "Peludinhos",
  BrasilEgito: "Mistura do Brasil com Egito",
};

export const DOG_TAGS = [
  "Dócil",
  "Brincalhão",
  "Medroso",
  "Ativo",
  "Tranquilo",
  "Sociável",
  "Resiliente",
  "Carinhoso",
  "Amável",
  "Curioso",
  "Tímido",
  "Independente",
  "Protetor",
  "Companheiro",
  "Adaptável",
] as const;
