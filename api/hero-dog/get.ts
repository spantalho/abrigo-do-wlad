import { redis } from "../_lib/redis";
import type { IncomingMessage, ServerResponse } from "http";
import { validateRequest } from "../_lib/validation";
import { sendError, sendSuccess } from "../_lib/response";
import { HTTP_STATUS } from "../_lib/constants";

export default async function handler(
  _req: IncomingMessage,
  res: ServerResponse,
) {
  const isValid = await validateRequest(_req, res, {
    expectedMethod: "GET",
    validateOrigin: false,
    validateContentType: false,
    validateRequestSize: false,
  });

  if (!isValid) {
    return;
  }

  try {
    const dog = await redis.get("hero-dog");

    if (dog) {
      sendSuccess(res, "Hero dog fetched successfully.", dog);
    } else {
      sendError(res, HTTP_STATUS.NOT_FOUND, "Hero dog not found.");
    }
  } catch (err) {
    console.error(err);
    sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Error fetching hero dog.",
    );
  }
}
