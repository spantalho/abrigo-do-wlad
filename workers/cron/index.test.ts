import assert from "node:assert/strict";
import { test } from "vitest";

import { runCronJobs, type CronDependencies } from "./index";

const controller: ScheduledController = {
  cron: "0 3 * * *",
  scheduledTime: Date.parse("2026-08-21T03:00:00.000Z"),
  noRetry() {},
};

test("cron runs hero rotation and LGPD cleanup in delete mode", async () => {
  const calls: string[] = [];
  const dependencies: CronDependencies = {
    async updateHeroDog() {
      calls.push("hero");
      return { status: 200, body: { message: "ok" } };
    },
    async cleanupExpiredAdoptionApplications(_env, options) {
      calls.push(`cleanup:${options.cutoff?.toISOString()}`);
      return {
        batches: 1,
        cutoff: options.cutoff?.toISOString() ?? "",
        deleted: 2,
        hasMore: false,
        matched: 2,
      };
    },
  };

  await runCronJobs(controller, { ADOPTION_CLEANUP_MODE: "delete" }, dependencies);

  assert.deepEqual(calls.sort(), [
    "cleanup:2026-08-21T03:00:00.000Z",
    "hero",
  ]);
});

test("cron leaves destructive cleanup disabled by default", async () => {
  let cleanupCalled = false;
  const dependencies: CronDependencies = {
    async updateHeroDog() {
      return { status: 200, body: { message: "ok" } };
    },
    async cleanupExpiredAdoptionApplications() {
      cleanupCalled = true;
      throw new Error("must not run");
    },
  };

  await runCronJobs(controller, {}, dependencies);
  assert.equal(cleanupCalled, false);
});

test("cron waits for both jobs and reports every failure", async () => {
  let cleanupFinished = false;
  const dependencies: CronDependencies = {
    async updateHeroDog() {
      return { status: 500, body: { message: "hero failed" } };
    },
    async cleanupExpiredAdoptionApplications() {
      cleanupFinished = true;
      throw new Error("cleanup failed");
    },
  };

  await assert.rejects(
    () => runCronJobs(controller, { ADOPTION_CLEANUP_MODE: "delete" }, dependencies),
    /hero-dog: status 500.*adoption-cleanup: cleanup failed/,
  );
  assert.equal(cleanupFinished, true);
});
