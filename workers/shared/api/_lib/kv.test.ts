import { test } from "vitest";
import assert from "node:assert/strict";

import { kv } from "./kv.ts";

test("kv handles object values and counter operations", async () => {
  const key = "test:kv:store";

  await kv.set(key, { name: "Wlad", visits: 1 });

  const value = await kv.get<{ name: string; visits: number }>(key);
  assert.deepEqual(value, { name: "Wlad", visits: 1 });

  const count = await kv.incr("test:kv:counter");
  assert.equal(count, 1);

  const ttl = await kv.expire("test:kv:counter", 60);
  assert.equal(ttl, 1);
});
