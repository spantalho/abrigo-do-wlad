import assert from "node:assert/strict";
import { test } from "vitest";

import type { AccessIdentity } from "./access";
import { handleAdminApi, type AdminApiDependencies } from "./admin-api";
import type { AdminNotification, NotificationInput } from "./notifications";

const identity: AccessIdentity = {
  email: "administrator@example.test",
  role: "administrator",
  subject: "test-subject",
};
const env = {
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-secret",
  CLOUDINARY_CLOUD_NAME: "test-cloud",
  FIREBASE_PROJECT_ID: "test-project",
} as Env;

const developerIdentity: AccessIdentity = {
  email: "developer@example.test",
  role: "developer",
  subject: "developer-subject",
};

function notificationResponse(
  input: NotificationInput,
  requestIdentity: AccessIdentity,
): AdminNotification {
  return {
    ...input,
    target: "admin",
    updatedAt: "2026-08-24T12:00:00.000Z",
    author: requestIdentity.email,
    expiresAt:
      input.expiration === "until_deleted"
        ? null
        : "2026-08-24T18:00:00.000Z",
  };
}

function keyDependencies(
  overrides: Partial<AdminApiDependencies> = {},
): AdminApiDependencies {
  return {
    listSystemKeys: async () => [],
    rotateSystemKey: async () => ({ id: "key-id", version: "v2" }),
    getAdminNotification: async () => null,
    saveAdminNotification: async (_env, input, requestIdentity) =>
      notificationResponse(input, requestIdentity),
    deleteAdminNotification: async () => undefined,
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

test("dog updates reject more than six photos before accessing Firestore", async () => {
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/dogs/123", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.test",
      },
      body: JSON.stringify({
        fotos: Array.from(
          { length: 7 },
          (_, index) => `https://images.example.test/dog-${index}.jpg`,
        ),
      }),
    }),
    env,
    identity,
  );

  assert.equal(response.status, 400);
  assert.equal(
    (await response.json() as { error: string }).error,
    "Um cachorro pode ter no máximo 6 fotos.",
  );
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

test("administrator identities can read the current admin notification", async () => {
  const notification = {
    message: "Manutenção programada para hoje.",
    type: "info" as const,
    target: "admin" as const,
    updatedAt: "2026-08-24T12:00:00.000Z",
    author: developerIdentity.email,
    expiration: "until_deleted" as const,
    expiresAt: null,
  };
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/notifications"),
    env,
    identity,
    keyDependencies({ getAdminNotification: async () => notification }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), notification);
});

test("administrator identities cannot change the admin notification", async () => {
  let called = false;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.test",
      },
      body: JSON.stringify({
        message: "Alerta",
        type: "urgent",
        expiration: "1h",
      }),
    }),
    env,
    identity,
    keyDependencies({
      saveAdminNotification: async (_env, input, requestIdentity) => {
        called = true;
        return notificationResponse(input, requestIdentity);
      },
    }),
  );

  assert.equal(response.status, 403);
  assert.equal(called, false);
});

test("developer identities can replace the single admin notification", async () => {
  let receivedInput: NotificationInput | undefined;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.test",
      },
      body: JSON.stringify({
        message: "  Atenção ao prazo.  ",
        type: "urgent",
        expiration: "6h",
      }),
    }),
    env,
    developerIdentity,
    keyDependencies({
      saveAdminNotification: async (_env, input, requestIdentity) => {
        receivedInput = input;
        return notificationResponse(input, requestIdentity);
      },
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(receivedInput, {
    message: "Atenção ao prazo.",
    type: "urgent",
    expiration: "6h",
  });
  assert.deepEqual(await response.json(), {
    message: "Atenção ao prazo.",
    type: "urgent",
    target: "admin",
    updatedAt: "2026-08-24T12:00:00.000Z",
    author: developerIdentity.email,
    expiration: "6h",
    expiresAt: "2026-08-24T18:00:00.000Z",
  });
});

test("notification updates reject unsupported types", async () => {
  let called = false;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.test",
      },
      body: JSON.stringify({
        message: "Alerta",
        type: "critical",
        expiration: "1h",
      }),
    }),
    env,
    developerIdentity,
    keyDependencies({
      saveAdminNotification: async (_env, input, requestIdentity) => {
        called = true;
        return notificationResponse(input, requestIdentity);
      },
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("notification updates reject unsupported expiration options", async () => {
  let called = false;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://admin.example.test",
      },
      body: JSON.stringify({
        message: "Alerta",
        type: "info",
        expiration: "24h",
      }),
    }),
    env,
    developerIdentity,
    keyDependencies({
      saveAdminNotification: async (_env, input, requestIdentity) => {
        called = true;
        return notificationResponse(input, requestIdentity);
      },
    }),
  );

  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("developer identities can remove the admin notification", async () => {
  let receivedIdentity: AccessIdentity | undefined;
  const response = await handleAdminApi(
    new Request("https://admin.example.test/api/admin/notifications", {
      method: "DELETE",
      headers: { Origin: "https://admin.example.test" },
    }),
    env,
    developerIdentity,
    keyDependencies({
      deleteAdminNotification: async (_env, requestIdentity) => {
        receivedIdentity = requestIdentity;
      },
    }),
  );

  assert.equal(response.status, 204);
  assert.deepEqual(receivedIdentity, developerIdentity);
});
