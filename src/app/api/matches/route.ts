import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { showsFitBreakdown } from "@/lib/experiments";
import { getRankedMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { publicListing } from "@/lib/serializers";

/** GET /api/matches: ranked matches for the arriving student, with request status. */
export const GET = withUser(async (user) => {
  if (!user.preference) {
    return jsonError("Complete your preferences to see matches.", 409);
  }

  const preference = await prisma.preferenceProfile.findUniqueOrThrow({
    where: { id: user.preference.id },
    include: { market: true, matches: true }
  });
  const ranked = await getRankedMatches(preference, user.id);
  const statusByListing = new Map(preference.matches.map((match) => [match.listingId, match]));
  const withBreakdown = showsFitBreakdown(user.experimentGroups);

  return NextResponse.json({
    matches: ranked.map(({ listing, fit, rank }) => ({
      rank,
      fitScore: fit.score,
      fitBreakdown: withBreakdown ? fit : undefined,
      request: statusByListing.get(listing.id) ? { id: statusByListing.get(listing.id)!.id, status: statusByListing.get(listing.id)!.status } : null,
      listing: publicListing(listing)
    }))
  });
});
