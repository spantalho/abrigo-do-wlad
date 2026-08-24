import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => {
  const enableLocalWorker = command === "serve" && !isPreview;

  return {
    envDir: path.resolve(__dirname, "../.."),
    plugins: [
      react(),
      ...(enableLocalWorker
        ? [cloudflare({ configPath: path.resolve(__dirname, "wrangler.jsonc") })]
        : []),
    ],
  };
});
