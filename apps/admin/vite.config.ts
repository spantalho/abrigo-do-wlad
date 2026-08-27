import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command, isPreview, mode }) => {
  const enableMockAdmin = command === "serve" && mode === "mock";
  const enableLocalWorker = command === "serve" && !isPreview && !enableMockAdmin;

  if (mode === "mock" && command !== "serve") {
    throw new Error("O modo mock do painel só pode ser usado pelo servidor de desenvolvimento.");
  }

  return {
    define: {
      "import.meta.env.ADMIN_MOCK_MODE": JSON.stringify(enableMockAdmin),
    },
    envDir: enableMockAdmin ? false : path.resolve(__dirname, "../.."),
    plugins: [
      react(),
      ...(enableLocalWorker
        ? [cloudflare({ configPath: path.resolve(__dirname, "wrangler.jsonc") })]
        : []),
    ],
  };
});
