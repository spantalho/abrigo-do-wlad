import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";

import type { AccessIdentity } from "./access";

const firestore = vi.hoisted(() => ({
  createDocument: vi.fn(),
  getDocument: vi.fn(),
  updateDocument: vi.fn(),
}));

vi.mock("../../../workers/shared/api/_lib/encryption", () => ({
  encryptSystemKey: () => "encrypted-system-key",
}));

vi.mock("../../../workers/shared/api/_lib/firestore", () => ({
  createFirestoreClient: () => firestore,
}));

import { rotateSystemKey } from "./system-keys";

const env = {} as Env;
const identity: AccessIdentity = {
  email: "developer@example.test",
  role: "developer",
  subject: "developer-subject",
};

beforeEach(() => {
  vi.clearAllMocks();
});

test("rotation initializes the first system key when the document does not exist", async () => {
  firestore.getDocument.mockResolvedValue(null);
  firestore.createDocument.mockResolvedValue({ id: "keys" });

  const result = await rotateSystemKey(env, identity);

  assert.equal(result.version, "v1");
  assert.match(result.id, /^[0-9a-f-]{36}$/);
  assert.equal(firestore.updateDocument.mock.calls.length, 0);
  assert.deepEqual(firestore.createDocument.mock.calls, [[
    "system",
    {
      active_key_id: result.id,
      keys: {
        [result.id]: {
          id: result.id,
          key: "encrypted-system-key",
          version: "v1",
          createdAt: firestore.createDocument.mock.calls[0]?.[1].keys[result.id].createdAt,
          author: identity.email,
          counter: 0,
          active: true,
        },
      },
    },
    { documentId: "keys" },
  ]]);
});

test("rotation preserves existing keys and advances the version", async () => {
  const existingKey = {
    id: "existing-key-id",
    key: "existing-encrypted-key",
    version: "v1",
    createdAt: "2026-08-22T12:00:00.000Z",
    author: "developer@example.test",
    counter: 3,
    active: true,
  };
  firestore.getDocument.mockResolvedValue({
    name: "projects/test/databases/(default)/documents/system/keys",
    updateTime: "2026-08-23T12:00:00.000Z",
    data: {
      active_key_id: existingKey.id,
      keys: { [existingKey.id]: existingKey },
    },
  });
  firestore.updateDocument.mockResolvedValue({});

  const result = await rotateSystemKey(env, identity);

  assert.equal(result.version, "v2");
  assert.equal(firestore.createDocument.mock.calls.length, 0);
  assert.deepEqual(firestore.updateDocument.mock.calls, [[
    "projects/test/databases/(default)/documents/system/keys",
    {
      active_key_id: result.id,
      keys: {
        [existingKey.id]: { ...existingKey, active: false },
        [result.id]: {
          id: result.id,
          key: "encrypted-system-key",
          version: "v2",
          createdAt: firestore.updateDocument.mock.calls[0]?.[1].keys[result.id].createdAt,
          author: identity.email,
          counter: 0,
          active: true,
        },
      },
    },
    { expectedUpdateTime: "2026-08-23T12:00:00.000Z" },
  ]]);
});
