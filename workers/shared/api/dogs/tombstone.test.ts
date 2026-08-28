import assert from "node:assert/strict";
import { test } from "vitest";

import type { CloudflareEnv } from "../_lib/env";
import { getDogTombstone, saveDogTombstone } from "./tombstone";

function createKvEnv(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const puts: Array<{ key: string; value: string; options: KVNamespacePutOptions | undefined }> = [];
  const env: CloudflareEnv = {
    KV: {
      async get(key) {
        return values.get(key) ?? null;
      },
      async put(key, value, options) {
        assert.equal(typeof value, "string");
        const serialized = value as string;
        values.set(key, serialized);
        puts.push({ key, value: serialized, options });
      },
    },
  };
  return { env, puts, values };
}

test("saves a permanent, minimal dog tombstone under the public document id", async () => {
  const { env, puts } = createKvEnv();
  const tombstone = await saveDogTombstone(env, {
    id: "firestore-dog-123",
    nome: "  Paçoca  ",
    status: "adopted",
    removedAt: "2026-08-28T15:00:00.000Z",
  });

  assert.deepEqual(tombstone, {
    schemaVersion: 1,
    id: "firestore-dog-123",
    nome: "Paçoca",
    status: "adopted",
    removedAt: "2026-08-28T15:00:00.000Z",
  });
  assert.equal(puts.length, 1);
  assert.equal(puts[0]?.key, "dogs-tombstone:firestore-dog-123");
  assert.equal(puts[0]?.options, undefined);
  assert.deepEqual(JSON.parse(puts[0]?.value ?? "null"), tombstone);
});

test("reads only valid tombstones for the requested dog", async () => {
  const valid = {
    schemaVersion: 1,
    id: "dog-valid",
    nome: "Lua",
    status: "unavailable",
    removedAt: "2026-08-28T16:00:00.000Z",
  };
  const { env } = createKvEnv({
    "dogs-tombstone:dog-valid": JSON.stringify(valid),
    "dogs-tombstone:dog-invalid": JSON.stringify({ ...valid, id: "another-dog" }),
  });

  assert.deepEqual(await getDogTombstone(env, "dog-valid"), valid);
  assert.equal(await getDogTombstone(env, "dog-invalid"), null);
});

test("rejects invalid public dog ids before accessing KV", async () => {
  const { env, puts } = createKvEnv();

  await assert.rejects(
    () => saveDogTombstone(env, {
      id: "dogs/unsafe",
      nome: "Toto",
      status: "adopted",
      removedAt: "2026-08-28T17:00:00.000Z",
    }),
    /Invalid dog tombstone/,
  );
  assert.equal(puts.length, 0);
  await assert.rejects(() => getDogTombstone(env, "../unsafe"), /Invalid public dog ID/);
});
