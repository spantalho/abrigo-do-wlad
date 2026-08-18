import crypto from "crypto";
import { getDb } from "./firebase";
import { getEnvValue, type CloudflareEnv } from "./env";

function decryptSystemKey(encryptedKeyString: string, env?: CloudflareEnv): string {
  const masterKey = getEnvValue(env, "MASTER_KEY");
  if (!masterKey) {
    throw new Error("MASTER_KEY is not defined in environment variables.");
  }
  
  const parts = encryptedKeyString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format. Expected iv:authTag:encrypted");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const masterCipherKey = crypto.createHash("sha256").update(masterKey).digest();
  const decipher = crypto.createDecipheriv("aes-256-gcm", masterCipherKey, iv);
  decipher.setAuthTag(authTag);
  
  let decryptedKey = decipher.update(encryptedHex, "hex", "utf8");
  decryptedKey += decipher.final("utf8");
  
  return decryptedKey;
}

export async function encryptData(
  data: Record<string, unknown>,
  env?: CloudflareEnv,
): Promise<{ encryptedData: string; keyVersion: string }> {
  const db = getDb(env);

  const keyDocSnap = await db.collection("system").doc("keys").get();
  if (!keyDocSnap.exists) {
    throw new Error(
      "Chaves de criptografia não encontradas no banco de dados.",
    );
  }

  const { active_key_id, keys } = keyDocSnap.data() as {
    active_key_id: string;
    keys: Record<string, { id: string; key: string; version: string; createdAt: string }>;
  };
  
  const encryptedCurrentKey = keys[active_key_id]?.key;

  if (!encryptedCurrentKey) {
    throw new Error("Chave de criptografia ativa inválida ou não encontrada.");
  }

  const currentKey = decryptSystemKey(encryptedCurrentKey, env);

  const algorithm = "aes-256-gcm";
  const iv = crypto.randomBytes(16);
  // (32 bytes/aes-256)
  const cipherKey = crypto
    .createHash("sha256")
    .update(String(currentKey))
    .digest();
  const cipher = crypto.createCipheriv(algorithm, cipherKey, iv);

  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  const encryptedData = `${iv.toString("hex")}:${authTag}:${encrypted}`;

  return { encryptedData, keyVersion: active_key_id };
}
