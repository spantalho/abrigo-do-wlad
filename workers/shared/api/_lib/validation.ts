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
  req: Request,
  options?: {
    requireAuth?: boolean;
    expectedMethod?: string;
    skipRateLimit?: boolean;
    validateOrigin?: boolean;
    validateContentType?: boolean;
    validateRequestSize?: boolean;
  },
  env?: Record<string, string | undefined>,
): Promise<Response | null> {
  const method = options?.expectedMethod || "POST";
  const shouldValidateBody = ["POST", "PUT", "PATCH"].includes(method);
  const shouldValidateOrigin = options?.validateOrigin ?? true;
  const shouldValidateContentType =
    options?.validateContentType ?? shouldValidateBody;
  const shouldValidateRequestSize =
    options?.validateRequestSize ?? shouldValidateBody;

  if (req.method !== method) {
    return sendError(HTTP_STATUS.METHOD_NOT_ALLOWED, "Method not allowed");
  }

  const clientIp = getClientIp(req);

  if (!options?.skipRateLimit) {
    const isAllowed = await checkRateLimit(clientIp, env);
    if (!isAllowed) {
      return sendError(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        "Too many requests. Please try again later.",
      );
    }
  }

  const contentLength = req.headers.get("content-length") ?? undefined;

  if (
    shouldValidateRequestSize &&
    contentLength !== undefined &&
    !validateRequestSize(contentLength)
  ) {
    return sendError(HTTP_STATUS.PAYLOAD_TOO_LARGE, "Request entity too large");
  }

  if (shouldValidateOrigin && !validateOrigin(req, env)) {
    return sendError(HTTP_STATUS.FORBIDDEN, "Forbidden: Invalid origin");
  }

  if (shouldValidateContentType && !validateContentType(req)) {
    return sendError(HTTP_STATUS.BAD_REQUEST, "Invalid Content-Type");
  }

  return null;
}
