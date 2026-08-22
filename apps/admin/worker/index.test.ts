import assert from "node:assert/strict";
import { test } from "vitest";

import { secureAssetResponse } from "./index";

test("admin assets prevent search engine indexing", async () => {
  const response = secureAssetResponse(
    new Response("<!doctype html><title>Admin</title>", {
      headers: { "Content-Type": "text/html" },
    }),
  );

  assert.equal(
    response.headers.get("X-Robots-Tag"),
    "noindex, nofollow, noarchive, nosnippet",
  );
});
