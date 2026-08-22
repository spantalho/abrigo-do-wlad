import assert from "node:assert/strict";
import { test } from "vitest";

import type { AccessIdentity } from "./access";
import { handleAdminApi } from "./admin-api";

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
