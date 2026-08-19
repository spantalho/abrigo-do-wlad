export type CloudflareEnv = Record<string, unknown>;

export function getEnvValue(
  env: CloudflareEnv | undefined,
  key: string,
  fallback?: string,
): string | undefined {
  const envValue = env?.[key];
  const normalizedEnvValue = typeof envValue === "string" ? envValue : undefined;

  return normalizedEnvValue ?? process.env[key] ?? fallback;
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
