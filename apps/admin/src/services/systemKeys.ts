import type { RotatedSystemKey, SystemKey } from "../types/systemKeys";
import { apiRequest } from "./api";

export function getSystemKeys(): Promise<SystemKey[]> {
  return apiRequest<SystemKey[]>("/api/admin/system-keys");
}

export function rotateSystemKey(): Promise<RotatedSystemKey> {
  return apiRequest<RotatedSystemKey>("/api/admin/system-keys/rotate", {
    method: "POST",
  });
}
