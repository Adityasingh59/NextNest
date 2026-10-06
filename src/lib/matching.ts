import type { Listing, Market, PreferenceProfile } from "@prisma/client";
import { computeFitScore, type FitListing, type FitPreference, type FitResult } from "@/lib/fit-score";
import { CAMPUS_AREA_SLUG, parseNeighborhoods } from "@/lib/markets";
import { prisma } from "@/lib/prisma";

export function toFitListing(listing: Listing): FitListing {
  return {
    monthlyRentCents: listing.monthlyRentCents,
    location: { lat: Number(listing.latitude), lng: Number(listing.longitude) },
    availableFrom: listing.availableFrom,
    availableUntil: listing.availableUntil ?? listing.leaseEndDate,
    roomType: listing.roomType,
    isFurnished: listing.isFurnished,
    lifestyleTags: listing.lifestyleTags
  };
}

export function areaLabel(preferredArea: string, market: Market) {
  if (preferredArea === CAMPUS_AREA_SLUG) {
    return "campus";
  }

  return parseNeighborhoods(market.neighborhoods).find((n) => n.slug === preferredArea)?.name ?? "your area";
}

export function toFitPreference(preference: PreferenceProfile, market: Market): FitPreference {
  return {
    budgetMinCents: preference.budgetMinCents,
    budgetMaxCents: preference.budgetMaxCents,
    areaLabel: areaLabel(preference.preferredArea, market),
    area: { lat: Number(preference.areaLatitude), lng: Number(preference.areaLongitude) },
    commuteRadiusMiles: Number(preference.commuteRadiusMiles),
    moveInDate: preference.moveInDate,
    leaseDurationMonths: preference.leaseDurationMonths,
    roomType: preference.roomType,
    wantsFurnished: preference.wantsFurnished,
    lifestyleTags: preference.lifestyleTags
  };
}

export function scoreListing(listing: Listing, preference: PreferenceProfile, market: Market): FitResult {
  return computeFitScore(toFitListing(listing), toFitPreference(preference, market));
}

export type RankedMatch = { listing: Listing; fit: FitResult; rank: number };

/**
 * Ranked feed for an arriving student: every live listing in their market,
 * scored and sorted. Computed per request (spec target: 500 listings < 2s).
 */
export async function getRankedMatches(preference: PreferenceProfile & { market: Market }, userId: string) {
  const listings = await prisma.listing.findMany({
    where: { marketId: preference.marketId, state: "ACTIVE", ownerId: { not: userId } }
  });

  return listings
    .map((listing) => ({ listing, fit: scoreListing(listing, preference, preference.market) }))
    .sort((a, b) => b.fit.score - a.fit.score || a.listing.monthlyRentCents - b.listing.monthlyRentCents)
    .map((entry, index): RankedMatch => ({ ...entry, rank: index + 1 }));
}
