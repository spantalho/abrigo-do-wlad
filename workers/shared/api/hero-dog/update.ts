import { getKvStore } from "../_lib/kv";
import { FieldPath } from "firebase-admin/firestore";
import { getDb } from "../_lib/firebase";
import { HTTP_STATUS } from "../_lib/constants";
import type { CloudflareEnv } from "../_lib/env";

const DOGS_COLLECTION = "dogs";

type HeroDog = {
  id: string;
  [key: string]: unknown;
};

async function getRandomDogFromServer(
  env?: CloudflareEnv,
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

export async function updateHeroDog(env?: CloudflareEnv) {
  try {
    const kvStore = getKvStore(env);
    const currentDog = await kvStore.get<HeroDog | null>("hero-dog");
    let newDog: HeroDog | null = null;
    let attempts = 0;

    do {
      newDog = await getRandomDogFromServer(env);
      attempts++;
    } while (newDog && currentDog && newDog.id === currentDog.id && attempts < 3);

    if (newDog) {
      await kvStore.set("hero-dog", newDog);
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
