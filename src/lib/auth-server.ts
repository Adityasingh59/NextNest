import { cookies } from "next/headers";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth";

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return readSessionToken(token);
}
