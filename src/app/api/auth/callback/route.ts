import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { trackEvent } from "@/lib/events";
import { assignExperimentGroups } from "@/lib/experiments";
import { consumeLoginToken } from "@/lib/login-tokens";
import { domainMatches, emailDomain } from "@/lib/markets";
import { prisma } from "@/lib/prisma";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/** GET /api/auth/callback?token=...: consume the magic link and start a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = token ? await consumeLoginToken(token) : null;

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=expired", url));
  }

  const markets = await prisma.market.findMany({ where: { isActive: true } });
  const market = markets.find((candidate) => domainMatches(emailDomain(email), candidate.emailDomains));

  if (!market) {
    return NextResponse.redirect(new URL("/login?error=unsupported", url));
  }

  const isAdmin = adminEmails().includes(email);
  const existing = await prisma.user.findUnique({ where: { email } });

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email,
        emailVerified: new Date(),
        isEduEmail: true,
        universityName: market.universityName,
        universityVerificationStatus: "VERIFIED",
        marketId: market.id,
        roles: isAdmin ? ["STUDENT_SEEKER", "ADMIN"] : ["STUDENT_SEEKER"],
        experimentGroups: assignExperimentGroups(await prisma.user.count())
      }
    }));

  if (existing) {
    const roles = new Set(existing.roles);
    if (isAdmin) roles.add("ADMIN");
    await prisma.user.update({
      where: { id: existing.id },
      data: { emailVerified: new Date(), universityVerificationStatus: "VERIFIED", marketId: existing.marketId ?? market.id, roles: [...roles] }
    });
  } else {
    await trackEvent("user_signed_up", {
      userId: user.id,
      marketId: market.id,
      properties: { university_market: market.slug, referral_source: url.searchParams.get("ref") }
    });
  }

  const destination = existing?.name ? "/dashboard" : "/onboarding";
  const response = NextResponse.redirect(new URL(destination, url));
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user.id), sessionCookieOptions);
  return response;
}
