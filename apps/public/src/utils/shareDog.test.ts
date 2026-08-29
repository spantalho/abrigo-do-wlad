import assert from "node:assert/strict";
import { test, vi } from "vitest";

import type { DogShareEnvironment } from "./shareDog";
import { createDogShareData, shareDogProfile } from "./shareDog";

const dog = {
  publicSlug: "pacoca",
  nome: "Paçoca",
  idade: "2 anos",
};

function environment(
  overrides: Partial<DogShareEnvironment> = {},
): DogShareEnvironment {
  return {
    origin: "https://abrigodowlad.com.br",
    copyText: vi.fn(async () => undefined),
    ...overrides,
  };
}

test("builds native share data with the canonical dog URL", () => {
  assert.deepEqual(createDogShareData(dog, "https://abrigodowlad.com.br"), {
    title: "Paçoca para adoção | Abrigo do Wlad",
    text: "Conheça Paçoca, 2 anos, e ajude este doguinho a encontrar uma família.",
    url: "https://abrigodowlad.com.br/caes/pacoca",
  });
});

test("uses the native Web Share API when it is available", async () => {
  const nativeShare = vi.fn(async () => undefined);
  const copyText = vi.fn(async () => undefined);

  const result = await shareDogProfile(dog, environment({
    share: nativeShare,
    canShare: () => true,
    copyText,
  }));

  assert.equal(result, "shared");
  assert.equal(nativeShare.mock.calls.length, 1);
  assert.equal(copyText.mock.calls.length, 0);
});

test("copies the canonical URL when native sharing is unavailable", async () => {
  const copyText = vi.fn(async () => undefined);

  const result = await shareDogProfile(dog, environment({ copyText }));

  assert.equal(result, "copied");
  assert.deepEqual(copyText.mock.calls, [
    ["https://abrigodowlad.com.br/caes/pacoca"],
  ]);
});

test("copies the link when the browser rejects the share payload", async () => {
  const nativeShare = vi.fn(async () => undefined);
  const copyText = vi.fn(async () => undefined);

  const result = await shareDogProfile(dog, environment({
    share: nativeShare,
    canShare: () => false,
    copyText,
  }));

  assert.equal(result, "copied");
  assert.equal(nativeShare.mock.calls.length, 0);
  assert.equal(copyText.mock.calls.length, 1);
});

test("falls back to copy when the native share attempt fails", async () => {
  const copyText = vi.fn(async () => undefined);

  const result = await shareDogProfile(dog, environment({
    share: vi.fn(async () => {
      throw new Error("Native share unavailable");
    }),
    copyText,
  }));

  assert.equal(result, "copied");
  assert.equal(copyText.mock.calls.length, 1);
});

test("does not copy when the user dismisses the native share sheet", async () => {
  const copyText = vi.fn(async () => undefined);
  const error = new Error("Share cancelled");
  error.name = "AbortError";

  const result = await shareDogProfile(dog, environment({
    share: vi.fn(async () => {
      throw error;
    }),
    copyText,
  }));

  assert.equal(result, "cancelled");
  assert.equal(copyText.mock.calls.length, 0);
});
