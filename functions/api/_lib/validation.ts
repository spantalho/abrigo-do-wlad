import type { IncomingMessage, ServerResponse } from "http";
import { HTTP_STATUS } from "./constants";
import {
  getClientIp,
  checkRateLimit,
  validateOrigin,
  validateContentType,
  validateRequestSize,
} from "./security";
import { sendError } from "./response";

export async function validateRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options?: {
    requireAuth?: boolean;
    expectedMethod?: string;
    skipRateLimit?: boolean;
    validateOrigin?: boolean;
    validateContentType?: boolean;
    validateRequestSize?: boolean;
  },
): Promise<boolean> {
  const method = options?.expectedMethod || "POST";
  const shouldValidateBody = ["POST", "PUT", "PATCH"].includes(method);
  const shouldValidateOrigin = options?.validateOrigin ?? true;
  const shouldValidateContentType =
    options?.validateContentType ?? shouldValidateBody;
  const shouldValidateRequestSize =
    options?.validateRequestSize ?? shouldValidateBody;

  // Validar método HTTP
  if (req.method !== method) {
    sendError(res, HTTP_STATUS.METHOD_NOT_ALLOWED, "Method not allowed");
    return false;
  }

  const clientIp = getClientIp(req);

  // Rate limiting (skip para operações não-sensíveis)
  if (!options?.skipRateLimit) {
    const isAllowed = await checkRateLimit(clientIp);
    if (!isAllowed) {
      sendError(
        res,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        "Too many requests. Please try again later.",
      );
      return false;
    }
  }

  // Validar tamanho
  const contentLength = Array.isArray(req.headers["content-length"])
    ? req.headers["content-length"][0]
    : req.headers["content-length"];

  if (
    shouldValidateRequestSize &&
    contentLength !== undefined &&
    !validateRequestSize(contentLength)
  ) {
    sendError(res, HTTP_STATUS.PAYLOAD_TOO_LARGE, "Request entity too large");
    return false;
  }

  // Validar origin
  if (shouldValidateOrigin && !validateOrigin(req)) {
    sendError(res, HTTP_STATUS.FORBIDDEN, "Forbidden: Invalid origin");
    return false;
  }

  // Validar Content-Type
  if (shouldValidateContentType && !validateContentType(req)) {
    sendError(res, HTTP_STATUS.BAD_REQUEST, "Invalid Content-Type");
    return false;
  }

  return true;
}
