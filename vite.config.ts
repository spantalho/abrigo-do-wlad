import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "");
    const requiredFirebaseVars = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_APP_ID"
    ];
    const missingFirebaseVars = requiredFirebaseVars.filter((name) => !env[name]?.trim());

    if (missingFirebaseVars.length > 0) {
      throw new Error(
        `Build interrompido: defina as variáveis do Firebase no ambiente de build do Pages: ${missingFirebaseVars.join(", ")}`
      );
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});