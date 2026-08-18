import test from "node:test";
import assert from "node:assert/strict";

import { redis } from "./redis.ts";

test("redis handles object values and counter operations", async () => {
  const key = "test:redis:store";

  await redis.set(key, { name: "Wlad", visits: 1 });

  const value = await redis.get<{ name: string; visits: number }>(key);
  assert.deepEqual(value, { name: "Wlad", visits: 1 });

  const count = await redis.incr("test:redis:counter");
  assert.equal(count, 1);

  const ttl = await redis.expire("test:redis:counter", 60);
  assert.equal(ttl, 1);
});
