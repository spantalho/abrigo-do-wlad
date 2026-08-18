import { onRequest as getHeroDogHandler } from "./hero-dog/get";
import { onRequest as createAdoptionHandler } from "./adoption/create";
import { onRequest as debugEmailHandler } from "./tests/email";
import { onRequest as updateHeroDogHandler } from "./hero-dog/update";
import { jsonResponse } from "./_lib/env";

export async function onRequest({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/hero-dog/get") {
    return getHeroDogHandler({ request, env });
  }

  if (pathname === "/api/hero-dog/update") {
    return updateHeroDogHandler({ request, env });
  }

  if (pathname === "/api/adoption/create") {
    return createAdoptionHandler({ request, env });
  }

  if (pathname === "/api/tests/email") {
    return debugEmailHandler({ request, env });
  }

  return jsonResponse(404, {
    message: "Route not found.",
  });
}
