import type { Dog } from "@/types/dogs";
import { dogProfilePath } from "@/utils/dogUrl";

type ShareableDog = Pick<Dog, "publicSlug" | "nome" | "idade">;

export type DogShareResult = "shared" | "copied" | "cancelled";

export interface DogShareEnvironment {
  origin: string;
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  copyText: (value: string) => Promise<void>;
}

export function createDogShareData(
  dog: ShareableDog,
  origin: string,
): ShareData {
  return {
    title: `${dog.nome} para adoção | Abrigo do Wlad`,
    text: `Conheça ${dog.nome}, ${dog.idade}, e ajude este doguinho a encontrar uma família.`,
    url: new URL(dogProfilePath(dog.publicSlug), origin).toString(),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

async function copyInBrowser(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // The textarea fallback also covers browsers that restrict Clipboard API.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  let copied = false;
  try {
    textarea.select();
    copied = document.execCommand("copy");
  } finally {
    textarea.remove();
  }

  if (!copied) throw new Error("Unable to copy dog profile URL.");
}

function browserShareEnvironment(): DogShareEnvironment {
  return {
    origin: window.location.origin,
    share: typeof navigator.share === "function"
      ? navigator.share.bind(navigator)
      : undefined,
    canShare: typeof navigator.canShare === "function"
      ? navigator.canShare.bind(navigator)
      : undefined,
    copyText: copyInBrowser,
  };
}

export async function shareDogProfile(
  dog: ShareableDog,
  environment: DogShareEnvironment = browserShareEnvironment(),
): Promise<DogShareResult> {
  const data = createDogShareData(dog, environment.origin);
  const nativeShare = environment.share;
  let canUseNativeShare = Boolean(nativeShare);
  if (nativeShare && environment.canShare) {
    try {
      canUseNativeShare = environment.canShare(data);
    } catch {
      canUseNativeShare = false;
    }
  }

  if (nativeShare && canUseNativeShare) {
    try {
      await nativeShare(data);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  await environment.copyText(data.url ?? "");
  return "copied";
}
