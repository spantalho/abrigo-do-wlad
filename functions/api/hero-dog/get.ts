import { getRedisStore } from "../_lib/redis";
import { HTTP_STATUS } from "../_lib/constants";
import { jsonResponse, getEnvValue } from "../_lib/env";

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) {
  if (request.method !== "GET") {
    return jsonResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
      message: "Method not allowed",
    });
  }

  const redisUrl =
    getEnvValue(env, "REDIS_URL") ||
    getEnvValue(env, "CLOUDFLARE_REDIS_URL");

  if (!redisUrl) {
    return jsonResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: "Redis configuration is missing.",
    });
  }

  try {
    const redis = getRedisStore(env);
    const dog = await redis.get("hero-dog");

    if (dog) {
      return jsonResponse(HTTP_STATUS.OK, {
        message: "Hero dog fetched successfully.",
        data: dog,
      });
    }

    return jsonResponse(HTTP_STATUS.NOT_FOUND, {
      message: "Hero dog not found.",
    });
  } catch (err) {
    console.error("Error fetching hero dog:", err);

    return jsonResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: "Error fetching hero dog.",
    });
  }
}
