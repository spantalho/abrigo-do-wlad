export function dogSlug(nome: string): string {
  const slug = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "cao";
}

export function dogProfilePath(id: string, nome: string): string {
  return `/caes/${encodeURIComponent(id)}/${dogSlug(nome)}`;
}
