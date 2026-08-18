import { redis } from "../_lib/redis";
import { FieldPath } from "firebase-admin/firestore";
import { IncomingMessage, ServerResponse } from "http";

import { db } from "../_lib/firebase.js";
import { validateRequest } from "../_lib/validation";
import { validateAuthHeader } from "../_lib/security";
import { sendError, sendSuccess } from "../_lib/response";
import { HTTP_STATUS } from "../_lib/constants";

const DOGS_COLLECTION = "dogs";

async function getRandomDogFromServer() {
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

  // fallback if the query returns nothing (e.g., randomKey is past the last doc)
  if (snapshot.empty) {
    snapshot = await docRef.orderBy(FieldPath.documentId()).limit(1).get();
  }

  if (snapshot.empty) {
    return null;
  }

  const randomDoc = snapshot.docs[0];

  return { id: randomDoc.id, ...randomDoc.data() };
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const isValid = await validateRequest(req, res, {
    expectedMethod: "GET",
    skipRateLimit: true,
    validateOrigin: false,
    validateContentType: false,
    validateRequestSize: false,
  });

  if (!isValid) {
    return;
  }

  const authHeader = req.headers.authorization;
  if (!validateAuthHeader(authHeader, process.env.CRON_SECRET || "")) {
    sendError(res, HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    return;
  }

  try {
    const currentDog: any = await redis.get("hero-dog");
    let newDog;
    let attempts = 0;

    do {
      newDog = await getRandomDogFromServer();
      attempts++;
    } while (newDog && currentDog && newDog.id === currentDog.id && attempts < 3);

    if (newDog) {
      await redis.set("hero-dog", newDog);
      sendSuccess(res, "Hero dog updated!", { dog: newDog });
    } else {
      sendError(res, HTTP_STATUS.NOT_FOUND, "No dog found");
    }
  } catch (err) {
    console.error(err);
    sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Error updating hero dog",
    );
  }
}
