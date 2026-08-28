import type { CloudflareEnv } from "../_lib/env";
import { jsonResponse } from "../_lib/env";
import { getCurrentDogFeed, type DogFeed, type PublicDog } from "./feed";
import {
  getDogTombstone,
  isValidPublicDogId,
  type DogTombstone,
} from "./tombstone";

export type DogProfilePayload =
  | { state: "available"; dog: PublicDog }
  | { state: "unavailable"; tombstone: DogTombstone };

function tombstoneIsNewerThanFeed(
  tombstone: DogTombstone,
  feedGeneratedAt: string,
): boolean {
  return Date.parse(tombstone.removedAt) >= Date.parse(feedGeneratedAt);
}

function unavailableResponse(tombstone: DogTombstone): Response {
  return jsonResponse(410, {
    state: "unavailable",
    tombstone,
  } satisfies DogProfilePayload, {
    "Cache-Control": "public, max-age=300, s-maxage=3600",
  });
}

export async function getDogProfileResponse(
  request: Request,
  env: CloudflareEnv,
  dogId: string,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" },
    });
  }
  if (!isValidPublicDogId(dogId)) {
    return jsonResponse(400, { message: "Invalid dog ID." });
  }

  try {
    const tombstone = await getDogTombstone(env, dogId);
    let feed: DogFeed;
    try {
      feed = await getCurrentDogFeed(env);
    } catch (error) {
      if (tombstone) return unavailableResponse(tombstone);
      throw error;
    }

    const dog = feed.dogs.find((item) => item.id === dogId);
    if (
      tombstone &&
      (!dog || tombstoneIsNewerThanFeed(tombstone, feed.generatedAt))
    ) {
      return unavailableResponse(tombstone);
    }
    if (dog) {
      return jsonResponse(200, {
        state: "available",
        dog,
      } satisfies DogProfilePayload, {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      });
    }
    if (tombstone) return unavailableResponse(tombstone);

    return jsonResponse(404, { message: "Dog not found." });
  } catch (error) {
    console.error(JSON.stringify({
      event: "dogs.profile.request.failed",
      dogId,
      message: error instanceof Error ? error.message : "Unknown failure",
    }));
    return jsonResponse(503, { message: "Dog profile is temporarily unavailable." });
  }
}
