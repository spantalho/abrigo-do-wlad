import type { ServerResponse } from "http";
import { HTTP_STATUS } from "./constants";

interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
  errors?: unknown;
}

export function sendResponse<T = unknown>(
  res: ServerResponse,
  statusCode: number,
  message: string,
  data?: T,
  errors?: unknown,
): void {
  const response: ApiResponse<T> = {
    message,
    ...(data !== undefined ? { data } : {}),
    ...(errors !== undefined ? { errors } : {}),
  };

  res.setHeader("Content-Type", "application/json");
  res.statusCode = statusCode;
  res.end(JSON.stringify(response));
}

export function sendSuccess<T = unknown>(
  res: ServerResponse,
  message: string,
  data?: T,
  statusCode: number = HTTP_STATUS.OK,
): void {
  sendResponse(res, statusCode, message, data);
}

export function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string,
  errors?: unknown,
): void {
  sendResponse(res, statusCode, message, undefined, errors);
}
