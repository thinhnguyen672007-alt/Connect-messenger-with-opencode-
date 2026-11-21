import crypto from "node:crypto";

export function verifyMetaSignature(rawBody: Buffer, header: string | undefined, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest();
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(received, expected);
}
