import { onRequest as createAdoptionApplication } from "../shared/api/adoption/create";
import { getEnvValue, jsonResponse, type CloudflareEnv } from "../shared/api/_lib/env";
import { onRequest as getHeroDog } from "../shared/api/hero-dog/get";
import { onRequest as sendDebugEmail } from "../shared/api/tests/email";

export type AppEnv = CloudflareEnv & {
  ASSETS: Pick<Env["ASSETS"], "fetch">;
};

function secureAssetResponse(response: Response): Response {
  const secured = new Response(response.body, response);
  secured.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("X-Frame-Options", "DENY");
  return secured;
}

async function handleApiRequest(request: Request, env: AppEnv): Promise<Response> {
  const pathname = new URL(request.url).pathname;

  if (pathname === "/api/hero-dog") {
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

    return secureAssetResponse(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;
