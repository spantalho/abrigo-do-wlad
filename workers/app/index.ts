import { onRequest as createAdoptionApplication } from "../shared/api/adoption/create";
import { getEnvValue, jsonResponse, type CloudflareEnv } from "../shared/api/_lib/env";
import { onRequest as getHeroDog } from "../shared/api/hero-dog/get";
import { onRequest as sendDebugEmail } from "../shared/api/tests/email";

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export type AppEnv = CloudflareEnv & {
  ASSETS: AssetsBinding;
};

async function handleApiRequest(request: Request, env: AppEnv): Promise<Response> {
  const pathname = new URL(request.url).pathname;

  if (pathname === "/api/hero-dog/get") {
    return getHeroDog({ request, env });
  }

  if (pathname === "/api/adoption/create") {
    return createAdoptionApplication({ request, env });
  }

  if (
    pathname === "/api/tests/email" &&
    getEnvValue(env, "NODE_ENV") === "development"
  ) {
    return sendDebugEmail({ request, env });
  }

  return jsonResponse(404, { message: "Route not found." });
}

export default {
  async fetch(request: Request, env: AppEnv): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
