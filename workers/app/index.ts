import { onRequest as createAdoptionApplication } from "../shared/api/adoption/create";
import { getEnvValue, jsonResponse, type CloudflareEnv } from "../shared/api/_lib/env";
import { getDogFeedResponse } from "../shared/api/dogs/feed";
import {
  availableDogMetadata,
  dogProfilePath,
  missingDogMetadata,
  rewriteDogPageMetadata,
  unavailableDogMetadata,
  unavailableServiceMetadata,
  type DogPageMetadata,
} from "../shared/api/dogs/metadata";
import {
  getDogProfileResponse,
  resolveDogProfile,
} from "../shared/api/dogs/profile";
import { isValidPublicDogId } from "../shared/api/dogs/tombstone";
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

function dogPageId(pathname: string): string | null {
  if (!pathname.startsWith("/caes/")) return null;

  const match = pathname.match(/^\/caes\/([^/]+)(?:\/[^/]+)?\/?$/);
  return match?.[1] ?? "";
}

function responseWithStatus(response: Response, status: number): Response {
  return new Response(response.body, {
    status,
    headers: response.headers,
  });
}

async function renderDogPage(
  request: Request,
  env: AppEnv,
  metadata: DogPageMetadata,
  status: number,
): Promise<Response> {
  const asset = await env.ASSETS.fetch(request);
  const response = responseWithStatus(asset, status);
  response.headers.set(
    "Cache-Control",
    status === 200
      ? "public, max-age=60, s-maxage=300"
      : status === 410
        ? "public, max-age=300, s-maxage=3600"
        : status === 404
          ? "public, max-age=60, s-maxage=300"
          : "no-store",
  );
  if (status >= 400) {
    response.headers.set("X-Robots-Tag", metadata.robots);
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const rendered = contentType.includes("text/html")
    ? rewriteDogPageMetadata(response, metadata)
    : response;
  return secureAssetResponse(rendered);
}

async function handleDogPageRequest(
  request: Request,
  env: AppEnv,
  dogId: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return secureAssetResponse(await env.ASSETS.fetch(request));
  }

  if (!isValidPublicDogId(dogId)) {
    return renderDogPage(request, env, missingDogMetadata(), 404);
  }

  try {
    const profile = await resolveDogProfile(env, dogId);
    if (profile.state === "not_found") {
      return renderDogPage(request, env, missingDogMetadata(), 404);
    }

    const subject = profile.state === "available"
      ? profile.dog
      : profile.tombstone;
    const canonicalPath = dogProfilePath(subject.id, subject.nome);
    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== canonicalPath) {
      requestUrl.pathname = canonicalPath;
      return secureAssetResponse(Response.redirect(requestUrl, 308));
    }

    return profile.state === "available"
      ? renderDogPage(request, env, availableDogMetadata(profile.dog), 200)
      : renderDogPage(
        request,
        env,
        unavailableDogMetadata(profile.tombstone),
        410,
      );
  } catch (error) {
    console.error(JSON.stringify({
      event: "dogs.page.request.failed",
      dogId,
      message: error instanceof Error ? error.message : "Unknown failure",
    }));
    return renderDogPage(request, env, unavailableServiceMetadata(), 503);
  }
}

async function handleApiRequest(request: Request, env: AppEnv): Promise<Response> {
  const pathname = new URL(request.url).pathname;

  if (pathname === "/api/hero-dog") {
    return getHeroDog({ request, env });
  }

  if (pathname === "/api/dogs") {
    return getDogFeedResponse(request, env);
  }

  const dogProfileMatch = pathname.match(/^\/api\/dogs\/([^/]+)$/);
  if (dogProfileMatch) {
    return getDogProfileResponse(request, env, dogProfileMatch[1] ?? "");
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

    const requestedDogId = dogPageId(pathname);
    if (requestedDogId !== null) {
      return handleDogPageRequest(request, env, requestedDogId);
    }

    return secureAssetResponse(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;
