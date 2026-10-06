import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, withUser, type IdContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ note: z.string().trim().min(20, "Explain in at least 20 characters").max(1000) });

/** POST /api/listings/[id]/appeal: the poster adds context to a held or rejected listing. */
export const POST = withUser(async (user, request, { params }: IdContext) => {
  const { id } = await params;
  const { note } = bodySchema.parse(await request.json());
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing || listing.ownerId !== user.id) {
    return jsonError("Listing not found.", 404);
  }
  if (listing.state !== "UNDER_REVIEW" && listing.state !== "REJECTED") {
    return jsonError("Only listings under review or rejected can be appealed.", 409);
  }

  await prisma.listing.update({ where: { id }, data: { appealNote: note, state: "UNDER_REVIEW" } });
  return NextResponse.json({ ok: true });
});
