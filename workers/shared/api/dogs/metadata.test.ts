import assert from "node:assert/strict";
import { test } from "vitest";

import type { PublicDog } from "./feed";
import {
  availableDogMetadata,
  unavailableDogMetadata,
} from "./metadata";

function dog(overrides: Partial<PublicDog> = {}): PublicDog {
  return {
    id: "dog-1",
    publicSlug: "pacoca",
    nome: "Paçoca",
    idade: "2 anos",
    cateIdade: "adulto",
    sexo: "Macho",
    temperamento: "Dócil",
    tags: ["dócil"],
    status: "Disponível para Adoção",
    fotos: [],
    cor: "caramelo",
    ...overrides,
  };
}

test("builds indexable Open Graph metadata with an optimized share image", () => {
  const metadata = availableDogMetadata(dog({
    fotos: [
      "https://res.cloudinary.com/demo/image/upload/v1/dogs/pacoca.png",
    ],
    descricaoCompleta: "  Muito carinhosa   e pronta para encontrar uma família.  ",
  }));

  assert.equal(metadata.title, "Paçoca para adoção | Abrigo do Wlad");
  assert.equal(
    metadata.description,
    "Muito carinhosa e pronta para encontrar uma família.",
  );
  assert.equal(
    metadata.canonicalUrl,
    "https://abrigodowlad.com.br/caes/pacoca",
  );
  assert.equal(
    metadata.imageUrl,
    "https://res.cloudinary.com/demo/image/upload/c_fill,w_1200,h_630,q_85,f_jpg,g_auto/v1/dogs/pacoca.png",
  );
  assert.equal(metadata.imageWidth, 1200);
  assert.equal(metadata.imageHeight, 630);
  assert.match(metadata.robots, /^index, follow/);
});

test("uses generic artwork and noindex metadata for a removed dog", () => {
  const metadata = unavailableDogMetadata({
    schemaVersion: 1,
    id: "dog-1",
    publicSlug: "pacoca",
    nome: "Paçoca",
    status: "adopted",
    removedAt: "2026-08-28T15:00:00.000Z",
  });

  assert.equal(metadata.title, "Paçoca encontrou uma família | Abrigo do Wlad");
  assert.equal(metadata.imageUrl, "https://abrigodowlad.com.br/og-image.jpg");
  assert.equal(metadata.robots, "noindex, follow");
});

test("keeps long dog descriptions within the social metadata limit", () => {
  const metadata = availableDogMetadata(dog({
    descricaoCompleta: "Uma história muito especial. ".repeat(20),
  }));

  assert.ok(metadata.description.length <= 180);
  assert.ok(metadata.description.endsWith("…"));
});
