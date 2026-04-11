import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PENDING_LOGIN_COOKIE,
  SESSION_COOKIE,
  createPendingLoginCookie,
  findApprovedAccount,
  isAllowedEmail,
  isStrictPassword
} from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password, consent } = (await request.json()) as {
    email?: string;
    password?: string;
    consent?: boolean;
  };

  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  if (!normalizedEmail || !normalizedPassword) {
    return NextResponse.json({ error: "Enter both your institutional email and password." }, { status: 400 });
  }

  if (!isAllowedEmail(normalizedEmail)) {
    return NextResponse.json(
      { error: "Only approved university or partner-landlord accounts can access NextNest." },
      { status: 403 }
    );
  }

  if (!isStrictPassword(normalizedPassword)) {
    return NextResponse.json(
      {
        error: "Password must be at least 12 characters and include upper, lower, number, and symbol."
      },
      { status: 400 }
    );
  }

  if (!consent) {
    return NextResponse.json(
      { error: "You must acknowledge the secure access policy before continuing." },
      { status: 400 }
    );
  }

  const account = findApprovedAccount(normalizedEmail);

  if (!account || account.password !== normalizedPassword) {
    return NextResponse.json({ error: "Credentials do not match an approved account." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const pendingToken = await createPendingLoginCookie(account);

  cookieStore.set(PENDING_LOGIN_COOKIE, pendingToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60
  });
  cookieStore.delete(SESSION_COOKIE);

  return NextResponse.json({ ok: true, redirectTo: "/verify" });
}
