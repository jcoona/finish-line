import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getEncryptionKey() {
  const source = process.env.FINISH_LINE_ENCRYPTION_KEY?.trim();

  if (!source) {
    throw new Error("Missing required environment variable: FINISH_LINE_ENCRYPTION_KEY");
  }

  return createHash("sha256").update(source).digest();
}

export function encryptJson(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    authTag: authTag.toString("base64"),
  });
}

export function decryptJson<T>(payload: string): T {
  const parsed = JSON.parse(payload) as {
    iv: string;
    ciphertext: string;
    authTag: string;
  };

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(parsed.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(parsed.authTag, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parsed.ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(plaintext.toString("utf8")) as T;
}
