import { z } from "zod";

import { decryptDataBatch } from "../../../workers/shared/api/_lib/encryption";
import {
  createFirestoreClient,
  FirestoreRestError,
  type FirestoreDocument,
} from "../../../workers/shared/api/_lib/firestore";
import type { AccessIdentity } from "./access";
import { createSignedUpload, deleteCloudinaryImage } from "./cloudinary";

const MAX_BODY_BYTES = 256 * 1024;
const MANAGED_COLLECTIONS = {
  adoptions: "adoption_application",
  dogs: "dogs",
  recycle: "recycle_points",
} as const;

const httpsUrl = z.string().url().refine((value) => value.startsWith("https://"));
const dogSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  idade: z.string().trim().min(1).max(80),
  cateIdade: z.enum(["filhote", "adulto", "idoso"]),
  sexo: z.enum(["Macho", "Fêmea"]),
  temperamento: z.string().trim().min(1).max(240),
  tags: z.array(z.string().trim().min(1).max(60)).max(30),
  status: z.string().trim().min(1).max(80),
  fotos: z.array(httpsUrl).max(20),
  cor: z.string().trim().min(1).max(80),
  instaLink: httpsUrl.optional().or(z.literal("")),
  descricaoCompleta: z.string().trim().max(5_000).optional(),
});
const dogUpdateSchema = dogSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one dog field is required.",
);
const recycleSchema = z.object({
  zone: z.string().trim().min(1).max(80),
  neighborhood: z.string().trim().min(1).max(120),
  name: z.string().trim().max(160).optional().or(z.literal("")),
  address: z.string().trim().min(1).max(300),
  latitude: z.string().trim().max(40).optional().or(z.literal("")),
  longitude: z.string().trim().max(40).optional().or(z.literal("")),
});
const recycleUpdateSchema = recycleSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one recycle point field is required.",
);
const adoptionStatusSchema = z.object({ status: z.enum(["approved", "rejected"]) });
const imageDeleteSchema = z.object({ imageUrl: httpsUrl });

function jsonResponse(status: number, body: unknown): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function methodNotAllowed(allowed: string[]): Response {
  return new Response(null, {
    status: 405,
    headers: { Allow: allowed.join(", "), "Cache-Control": "no-store" },
  });
}

function assertSameOrigin(request: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new ApiError(403, "Cross-origin state change rejected.");
  }
}

async function parseJson(request: Request): Promise<unknown> {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json.");
  }
  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "Request body is too large.");
  }
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    throw new ApiError(413, "Request body is too large.");
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ApiError(400, "Request body is not valid JSON.");
  }
}

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function numericDogId(value: string): number {
  if (!/^\d{1,16}$/.test(value)) throw new ApiError(400, "Invalid dog ID.");
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new ApiError(400, "Invalid dog ID.");
  return id;
}

function documentId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    throw new ApiError(400, "Invalid document ID.");
  }
  return value;
}

async function listAdoptions(env: Env): Promise<Record<string, unknown>[]> {
  const documents = await createFirestoreClient(env).listDocuments<{
    sensitive?: unknown;
    keyVersion?: unknown;
    [key: string]: unknown;
  }>(MANAGED_COLLECTIONS.adoptions, {
    direction: "DESCENDING",
    orderBy: "submittedAt",
  });
  const encryptedDocuments = documents.filter(
    (document) =>
      typeof document.data.sensitive === "string" &&
      typeof document.data.keyVersion === "string",
  );
  const decrypted = await decryptDataBatch(
    encryptedDocuments.map((document) => ({
      encryptedData: document.data.sensitive as string,
      keyVersion: document.data.keyVersion as string,
    })),
    env,
  );
  const decryptedByName = new Map(
    encryptedDocuments.map((document, index) => [document.name, decrypted[index]]),
  );

  return documents.map((document) => {
    const publicData = { ...document.data };
    delete publicData.sensitive;
    delete publicData.keyVersion;
    return { id: document.id, ...publicData, ...decryptedByName.get(document.name) };
  });
}

