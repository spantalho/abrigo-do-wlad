export type CloudflareStringEnvKey = {
  [Key in keyof Env]: Env[Key] extends string ? Key : never;
}[keyof Env] & string;

type KvBinding = {
  get(key: string): Promise<string | null>;
  put: Env["KV"]["put"];
};
type AssetsBinding = Pick<Env["ASSETS"], "fetch">;

export type CloudflareEnv = Partial<Pick<Env, CloudflareStringEnvKey>> & {
  KV?: KvBinding;
  ASSETS?: AssetsBinding;
};

export function getEnvValue(
  env: CloudflareEnv | undefined,
  key: CloudflareStringEnvKey,
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
