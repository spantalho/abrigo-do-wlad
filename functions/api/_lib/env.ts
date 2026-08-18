export type CloudflareEnv = Record<string, string | undefined>;

export function getEnvValue(
  env: CloudflareEnv | undefined,
  key: string,
  fallback?: string,
): string | undefined {
  return env?.[key] ?? process.env[key] ?? fallback;
}

export function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}
