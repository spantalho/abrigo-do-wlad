import { getDb } from "../_lib/firebase";
import { encryptData } from "../_lib/encryption";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { sendEmail, generateAdoptionApplicationEmail } from "../_lib/email";
import { fullFormSchema } from "../../../../src/pages/BetaForm/components/WizardForm/schema";
import { z } from "zod";
import { sanitizeFormFields, verifyRecaptcha } from "../_lib/security";
import {
  ADOPTION_EXPIRATION_DAYS,
  HTTP_STATUS,
  MAX_REQUEST_SIZE,
} from "../_lib/constants";
import {
  jsonResponse,
  getEnvValue,
  type CloudflareEnv,
} from "../_lib/env";

type AdoptionApplicationData = z.infer<typeof fullFormSchema>;

async function sendAdoptionApplicationEmail(
  applicationData: Record<string, unknown>,
  applicationId: string,
  env: CloudflareEnv,
): Promise<void> {
  try {
    const { html, text } = generateAdoptionApplicationEmail(
      applicationData,
      applicationId,
      env,
    );

    const recipient = getEnvValue(env, "ADOPTION_EMAIL_RECIPIENT");

    await sendEmail(
      {
        to: recipient as string,
        subject: `Nova Candidatura de Adoção: ${applicationData.animal_especifico || "Geral"}`,
        html,
        text,
      },
      env,
    );
  } catch (err) {
    console.error("Error sending adoption application email:", err);
  }
}

const SENSITIVE_FIELDS = [
  "nome_adotante",
  "telefone",
  "email",
  "endereco",
  "redes_sociais",
  "renda_mensal",
  "empresa",
  "profissao",
  "idade",
];

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: CloudflareEnv;
}) {
  if (request.method !== "POST") {
    return jsonResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
      message: "Method not allowed",
    });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_REQUEST_SIZE) {
    return jsonResponse(HTTP_STATUS.PAYLOAD_TOO_LARGE, {
      message: "Request entity too large",
    });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return jsonResponse(HTTP_STATUS.BAD_REQUEST, {
      message: "Invalid Content-Type",
    });
  }

  try {
    const data = (await request.json()) as AdoptionApplicationData;

    const recaptchaSecret = getEnvValue(env, "RECAPTCHA_SECRET_KEY");
    if (!recaptchaSecret) {
      return jsonResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
        message: "reCAPTCHA secret is not configured.",
      });
    }

    const captchaValid = await verifyRecaptcha(data.captchaToken, env);
    if (!captchaValid) {
      return jsonResponse(HTTP_STATUS.BAD_REQUEST, {
        message: "reCAPTCHA validation failed",
      });
    }

    const validationResult = fullFormSchema.safeParse(data);

    if (!validationResult.success) {
      return jsonResponse(HTTP_STATUS.BAD_REQUEST, {
        message: "Validation failed",
        errors: z.treeifyError(validationResult.error),
      });
    }

    const rawApplicationData = Object.fromEntries(
      Object.entries(validationResult.data).filter(
        ([key]) => key !== "captchaToken",
      ),
    );
    const applicationData = sanitizeFormFields(rawApplicationData);
    const sensitiveData: Record<string, unknown> = {};
    const publicData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(applicationData)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        sensitiveData[key] = value;
      } else {
        publicData[key] = value;
      }
    }

    const { encryptedData, keyVersion } = await encryptData(sensitiveData, env);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ADOPTION_EXPIRATION_DAYS);

    const documentData = {
      ...publicData,
      sensitive: encryptedData,
      keyVersion,
      submittedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      status: "pending",
    };

    const db = getDb(env);
    const docRef = await db.collection("adoption_application").add(documentData);

    await sendAdoptionApplicationEmail(applicationData, docRef.id, env);

    return jsonResponse(HTTP_STATUS.CREATED, {
      message: "Application submitted successfully",
      data: { id: docRef.id },
    });
  } catch (err) {
    console.error("Error creating adoption application:", err);

    if (err instanceof SyntaxError) {
      return jsonResponse(HTTP_STATUS.BAD_REQUEST, {
        message: "Invalid JSON",
      });
    }

    return jsonResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: "Error creating adoption application",
    });
  }
}
