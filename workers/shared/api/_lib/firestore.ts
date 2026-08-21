import { importPKCS8, SignJWT } from "jose";

import {
  getEnvValue,
  type CloudflareEnv,
  type CloudflareStringEnvKey,
} from "./env";

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_EXPIRATION_SECONDS = 3600;
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const AUTO_ID_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const AUTO_ID_LENGTH = 20;

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number | string }
  | { timestampValue: string }
  | { stringValue: string }
  | { bytesValue: string }
  | { referenceValue: string }
  | { geoPointValue: { latitude: number; longitude: number } }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface FirestoreApiDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
}

interface RunQueryResult {
  document?: FirestoreApiDocument;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface CachedAccessToken {
  cacheKey: string;
  token: string;
  expiresAt: number;
}

export interface FirestoreDocument<T extends Record<string, unknown>> {
  id: string;
  name: string;
  data: T;
  createTime?: string;
  updateTime?: string;
}

export interface CreateDocumentOptions {
  serverTimestampFields?: string[];
  documentId?: string;
}

export interface FirestoreRestClientOptions {
  fetcher?: typeof fetch;
  tokenProvider?: () => Promise<string>;
  documentIdGenerator?: () => string;
}

let cachedAccessToken: CachedAccessToken | undefined;

function requireEnvValue(
  env: CloudflareEnv | undefined,
  key: CloudflareStringEnvKey,
): string {
  const value = getEnvValue(env, key)?.trim();

  if (!value) {
    throw new Error(`${key} is not defined in environment variables.`);
  }

  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function decodeDouble(value: number | string): number {
  if (typeof value === "number") {
    return value;
  }

  if (value === "NaN") {
    return Number.NaN;
  }

  if (value === "Infinity") {
    return Number.POSITIVE_INFINITY;
  }

  if (value === "-Infinity") {
    return Number.NEGATIVE_INFINITY;
  }

  return Number(value);
}

export function encodeFirestoreValue(value: unknown): FirestoreValue {
  if (value === null) {
    return { nullValue: null };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new TypeError("Cannot encode an invalid Date as a Firestore value.");
    }

    return { timestampValue: value.toISOString() };
  }

  if (value instanceof Uint8Array) {
    return { bytesValue: bytesToBase64(value) };
  }

  switch (typeof value) {
    case "boolean":
      return { booleanValue: value };
    case "string":
      return { stringValue: value };
    case "bigint":
      return { integerValue: value.toString() };
    case "number":
      if (Number.isInteger(value) && Number.isFinite(value)) {
        return { integerValue: value.toString() };
      }

      if (Number.isNaN(value)) {
        return { doubleValue: "NaN" };
      }

      if (value === Number.POSITIVE_INFINITY) {
        return { doubleValue: "Infinity" };
      }

      if (value === Number.NEGATIVE_INFINITY) {
        return { doubleValue: "-Infinity" };
      }

      return { doubleValue: value };
    case "object": {
      if (Array.isArray(value)) {
        return {
          arrayValue: {
            values: value.map((item) => encodeFirestoreValue(item)),
          },
        };
      }

      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new TypeError("Only plain objects can be encoded as Firestore maps.");
      }

      const fields = Object.fromEntries(
        Object.entries(value)
          .filter(([, fieldValue]) => fieldValue !== undefined)
          .map(([fieldName, fieldValue]) => [
            fieldName,
            encodeFirestoreValue(fieldValue),
          ]),
      );

      return { mapValue: { fields } };
    }
    default:
      throw new TypeError(`Unsupported Firestore value type: ${typeof value}`);
  }
}

