import assert from "node:assert/strict";
import { test } from "vitest";

import {
  ADOPTION_IDEMPOTENCY_STORAGE_KEY,
  clearIdempotencyKey,
  getAdoptionApplicationId,
  getOrCreateIdempotencyKey,
} from "./submission";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

test("reuses the idempotency key until the submission succeeds", () => {
  const storage = createMemoryStorage();

  const firstKey = getOrCreateIdempotencyKey(storage);
  const retryKey = getOrCreateIdempotencyKey(storage);

  assert.match(firstKey, /^[0-9a-f-]{36}$/i);
  assert.equal(retryKey, firstKey);
  assert.equal(storage.getItem(ADOPTION_IDEMPOTENCY_STORAGE_KEY), firstKey);

  clearIdempotencyKey(storage);
  assert.equal(storage.getItem(ADOPTION_IDEMPOTENCY_STORAGE_KEY), null);
  assert.notEqual(getOrCreateIdempotencyKey(storage), firstKey);
});

test("creates a key when session storage is unavailable", () => {
  const unavailableStorage = {
    getItem: () => {
      throw new Error("storage disabled");
    },
    setItem: () => {
      throw new Error("storage disabled");
    },
    removeItem: () => {
      throw new Error("storage disabled");
    },
  } as unknown as Storage;

  assert.match(getOrCreateIdempotencyKey(unavailableStorage), /^[0-9a-f-]{36}$/i);
  assert.doesNotThrow(() => clearIdempotencyKey(unavailableStorage));
});

test("reads the application ID from the API data envelope", async () => {
  const response = Response.json(
    { message: "Created", data: { id: "application-123" } },
    { status: 201 },
  );

  assert.deepEqual(await getAdoptionApplicationId(response), {
    applicationId: "application-123",
  });
});

test("preserves a notification warning without turning persistence into failure", async () => {
  const response = Response.json(
    {
      message: "Created",
      data: { id: "application-123", notificationEmailSent: false },
      warning: "A candidatura foi salva, mas a notificação falhou.",
    },
    { status: 201 },
  );

  assert.deepEqual(await getAdoptionApplicationId(response), {
    applicationId: "application-123",
    warning: "A candidatura foi salva, mas a notificação falhou.",
  });
});

test("surfaces the API error message when submission fails", async () => {
  const response = Response.json(
    { message: "Too many requests. Please try again later." },
    { status: 429 },
  );

  await assert.rejects(
    () => getAdoptionApplicationId(response),
    /Too many requests/,
  );
});

test("rejects a successful response without an application ID", async () => {
  const response = Response.json({ message: "Created" }, { status: 201 });

  await assert.rejects(
    () => getAdoptionApplicationId(response),
    /não retornou o ID/,
  );
});
