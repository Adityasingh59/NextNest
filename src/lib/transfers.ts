import type { Prisma } from "@prisma/client";
import { trackEvent } from "@/lib/events";
import { readExperimentGroups } from "@/lib/experiments";
import { scoreListing } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/session";

const DAY_MS = 24 * 60 * 60 * 1000;

export class TransferError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
  }
}

/** Arriving student asks to take over a listing. Stores a fit-score snapshot. */
export async function requestMatch(user: CurrentUser, listingId: string, introMessage?: string) {
  if (!user.preference) {
    throw new TransferError("Complete your preferences before requesting a match.");
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { market: true } });

  if (!listing || listing.state !== "ACTIVE" || listing.marketId !== user.preference.marketId) {
    throw new TransferError("This listing is not available.", 404);
  }
  if (listing.ownerId === user.id) {
    throw new TransferError("You cannot request your own listing.");
  }
  if (listing.isSample) {
    throw new TransferError("Sample listings show how matching works and cannot be requested.");
  }

  const existing = await prisma.match.findUnique({
    where: { listingId_preferenceId: { listingId, preferenceId: user.preference.id } }
  });
  if (existing && existing.status !== "WITHDRAWN") {
    return existing;
  }

  const fit = scoreListing(listing, user.preference, listing.market);
  const data = {
    fitScore: fit.score,
    fitBreakdown: fit as unknown as Prisma.InputJsonObject,
    status: "REQUESTED" as const,
    introMessage: introMessage?.trim().slice(0, 300) || null,
    requestedAt: new Date(),
    respondedAt: null,
    declineReason: null
  };

  const match = await prisma.match.upsert({
    where: { listingId_preferenceId: { listingId, preferenceId: user.preference.id } },
    create: { listingId, preferenceId: user.preference.id, ...data },
    update: data
  });

  await trackEvent("match_requested", {
    userId: user.id,
    marketId: listing.marketId,
    properties: {
      listing_id: listingId,
      match_id: match.id,
      fit_score: fit.score,
      fit_score_variant: readExperimentGroups(user.experimentGroups).fit_score_transparency ?? null
    }
  });

  return match;
}

async function loadOwnedRequest(user: CurrentUser, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { listing: true, preference: true }
  });

  if (!match || match.listing.ownerId !== user.id) {
    throw new TransferError("Match request not found.", 404);
  }
  if (match.status !== "REQUESTED") {
    throw new TransferError("This request has already been answered.", 409);
  }

  return match;
}

/** Departing tenant accepts: listing is matched, other requests close, signing opens. */
export async function acceptMatch(user: CurrentUser, matchId: string) {
  const match = await loadOwnedRequest(user, matchId);

  if (match.listing.state !== "ACTIVE") {
    throw new TransferError("This listing is no longer open for matches.", 409);
  }

  const others = await prisma.match.findMany({
    where: { listingId: match.listingId, status: "REQUESTED", id: { not: match.id } },
    select: { id: true }
  });

  const transfer = await prisma.$transaction(async (tx) => {
    const claimed = await tx.listing.updateMany({
      where: { id: match.listingId, state: "ACTIVE" },
      data: { state: "MATCHED" }
    });
    if (claimed.count !== 1) {
      throw new TransferError("This listing is no longer open for matches.", 409);
    }

    await tx.match.update({ where: { id: match.id }, data: { status: "ACCEPTED", respondedAt: new Date() } });
    await tx.match.updateMany({
      where: { id: { in: others.map((other) => other.id) } },
      data: { status: "DECLINED", respondedAt: new Date(), declineReason: "The listing was matched with another student." }
    });

    return tx.leaseTransfer.create({
      data: {
        listingId: match.listingId,
        matchId: match.id,
        outgoingStudentId: user.id,
        incomingStudentId: match.preference.userId,
        status: "READY_FOR_SIGNATURE",
        readyForSignatureAt: new Date()
      }
    });
  });

  await trackEvent("match_accepted", {
    userId: user.id,
    marketId: match.listing.marketId,
    properties: {
      listing_id: match.listingId,
      match_id: match.id,
      seeker_user_id: match.preference.userId,
      days_to_accept: Math.round(((Date.now() - match.requestedAt.getTime()) / DAY_MS) * 10) / 10
    }
  });

  for (const other of others) {
    await trackEvent("match_declined", {
      userId: user.id,
      marketId: match.listing.marketId,
      properties: { listing_id: match.listingId, match_id: other.id, decline_reason: "listing_matched_elsewhere" }
    });
  }

  return transfer;
}

export async function declineMatch(user: CurrentUser, matchId: string, reason?: string) {
  const match = await loadOwnedRequest(user, matchId);
  const declineReason = reason?.trim().slice(0, 300) || null;

  const updated = await prisma.match.update({
    where: { id: match.id },
    data: { status: "DECLINED", respondedAt: new Date(), declineReason }
  });

  await trackEvent("match_declined", {
    userId: user.id,
    marketId: match.listing.marketId,
    properties: { listing_id: match.listingId, match_id: match.id, decline_reason: declineReason }
  });

  return updated;
}

/** Built-in e-signature: each party types their full legal name once. */
export async function signTransfer(user: CurrentUser, transferId: string, signatureName: string) {
  const name = signatureName.trim();
  if (name.length < 3 || name.length > 120) {
    throw new TransferError("Type your full legal name to sign.");
  }

  const transfer = await prisma.leaseTransfer.findUnique({
    where: { id: transferId },
    include: { listing: { include: { market: true } }, incomingStudent: true }
  });

  if (!transfer || (transfer.outgoingStudentId !== user.id && transfer.incomingStudentId !== user.id)) {
    throw new TransferError("Transfer not found.", 404);
  }
  if (transfer.status === "FULLY_EXECUTED" || transfer.status === "CANCELLED") {
    throw new TransferError("This transfer is already closed.", 409);
  }

  const isOutgoing = transfer.outgoingStudentId === user.id;
  const alreadySigned = isOutgoing ? transfer.outgoingSignedAt : transfer.incomingSignedAt;
  if (alreadySigned) {
    throw new TransferError("You have already signed.", 409);
  }

  const now = new Date();
  const otherSigned = isOutgoing ? transfer.incomingSignedAt : transfer.outgoingSignedAt;
  const complete = Boolean(otherSigned);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.leaseTransfer.update({
      where: { id: transfer.id },
      data: {
        ...(isOutgoing ? { outgoingSignatureName: name, outgoingSignedAt: now } : { incomingSignatureName: name, incomingSignedAt: now }),
        status: complete ? "FULLY_EXECUTED" : isOutgoing ? "OUTGOING_SIGNED" : "INCOMING_SIGNED",
        fullyExecutedAt: complete ? now : null
      }
    });

    if (complete) {
      await tx.match.update({ where: { id: transfer.matchId }, data: { status: "TRANSFERRED" } });
      await tx.listing.update({ where: { id: transfer.listingId }, data: { state: "TRANSFERRED", completedAt: now } });
    }

    return result;
  });

  if (complete) {
    const properties = {
      match_id: transfer.matchId,
      university_market: transfer.listing.market.slug,
      seeker_user_id: transfer.incomingStudentId
    };
    await trackEvent("lease_signed", { userId: user.id, marketId: transfer.listing.marketId, properties });
    await trackEvent("transfer_completed", {
      userId: user.id,
      marketId: transfer.listing.marketId,
      properties: {
        ...properties,
        days_from_signup: Math.round((now.getTime() - transfer.incomingStudent.createdAt.getTime()) / DAY_MS)
      }
    });
  }

  return updated;
}
