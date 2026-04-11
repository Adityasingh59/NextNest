export const SESSION_COOKIE = "nextnest_session";
export const PENDING_LOGIN_COOKIE = "nextnest_pending_login";

type UserRole = "STUDENT" | "LANDLORD" | "ADMIN";
type VerificationBadge = "Verified Student" | "ID Verified";

export type SessionUser = {
  email: string;
  displayName: string;
  role: UserRole;
  university: string;
  badge: VerificationBadge;
};

type StoredSession = SessionUser & {
  issuedAt: number;
  expiresAt: number;
};

export type PendingLogin = {
  email: string;
  displayName: string;
  role: UserRole;
  university: string;
  badge: VerificationBadge;
  verificationCode: string;
  idSuffix: string;
  createdAt: number;
  attemptsRemaining: number;
};

export type ApprovedAccount = {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  university: string;
  badge: VerificationBadge;
  verificationCode: string;
  idSuffix: string;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const PENDING_WINDOW_MS = 15 * 60 * 1000;
const SESSION_WINDOW_MS = 12 * ONE_DAY_MS;

const approvedAccounts: ApprovedAccount[] = [
  {
    email: "lena@columbia.edu",
    password: "NestSecure!2026",
    displayName: "Lena Alvarez",
    role: "STUDENT",
    university: "Columbia University",
    badge: "Verified Student",
    verificationCode: "246810",
    idSuffix: "4821"
  },
  {
    email: "omar@nyu.edu",
    password: "HousingFlow#2026",
    displayName: "Omar Rahman",
    role: "STUDENT",
    university: "New York University",
    badge: "Verified Student",
    verificationCode: "514278",
    idSuffix: "1550"
  },
  {
    email: "leasing@westharborpm.com",
    password: "LandlordGate!2026",
    displayName: "West Harbor Leasing",
    role: "LANDLORD",
    university: "Partner Landlord",
    badge: "ID Verified",
    verificationCode: "775544",
    idSuffix: "9004"
  }
];

function getAuthSecret() {
  return process.env.AUTH_SECRET || "nextnest-dev-only-secret-change-me";
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

async function signValue(value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

async function encodeSignedPayload(payload: Record<string, unknown>) {
  const encoder = new TextEncoder();
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signValue(body);
  return `${body}.${signature}`;
}

async function decodeSignedPayload<T>(token?: string | null): Promise<T | null> {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = await signValue(body);

  if (signature !== expectedSignature) {
    return null;
  }

  const decoder = new TextDecoder();
  const decodedBody = decoder.decode(base64UrlDecode(body));

  try {
    return JSON.parse(decodedBody) as T;
  } catch {
    return null;
  }
}

export function getApprovedAccounts() {
  return approvedAccounts;
}

export function findApprovedAccount(email: string) {
  return approvedAccounts.find((account) => account.email === email.toLowerCase());
}

export function isStrictPassword(value: string) {
  return (
    value.length >= 12 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value) &&
    !/\s/.test(value)
  );
}

export function isAllowedEmail(email: string) {
  return email.endsWith(".edu") || Boolean(findApprovedAccount(email));
}

export async function createPendingLoginCookie(account: ApprovedAccount) {
  return encodePendingLoginPayload({
    email: account.email,
    displayName: account.displayName,
    role: account.role,
    university: account.university,
    badge: account.badge,
    verificationCode: account.verificationCode,
    idSuffix: account.idSuffix,
    createdAt: Date.now(),
    attemptsRemaining: 5
  });
}

export async function encodePendingLoginPayload(payload: PendingLogin) {
  return encodeSignedPayload(payload);
}

export async function readPendingLogin(token?: string | null) {
  const pending = await decodeSignedPayload<PendingLogin>(token);

  if (!pending) {
    return null;
  }

  if (Date.now() - pending.createdAt > PENDING_WINDOW_MS) {
    return null;
  }

  if (pending.attemptsRemaining <= 0) {
    return null;
  }

  return pending;
}

export async function createSessionCookie(user: SessionUser) {
  const payload: StoredSession = {
    ...user,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_WINDOW_MS
  };

  return encodeSignedPayload(payload);
}

export async function readSessionToken(token?: string | null) {
  const session = await decodeSignedPayload<StoredSession>(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    return null;
  }

  return session;
}
