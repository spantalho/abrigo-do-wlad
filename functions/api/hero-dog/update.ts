import { getRedisStore } from "../_lib/redis";
import { FieldPath } from "firebase-admin/firestore";
import { getDb } from "../_lib/firebase";
import { validateAuthHeader } from "../_lib/security";
import { HTTP_STATUS } from "../_lib/constants";
import { getEnvValue, jsonResponse } from "../_lib/env";

const DOGS_COLLECTION = "dogs";

type HeroDog = {
  id: string;
  [key: string]: unknown;
};

async function getRandomDogFromServer(
  env?: Record<string, string | undefined>,
): Promise<HeroDog | null> {
  const db = getDb(env);
  const docRef = db.collection(DOGS_COLLECTION);

  const countSnapshot = await docRef.count().get();
  const count = countSnapshot.data().count;

  if (count === 0) {
    return null;
  }

  const randomKey = docRef.doc().id;

  let snapshot = await docRef
    .where(FieldPath.documentId(), ">=", randomKey)
    .limit(1)
    .get();

  if (snapshot.empty) {
    snapshot = await docRef.orderBy(FieldPath.documentId()).limit(1).get();
  }

  if (snapshot.empty) {
    return null;
  }

  const randomDoc = snapshot.docs[0];

  return { id: randomDoc.id, ...randomDoc.data() };
}

export async function updateHeroDog(env?: Record<string, string | undefined>) {
  try {
    const redis = getRedisStore(env);
    const currentDog = await redis.get<HeroDog | null>("hero-dog");
    let newDog: HeroDog | null = null;
    let attempts = 0;

    do {
      newDog = await getRandomDogFromServer(env);
      attempts++;
    } while (newDog && currentDog && newDog.id === currentDog.id && attempts < 3);

    if (newDog) {
      await redis.set("hero-dog", newDog);
      return {
        status: HTTP_STATUS.OK,
        body: {
          message: "Hero dog updated!",
          data: { dog: newDog },
        },
      };
    }

    return {
      status: HTTP_STATUS.NOT_FOUND,
      body: {
        message: "No dog found",
      },
    };
  } catch (err) {
    console.error("Error updating hero dog:", err);
    return {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      body: {
        message: "Error updating hero dog",
      },
    };
  }
}

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

  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = getEnvValue(env, "CRON_SECRET") || "";

  if (!validateAuthHeader(authHeader, cronSecret)) {
    return jsonResponse(HTTP_STATUS.UNAUTHORIZED, {
      message: "Unauthorized",
    });
  }

  const result = await updateHeroDog(env);
  return jsonResponse(result.status, result.body);
}

export async function scheduled({
  cron,
  env,
}: {
  cron: string;
  env: Record<string, string | undefined>;
}) {
  console.log(`Scheduled hero-dog update triggered via cron: ${cron}`);

  const result = await updateHeroDog(env);
  return jsonResponse(result.status, result.body);
}
