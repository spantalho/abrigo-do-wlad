import { describe, expect, test } from "vitest";

import {
  MAX_DOG_TEMPERAMENT_LENGTH,
  dogEntitySchema,
  dogInputSchema,
  dogUpdateSchema,
  formatDogAge,
  parseDogAge,
  recyclePointEntitySchema,
  recyclePointInputSchema,
  recyclePointUpdateSchema,
} from "./entities";

const validDogInput = {
  nome: "Nina",
  idade: "2 anos",
  cateIdade: "adulto" as const,
  sexo: "Fêmea" as const,
  temperamento: "Dócil e sociável",
  tags: ["Dócil"],
  status: "Vacinado e Castrado" as const,
  fotos: [],
  cor: "caramelo",
  instaLink: "",
  descricaoCompleta: "",
};

const validRecyclePointInput = {
  zone: "ZONA SUL",
  neighborhood: "Aldeota",
  name: "Mercado local",
  address: "Rua Exemplo, 123",
  latitude: "-3.7319",
  longitude: "-38.5267",
};

describe("admin entity contracts", () => {
  test.each(["1 ano", "2 anos", "1 mês", "8 meses", "2-3 anos"])(
    "accepts the canonical dog age %s",
    (idade) => {
      expect(dogInputSchema.safeParse({ ...validDogInput, idade }).success).toBe(true);
    },
  );

  test.each(["aaaaaaaa", "2--3 anos", "3-2 anos", "1 anos", "31 anos"])(
    "rejects the invalid dog age %s",
    (idade) => {
      expect(dogInputSchema.safeParse({ ...validDogInput, idade }).success).toBe(false);
    },
  );

  test("parses and formats dog ages without changing the stored string contract", () => {
    expect(parseDogAge("2-3 anos")).toEqual({ range: "2-3", unit: "anos" });
    expect(formatDogAge("1", "meses")).toBe("1 mês");
    expect(formatDogAge("1-1", "anos")).toBe("1 ano");
  });

  test("keeps reads tolerant to legacy free-form dog ages", () => {
    const result = dogEntitySchema.safeParse({
      ...validDogInput,
      id: 123,
      idade: "aproximadamente dois anos",
    });

    expect(result.success).toBe(true);
  });

  test("accepts a dog temperament at the write limit", () => {
    const result = dogInputSchema.safeParse({
      ...validDogInput,
      temperamento: "a".repeat(MAX_DOG_TEMPERAMENT_LENGTH),
    });

    expect(result.success).toBe(true);
  });

  test("rejects a dog temperament above the write limit", () => {
    const result = dogInputSchema.safeParse({
      ...validDogInput,
      temperamento: "a".repeat(MAX_DOG_TEMPERAMENT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("no máximo 80 caracteres");
    }
  });

  test("keeps reads tolerant to legacy dog temperaments", () => {
    const result = dogEntitySchema.safeParse({
      ...validDogInput,
      id: 123,
      temperamento: "a".repeat(MAX_DOG_TEMPERAMENT_LENGTH + 1),
    });

    expect(result.success).toBe(true);
  });

  test("rejects empty dog updates", () => {
    expect(dogUpdateSchema.safeParse({}).success).toBe(false);
  });

  test("requires latitude and longitude together on complete inputs", () => {
    const result = recyclePointInputSchema.safeParse({
      ...validRecyclePointInput,
      longitude: "",
    });

    expect(result.success).toBe(false);
  });

  test("rejects coordinates outside their geographic ranges", () => {
    const result = recyclePointInputSchema.safeParse({
      ...validRecyclePointInput,
      latitude: "-91",
    });

    expect(result.success).toBe(false);
  });

  test("allows a partial update to change only one coordinate", () => {
    expect(recyclePointUpdateSchema.safeParse({ latitude: "-3.7" }).success).toBe(true);
  });

  test("keeps reads tolerant to legacy free-form coordinates", () => {
    const result = recyclePointEntitySchema.safeParse({
      ...validRecyclePointInput,
      id: "point-1",
      latitude: "coordenada legada",
    });

    expect(result.success).toBe(true);
  });
});
