import { NextResponse } from "next/server";
import { jsonError, withUser, type IdContext } from "@/lib/api";
import { showsFitBreakdown } from "@/lib/experiments";
import { scoreListing } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/serializers";

/** GET /api/listings/[id]: listing detail with the viewer's fit score breakdown. */
export const GET = withUser(async (user, _request, { params }: IdContext) => {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id }, include: { market: true } });
  const isOwner = listing?.ownerId === user.id;

  if (!listing || (!isOwner && (listing.state !== "ACTIVE" || listing.marketId !== user.market.id))) {
    return jsonError("Listing not found.", 404);
  }

  const fit = user.preference ? scoreListing(listing, user.preference, listing.market) : null;

  return NextResponse.json({
    listing: publicListing(listing),
    fitScore: fit?.score ?? null,
    fitBreakdown: fit && showsFitBreakdown(user.experimentGroups) ? fit : null
  });
});
