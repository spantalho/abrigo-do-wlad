import Redis from "ioredis";

type RedisValue = string | number | boolean | object | null | undefined;

type RedisStore = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: RedisValue) => Promise<"OK">;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
};

function toRedisPayload(value: RedisValue): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "null";
  }

  return JSON.stringify(value);
}

function fromRedisPayload<T>(value: string | null): T | null {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

const redisUrl = process.env.REDIS_URL || process.env.CLOUDFLARE_REDIS_URL;
const redisClient = redisUrl ? new Redis(redisUrl, { lazyConnect: true }) : null;

const mockStore = new Map<string, RedisValue>();

mockStore.set("hero-dog", {
  id: "mock-hero-123",
  nome: "David Bowie (Mock Dev)",
  descricao: "Cachorro diário do cache em memória",
});

const mockRedis: RedisStore = {
  get: async <T>(key: string): Promise<T | null> => {
    console.log(`[REDIS MOCK] GET "${key}"`);
    const value = mockStore.get(key);
    return value === undefined ? null : (value as T);
  },
  set: async (key: string, value: RedisValue): Promise<"OK"> => {
    console.log(
      `[REDIS MOCK] SET "${key}" =`,
      value && typeof value === "object"
        ? Object.keys(value as Record<string, unknown>)
        : value,
    );
    mockStore.set(key, value);
    return "OK";
  },
  incr: async (key: string): Promise<number> => {
    const current = Number(mockStore.get(key) ?? 0);
    const next = current + 1;
    mockStore.set(key, next);
    return next;
  },
  expire: async (key: string, seconds: number): Promise<number> => {
    console.log(`[REDIS MOCK] EXPIRE "${key}" = ${seconds}s`);
    return mockStore.has(key) ? 1 : 0;
  },
};

const liveRedis: RedisStore = {
  get: async <T>(key: string): Promise<T | null> => {
    if (!redisClient) {
      throw new Error("Redis client is not configured.");
    }

    const value = await redisClient.get(key);
    return fromRedisPayload<T>(value);
  },
  set: async (key: string, value: RedisValue): Promise<"OK"> => {
    if (!redisClient) {
      throw new Error("Redis client is not configured.");
    }

    await redisClient.set(key, toRedisPayload(value));
    return "OK";
  },
  incr: async (key: string): Promise<number> => {
    if (!redisClient) {
      throw new Error("Redis client is not configured.");
    }

    return Number(await redisClient.incr(key));
  },
  expire: async (key: string, seconds: number): Promise<number> => {
    if (!redisClient) {
      throw new Error("Redis client is not configured.");
    }

    return Number(await redisClient.expire(key, seconds));
  },
};

export const redis: RedisStore = redisClient ? liveRedis : mockRedis;
export { redisClient };
