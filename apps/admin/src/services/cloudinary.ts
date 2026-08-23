import { apiRequest } from "./api";

interface SignedUpload {
  apiKey: string;
  cloudName: string;
  folder: string;
  signature: string;
  timestamp: number;
}

interface CloudinaryUploadResponse {
  error?: {
    message?: unknown;
  };
  secure_url?: unknown;
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const signed = await apiRequest<SignedUpload>("/api/admin/media/sign-upload", {
    method: "POST",
  });
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signed.apiKey);
  formData.append("folder", signed.folder);
  formData.append("signature", signed.signature);
  formData.append("timestamp", String(signed.timestamp));
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`,
    { method: "POST", body: formData },
  );
  let payload: CloudinaryUploadResponse;
  try {
    payload = (await response.json()) as CloudinaryUploadResponse;
  } catch {
    throw new Error(`Erro no upload da imagem (HTTP ${response.status}).`);
  }
  if (!response.ok || typeof payload.secure_url !== "string") {
    const message = payload.error?.message;
    throw new Error(
      typeof message === "string" && message.trim()
        ? message
        : "Erro no upload da imagem.",
    );
  }
  return payload.secure_url;
}