function serializeDocuments<T extends Record<string, unknown>>(
  documents: FirestoreDocument<T>[],
): Array<T & { documentId: string }> {
  return documents.map((document) => ({ documentId: document.id, ...document.data }));
}

async function handleDogs(request: Request, env: Env, pathId?: string): Promise<Response> {
  const firestore = createFirestoreClient(env);
  if (!pathId) {
    if (request.method === "GET") {
      return jsonResponse(200, serializeDocuments(await firestore.listDocuments("dogs")));
    }
    if (request.method === "POST") {
      const dog = dogSchema.parse(await parseJson(request));
      const id = Date.now();
      await firestore.createDocument("dogs", { ...dog, id });
      return jsonResponse(201, { id });
    }
    return methodNotAllowed(["GET", "POST"]);
  }

  const id = numericDogId(pathId);
  const document = await firestore.findFirstDocumentByField<{ fotos?: unknown }>("dogs", "id", id);
  if (!document) throw new ApiError(404, "Dog not found.");

  if (request.method === "GET") return jsonResponse(200, { id, ...document.data });
  if (request.method === "PATCH") {
    const update = dogUpdateSchema.parse(await parseJson(request));
    await firestore.updateDocument(document.name, update);
    if (update.fotos) {
      const previousPhotos = Array.isArray(document.data.fotos)
        ? document.data.fotos.filter((photo): photo is string => typeof photo === "string")
        : [];
      const removedPhotos = previousPhotos.filter((photo) => !update.fotos?.includes(photo));
      const deletions = await Promise.allSettled(
        removedPhotos.map((photo) => deleteCloudinaryImage(photo, env)),
      );
      if (deletions.some((result) => result.status === "rejected")) {
        console.warn(JSON.stringify({ event: "admin.media.cleanup.partial", dogId: id }));
      }
    }
    return jsonResponse(200, { ok: true });
  }
  if (request.method === "DELETE") {
    const adoptedViaSite = new URL(request.url).searchParams.get("adoptedViaSite") === "true";
    const photos = Array.isArray(document.data.fotos)
      ? document.data.fotos.filter((photo): photo is string => typeof photo === "string")
      : [];
    const deletions = await Promise.allSettled(
      photos.map((photo) => deleteCloudinaryImage(photo, env)),
    );
    if (deletions.some((result) => result.status === "rejected")) {
      console.warn(JSON.stringify({ event: "admin.media.cleanup.partial", dogId: id }));
    }
    await firestore.deleteDocument(document.name);
    if (adoptedViaSite) {
      await firestore.incrementDocumentField("system/statistics", "adoptionsCount", 1);
    }
    return new Response(null, { status: 204 });
  }
  return methodNotAllowed(["GET", "PATCH", "DELETE"]);
}

async function handleRecycle(request: Request, env: Env, pathId?: string): Promise<Response> {
  const firestore = createFirestoreClient(env);
  if (!pathId) {
    if (request.method === "GET") {
      const documents = await firestore.listDocuments("recycle_points");
      return jsonResponse(200, documents.map((document) => ({ id: document.id, ...document.data })));
    }
    if (request.method === "POST") {
      const point = recycleSchema.parse(await parseJson(request));
      const result = await firestore.createDocument("recycle_points", point);
      return jsonResponse(201, { id: result.id });
    }
    return methodNotAllowed(["GET", "POST"]);
  }

  const id = documentId(pathId);
  const document = await firestore.getDocument(`recycle_points/${id}`);
  if (!document) throw new ApiError(404, "Recycle point not found.");
  if (request.method === "GET") return jsonResponse(200, { id, ...document.data });
  if (request.method === "PATCH") {
    await firestore.updateDocument(document.name, recycleUpdateSchema.parse(await parseJson(request)));
    return jsonResponse(200, { ok: true });
  }
  if (request.method === "DELETE") {
    await firestore.deleteDocument(document.name);
    return new Response(null, { status: 204 });
  }
  return methodNotAllowed(["GET", "PATCH", "DELETE"]);
}

