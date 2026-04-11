import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  PENDING_LOGIN_COOKIE,
  SESSION_COOKIE,
  createSessionCookie,
  encodePendingLoginPayload,
  readPendingLogin
} from "@/lib/auth";

export async function POST(request: Request) {
  const { code, idSuffix } = (await request.json()) as {
    code?: string;
    idSuffix?: string;
  };

  const normalizedCode = String(code ?? "").trim();
  const normalizedIdSuffix = String(idSuffix ?? "").trim();
  const cookieStore = await cookies();
  const pending = await readPendingLogin(cookieStore.get(PENDING_LOGIN_COOKIE)?.value);

  if (!pending) {
    return NextResponse.json(
      { error: "Your secure login window expired. Start again from the login page." },
      { status: 401 }
    );
  }

  if (!/^\d{6}$/.test(normalizedCode)) {
    return NextResponse.json({ error: "Enter the six-digit verification code." }, { status: 400 });
  }

  if (!/^\d{4}$/.test(normalizedIdSuffix)) {
    return NextResponse.json({ error: "Enter the last four digits of your student or employee ID." }, { status: 400 });
  }

  if (normalizedCode !== pending.verificationCode || normalizedIdSuffix !== pending.idSuffix) {
    const attemptsRemaining = pending.attemptsRemaining - 1;

    if (attemptsRemaining <= 0) {
      cookieStore.delete(PENDING_LOGIN_COOKIE);
      return NextResponse.json(
        { error: "Too many failed attempts. Start the login process again." },
        { status: 401 }
      );
    }

    cookieStore.set(
      PENDING_LOGIN_COOKIE,
      await encodePendingLoginPayload({
        ...pending,
        attemptsRemaining
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 15 * 60
      }
    );

    return NextResponse.json({ error: "Verification code or ID suffix is incorrect." }, { status: 401 });
  }

  const sessionToken = await createSessionCookie({
    email: pending.email,
    displayName: pending.displayName,
    role: pending.role,
    university: pending.university,
    badge: pending.badge
  });

  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 24 * 60 * 60
  });
  cookieStore.delete(PENDING_LOGIN_COOKIE);

  return NextResponse.json({ ok: true, redirectTo: "/" });
}
