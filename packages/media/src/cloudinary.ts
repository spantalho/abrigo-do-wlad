export type CloudinaryQuality = number | "auto";

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: CloudinaryQuality;
  format?: "auto" | "webp" | "jpg" | "png" | "avif";
  crop?: "scale" | "fill" | "fit" | "limit" | "crop";
  gravity?: "auto" | "face" | "center";
  radius?: number;
  effect?: string;
}

const CLOUDINARY_HOST = "res.cloudinary.com";
const UPLOAD_PATH = "/upload/";

export function isCloudinaryImageUrl(
  imageUrl: string | null | undefined,
): imageUrl is string {
  if (!imageUrl) return false;

  try {
    return new URL(imageUrl).hostname === CLOUDINARY_HOST;
  } catch {
    return false;
  }
}

function normalizeDimension(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return Math.round(value);
}

function normalizeQuality(quality: CloudinaryQuality): CloudinaryQuality {
  if (quality === "auto") return quality;
  if (!Number.isFinite(quality)) return "auto";

  return Math.min(100, Math.max(1, Math.round(quality)));
}

/**
 * Adiciona transformações de entrega a uma URL do Cloudinary. URLs de outros
 * provedores são preservadas para que a aplicação possa exibi-las normalmente.
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options: CloudinaryOptions = {},
): string {
  if (!originalUrl) return "";
  if (!isCloudinaryImageUrl(originalUrl)) return originalUrl;

  const uploadIndex = originalUrl.indexOf(UPLOAD_PATH);
  if (uploadIndex === -1) return originalUrl;

  const {
    quality = "auto",
    format = "auto",
    crop = "scale",
    gravity,
    radius,
    effect,
  } = options;
  const width = normalizeDimension(options.width);
  const height = normalizeDimension(options.height);
  const params: string[] = [];

  if (crop) params.push(`c_${crop}`);
  if (width) params.push(`w_${width}`);
  if (height) params.push(`h_${height}`);
  params.push(`q_${normalizeQuality(quality)}`);
  if (format) params.push(`f_${format}`);
  if (gravity) params.push(`g_${gravity}`);
  if (radius) params.push(`r_${radius}`);
  if (effect) params.push(`e_${effect}`);

  const insertionIndex = uploadIndex + UPLOAD_PATH.length;
  return `${originalUrl.slice(0, insertionIndex)}${params.join(",")}/${originalUrl.slice(insertionIndex)}`;
}

/** Gera uma miniatura quadrada otimizada. */
export function getThumbnailUrl(
  originalUrl: string | null | undefined,
  size = 300,
  quality: CloudinaryQuality = "auto",
): string {
  return getOptimizedImageUrl(originalUrl, {
    width: size,
    height: size,
    crop: "fill",
    gravity: "auto",
    quality,
    format: "auto",
  });
}

/**
 * Cria um srcset mantendo a proporção informada em `options.width/height`.
 * Retorna vazio para URLs externas, que continuam disponíveis pelo atributo src.
 */
export function getResponsiveImageSrcSet(
  originalUrl: string | null | undefined,
  widths: readonly number[],
  options: CloudinaryOptions = {},
): string {
  if (!isCloudinaryImageUrl(originalUrl)) return "";

  const baseWidth = normalizeDimension(options.width);
  const baseHeight = normalizeDimension(options.height);
  const normalizedWidths = [...new Set(widths.map(normalizeDimension))]
    .filter((width): width is number => width !== undefined)
    .sort((a, b) => a - b);

  return normalizedWidths
    .map((width) => {
      const height = baseWidth && baseHeight
        ? Math.round((width * baseHeight) / baseWidth)
        : baseHeight;
      const url = getOptimizedImageUrl(originalUrl, {
        ...options,
        width,
        height,
      });

      return `${url} ${width}w`;
    })
    .join(", ");
}
