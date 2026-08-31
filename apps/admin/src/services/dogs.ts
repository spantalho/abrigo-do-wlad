import {
  dogEntitySchema,
  type Dog,
  type DogInput,
  type DogUpdate,
} from "../../shared/entities";
import { ApiError, apiRequest } from "./api";

export async function addDog(dogData: DogInput) {
  await apiRequest<{ id: number }>("/api/admin/dogs", {
    method: "POST",
    body: JSON.stringify(dogData),
  });
  return true;
}

export async function getDogs(): Promise<Dog[]> {
  return dogEntitySchema.array().parse(await apiRequest<unknown>("/api/admin/dogs"));
}

export async function removeDogAndTrack(id: number, adoptedViaSite: boolean) {
  await apiRequest<void>(
    `/api/admin/dogs/${encodeURIComponent(id)}?adoptedViaSite=${String(adoptedViaSite)}`,
    { method: "DELETE" },
  );
  return true;
}

export async function getDogById(id: number): Promise<Dog | null> {
  try {
    return dogEntitySchema.parse(
      await apiRequest<unknown>(`/api/admin/dogs/${encodeURIComponent(id)}`),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateDog(id: number, data: DogUpdate) {
  await apiRequest(`/api/admin/dogs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return true;
}
