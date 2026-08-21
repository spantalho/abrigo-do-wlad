import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.jsonc",
      },
    }),
  ],
  test: {
    name: "worker",
    include: ["workers/**/*.worker.test.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage/worker",
      include: ["workers/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
  },
});
