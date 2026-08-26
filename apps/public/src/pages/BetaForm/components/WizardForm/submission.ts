interface AdoptionSubmissionPayload {
  message?: unknown;
  warning?: unknown;
  data?: {
    id?: unknown;
    notificationEmailSent?: unknown;
  };
}

export const ADOPTION_IDEMPOTENCY_STORAGE_KEY =
  "adoptionSubmissionIdempotencyKey";

export function getOrCreateIdempotencyKey(storage: Storage): string {
  try {
    const saved = storage.getItem(ADOPTION_IDEMPOTENCY_STORAGE_KEY)?.trim();

    if (saved) {
      return saved;
    }
  } catch {
    // The in-memory key held by the form still protects retries in this tab.
  }

  const key = crypto.randomUUID();

  try {
    storage.setItem(ADOPTION_IDEMPOTENCY_STORAGE_KEY, key);
  } catch {
    // Some privacy modes disable sessionStorage.
  }

  return key;
}

export function clearIdempotencyKey(storage: Storage): void {
  try {
    storage.removeItem(ADOPTION_IDEMPOTENCY_STORAGE_KEY);
  } catch {
    // Nothing to clear when sessionStorage is unavailable.
  }
}

export interface AdoptionSubmissionResult {
  applicationId: string;
  warning?: string;
}

async function readPayload(
  response: Response,
): Promise<AdoptionSubmissionPayload> {
  try {
    return (await response.json()) as AdoptionSubmissionPayload;
  } catch {
    return {};
  }
}

export async function getAdoptionApplicationId(
  response: Response,
): Promise<AdoptionSubmissionResult> {
  const payload = await readPayload(response);

  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string" && payload.message.trim()
        ? payload.message
        : "Erro ao enviar formulário. Tente novamente.",
    );
  }

  const applicationId = payload.data?.id;
  if (typeof applicationId !== "string" || !applicationId.trim()) {
    throw new Error("A API não retornou o ID da candidatura.");
  }

  const warning =
    typeof payload.warning === "string" && payload.warning.trim()
      ? payload.warning
      : undefined;

  return {
    applicationId,
    ...(warning ? { warning } : {}),
  };
}
