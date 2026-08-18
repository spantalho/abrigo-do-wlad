import nodemailer from "nodemailer";
import { getEnvValue, type CloudflareEnv } from "./env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getTransporter(env?: CloudflareEnv) {
  const gmailUser = getEnvValue(env, "GMAIL_USER");
  const gmailPass = getEnvValue(env, "GMAIL_PASS") || getEnvValue(env, "GMAIL_USER_PASSWORD");

  if (!gmailUser || !gmailPass) {
    throw new Error("GMAIL credentials are not configured in the Cloudflare environment.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

export async function sendEmail(
  options: EmailOptions,
  env?: CloudflareEnv,
): Promise<void> {
  try {
      const gmailUser = getEnvValue(env, "GMAIL_USER") || process.env.GMAIL_USER;
    const transporter = getTransporter(env);

    await transporter.sendMail({
      from: `"Abrigo do Wlad" <${gmailUser}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (getEnvValue(env, "NODE_ENV") === "development" || process.env.NODE_ENV === "development") {
      console.log("[DEBUG] to:", options.to);
      console.log("[DEBUG] from:", gmailUser);
    }

    console.log(`Email enviado para ${options.to}`);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Falha ao enviar email");
  }
}

export function generateAdoptionApplicationEmail(
  applicationData: Record<string, unknown>,
  applicationId: string,
  env?: CloudflareEnv,
): { html: string; text: string } {
  const nome = applicationData.nome_adotante || "Candidato";
  const animal = applicationData.animal_especifico || "não especificado";

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #fceae3;
            margin: 0;
            padding: 40px 20px;
            color: #1a1a1a;
            -webkit-font-smoothing: antialiased;
          }
          .wrapper {
            max-width: 540px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05); /* Sombra suave */
            border: 1px solid #f1e5e1;
          }
          .header {
            padding: 40px 40px 20px;
            text-align: center;
          }
          .logo-text {
            font-size: 26px;
            font-weight: 700;
            color: #ff6c37;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 0 40px 40px;
          }
          h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 15px;
            color: #1a1a1a;
            text-align: center;
          }
          p {
            font-size: 16px;
            line-height: 1.6;
            color: #4a4a4a;
            margin: 0 0 25px;
            text-align: center;
          }
          .details-card {
            background-color: #fafafa;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 35px;
            border: 1px solid #ececec;
          }
          .detail-item {
            margin-bottom: 12px;
            font-size: 15px;
          }
          .detail-item:last-child {
            margin-bottom: 0;
          }
          .detail-item strong {
            color: #1a1a1a;
            font-weight: 600;
            display: inline-block;
            width: 100px;
          }
          .detail-item span {
            color: #4a4a4a;
          }
          .divider {
            border-top: 1px dashed #dddddd;
            margin-top: 16px;
            padding-top: 16px;
          }
          .divider strong, .divider span {
            color: #767676;
            font-size: 13px;
            font-weight: normal;
          }
          .btn-container {
            text-align: center;
          }
          .btn {
            display: inline-block;
            background-color: #ff6c37;
            color: #ffffff !important;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none;
            padding: 16px 36px;
            border-radius: 8px;
            transition: background-color 0.3s;
          }
          .footer {
            background-color: #fafafa;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #f1e5e1;
          }
          .footer p {
            font-size: 13px;
            color: #767676;
            margin: 0 0 5px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <p class="logo-text">Abrigo do Wlad</p>
          </div>
          
          <div class="content">
            <h1>Nova Solicitação de Adoção! 🐾</h1>
            <p>Um novo formulário de pré-adoção acaba de ser enviado e está aguardando a sua análise.</p>
            
            <div class="details-card">
              <div class="detail-item">
                <strong>Candidato:</strong>
                <span>${nome}</span>
              </div>
              <div class="detail-item">
                <strong>Animal:</strong>
                <span>${animal}</span>
              </div>
              <div class="detail-item divider">
                <strong>ID da ficha:</strong>
                <span>${applicationId}</span>
              </div>
            </div>

            <div class="btn-container">
              <a href="${getEnvValue(env, "ADMIN_PANEL_URL") || process.env.ADMIN_PANEL_URL || "#"}" class="btn">Analisar Solicitação</a>
            </div>
          </div>

          <div class="footer">
            <p>Esta é uma notificação automática do sistema.</p>
            <p>Por favor, não responda a este email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Nova Solicitação de Pré-adoção

Candidato: ${nome}
Animal: ${animal}
ID da Solicitação: ${applicationId}

Por favor, acesse o painel de administração para revisar os detalhes completos desta solicitação.

---
Esta é uma mensagem automática. Por favor, não responda a este email.
  `;

  return { html, text };
}
