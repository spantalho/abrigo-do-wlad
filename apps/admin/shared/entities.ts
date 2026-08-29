import { z } from "zod";

export const MAX_DOG_PHOTOS = 6;
export const MAX_DOG_TAGS = 5;
export const MAX_DOG_TEMPERAMENT_LENGTH = 80;
export const MAX_DOG_AGE_YEARS = 30;
export const MAX_DOG_AGE_MONTHS = MAX_DOG_AGE_YEARS * 12;

export const DOG_AGE_CATEGORIES = ["filhote", "adulto", "idoso"] as const;
export const DOG_AGE_UNITS = ["anos", "meses"] as const;
export const DOG_SEXES = ["Macho", "Fêmea"] as const;
export const DOG_HEALTH_STATUSES = [
  "Vacinado e Castrado",
  "Apenas Castrado",
  "Em Protocolo Vacinal",
] as const;

export const dogAgeCategorySchema = z.enum(DOG_AGE_CATEGORIES);
export const dogSexSchema = z.enum(DOG_SEXES);
export const dogHealthStatusSchema = z.enum(DOG_HEALTH_STATUSES);

export type DogAgeUnit = (typeof DOG_AGE_UNITS)[number];

export interface DogAgeParts {
  range: string;
  unit: DogAgeUnit;
}

export function formatDogAge(range: string, unit: DogAgeUnit): string {
  if (!range) return "";

  const [minimum, maximum] = range.split("-");
  const normalizedRange = maximum === minimum ? minimum : range;
  const singular = normalizedRange === "1";
  const suffix = unit === "anos"
    ? singular ? "ano" : "anos"
    : singular ? "mês" : "meses";
  return `${normalizedRange} ${suffix}`;
}

export function parseDogAge(value: string): DogAgeParts | null {
  const normalized = value.trim();
  const match = /^(\d+)(?:-(\d+))? (ano|anos|mês|meses)$/.exec(normalized);
  if (!match) return null;

  const minimum = Number(match[1]);
  const maximum = match[2] === undefined ? undefined : Number(match[2]);
  const unit: DogAgeUnit = match[3]?.startsWith("ano") ? "anos" : "meses";
  const upperLimit = unit === "anos" ? MAX_DOG_AGE_YEARS : MAX_DOG_AGE_MONTHS;
  if (
    !Number.isSafeInteger(minimum)
    || minimum < 1
    || minimum > upperLimit
    || (maximum !== undefined && (
      !Number.isSafeInteger(maximum)
      || maximum < minimum
      || maximum > upperLimit
    ))
  ) {
    return null;
  }

  const range = maximum === undefined ? String(minimum) : `${minimum}-${maximum}`;
  return formatDogAge(range, unit) === normalized ? { range, unit } : null;
}

const httpsUrlSchema = z
  .string()
  .trim()
  .max(2_048, "A URL deve ter no máximo 2048 caracteres.")
  .url("Informe uma URL válida.")
  .refine((value) => value.startsWith("https://"), "A URL deve usar HTTPS.");

const dogTemperamentWriteSchema = z
  .string()
  .trim()
  .min(1, "Informe o temperamento do cachorro.")
  .max(
    MAX_DOG_TEMPERAMENT_LENGTH,
    `O temperamento deve ter no máximo ${MAX_DOG_TEMPERAMENT_LENGTH} caracteres.`,
  );

const dogTemperamentReadSchema = z
  .string()
  .trim()
  .min(1, "Informe o temperamento do cachorro.");

const dogAgeWriteSchema = z.string().trim().refine(
  (value) => parseDogAge(value) !== null,
  "Informe uma idade válida, como 1 ano, 8 meses ou 2-3 anos.",
);

const dogAgeReadSchema = z
  .string()
  .trim()
  .min(1, "Informe a idade do cachorro.")
  .max(80);

const dogWritableFieldsSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cachorro.").max(120),
  idade: dogAgeWriteSchema,
  cateIdade: dogAgeCategorySchema,
  sexo: dogSexSchema,
  temperamento: dogTemperamentWriteSchema,
  tags: z
    .array(z.string().trim().min(1).max(60))
    .max(MAX_DOG_TAGS, `Um cachorro pode ter no máximo ${MAX_DOG_TAGS} tags.`),
  status: dogHealthStatusSchema,
  fotos: z
    .array(httpsUrlSchema)
    .max(MAX_DOG_PHOTOS, `Um cachorro pode ter no máximo ${MAX_DOG_PHOTOS} fotos.`),
  cor: z.string().trim().min(1, "Informe a cor do cachorro.").max(80),
  instaLink: z.union([z.literal(""), httpsUrlSchema]),
  descricaoCompleta: z.string().trim().max(5_000),
});

