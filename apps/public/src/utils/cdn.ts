export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "jpg" | "png" | "avif";
  crop?: "scale" | "fill" | "fit" | "limit" | "crop";
  gravity?: "auto" | "face" | "center";
  radius?: number;
  effect?: string;
}

/**
 * Optimizes a Cloudinary image URL by adding transformation parameters.
 * @param originalUrl the original Cloudinary image URL.
 * @param options an object of options for optimization.
 * @returns the optimized image URL, or the original URL if it's not a Cloudinary URL.
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: CloudinaryOptions = {},
): string {
  const {
    width,
    height,
    quality = 60,
    format = "auto",
    crop = "scale",
    gravity,
    radius,
    effect,
  } = options;

  if (!originalUrl.includes("res.cloudinary.com")) {
    return originalUrl;
  }

  // encontra a posição de inserção dos parâmetros
  const uploadString = "/upload/";
  const uploadIndex = originalUrl.indexOf(uploadString);

  if (uploadIndex === -1) {
    console.warn("Invalid Cloudinary URL:", originalUrl);
    return originalUrl;
  }

  const insertionIndex = uploadIndex + uploadString.length;

  const params: string[] = [];

  if (crop) params.push(`c_${crop}`);
  if (width) params.push(`w_${width}`);
  if (height) params.push(`h_${height}`);
  if (quality) params.push(`q_${quality}`);
  if (format) params.push(`f_${format}`);
  if (gravity) params.push(`g_${gravity}`);
  if (radius) params.push(`r_${radius}`);
  if (effect) params.push(`e_${effect}`);

  const paramsString = params.join(",");

  const finalParams = paramsString ? `${paramsString}/` : "";

  return (
    originalUrl.slice(0, insertionIndex) +
    finalParams +
    originalUrl.slice(insertionIndex)
  );
}

/**
 * Generates an optimized URL for a square thumbnail.
 * This is a checkpoint for getOptimizedImageUrl with predefined options for thumbnails.
 * @param originalUrl the original Cloudinary image URL.
 * @param size the width and height of the thumbnail in pixels. Defaults to 300.
 * @param quality the quality of the optimized image (0-100). Defaults to 50.
 * @returns the optimized thumbnail image URL.
 */
export function getThumbnaillUrl(
  originalUrl: string,
  size: number = 300,
  quality: number = 50,
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
