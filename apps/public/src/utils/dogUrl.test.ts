import assert from "node:assert/strict";
import { test } from "vitest";

import { dogProfilePath, dogSlug } from "./dogUrl";

test("creates stable URL-safe dog slugs", () => {
  assert.equal(dogSlug("  Paçoca & Café  "), "pacoca-cafe");
  assert.equal(dogSlug("LÚNA!!!"), "luna");
  assert.equal(dogSlug("🐶"), "cao");
});

test("builds a dog profile path from the immutable id and display name", () => {
  assert.equal(
    dogProfilePath("firestore-dog_123", "Paçoca"),
    "/caes/firestore-dog_123/pacoca",
  );
});
