import type { Market, Prisma, User } from "@prisma/client";
import { trackEvent } from "@/lib/events";
import { parseDate, type ListingInput } from "@/lib/listing-input";
import { parseNeighborhoods } from "@/lib/markets";
import { prisma } from "@/lib/prisma";
import { screenListing } from "@/lib/scam/screen";

const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000;

export class ListingInputError extends Error {}

/**
 * Creates a listing in SCREENING, runs both scam-detection paths, logs the
 * decision for audit, and moves the listing to ACTIVE or UNDER_REVIEW.
 */
export async function createListing(user: User & { market: Market }, input: ListingInput) {
  const neighborhood = parseNeighborhoods(user.market.neighborhoods).find((n) => n.slug === input.neighborhood);

  if (!neighborhood) {
    throw new ListingInputError("Pick a neighborhood in your university market.");
  }

  const monthlyRentCents = input.monthlyRent * 100;
  const leaseEndDate = parseDate(input.leaseEndDate);
  const availableFrom = parseDate(input.availableFrom);

  const listing = await prisma.listing.create({
    data: {
      ownerId: user.id,
      marketId: user.market.id,
      title: input.title,
      description: input.description,
      streetLine1: input.streetLine1,
      city: user.market.city,
      stateRegion: user.market.stateRegion,
      postalCode: "",
      campusName: user.market.universityName,
      neighborhood: neighborhood.name,
      latitude: neighborhood.lat,
      longitude: neighborhood.lng,
      monthlyRentCents,
      leaseStartDate: parseDate(input.leaseStartDate),
      leaseEndDate,
      availableFrom,
      availableUntil: leaseEndDate,
      roomType: input.roomType,
      isFurnished: input.isFurnished,
      furnishingStatus: input.isFurnished ? "FULLY_FURNISHED" : "UNFURNISHED",
      lifestyleTags: input.lifestyleTags,
      photoUrls: input.photoUrls,
      landlordName: input.landlordName || null,
      landlordEmail: input.landlordEmail || null,
      state: "SCREENING",
      publishedAt: new Date(),
      furnitureItems: input.isFurnished && input.furnitureNotes ? { create: [{ name: "Included furniture", description: input.furnitureNotes }] } : undefined
    }
  });

  const screeningInput = {
    monthlyRentCents,
    marketAvgRentCents: user.market.marketAvgRentCents,
    text: [input.title, input.description, input.furnitureNotes].filter(Boolean).join("\n\n"),
    accountCreatedAt: user.createdAt,
    now: new Date(),
    listingLocation: { lat: neighborhood.lat, lng: neighborhood.lng },
    campusLocation: { lat: Number(user.market.campusLatitude), lng: Number(user.market.campusLongitude) }
  };

  const screening = await screenListing(screeningInput);
  const claudeScore = screening.claude.ok ? screening.claude.assessment.risk_score : null;
  const held = screening.outcome.decision === "HELD_FOR_REVIEW";

  const [updated] = await prisma.$transaction([
    prisma.listing.update({
      where: { id: listing.id },
      data: { state: held ? "UNDER_REVIEW" : "ACTIVE", scamScore: claudeScore, scamFlagged: held }
    }),
    prisma.scamCheck.create({
      data: {
        listingId: listing.id,
        heuristicFlags: screening.heuristics.flags,
        claudeRiskScore: claudeScore,
        claudeFlags: screening.claude.ok ? screening.claude.assessment.flags : [],
        claudeReasoning: screening.claude.ok ? screening.claude.assessment.reasoning : null,
        claudeError: screening.claude.ok ? null : screening.claude.error,
        threshold: screening.threshold,
        decision: screening.outcome.decision,
        inputs: {
          ...screeningInput,
          accountCreatedAt: screeningInput.accountCreatedAt.toISOString(),
          now: screeningInput.now.toISOString(),
          matchedPhrases: screening.heuristics.matchedPhrases,
          heuristicDetails: screening.heuristics.details,
          reason: screening.outcome.reason,
          model: screening.claude.ok ? screening.claude.model : null
        } as Prisma.InputJsonObject
      }
    })
  ]);

  await trackEvent("listing_created", {
    userId: user.id,
    marketId: user.market.id,
    properties: {
      listing_id: listing.id,
      university_market: user.market.slug,
      price: input.monthlyRent,
      lease_duration: Math.round((leaseEndDate.getTime() - availableFrom.getTime()) / MONTH_MS),
      furniture_included: input.isFurnished
    }
  });

  if (held) {
    const heuristicHit = screening.heuristics.flags.length > 0;
    const claudeHit = claudeScore !== null && claudeScore >= 40;
    await trackEvent("listing_flagged", {
      userId: user.id,
      marketId: user.market.id,
      properties: {
        listing_id: listing.id,
        flag_source: heuristicHit && claudeHit ? "both" : claudeHit ? "claude" : "heuristic",
        risk_score: claudeScore
      }
    });
  }

  return updated;
}
