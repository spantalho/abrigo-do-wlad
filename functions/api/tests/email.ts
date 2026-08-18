import { sendEmail, generateAdoptionApplicationEmail } from "../_lib/email";
import { HTTP_STATUS } from "../_lib/constants";
import { getEnvValue, jsonResponse } from "../_lib/env";

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) {
  if (request.method !== "GET") {
    return jsonResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, {
      message: "Method not allowed",
    });
  }

  if (getEnvValue(env, "NODE_ENV") === "production") {
    return jsonResponse(HTTP_STATUS.FORBIDDEN, {
      message: "Not available in production",
    });
  }

  try {
    const mockApplicationData = {
      nome_adotante: "José da Silva Teste",
      animal_especifico: "Rex (Debug Mode)",
    };

    const mockApplicationId = "test-id-123456789";

    const { html, text } = generateAdoptionApplicationEmail(
      mockApplicationData,
      mockApplicationId,
    );

    const debugRecipient =
      getEnvValue(env, "DEBUG_EMAIL_RECIPIENT") ||
      getEnvValue(env, "ADOPTION_EMAIL_RECIPIENT") ||
      getEnvValue(env, "GMAIL_USER");

    if (!debugRecipient) {
      throw new Error("No recipient email configured for debug");
    }

    await sendEmail({
      to: debugRecipient as string,
      subject: `[TESTE DEBUG] Nova Candidatura de Adoção: ${mockApplicationData.animal_especifico}`,
      html,
      text,
    });

    return jsonResponse(HTTP_STATUS.OK, {
      message: "Debug email sent successfully",
      data: { sentTo: debugRecipient },
    });
  } catch (err) {
    console.error("Error sending debug email:", err);

    return jsonResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      message: err instanceof Error ? err.message : "Default error",
    });
  }
}
