import type { Dog, DogFilters } from "@/types/dogs";

export interface DogFeedPage {
  dogs: Dog[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  version: string;
}

export class DogFeedVersionError extends Error {
  constructor() {
    super("A versão da lista de cães expirou.");
    this.name = "DogFeedVersionError";
  }
}

function isDogFeedPage(value: unknown): value is DogFeedPage {
  if (!value || typeof value !== "object") return false;
  const page = value as Record<string, unknown>;
  return (
    Array.isArray(page.dogs) &&
    typeof page.totalItems === "number" &&
    typeof page.currentPage === "number" &&
    typeof page.totalPages === "number" &&
    typeof page.itemsPerPage === "number" &&
    typeof page.version === "string"
  );
}

export async function getDogFeedPage(
  filters: DogFilters,
  page: number,
  itemsPerPage: number,
  version?: string,
  signal?: AbortSignal,
): Promise<DogFeedPage> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(itemsPerPage),
  });
  if (filters.cateIdade && filters.cateIdade !== "all") {
    params.set("cateIdade", filters.cateIdade);
  }
  if (filters.cor && filters.cor !== "all") {
    params.set("cor", filters.cor);
  }
  if (filters.tags && filters.tags !== "all") {
    params.set("tag", filters.tags);
  }
  if (version) {
    params.set("version", version);
  }

  const response = await fetch(`/api/dogs?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (response.status === 409 && version) {
    throw new DogFeedVersionError();
  }
  if (!response.ok) {
    throw new Error(`Falha ao carregar cães (HTTP ${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!isDogFeedPage(payload)) {
    throw new Error("A API retornou uma lista de cães inválida.");
  }
  return payload;
}
