import assert from "node:assert/strict";
import { test } from "vitest";

import type { AccessIdentity } from "./access";
import { handleAdminApi, type AdminApiDependencies } from "./admin-api";

const identity: AccessIdentity = {
  email: "administrator@example.test",
  role: "administrator",
  subject: "test-subject",
};
const env = {
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-secret",
  CLOUDINARY_CLOUD_NAME: "test-cloud",
} as Env;

const developerIdentity: AccessIdentity = {
  email: "developer@example.test",
  role: "developer",
  subject: "developer-subject",
};

function keyDependencies(
  overrides: Partial<AdminApiDependencies> = {},
): AdminApiDependencies {
  return {
    listSystemKeys: async () => [],
    rotateSystemKey: async () => ({ id: "key-id", version: "v2" }),
    ...overrides,
  };
}

test("admin API rejects state changes without a same-origin Origin header", async () => {
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/media/sign-upload", {
      method: "POST",
    }),
    env,
    identity,
  );

  assert.equal(response.status, 403);
});

test("admin API signs uploads only after same-origin validation", async () => {
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/media/sign-upload", {
      method: "POST",
      headers: { Origin: "https://admin.example.test" },
    }),
    env,
    identity,
  );
  const payload = await response.json() as Record<string, unknown>;

  assert.equal(response.status, 200);
  assert.equal(payload.folder, "abrigo-do-wlad/dogs");
  assert.equal("apiSecret" in payload, false);
});

test("administrator identities cannot list system keys", async () => {
  let called = false;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/system-keys"),
    env,
    identity,
    keyDependencies({
      listSystemKeys: async () => {
        called = true;
        return [];
      },
    }),
  );

  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test("administrator identities cannot rotate system keys", async () => {
  let called = false;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/system-keys/rotate", {
      method: "POST",
      headers: { Origin: "https://admin.example.test" },
    }),
    env,
    identity,
    keyDependencies({
      rotateSystemKey: async () => {
        called = true;
        return { id: "forbidden", version: "v999" };
      },
    }),
  );

  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test("developer identities can list sanitized system-key metadata", async () => {
  const metadata = [{
    id: "key-id",
    version: "v1",
    createdAt: "2026-08-22T12:00:00.000Z",
    author: developerIdentity.email,
    counter: 4,
    active: true,
  }];
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/system-keys"),
    env,
    developerIdentity,
    keyDependencies({ listSystemKeys: async () => metadata }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), metadata);
  assert.equal("key" in metadata[0], false);
});

test("developer identities can rotate system keys", async () => {
  let receivedIdentity: AccessIdentity | undefined;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/system-keys/rotate", {
      method: "POST",
      headers: { Origin: "https://admin.example.test" },
    }),
    env,
    developerIdentity,
    keyDependencies({
      rotateSystemKey: async (_env, requestIdentity) => {
        receivedIdentity = requestIdentity;
        return { id: "new-key-id", version: "v2" };
      },
    }),
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: "new-key-id", version: "v2" });
  assert.deepEqual(receivedIdentity, developerIdentity);
});