export function decodeFirestoreValue(value: FirestoreValue): unknown {
  if ("nullValue" in value) {
    return null;
  }

  if ("booleanValue" in value) {
    return value.booleanValue;
  }

  if ("integerValue" in value) {
    const integer = Number(value.integerValue);
    return Number.isSafeInteger(integer) ? integer : value.integerValue;
  }

  if ("doubleValue" in value) {
    return decodeDouble(value.doubleValue);
  }

  if ("timestampValue" in value) {
    return value.timestampValue;
  }

  if ("stringValue" in value) {
    return value.stringValue;
  }

  if ("bytesValue" in value) {
    return value.bytesValue;
  }

  if ("referenceValue" in value) {
    return value.referenceValue;
  }

  if ("geoPointValue" in value) {
    return value.geoPointValue;
  }

  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map(decodeFirestoreValue);
  }

  return Object.fromEntries(
    Object.entries(value.mapValue.fields ?? {}).map(([fieldName, fieldValue]) => [
      fieldName,
      decodeFirestoreValue(fieldValue),
    ]),
  );
}

function encodeDocumentFields(
  data: Record<string, unknown>,
): Record<string, FirestoreValue> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([fieldName, value]) => [fieldName, encodeFirestoreValue(value)]),
  );
}

function decodeDocument<T extends Record<string, unknown>>(
  document: FirestoreApiDocument,
): FirestoreDocument<T> {
  const id = document.name.split("/").at(-1);

  if (!id) {
    throw new Error(`Firestore returned an invalid document name: ${document.name}`);
  }

  return {
    id,
    name: document.name,
    data: Object.fromEntries(
      Object.entries(document.fields ?? {}).map(([fieldName, value]) => [
        fieldName,
        decodeFirestoreValue(value),
      ]),
    ) as T,
    createTime: document.createTime,
    updateTime: document.updateTime,
  };
}

export function createFirestoreDocumentId(): string {
  const id: string[] = [];
  const maxValidByte =
    Math.floor(256 / AUTO_ID_CHARACTERS.length) * AUTO_ID_CHARACTERS.length;

  while (id.length < AUTO_ID_LENGTH) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(AUTO_ID_LENGTH));

    for (const randomByte of randomBytes) {
      if (randomByte < maxValidByte) {
        id.push(AUTO_ID_CHARACTERS[randomByte % AUTO_ID_CHARACTERS.length]);
      }

      if (id.length === AUTO_ID_LENGTH) {
        break;
      }
    }
  }

  return id.join("");
}

async function requestGoogleAccessToken(
  env: CloudflareEnv | undefined,
  fetcher: typeof fetch,
): Promise<string> {
  const clientEmail = requireEnvValue(env, "FIREBASE_CLIENT_EMAIL");
  const privateKey = requireEnvValue(env, "FIREBASE_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
  const cacheKey = `${requireEnvValue(env, "FIREBASE_PROJECT_ID")}:${clientEmail}`;
  const now = Date.now();

  if (
    cachedAccessToken?.cacheKey === cacheKey &&
    cachedAccessToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > now
  ) {
    return cachedAccessToken.token;
  }

  const issuedAt = Math.floor(now / 1000);
  const signingKey = await importPKCS8(privateKey, "RS256");
  const assertion = await new SignJWT({ scope: FIRESTORE_SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(clientEmail)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + TOKEN_EXPIRATION_SECONDS)
    .sign(signingKey);

  const response = await fetcher(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    const reason =
      payload.error_description ?? payload.error ?? `HTTP ${response.status}`;
    throw new Error(`Unable to authenticate the Firestore service account: ${reason}`);
  }

  const expiresIn = payload.expires_in ?? TOKEN_EXPIRATION_SECONDS;
  cachedAccessToken = {
    cacheKey,
    token: payload.access_token,
    expiresAt: now + expiresIn * 1000,
  };

  return payload.access_token;
}

export class FirestoreRestError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "FirestoreRestError";
    this.status = status;
    this.details = details;
  }
}

export class FirestoreRestClient {
  private readonly databaseRoot: string;
  private readonly documentsRoot: string;
  private readonly fetcher: typeof fetch;
  private readonly tokenProvider: () => Promise<string>;
  private readonly documentIdGenerator: () => string;

