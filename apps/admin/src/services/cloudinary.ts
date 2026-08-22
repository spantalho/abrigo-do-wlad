import { apiRequest } from "./api";

interface SignedUpload {
  apiKey: string;
  cloudName: string;
  folder: string;
  signature: string;
  timestamp: number;
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
  const payload = (await response.json()) as { secure_url?: unknown };
  if (!response.ok || typeof payload.secure_url !== "string") {
    throw new Error("Erro no upload da imagem.");
  }
  return payload.secure_url;
}
