import test from "node:test";
import assert from "node:assert/strict";

import { sendError, sendSuccess } from "./response.ts";

test("sendSuccess returns a JSON Response in Cloudflare Pages format", async () => {
  const response = sendSuccess("OK", { id: 1 }, 201);

  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Content-Type"), "application/json");

  const json = await response.json();
  assert.deepEqual(json, {
    message: "OK",
    data: { id: 1 },
  });
});

test("sendError returns a structured JSON error payload", async () => {
  const response = sendError(400, "Bad request", { code: "INVALID_PAYLOAD" });

  assert.equal(response.status, 400);

  const json = await response.json();
  assert.deepEqual(json, {
    message: "Bad request",
    errors: { code: "INVALID_PAYLOAD" },
  });
});
