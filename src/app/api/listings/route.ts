import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { listingInputSchema } from "@/lib/listing-input";
import { createListing } from "@/lib/listings";
import { getRankedMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/serializers";
import { showsFitBreakdown } from "@/lib/experiments";

/** GET /api/listings: active listings in the user's market, ranked by fit score when they have preferences. */
export const GET = withUser(async (user) => {
  if (user.preference) {
    const preference = await prisma.preferenceProfile.findUniqueOrThrow({ where: { id: user.preference.id }, include: { market: true } });
    const ranked = await getRankedMatches(preference, user.id);
    const withBreakdown = showsFitBreakdown(user.experimentGroups);

    return NextResponse.json({
      listings: ranked.map(({ listing, fit, rank }) => ({
        ...publicListing(listing),
        rank,
        fitScore: fit.score,
        fitBreakdown: withBreakdown ? fit : undefined
      }))
    });
  }

  const listings = await prisma.listing.findMany({
    where: { marketId: user.market.id, state: "ACTIVE" },
    orderBy: { publishedAt: "desc" }
  });
  return NextResponse.json({ listings: listings.map(publicListing) });
});

/** POST /api/listings: create a listing; it goes live only after scam screening. */
export const POST = withUser(async (user, request) => {
  const input = listingInputSchema.parse(await request.json());

  const openListings = await prisma.listing.count({
    where: { ownerId: user.id, state: { in: ["SCREENING", "UNDER_REVIEW", "ACTIVE", "MATCHED"] } }
  });
  if (openListings >= 3) {
    return jsonError("You can have up to 3 open listings at a time.");
  }

  const listing = await createListing(user, input);
  return NextResponse.json({ listing: { id: listing.id, state: listing.state } }, { status: 201 });
});
