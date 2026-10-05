import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = await readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { market: true, preference: true }
  });

  return user?.isActive ? user : null;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For pages: sends signed-out visitors to /login. */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user || !user.market) {
    redirect("/login");
  }

  return user as CurrentUser & { market: NonNullable<CurrentUser["market"]> };
}

export function isAdmin(user: { roles: string[] }) {
  return user.roles.includes("ADMIN");
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  return user;
}
