/**
 * Signed session cookie. Edge-safe (Web Crypto only) so middleware can
 * verify it; the user record itself is loaded from the database by
 * `getCurrentUser` in `session.ts`.
 */

export const SESSION_COOKIE = "nextnest_session";
export const SESSION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  userId: string;
  issuedAt: number;
  expiresAt: number;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production.");
  }

  return secret || "nextnest-dev-only-secret-change-me";
}

function base64UrlEncode(input: Uint8Array) {
  let binary = "";

  for (const byte of input) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(userId: string) {
  const now = Date.now();
  const payload: SessionPayload = { userId, issuedAt: now, expiresAt: now + SESSION_WINDOW_MS };
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await getKey(), new TextEncoder().encode(body));

  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function readSessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      base64UrlDecode(signature),
      new TextEncoder().encode(body)
    );

    if (!valid) {
      return null;
    }

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_WINDOW_MS / 1000
};