async function handleDashboard(env: Env): Promise<Response> {
  const firestore = createFirestoreClient(env);
  const [dogs, recycles, adoptions, statistics] = await Promise.all([
    firestore.listDocuments("dogs"),
    firestore.listDocuments("recycle_points"),
    listAdoptions(env),
    firestore.getDocument<{ adoptionsCount?: unknown }>("system/statistics"),
  ]);
  const now = Date.now();
  const expiringAdoptions = adoptions.flatMap((adoption) => {
    if (typeof adoption.submittedAt !== "string") return [];
    const submittedAt = Date.parse(adoption.submittedAt);
    if (!Number.isFinite(submittedAt)) return [];
    const daysOld = Math.floor((now - submittedAt) / 86_400_000);
    const daysLeft = Math.max(0, 30 - daysOld);
    if (daysLeft > 5) return [];
    return [{
      id: String(adoption.id),
      nome: typeof adoption.nome_adotante === "string" ? adoption.nome_adotante : "Candidato",
      daysLeft,
    }];
  }).sort((left, right) => left.daysLeft - right.daysLeft);

  return jsonResponse(200, {
    metrics: {
      dogs: dogs.length,
      recycles: recycles.length,
      adoptions: adoptions.length,
      adoptionsViaSite:
        typeof statistics?.data.adoptionsCount === "number"
          ? statistics.data.adoptionsCount
          : 0,
    },
    expiringAdoptions,
  });
}

export async function handleAdminApi(
  request: Request,
  env: Env,
  identity: AccessIdentity,
): Promise<Response> {
  try {
    void identity;
    assertSameOrigin(request);
    const url = new URL(request.url);
    const segments = url.pathname.split("/").filter(Boolean);

    if (url.pathname === "/api/admin/dashboard" && request.method === "GET") {
      return handleDashboard(env);
    }
    if (url.pathname === "/api/admin/adoptions" && request.method === "GET") {
      return jsonResponse(200, await listAdoptions(env));
    }
    if (segments[2] === "adoptions" && segments[4] === "status" && segments.length === 5) {
      if (request.method !== "PATCH") return methodNotAllowed(["PATCH"]);
      const id = documentId(segments[3] ?? "");
      const document = await createFirestoreClient(env).getDocument(`adoption_application/${id}`);
      if (!document) throw new ApiError(404, "Adoption application not found.");
      const { status } = adoptionStatusSchema.parse(await parseJson(request));
      await createFirestoreClient(env).updateDocument(document.name, { status });
      return jsonResponse(200, { ok: true });
    }
    if (segments[2] === "dogs" && segments.length <= 4) {
      return handleDogs(request, env, segments[3]);
    }
    if (segments[2] === "recycle-points" && segments.length <= 4) {
      return handleRecycle(request, env, segments[3]);
    }
    if (url.pathname === "/api/admin/media/sign-upload") {
      if (request.method !== "POST") return methodNotAllowed(["POST"]);
      return jsonResponse(200, await createSignedUpload(env));
    }
    if (url.pathname === "/api/admin/media/delete") {
      if (request.method !== "POST") return methodNotAllowed(["POST"]);
      const { imageUrl } = imageDeleteSchema.parse(await parseJson(request));
      await deleteCloudinaryImage(imageUrl, env);
      return jsonResponse(200, { ok: true });
    }
    return jsonResponse(404, { error: "Not found" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse(400, { error: "Invalid request", issues: error.issues });
    }
    if (error instanceof ApiError) return jsonResponse(error.status, { error: error.message });
    if (error instanceof FirestoreRestError && error.status === 404) {
      return jsonResponse(404, { error: "Document not found" });
    }
    console.error(JSON.stringify({
      event: "admin.api.error",
      message: error instanceof Error ? error.message : "Unknown failure",
    }));
    return jsonResponse(500, { error: "Internal server error" });
  }
}
