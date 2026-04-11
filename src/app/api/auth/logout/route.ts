import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PENDING_LOGIN_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(PENDING_LOGIN_COOKIE);

  return NextResponse.json({ ok: true, redirectTo: "/login" });
}
