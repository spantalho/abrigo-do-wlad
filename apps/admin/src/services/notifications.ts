import type { AdminNotification, NotificationInput } from "../types/notifications";
import { apiRequest } from "./api";

export function getAdminNotification(): Promise<AdminNotification | null> {
  return apiRequest<AdminNotification | null>("/api/admin/notifications");
}

export function saveAdminNotification(
  notification: NotificationInput,
): Promise<AdminNotification> {
  return apiRequest<AdminNotification>("/api/admin/notifications", {
    method: "PUT",
    body: JSON.stringify(notification),
  });
}

export function deleteAdminNotification(): Promise<void> {
  return apiRequest<void>("/api/admin/notifications", { method: "DELETE" });
}
