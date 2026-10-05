import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AppealForm, MatchViewBeacon, RequestMatchForm } from "@/components/client/actions";
import { Badge, Banner, FitScoreBar, ListingStateBadge, PhotoPlaceholder, ScreenedBadge, VerifiedBadge } from "@/components/ui";
import { showsFitBreakdown } from "@/lib/experiments";
import { roomTypeLabel } from "@/lib/fit-score";
import { getRankedMatches, scoreListing } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { isAdmin, requireUser } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ListingPage({
  params,
  searchParams
}: {
  params: Promise<{ listingId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ listingId }, { created }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { market: true, furnitureItems: true, owner: { select: { universityName: true } } }
  });

  if (!listing) notFound();

  const isOwner = listing.ownerId === user.id;
  const myMatch = user.preference
    ? await prisma.match.findUnique({ where: { listingId_preferenceId: { listingId, preferenceId: user.preference.id } }, include: { transfer: true } })
    : null;
  const canView = isOwner || isAdmin(user) || myMatch || (listing.state === "ACTIVE" && listing.marketId === user.market.id);

  if (!canView) notFound();

  const fit = !isOwner && user.preference ? scoreListing(listing, user.preference, listing.market) : null;
  const withBreakdown = showsFitBreakdown(user.experimentGroups);
  const isLive = listing.state === "ACTIVE";

  let rank: number | null = null;
  if (fit && isLive && user.preference) {
    const ranked = await getRankedMatches({ ...user.preference, market: listing.market }, user.id);
    rank = ranked.find((entry) => entry.listing.id === listing.id)?.rank ?? null;
  }

  const availableUntil = listing.availableUntil ?? listing.leaseEndDate;
  const details = [
    { label: "Room type", value: roomTypeLabel(listing.roomType) },
    { label: "Available", value: `${formatDate(listing.availableFrom)} – ${formatDate(availableUntil)}` },
    { label: "Furniture", value: listing.isFurnished ? "Included" : "Not included" },
    { label: "Neighborhood", value: listing.neighborhood ?? listing.market.city }
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      {fit && isLive ? <MatchViewBeacon listingId={listing.id} fitScore={fit.score} rank={rank} /> : null}

      <div className="flex flex-col gap-6">
        {created && isOwner ? (
          listing.state === "ACTIVE" ? (
            <Banner tone="nest" icon={<CheckCircle2 size={16} />}>
              Your listing passed screening and is live. Matching students will see it in their feed.
            </Banner>
          ) : (
            <Banner tone="amber">Your listing is in a quick manual review before it goes live. You can add context below.</Banner>
          )
        ) : null}

        <div
          className="relative flex h-56 items-start justify-between rounded-xl bg-surface-sunken bg-cover bg-center p-4 sm:h-72"
          style={listing.photoUrls[0] ? { backgroundImage: `url(${JSON.stringify(listing.photoUrls[0])})` } : undefined}
        >
          {listing.photoUrls[0] ? null : <PhotoPlaceholder />}
          <span className="relative">{listing.isSample ? <Badge tone="sky">Sample listing</Badge> : null}</span>
          <div className="relative flex flex-wrap justify-end gap-1">
            <VerifiedBadge />
            {isLive ? <ScreenedBadge /> : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sky">{listing.owner.universityName ?? listing.market.universityName}</Badge>
            {isOwner || isAdmin(user) ? <ListingStateBadge state={listing.state} /> : null}
          </div>
          <h1 className="text-heading-lg">{listing.title}</h1>
          <p className="text-heading-sm text-nest">{formatCurrency(listing.monthlyRentCents / 100)}/mo</p>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-surface-raised p-4">
          {details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-caption text-ink-muted">{detail.label}</dt>
              <dd className="font-medium">{detail.value}</dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-2">
          <h2 className="text-heading-sm">About this place</h2>
          <p className="whitespace-pre-line text-ink">{listing.description}</p>
          {listing.furnitureItems.map((item) => (
            <p key={item.id} className="text-body-sm text-ink-muted">
              Furniture: {item.description}
            </p>
          ))}
          {listing.lifestyleTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {listing.lifestyleTags.map((tag) => (
                <span key={tag} className="nn-tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
        {fit ? (
          <div className="nn-card p-5">
            <h2 className="mb-3 text-heading">Your fit</h2>
            <FitScoreBar score={fit.score} dimensions={withBreakdown ? fit.dimensions : undefined} compact={!withBreakdown} />
            {withBreakdown ? <p className="mt-3 text-body-sm text-ink-muted">{fit.summary}.</p> : null}
          </div>
        ) : null}

        {!isOwner ? (
          <div className="nn-card p-5">
            {myMatch && myMatch.status !== "WITHDRAWN" ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium">
                  {myMatch.status === "REQUESTED" && "Request sent. The tenant will review it."}
                  {myMatch.status === "ACCEPTED" && "The tenant accepted your request."}
                  {myMatch.status === "DECLINED" && "The tenant went with someone else this time."}
                  {myMatch.status === "TRANSFERRED" && "This lease is now yours."}
                </p>
                {myMatch.transfer ? (
                  <Link href={`/transfers/${myMatch.transfer.id}`} className="nn-btn nn-btn-primary">
                    {myMatch.transfer.status === "FULLY_EXECUTED" ? "View signed transfer" : "Review and sign"}
                  </Link>
                ) : null}
              </div>
            ) : listing.isSample ? (
              <p className="text-body-sm text-ink-muted">This is a sample listing that shows how matching works. Real listings can be requested.</p>
            ) : !user.preference ? (
              <div className="flex flex-col gap-3">
                <p className="text-body-sm text-ink-muted">Set your preferences to see your fit score and request this room.</p>
                <Link href="/preferences" className="nn-btn nn-btn-primary">
                  Set preferences
                </Link>
              </div>
            ) : isLive ? (
              <RequestMatchForm listingId={listing.id} />
            ) : (
              <p className="text-body-sm text-ink-muted">This listing is no longer taking requests.</p>
            )}
          </div>
        ) : (
          <div className="nn-card flex flex-col gap-3 p-5">
            <h2 className="text-heading-sm">Manage</h2>
            {listing.state === "UNDER_REVIEW" || listing.state === "REJECTED" ? (
              listing.appealNote ? (
                <p className="text-body-sm text-ink-muted">Your note is with a reviewer: “{listing.appealNote}”</p>
              ) : (
                <AppealForm listingId={listing.id} />
              )
            ) : (
              <Link href="/dashboard" className="nn-btn nn-btn-sm self-start">
                See match requests
              </Link>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
