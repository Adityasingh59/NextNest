import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Funnel and KPI queries over the events table
 * (spec: "Funnel Framework" and "KPI Framework").
 * Every stage counts distinct students so stage-to-stage conversion is meaningful;
 * accept/sign stages are attributed to the requesting student via seeker_user_id.
 */

export type FunnelStage = { key: string; label: string; count: number; conversionFromPrevious: number | null };

const ratio = (numerator: number, denominator: number) => (denominator > 0 ? numerator / denominator : null);

function marketFilter(marketId?: string) {
  return marketId ? Prisma.sql`AND "marketId" = ${marketId}` : Prisma.empty;
}

async function distinctUsers(eventTypes: string[], marketId?: string) {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "userId") AS count FROM "Event"
    WHERE "eventType" IN (${Prisma.join(eventTypes)}) ${marketFilter(marketId)}`;
  return Number(rows[0]?.count ?? 0);
}

async function distinctSeekers(eventType: string, marketId?: string) {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "eventProperties"->>'seeker_user_id') AS count FROM "Event"
    WHERE "eventType" = ${eventType} ${marketFilter(marketId)}`;
  return Number(rows[0]?.count ?? 0);
}

async function countEvents(eventType: string, marketId?: string) {
  return prisma.event.count({ where: { eventType, ...(marketId ? { marketId } : {}) } });
}

export async function getFunnel(marketId?: string): Promise<FunnelStage[]> {
  const counts = [
    { key: "signup", label: "Signup", count: await distinctUsers(["user_signed_up"], marketId) },
    { key: "created", label: "Profile / listing created", count: await distinctUsers(["preference_submitted", "listing_created"], marketId) },
    { key: "viewed", label: "Match viewed", count: await distinctUsers(["match_viewed"], marketId) },
    { key: "requested", label: "Match requested", count: await distinctUsers(["match_requested"], marketId) },
    { key: "accepted", label: "Match accepted", count: await distinctSeekers("match_accepted", marketId) },
    { key: "signed", label: "Lease signed", count: await distinctSeekers("lease_signed", marketId) }
  ];

  return counts.map((stage, index) => ({
    ...stage,
    conversionFromPrevious: index === 0 ? null : ratio(stage.count, counts[index - 1].count)
  }));
}

export async function getKpis(marketId?: string) {
  const filter = marketFilter(marketId);

  const [activation] = await prisma.$queryRaw<{ signed_up: bigint; activated: bigint }[]>`
    WITH signups AS (
      SELECT "userId", MIN("createdAt") AS at FROM "Event"
      WHERE "eventType" = 'user_signed_up' ${filter} GROUP BY "userId"
    )
    SELECT COUNT(*) AS signed_up,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM "Event" e WHERE e."userId" = s."userId"
          AND e."eventType" IN ('preference_submitted', 'listing_created')
          AND e."createdAt" <= s.at + INTERVAL '48 hours'
      )) AS activated
    FROM signups s`;

  const [pairs] = await prisma.$queryRaw<{ viewed: bigint; requested: bigint }[]>`
    SELECT
      COUNT(DISTINCT ("userId", "eventProperties"->>'listing_id')) FILTER (WHERE "eventType" = 'match_viewed') AS viewed,
      COUNT(DISTINCT ("userId", "eventProperties"->>'listing_id')) FILTER (WHERE "eventType" = 'match_requested') AS requested
    FROM "Event" WHERE "eventType" IN ('match_viewed', 'match_requested') ${filter}`;

  const [firstView] = await prisma.$queryRaw<{ median_hours: number | null }[]>`
    WITH signups AS (
      SELECT "userId", MIN("createdAt") AS at FROM "Event" WHERE "eventType" = 'user_signed_up' ${filter} GROUP BY "userId"
    ), views AS (
      SELECT "userId", MIN("createdAt") AS at FROM "Event" WHERE "eventType" = 'match_viewed' ${filter} GROUP BY "userId"
    )
    SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (v.at - s.at)) / 3600)::float AS median_hours
    FROM signups s JOIN views v ON v."userId" = s."userId"`;

  const requested = await countEvents("match_requested", marketId);
  const accepted = await countEvents("match_accepted", marketId);
  const signed = await countEvents("lease_signed", marketId);

  return {
    activationRate: ratio(Number(activation?.activated ?? 0), Number(activation?.signed_up ?? 0)),
    matchToRequestRate: ratio(Number(pairs?.requested ?? 0), Number(pairs?.viewed ?? 0)),
    requestToAcceptRate: ratio(accepted, requested),
    acceptToSignRate: ratio(signed, accepted),
    medianHoursToFirstMatchView: firstView?.median_hours ?? null
  };
}

/** Experiment 1: match-to-request rate by fit-score transparency variant. */
export async function getTransparencyExperiment(marketId?: string) {
  const rows = await prisma.$queryRaw<{ variant: string | null; viewed: bigint; requested: bigint }[]>`
    SELECT "eventProperties"->>'fit_score_variant' AS variant,
      COUNT(DISTINCT ("userId", "eventProperties"->>'listing_id')) FILTER (WHERE "eventType" = 'match_viewed') AS viewed,
      COUNT(DISTINCT ("userId", "eventProperties"->>'listing_id')) FILTER (WHERE "eventType" = 'match_requested') AS requested
    FROM "Event" WHERE "eventType" IN ('match_viewed', 'match_requested') ${marketFilter(marketId)}
    GROUP BY 1`;

  return (["control", "treatment"] as const).map((variant) => {
    const row = rows.find((candidate) => candidate.variant === variant);
    const viewed = Number(row?.viewed ?? 0);
    const requested = Number(row?.requested ?? 0);
    return { variant, viewed, requested, rate: ratio(requested, viewed) };
  });
}

/** Scam detection precision and false-positive rate from reviewed checks. */
export async function getScamStats(marketId?: string) {
  const listingFilter = marketId ? { listing: { marketId } } : {};
  const [screened, held, confirmedScam, clearedAfterHold] = await Promise.all([
    prisma.scamCheck.count({ where: listingFilter }),
    prisma.scamCheck.count({ where: { ...listingFilter, decision: "HELD_FOR_REVIEW" } }),
    prisma.scamCheck.count({ where: { ...listingFilter, decision: "HELD_FOR_REVIEW", reviewOutcome: "REJECTED" } }),
    prisma.scamCheck.count({ where: { ...listingFilter, decision: "HELD_FOR_REVIEW", reviewOutcome: "APPROVED" } })
  ]);
  const autoApproved = screened - held;

  return {
    screened,
    held,
    pendingReview: held - confirmedScam - clearedAfterHold,
    precision: ratio(confirmedScam, confirmedScam + clearedAfterHold),
    falsePositiveRate: ratio(clearedAfterHold, clearedAfterHold + autoApproved)
  };
}
