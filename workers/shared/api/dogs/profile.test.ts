import assert from "node:assert/strict";
import { test, vi } from "vitest";

import type { CloudflareEnv } from "../_lib/env";
import type { DogFeed, PublicDog } from "./feed";
import { getDogProfileResponse } from "./profile";
import type { DogTombstone } from "./tombstone";

function dog(id = "dog-1"): PublicDog {
  return {
    id,
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
}

function feed(dogs: PublicDog[], generatedAt = "2026-08-28T14:00:00.000Z"): DogFeed {
  return {
    schemaVersion: 1,
    version: "2026-08-28",
    generatedAt,
    dogs,
  };
}

function tombstone(
  removedAt = "2026-08-28T15:00:00.000Z",
): DogTombstone {
  return {
    schemaVersion: 1,
    id: "dog-1",
    nome: "Paçoca",
    status: "adopted",
    removedAt,
  };
}

function envWith(values: Record<string, unknown>): CloudflareEnv {
  return {
    NODE_ENV: "production",
    KV: {
      async get(key) {
        const value = values[key];
        return value === undefined ? null : JSON.stringify(value);
      },
      async put() {},
    },
  };
}

test("returns an available dog from the current feed", async () => {
  const currentDog = dog();
  const response = await getDogProfileResponse(
    new Request("https://abrigo.test/api/dogs/dog-1"),
    envWith({ "dogs-feed:current": feed([currentDog]) }),
    "dog-1",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { state: "available", dog: currentDog });
});

test("a tombstone newer than the feed wins over a stale available dog", async () => {
  const removedDog = tombstone();
  const response = await getDogProfileResponse(
    new Request("https://abrigo.test/api/dogs/dog-1"),
    envWith({
      "dogs-feed:current": feed([dog()]),
      "dogs-tombstone:dog-1": removedDog,
    }),
    "dog-1",
  );

  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), {
    state: "unavailable",
    tombstone: removedDog,
  });
});

test("a newer feed can supersede an orphan tombstone", async () => {
  const currentDog = dog();
  const response = await getDogProfileResponse(
    new Request("https://abrigo.test/api/dogs/dog-1"),
    envWith({
      "dogs-feed:current": feed([currentDog], "2026-08-28T16:00:00.000Z"),
      "dogs-tombstone:dog-1": tombstone(),
    }),
    "dog-1",
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { state: "available", dog: currentDog });
});

test("returns a tombstone even when the current feed cannot be read", async () => {
  const removedDog = tombstone();
  const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const env: CloudflareEnv = {
    NODE_ENV: "production",
    KV: {
      async get(key) {
        if (key === "dogs-tombstone:dog-1") return JSON.stringify(removedDog);
        throw new Error("feed unavailable");
      },
      async put() {},
    },
  };

  const response = await getDogProfileResponse(
    new Request("https://abrigo.test/api/dogs/dog-1"),
    env,
    "dog-1",
  );

  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), {
    state: "unavailable",
    tombstone: removedDog,
  });
  errorLog.mockRestore();
});

test("distinguishes unknown and invalid public dog ids", async () => {
  const env = envWith({ "dogs-feed:current": feed([]) });
  const missingResponse = await getDogProfileResponse(
    new Request("https://abrigo.test/api/dogs/missing"),
    env,
    "missing",
  );
  const invalidResponse = await getDogProfileResponse(
    new Request("https://abrigo.test/api/dogs/invalid%2Fid"),
    env,
    "invalid%2Fid",
  );

  assert.equal(missingResponse.status, 404);
  assert.equal(invalidResponse.status, 400);
});
