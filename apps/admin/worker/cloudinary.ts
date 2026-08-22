const DOG_IMAGE_FOLDER = "abrigo-do-wlad/dogs";

export type CloudinaryEnv = Pick<
  Env,
  "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET" | "CLOUDINARY_CLOUD_NAME"
>;

function requireValue(env: CloudinaryEnv, key: keyof CloudinaryEnv): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`${key} is not configured.`);
  return value;
}

async function sha1Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function signParameters(
  parameters: Record<string, string | number | boolean>,
  secret: string,
): Promise<string> {
  const canonical = Object.entries(parameters)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("&");
  return sha1Hex(`${canonical}${secret}`);
}

export async function createSignedUpload(env: CloudinaryEnv) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await signParameters(
    { folder: DOG_IMAGE_FOLDER, timestamp },
    requireValue(env, "CLOUDINARY_API_SECRET"),
  );

  return {
    apiKey: requireValue(env, "CLOUDINARY_API_KEY"),
    cloudName: requireValue(env, "CLOUDINARY_CLOUD_NAME"),
    folder: DOG_IMAGE_FOLDER,
    signature,
    timestamp,
  };
}

function publicIdFromUrl(imageUrl: string, cloudName: string): string {
  const url = new URL(imageUrl);
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    throw new TypeError("Only HTTPS Cloudinary image URLs can be deleted.");
  }

  const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (segments[0] !== cloudName || segments[1] !== "image" || segments[2] !== "upload") {
    throw new TypeError("Cloudinary image URL does not belong to this account.");
  }

  const versionIndex = segments.findIndex(
    (segment, index) => index >= 3 && /^v\d+$/.test(segment),
  );
  const publicSegments = segments.slice(versionIndex >= 0 ? versionIndex + 1 : 3);
  if (publicSegments.length === 0) throw new TypeError("Invalid Cloudinary image URL.");

  const last = publicSegments.at(-1)!;
  publicSegments[publicSegments.length - 1] = last.replace(/\.[A-Za-z0-9]+$/, "");
  const publicId = publicSegments.join("/");
  if (!publicId.startsWith(`${DOG_IMAGE_FOLDER}/`)) {
    throw new TypeError("Cloudinary image is outside the managed dog folder.");
  }
  return publicId;
}

export async function deleteCloudinaryImage(
  imageUrl: string,
  env: CloudinaryEnv,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const cloudName = requireValue(env, "CLOUDINARY_CLOUD_NAME");
  const publicId = publicIdFromUrl(imageUrl, cloudName);
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = { invalidate: true, public_id: publicId, timestamp };
  const signature = await signParameters(
    parameters,
    requireValue(env, "CLOUDINARY_API_SECRET"),
  );
  const body = new URLSearchParams({
    api_key: requireValue(env, "CLOUDINARY_API_KEY"),
    invalidate: "true",
    public_id: publicId,
    signature,
    timestamp: String(timestamp),
  });
  const response = await fetcher(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
    { method: "POST", body },
  );
  const payload = (await response.json()) as { result?: string };

  if (!response.ok || !["ok", "not found"].includes(payload.result ?? "")) {
    throw new Error("Cloudinary image deletion failed.");
  }
}