  constructor(
    projectId: string,
    options: FirestoreRestClientOptions = {},
    env?: CloudflareEnv,
  ) {
    this.databaseRoot = `projects/${projectId}/databases/(default)`;
    this.documentsRoot = `${this.databaseRoot}/documents`;
    const fetcher = options.fetcher ?? fetch;
    this.fetcher = (input, init) => fetcher(input, init);
    this.tokenProvider =
      options.tokenProvider ?? (() => requestGoogleAccessToken(env, this.fetcher));
    this.documentIdGenerator =
      options.documentIdGenerator ?? createFirestoreDocumentId;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.tokenProvider();
    const response = await this.fetcher(
      `https://firestore.googleapis.com/v1/${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      },
    );

    if (!response.ok) {
      const rawDetails = await response.text();
      let details: unknown = rawDetails;

      try {
        details = JSON.parse(rawDetails) as unknown;
      } catch {
        // The API occasionally returns a plain-text error response.
      }

      const apiMessage =
        typeof details === "object" &&
        details !== null &&
        "error" in details &&
        typeof details.error === "object" &&
        details.error !== null &&
        "message" in details.error &&
        typeof details.error.message === "string"
          ? details.error.message
          : response.statusText;

      throw new FirestoreRestError(
        `Firestore request failed (${response.status}): ${apiMessage}`,
        response.status,
        details,
      );
    }

    return (await response.json()) as T;
  }

  async getDocument<T extends Record<string, unknown>>(
    documentPath: string,
  ): Promise<FirestoreDocument<T> | null> {
    const encodedPath = documentPath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    try {
      const document = await this.request<FirestoreApiDocument>(
        `${this.documentsRoot}/${encodedPath}`,
      );
      return decodeDocument<T>(document);
    } catch (error) {
      if (error instanceof FirestoreRestError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async findFirstDocument<T extends Record<string, unknown>>(
    collectionId: string,
    startingDocumentId?: string,
  ): Promise<FirestoreDocument<T> | null> {
    const structuredQuery: Record<string, unknown> = {
      from: [{ collectionId }],
      orderBy: [
        {
          field: { fieldPath: "__name__" },
          direction: "ASCENDING",
        },
      ],
      limit: 1,
    };

    if (startingDocumentId) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: "__name__" },
          op: "GREATER_THAN_OR_EQUAL",
          value: {
            referenceValue: `${this.documentsRoot}/${collectionId}/${startingDocumentId}`,
          },
        },
      };
    }

    const results = await this.request<RunQueryResult[]>(
      `${this.documentsRoot}:runQuery`,
      {
        method: "POST",
        body: JSON.stringify({ structuredQuery }),
      },
    );
    const document = results.find((result) => result.document)?.document;

    return document ? decodeDocument<T>(document) : null;
  }

  async createDocument(
    collectionId: string,
    data: Record<string, unknown>,
    options: CreateDocumentOptions = {},
  ): Promise<{ id: string; commitTime?: string }> {
    const id = options.documentId ?? this.documentIdGenerator();

    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) {
      throw new TypeError("Firestore document ID contains invalid characters.");
    }

    const name = `${this.documentsRoot}/${collectionId}/${id}`;
    const updateTransforms = (options.serverTimestampFields ?? []).map(
      (fieldPath) => ({
        fieldPath,
        setToServerValue: "REQUEST_TIME",
      }),
    );
    const write = {
      update: {
        name,
        fields: encodeDocumentFields(data),
      },
      currentDocument: { exists: false },
      ...(updateTransforms.length > 0 ? { updateTransforms } : {}),
    };
    const result = await this.request<{ commitTime?: string }>(
      `${this.databaseRoot}/documents:commit`,
      {
        method: "POST",
        body: JSON.stringify({ writes: [write] }),
      },
    );

    return { id, commitTime: result.commitTime };
  }
}

export function createFirestoreClient(
  env?: CloudflareEnv,
  options: FirestoreRestClientOptions = {},
): FirestoreRestClient {
  return new FirestoreRestClient(
    requireEnvValue(env, "FIREBASE_PROJECT_ID"),
    options,
    env,
  );
}
