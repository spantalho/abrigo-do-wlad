import assert from "node:assert/strict";
import { test } from "vitest";

import { dogProfilePath } from "./dogUrl";

test("builds a short dog profile path from its immutable public slug", () => {
  assert.equal(
    dogProfilePath("pacoca-2"),
    "/caes/pacoca-2",
  );
});
