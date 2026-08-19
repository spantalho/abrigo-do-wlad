import { getEnvValue, type CloudflareEnv } from "./env";

type KvValue = string | number | boolean | object | null | undefined;

type KvStore = {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
};

type KvCacheStore = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: KvValue) => Promise<"OK">;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
};

function toKvPayload(value: KvValue): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "null";
  }

  return JSON.stringify(value);
}

function fromKvPayload<T>(value: string | null): T | null {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

function isKvStore(value: unknown): value is KvStore {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    "put" in value &&
    typeof (value as KvStore).get === "function" &&
    typeof (value as KvStore).put === "function"
  );
}

function getKvBinding(env?: CloudflareEnv): KvStore | null {
  const candidates = [
    env?.CACHE_KV,
    env?.APP_CACHE_KV,
    env?.KV,
  ];

  for (const candidate of candidates) {
    if (isKvStore(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function getKvStore(env?: CloudflareEnv): KvCacheStore {
  const kv = getKvBinding(env);

  const mockStore = new Map<string, string>();
  const mockExpirations = new Map<string, number>();

  function isExpired(key: string): boolean {
    const expiresAt = mockExpirations.get(key);

    if (!expiresAt) {
      return false;
    }

    if (Date.now() > expiresAt) {
      mockExpirations.delete(key);
      mockStore.delete(key);
      return true;
    }

    return false;
  }

  mockStore.set(
    "hero-dog",
    JSON.stringify({
      id: "mock-hero-123",
      nome: "David Bowie (Mock Dev)",
      descricao: "Cachorro diario do cache em memoria",
    }),
  );

  const mockKv: KvCacheStore = {
    get: async <T>(key: string): Promise<T | null> => {
      console.log(`[KV MOCK] GET "${key}"`);

      if (isExpired(key)) {
        return null;
      }

      const value = mockStore.get(key);
      return fromKvPayload<T>(value ?? null);
    },
    set: async (key: string, value: KvValue): Promise<"OK"> => {
      mockExpirations.delete(key);
      console.log(
        `[KV MOCK] SET "${key}" =`,
        value && typeof value === "object"
          ? Object.keys(value as Record<string, unknown>)
          : value,
      );
      mockStore.set(key, toKvPayload(value));
      return "OK";
    },
    incr: async (key: string): Promise<number> => {
      if (isExpired(key)) {
        mockStore.set(key, "1");
        return 1;
      }

      const current = Number(mockStore.get(key) ?? 0);
      const next = current + 1;
      mockStore.set(key, String(next));
      return next;
    },
    expire: async (key: string, seconds: number): Promise<number> => {
      console.log(`[KV MOCK] EXPIRE "${key}" = ${seconds}s`);
      if (!mockStore.has(key)) {
        return 0;
      }

      mockExpirations.set(key, Date.now() + seconds * 1000);
      return mockStore.has(key) ? 1 : 0;
    },
  };

  const liveKv: KvCacheStore = {
    get: async <T>(key: string): Promise<T | null> => {
      if (!kv) {
        throw new Error("Cloudflare KV binding is not configured.");
      }

      const value = await kv.get(key);
      return fromKvPayload<T>(value);
    },
    set: async (key: string, value: KvValue): Promise<"OK"> => {
      if (!kv) {
        throw new Error("Cloudflare KV binding is not configured.");
      }

      await kv.put(key, toKvPayload(value));
      return "OK";
    },
    incr: async (key: string): Promise<number> => {
      if (!kv) {
        throw new Error("Cloudflare KV binding is not configured.");
      }

      const current = Number(await kv.get(key)) || 0;
      const next = current + 1;

      await kv.put(key, String(next));
      return next;
    },
    expire: async (key: string, seconds: number): Promise<number> => {
      if (!kv) {
        throw new Error("Cloudflare KV binding is not configured.");
      }

      const current = await kv.get(key);

      if (current === null) {
        return 0;
      }

      await kv.put(key, current, { expirationTtl: seconds });
      return 1;
    },
  };

  if (!kv) {
    if (env && getEnvValue(env, "NODE_ENV") === "production") {
      throw new Error("Cloudflare KV binding not found in production environment.");
    }

    if (getEnvValue(env, "NODE_ENV") !== "production") {
      console.warn(
        "Cloudflare KV binding not found. Falling back to in-memory mock store.",
      );
    }
    return mockKv;
  }

  return liveKv;
}

export const kv = getKvStore();
