import assert from "node:assert/strict";
import test from "node:test";

import worker, { type AppEnv } from "./index";

function createEnv(): AppEnv {
  return {
    ASSETS: {
      async fetch(request: Request): Promise<Response> {
        return new Response(`asset:${new URL(request.url).pathname}`);
      },
    },
    NODE_ENV: "production",
  };
}

test("unknown API routes return JSON 404 without falling back to the SPA", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/api/unknown"),
    createEnv(),
  );

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { message: "Route not found." });
});

test("non-API routes are delegated to the Static Assets binding", async () => {
  const response = await worker.fetch(
    new Request("https://example.com/sobre"),
    createEnv(),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset:/sobre");
});
