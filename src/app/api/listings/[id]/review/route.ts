import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, withUser, type IdContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/session";

const bodySchema = z.object({ outcome: z.enum(["APPROVED", "REJECTED"]) });

/**
 * POST /api/listings/[id]/review (admin): resolve a held listing.
 * The outcome is recorded on the scam check so precision and
 * false-positive rate can be measured.
 */
export const POST = withUser(async (user, request, { params }: IdContext) => {
  if (!isAdmin(user)) {
    return jsonError("Admins only.", 403);
  }

  const { id } = await params;
  const { outcome } = bodySchema.parse(await request.json());
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { scamChecks: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  if (!listing || listing.state !== "UNDER_REVIEW") {
    return jsonError("Listing is not awaiting review.", 409);
  }

  await prisma.$transaction([
    prisma.listing.update({ where: { id }, data: { state: outcome === "APPROVED" ? "ACTIVE" : "REJECTED" } }),
    ...listing.scamChecks.map((check) =>
      prisma.scamCheck.update({
        where: { id: check.id },
        data: { reviewOutcome: outcome, reviewedById: user.id, reviewedAt: new Date() }
      })
    )
  ]);

  return NextResponse.json({ ok: true });
});
