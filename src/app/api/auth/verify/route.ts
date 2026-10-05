import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { issueLoginToken } from "@/lib/login-tokens";
import { domainMatches, emailDomain } from "@/lib/markets";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email() });

/** POST /api/auth/verify: send a .edu verification (magic) link. */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return jsonError("Enter a valid email address.");
  }

  const { email } = parsed.data;
  const domain = emailDomain(email);

  if (!domain.endsWith(".edu")) {
    return jsonError("NextNest is for students. Use your university .edu email.");
  }

  const markets = await prisma.market.findMany({ where: { isActive: true } });
  const market = markets.find((candidate) => domainMatches(domain, candidate.emailDomains));

  if (!market) {
    return jsonError(
      `NextNest is live at ${markets.map((m) => m.universityName).join(", ")}. Your university is not supported yet.`
    );
  }

  const token = await issueLoginToken(email);
  const origin = process.env.AUTH_URL || new URL(request.url).origin;
  const link = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}`;

  const { delivered } = await sendEmail({
    to: email,
    subject: "Your NextNest sign-in link",
    text: `Confirm your ${market.universityName} email to sign in to NextNest:\n\n${link}\n\nThis link expires in 24 hours and works once. If you did not request it, ignore this email.`,
    html: `<p>Confirm your ${market.universityName} email to sign in to NextNest.</p><p><a href="${link}">Sign in to NextNest</a></p><p>This link expires in 24 hours and works once. If you did not request it, ignore this email.</p>`
  });

  // Local development without an email provider: hand the link back so the flow is testable.
  const devLink = !delivered && process.env.NODE_ENV !== "production" ? link : undefined;

  return NextResponse.json({ ok: true, university: market.universityName, devLink });
}
