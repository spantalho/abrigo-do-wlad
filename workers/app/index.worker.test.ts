import { env } from "cloudflare:workers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker, { type AppEnv } from "./index";

const blockedFetch = vi.fn<typeof fetch>(async () => {
  throw new Error("External network access is disabled in Worker tests.");
});

function createEnv(): AppEnv {
  return {
    KV: env.KV,
    NODE_ENV: "production",
    ALLOWED_ORIGIN: "https://abrigo.test",
    RECAPTCHA_SECRET_KEY: "synthetic-recaptcha-secret",
    ASSETS: {
      async fetch(request: Request): Promise<Response> {
        return new Response(`asset:${new URL(request.url).pathname}`);
      },
    },
  };
}

function adoptionRequest(
  body = "{}",
  headers: Record<string, string> = {},
): Request {
  return new Request("https://abrigo.test/api/adoption/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://abrigo.test",
      "X-Forwarded-For": "203.0.113.42",
      ...headers,
    },
    body,
  });
}

describe("Worker app runtime", () => {
  beforeEach(async () => {
    await env.KV.delete("rate-limit:203.0.113.0");
    blockedFetch.mockClear();
    vi.stubGlobal("fetch", blockedFetch);
  });

  afterEach(() => {
    expect(blockedFetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("reads the hero dog through the local KV binding", async () => {
    await env.KV.put(
      "hero-dog",
      JSON.stringify({ id: "hero-runtime", nome: "Bidu" }),
    );

    const response = await worker.fetch(
      new Request("https://abrigo.test/api/hero-dog"),
      createEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Hero dog fetched successfully.",
      data: { id: "hero-runtime", nome: "Bidu" },
    });
  });

  it("keeps unknown API routes out of the SPA fallback", async () => {
    const response = await worker.fetch(
      new Request("https://abrigo.test/api/unknown"),
      createEnv(),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Route not found.",
    });
  });

  it("delegates non-API routes to the assets binding", async () => {
    const response = await worker.fetch(
      new Request("https://abrigo.test/sobre"),
      createEnv(),
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("asset:/sobre");
  });

  it("does not expose the debug email route in production", async () => {
    const response = await worker.fetch(
      new Request("https://abrigo.test/api/tests/email"),
      createEnv(),
    );

    expect(response.status).toBe(404);
  });

  it("rejects unsupported adoption methods before external boundaries", async () => {
    const response = await worker.fetch(
      new Request("https://abrigo.test/api/adoption/create"),
      createEnv(),
    );

    expect(response.status).toBe(405);
  });

  it("rejects origins that only prefix-match the allowed host", async () => {
    const response = await worker.fetch(
      adoptionRequest("{}", {
        Origin: "https://abrigo.test.attacker.example",
      }),
      createEnv(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message: "Forbidden: Invalid origin",
    });
  });

  it("rejects non-JSON adoption requests", async () => {
    const response = await worker.fetch(
      adoptionRequest("plain text", { "Content-Type": "text/plain" }),
      createEnv(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Invalid Content-Type",
    });
  });

  it("enforces the rate limit with the local KV binding", async () => {
    const appEnv = createEnv();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await worker.fetch(adoptionRequest(), appEnv);
      expect(response.status).toBe(400);
    }

    const response = await worker.fetch(adoptionRequest(), appEnv);

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      message: "Too many requests. Please try again later.",
    });
  });

  it("rejects an oversized body even without Content-Length", async () => {
    const oversizedBody = JSON.stringify({ value: "x".repeat(52 * 1024) });
    const request = adoptionRequest(oversizedBody);

    expect(request.headers.has("Content-Length")).toBe(false);

    const response = await worker.fetch(request, createEnv());

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      message: "Request entity too large",
    });
  });
});
