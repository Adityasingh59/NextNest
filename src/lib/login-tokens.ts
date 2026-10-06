import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Spec: ".edu verification tokens expire after 24 hours." */
export const LOGIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Only the hash is stored, so a database leak cannot be used to sign in. */
export async function issueLoginToken(email: string) {
  const token = randomBytes(32).toString("base64url");

  await prisma.emailLoginToken.create({
    data: { email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + LOGIN_TOKEN_TTL_MS) }
  });

  return token;
}

/** Single use: returns the email once, then the token is spent. */
export async function consumeLoginToken(token: string) {
  const result = await prisma.emailLoginToken.updateMany({
    where: { tokenHash: hashToken(token), consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() }
  });

  if (result.count !== 1) {
    return null;
  }

  const record = await prisma.emailLoginToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return record?.email ?? null;
}