export const dogInputSchema = dogWritableFieldsSchema.extend({
  instaLink: dogWritableFieldsSchema.shape.instaLink.default(""),
  descricaoCompleta: dogWritableFieldsSchema.shape.descricaoCompleta.default(""),
});

export const dogDetailsSchema = dogInputSchema.omit({ fotos: true });

export const dogUpdateSchema = dogWritableFieldsSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Informe ao menos um campo para atualizar o cachorro.",
);

export const dogEntitySchema = dogInputSchema.extend({
  id: z.number().int().nonnegative(),
  // Reads stay tolerant so legacy records can be opened and corrected manually.
  idade: dogAgeReadSchema,
  temperamento: dogTemperamentReadSchema,
});

function coordinateSchema(label: string, minimum: number, maximum: number) {
  return z
    .string()
    .trim()
    .max(40, `${label} deve ter no máximo 40 caracteres.`)
    .refine(
      (value) => value === "" || /^-?\d+(?:\.\d+)?$/.test(value),
      `${label} deve ser um número decimal usando ponto.`,
    )
    .refine(
      (value) => value === "" || (Number(value) >= minimum && Number(value) <= maximum),
      `${label} deve estar entre ${minimum} e ${maximum}.`,
    )
    .default("");
}

const latitudeSchema = coordinateSchema("Latitude", -90, 90);
const longitudeSchema = coordinateSchema("Longitude", -180, 180);

const recyclePointWritableFieldsSchema = z.object({
  zone: z.string().trim().min(1, "Informe a zona da cidade.").max(80),
  neighborhood: z.string().trim().min(1, "Informe o bairro.").max(120),
  name: z.string().trim().max(160),
  address: z.string().trim().min(1, "Informe o endereço.").max(300),
  latitude: latitudeSchema.removeDefault(),
  longitude: longitudeSchema.removeDefault(),
});

function validateCoordinatePair(
  value: { latitude?: string; longitude?: string },
  context: z.RefinementCtx,
) {
  if (value.latitude === undefined || value.longitude === undefined) return;

  const hasLatitude = value.latitude !== "";
  const hasLongitude = value.longitude !== "";
  if (hasLatitude === hasLongitude) return;

  context.addIssue({
    code: "custom",
    path: [hasLatitude ? "longitude" : "latitude"],
    message: "Informe latitude e longitude juntas.",
  });
}

export const recyclePointInputSchema = recyclePointWritableFieldsSchema
  .extend({
    name: recyclePointWritableFieldsSchema.shape.name.default(""),
    latitude: recyclePointWritableFieldsSchema.shape.latitude.default(""),
    longitude: recyclePointWritableFieldsSchema.shape.longitude.default(""),
  })
  .superRefine(validateCoordinatePair);

export const recyclePointUpdateSchema = recyclePointWritableFieldsSchema
  .partial()
  .superRefine(validateCoordinatePair)
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo para atualizar o ponto de coleta.",
  );

const storedCoordinateSchema = z.string().trim().max(40).default("");

export const recyclePointEntitySchema = recyclePointWritableFieldsSchema.extend({
  id: z.string().trim().min(1),
  name: recyclePointWritableFieldsSchema.shape.name.default(""),
  // Reads remain compatible with coordinates previously stored as free-form strings.
  latitude: storedCoordinateSchema,
  longitude: storedCoordinateSchema,
});

export type DogInput = z.infer<typeof dogInputSchema>;
export type DogDetailsInput = z.infer<typeof dogDetailsSchema>;
export type DogUpdate = z.infer<typeof dogUpdateSchema>;
export type Dog = z.infer<typeof dogEntitySchema>;
export type DogHealthStatus = (typeof DOG_HEALTH_STATUSES)[number];

export type RecyclePointInput = z.infer<typeof recyclePointInputSchema>;
export type RecyclePointUpdate = z.infer<typeof recyclePointUpdateSchema>;
export type RecyclePoint = z.infer<typeof recyclePointEntitySchema>;
