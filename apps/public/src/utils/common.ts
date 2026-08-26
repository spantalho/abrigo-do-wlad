import type { ThirdPartyImagesData } from "../types/third-party-images";
import thirdPartyImages from "../assets/third-party-images.json";

const imagesData: ThirdPartyImagesData = thirdPartyImages;

/**
 * Gets the data for a third-party image and formats the Unsplash URL.
 * @param name The name of the image (key in the JSON).
 * @param options Unsplash formatting options.
 * @returns An object with the image URL and credit data, or null if not found.
 */
export const getThirdPartyImage = (
  name: string,
  options: {
    w?: number;
    h?: number;
    q?: number;
    crop?:
      | "top"
      | "bottom"
      | "left"
      | "right"
      | "center"
      | "faces"
      | "focalpoint";
  } = { w: 1920, q: 80 },
) => {
  const imageInfo = imagesData[name];

  if (!imageInfo) {
    console.error(`Third-Party image "${name}" not found.`);
    return null;
  }

  const cropParam = options.crop ? `&crop=${options.crop}` : "";
  const imageUrl = `https://images.unsplash.com/photo-${imageInfo.photoId}?auto=format&fit=crop&w=${options.w}&h=${options.h}&q=${options.q}${cropParam}`;

  return {
    url: imageUrl,
    ...imageInfo,
  };
};

/**
 * Preloads images into the browser cache to prevent flickering.
 * @param fotos Array of photo URLs
 * @returns A promise that resolves when all images have loaded
 */
export const preloadDogImages = (media: string[]): Promise<void[]> => {
  const imagePromises = media.map((src) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    });
  });
  return Promise.all(imagePromises);
};

/**
 * Shuffles an array in place using the Fisher-Yates (a.k.a Knuth)
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 * It creates a shallow copy of the array to avoid modifying the original.
 * @param {T[]} array The array to shuffle.
 * @returns {T[]} A new array with the elements shuffled.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
}

export function isAgentMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}
