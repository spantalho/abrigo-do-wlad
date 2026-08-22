import { apiRequest } from "./api";

export async function getAdoptionApplications<T>(): Promise<T[]> {
  return apiRequest<T[]>("/api/admin/adoptions");
}

export async function updateAdoptionStatus(
  id: string,
  newStatus: "approved" | "rejected",
) {
  await apiRequest(`/api/admin/adoptions/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });
}
