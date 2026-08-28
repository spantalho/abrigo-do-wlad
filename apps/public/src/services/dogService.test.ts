import assert from "node:assert/strict";
import { afterEach, test, vi } from "vitest";

import {
  DogFeedVersionError,
  DogProfileNotFoundError,
  getDogFeedPage,
  getDogProfile,
} from "./dogService";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("getDogFeedPage sends pagination, filters and feed version to the API", async () => {
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json({
    dogs: [],
    totalItems: 0,
    currentPage: 2,
    totalPages: 0,
    itemsPerPage: 6,
    version: "2026-08-24",
  }));
  vi.stubGlobal("fetch", fetchMock);

  const page = await getDogFeedPage(
    { cateIdade: "adulto", cor: "caramelo", tags: "docil" },
    2,
    6,
    "2026-08-24",
  );

  assert.equal(page.version, "2026-08-24");
  const requestUrl = String(fetchMock.mock.calls[0]?.[0]);
  assert.match(requestUrl, /^\/api\/dogs\?/);
  const params = new URL(requestUrl, "https://abrigo.test").searchParams;
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("limit"), "6");
  assert.equal(params.get("cateIdade"), "adulto");
  assert.equal(params.get("cor"), "caramelo");
  assert.equal(params.get("tag"), "docil");
  assert.equal(params.get("version"), "2026-08-24");
});

test("getDogFeedPage identifies an expired feed version", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(null, {
    status: 409,
  })));

  await assert.rejects(
    () => getDogFeedPage({}, 2, 6, "2026-08-20"),
    DogFeedVersionError,
  );
});

test("getDogProfile loads one available dog by public id", async () => {
  const dog = {
    id: "dog-1",
    nome: "Paçoca",
    idade: "2 anos",
    cateIdade: "adulto",
    sexo: "Macho",
    temperamento: "Dócil",
    tags: ["docil"],
    status: "Vacinado e Castrado",
    fotos: [],
    cor: "caramelo",
  };
  const fetchMock = vi.fn<typeof fetch>(async () => Response.json({
    state: "available",
    dog,
  }));
  vi.stubGlobal("fetch", fetchMock);

  assert.deepEqual(await getDogProfile("dog-1"), { state: "available", dog });
  assert.equal(String(fetchMock.mock.calls[0]?.[0]), "/api/dogs/dog-1");
});

test("getDogProfile accepts a 410 tombstone response", async () => {
  const tombstone = {
    schemaVersion: 1,
    id: "dog-1",
    nome: "Paçoca",
    status: "adopted",
    removedAt: "2026-08-28T15:00:00.000Z",
  };
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json({
    state: "unavailable",
    tombstone,
  }, { status: 410 })));

  assert.deepEqual(await getDogProfile("dog-1"), {
    state: "unavailable",
    tombstone,
  });
});

test("getDogProfile distinguishes an unknown dog", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json(
    { message: "Dog not found." },
    { status: 404 },
  )));

  await assert.rejects(() => getDogProfile("missing"), DogProfileNotFoundError);
});
