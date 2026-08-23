import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "");
    const requiredBuildVars = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_APP_ID",
      "VITE_RECAPTCHA_PUBLIC_KEY",
    ];
    const missingBuildVars = requiredBuildVars.filter(
      (name) => !env[name]?.trim(),
    );

    if (missingBuildVars.length > 0) {
      throw new Error(
        `Build interrompido: defina as variáveis públicas no ambiente de build do Worker: ${missingBuildVars.join(", ")}`,
      );
    }
  }

  return {
    plugins: [react(), cloudflare({ configPath: "./wrangler.jsonc" })],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
