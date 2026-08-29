import {
  recyclePointEntitySchema,
  type RecyclePoint,
  type RecyclePointInput,
  type RecyclePointUpdate,
} from "../../shared/entities";
import { ApiError, apiRequest } from "./api";

export async function addRecyclePoint(data: RecyclePointInput) {
  return (await apiRequest<{ id: string }>("/api/admin/recycle-points", {
    method: "POST",
    body: JSON.stringify(data),
  })).id;
}

export async function getRecyclePoints(): Promise<RecyclePoint[]> {
  return recyclePointEntitySchema.array().parse(
    await apiRequest<unknown>("/api/admin/recycle-points"),
  );
}

export async function deleteRecyclePoint(id: string) {
  await apiRequest<void>(`/api/admin/recycle-points/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return true;
}

export async function getRecyclePointById(id: string): Promise<RecyclePoint | null> {
  try {
    return recyclePointEntitySchema.parse(
      await apiRequest<unknown>(`/api/admin/recycle-points/${encodeURIComponent(id)}`),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function updateRecyclePoint(id: string, data: RecyclePointUpdate) {
  await apiRequest(`/api/admin/recycle-points/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return true;
}
