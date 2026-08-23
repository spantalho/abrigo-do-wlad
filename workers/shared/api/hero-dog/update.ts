import { getKvStore } from "../_lib/kv";
import {
  createFirestoreClient,
  createFirestoreDocumentId,
  type FirestoreRestClient,
} from "../_lib/firestore";
import { HTTP_STATUS } from "../_lib/constants";
import type { CloudflareEnv } from "../_lib/env";

const DOGS_COLLECTION = "dogs";

type HeroDog = {
  id: string;
  [key: string]: unknown;
};

async function getRandomDogFromServer(
  firestore: FirestoreRestClient,
): Promise<HeroDog | null> {
  const randomKey = createFirestoreDocumentId();
  const randomDocument =
    (await firestore.findFirstDocument<HeroDog>(DOGS_COLLECTION, randomKey)) ??
    (await firestore.findFirstDocument<HeroDog>(DOGS_COLLECTION));

  return randomDocument
    ? { ...randomDocument.data, id: randomDocument.id }
    : null;
}

export async function updateHeroDog(env?: CloudflareEnv) {
  try {
    const kvStore = getKvStore(env);
    const firestore = createFirestoreClient(env);
    const currentDog = await kvStore.get<HeroDog | null>("hero-dog");
    let newDog: HeroDog | null = null;
    let attempts = 0;

    do {
      newDog = await getRandomDogFromServer(firestore);
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
