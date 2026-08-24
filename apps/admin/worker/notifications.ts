import { z } from "zod";

import { createFirestoreClient } from "../../../workers/shared/api/_lib/firestore";
import type { AccessIdentity } from "./access";

const notificationCoreSchema = z.object({
  message: z.string().trim().min(1).max(240),
  type: z.enum(["trivial", "urgent", "success", "info"]),
});
const notificationExpirationSchema = z.enum(["1h", "6h", "12h", "until_deleted"]);

export const notificationInputSchema = notificationCoreSchema.extend({
  expiration: notificationExpirationSchema,
});

const adminNotificationSchema = notificationCoreSchema.extend({
  target: z.literal("admin"),
  updatedAt: z.string().datetime(),
  author: z.string().email(),
  expiration: notificationExpirationSchema,
  expiresAt: z.string().datetime().nullable(),
});
const storedAdminNotificationSchema = adminNotificationSchema.extend({
  expiration: notificationExpirationSchema.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export type NotificationInput = z.infer<typeof notificationInputSchema>;
export type AdminNotification = z.infer<typeof adminNotificationSchema>;

const NOTIFICATION_DOCUMENT = "system/notifications";
const EXPIRATION_MS = {
  "1h": 60 * 60 * 1_000,
  "6h": 6 * 60 * 60 * 1_000,
  "12h": 12 * 60 * 60 * 1_000,
} as const;

export async function getAdminNotification(
  env: Env,
  now: Date = new Date(),
): Promise<AdminNotification | null> {
  const document = await createFirestoreClient(env).getDocument(NOTIFICATION_DOCUMENT);
  if (!document) return null;

  const stored = storedAdminNotificationSchema.parse(document.data);
  const notification = adminNotificationSchema.parse({
    ...stored,
    expiration: stored.expiration ?? "until_deleted",
    expiresAt: stored.expiresAt ?? null,
  });

  if (
    notification.expiresAt &&
    Date.parse(notification.expiresAt) <= now.getTime()
  ) {
    return null;
  }

  return notification;
}

export async function saveAdminNotification(
  env: Env,
  input: NotificationInput,
  identity: AccessIdentity,
  now: Date = new Date(),
): Promise<AdminNotification> {
  const firestore = createFirestoreClient(env);
  const existing = await firestore.getDocument(NOTIFICATION_DOCUMENT);
  const updatedAt = now.toISOString();
  const notification = adminNotificationSchema.parse({
    ...input,
    target: "admin",
    updatedAt,
    author: identity.email,
    expiresAt:
      input.expiration === "until_deleted"
        ? null
        : new Date(now.getTime() + EXPIRATION_MS[input.expiration]).toISOString(),
  });

  if (existing) {
    await firestore.updateDocument(existing.name, notification, {
      expectedUpdateTime: existing.updateTime,
    });
  } else {
    await firestore.createDocument("system", notification, {
      documentId: "notifications",
    });
  }

  console.info(JSON.stringify({
    event: "admin.notification.saved",
    actor: identity.email,
    type: notification.type,
    expiration: notification.expiration,
    expiresAt: notification.expiresAt,
  }));

  return notification;
}

export async function deleteAdminNotification(env: Env, identity: AccessIdentity): Promise<void> {
  const firestore = createFirestoreClient(env);
  const existing = await firestore.getDocument(NOTIFICATION_DOCUMENT);

  if (existing) {
    await firestore.deleteDocument(existing.name);
  }

  console.info(JSON.stringify({
    event: "admin.notification.deleted",
    actor: identity.email,
    existed: Boolean(existing),
  }));
}
