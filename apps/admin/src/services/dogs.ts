import type { DogProps } from "../types/dogs";
import { ApiError, apiRequest } from "./api";

export async function addDog(dogData: Omit<DogProps, "id">) {
  await apiRequest<{ id: number }>("/api/admin/dogs", {
    method: "POST",
    body: JSON.stringify(dogData),
  });
  return true;
}

export async function getDogs(): Promise<DogProps[]> {
  return apiRequest<DogProps[]>("/api/admin/dogs");
}

export async function removeDogAndTrack(id: number, adoptedViaSite: boolean) {
  await apiRequest<void>(
    `/api/admin/dogs/${encodeURIComponent(id)}?adoptedViaSite=${String(adoptedViaSite)}`,
    { method: "DELETE" },
  );
  return true;
}

export async function getDogById(id: number): Promise<DogProps | null> {
  try {
    return await apiRequest<DogProps>(`/api/admin/dogs/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateDog(id: number, data: Partial<DogProps>) {
  const update = { ...data };
  delete update.id;
  await apiRequest(`/api/admin/dogs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(update),
  });
  return true;
}
