import assert from "node:assert/strict";
import { test } from "vitest";

import { createSignedUpload, deleteCloudinaryImage, type CloudinaryEnv } from "./cloudinary";

const env: CloudinaryEnv = {
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-secret",
  CLOUDINARY_CLOUD_NAME: "test-cloud",
};

test("signed upload exposes no API secret and fixes the managed folder", async () => {
  const signed = await createSignedUpload(env);

  assert.equal(signed.apiKey, "test-key");
  assert.equal(signed.cloudName, "test-cloud");
  assert.equal(signed.folder, "abrigo-do-wlad/dogs");
  assert.match(signed.signature, /^[a-f0-9]{40}$/);
  assert.equal("apiSecret" in signed, false);
});

test("image deletion accepts only this account and managed folder", async () => {
  let requestUrl = "";
  let body: URLSearchParams | undefined;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    body = init?.body as URLSearchParams;
    return Response.json({ result: "ok" });
  }) as typeof fetch;

  await deleteCloudinaryImage(
    "https://res.cloudinary.com/test-cloud/image/upload/v123/abrigo-do-wlad/dogs/wlad.jpg",
    env,
    fetcher,
  );

  assert.equal(requestUrl, "https://api.cloudinary.com/v1_1/test-cloud/image/destroy");
  assert.equal(body?.get("public_id"), "abrigo-do-wlad/dogs/wlad");
  assert.match(body?.get("signature") ?? "", /^[a-f0-9]{40}$/);

  await assert.rejects(
    () => deleteCloudinaryImage(
      "https://res.cloudinary.com/other-cloud/image/upload/v1/abrigo-do-wlad/dogs/wlad.jpg",
      env,
      fetcher,
    ),
    /does not belong/,
  );
  await assert.rejects(
    () => deleteCloudinaryImage(
      "https://res.cloudinary.com/test-cloud/image/upload/v1/unmanaged/wlad.jpg",
      env,
      fetcher,
    ),
    /outside the managed dog folder/,
  );
});
