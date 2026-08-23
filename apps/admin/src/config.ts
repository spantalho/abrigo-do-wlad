export const PUBLIC_APP_URL =
  import.meta.env.VITE_PUBLIC_APP_URL || "https://abrigodowlad.com.br";

// Fluxo ainda em validação: não deve ser incluído nos artefatos publicados.
export const ADMIN_ADOPTION_WORKFLOW_ENABLED =
  import.meta.env.MODE === "development";
