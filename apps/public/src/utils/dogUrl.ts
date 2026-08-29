export function dogProfilePath(publicSlug: string): string {
  return `/caes/${encodeURIComponent(publicSlug)}`;
}
