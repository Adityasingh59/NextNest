import Link from "next/link";
import { redirect } from "next/navigation";
import { RespondToRequest } from "@/components/client/actions";
import { Badge, EmptyState, FitScoreBar, ListingCard, ListingStateBadge, PageHeader } from "@/components/ui";
import { showsFitBreakdown } from "@/lib/experiments";
import { roomTypeLabel } from "@/lib/fit-score";
import { getRankedMatches } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils";

const REQUEST_STATUS: Record<string, { tone: "neutral" | "nest" | "sky" | "amber" | "red"; label: string }> = {
  REQUESTED: { tone: "sky", label: "Waiting for tenant" },
  ACCEPTED: { tone: "nest", label: "Accepted" },
  DECLINED: { tone: "neutral", label: "Declined" },
  WITHDRAWN: { tone: "neutral", label: "Withdrawn" },
  TRANSFERRED: { tone: "nest", label: "Transferred" }
};

export default async function DashboardPage() {
  const user = await requireUser();

  if (!user.name) {
    redirect("/onboarding");
  }

  const [preference, myListings] = await Promise.all([
    user.preference
      ? prisma.preferenceProfile.findUnique({
          where: { id: user.preference.id },
          include: { market: true, matches: { include: { listing: true, transfer: true }, orderBy: { requestedAt: "desc" } } }
        })
      : null,
    prisma.listing.findMany({
      where: { ownerId: user.id, state: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      include: {
        transfer: true,
        matches: {
          orderBy: [{ fitScore: "desc" }],
          include: { preference: { include: { user: { select: { universityName: true } } } } }
        }
      }
    })
  ]);

  const ranked = preference ? await getRankedMatches(preference, user.id) : [];
  const withBreakdown = showsFitBreakdown(user.experimentGroups);
  const requestedIds = new Set(preference?.matches.map((match) => match.listingId));
  const openRequests = myListings.flatMap((listing) => listing.matches.filter((match) => match.status === "REQUESTED"));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        overline={user.market.universityName}
        title={`Hi, ${user.name}`}
        description={
          openRequests.length > 0
            ? `You have ${openRequests.length} match request${openRequests.length === 1 ? "" : "s"} to review.`
            : "Your matches, requests and listings in one place."
        }
      />

      {myListings.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="listings-heading">
          <div className="flex items-center justify-between">
            <h2 id="listings-heading" className="text-heading">
              Your listings
            </h2>
            <Link href="/listings/new" className="nn-btn nn-btn-sm">
              List another room
            </Link>
          </div>
          {myListings.map((listing) => {
            const requests = listing.matches.filter((match) => match.status === "REQUESTED");
            return (
              <article key={listing.id} className="nn-card flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/listings/${listing.id}`} className="text-heading-sm hover:underline">
                      {listing.title}
                    </Link>
                    <p className="text-body-sm text-ink-muted">
                      {formatCurrency(listing.monthlyRentCents / 100)}/mo · {listing.neighborhood} ·{" "}
                      {formatDateRange(listing.availableFrom, listing.availableUntil ?? listing.leaseEndDate)}
                    </p>
                  </div>
                  <ListingStateBadge state={listing.state} />
                </div>

                {listing.state === "UNDER_REVIEW" ? (
                  <p className="text-body-sm text-ink-muted">
                    Our scam screening asked for a quick manual review. Most reviews finish within a day.{" "}
                    <Link className="nn-link" href={`/listings/${listing.id}`}>
                      Add context
                    </Link>
                  </p>
                ) : null}

                {listing.transfer ? (
                  <Link href={`/transfers/${listing.transfer.id}`} className="nn-btn nn-btn-sm nn-btn-primary self-start">
                    {listing.transfer.status === "FULLY_EXECUTED" ? "View signed transfer" : "Continue transfer"}
                  </Link>
                ) : null}

                {listing.state === "ACTIVE" ? (
                  requests.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                      {requests.map((match) => (
                        <li key={match.id} className="flex flex-col gap-3 rounded-md border border-line-subtle bg-surface p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="nest">Verified student</Badge>
                            <Badge tone="sky">{match.preference.user.universityName}</Badge>
                            <span className="text-caption text-ink-faint">Requested {formatDate(match.requestedAt)}</span>
                          </div>
                          <FitScoreBar score={match.fitScore} compact label="Their fit with your room" />
                          {match.introMessage ? <p className="text-body-sm">“{match.introMessage}”</p> : null}
                          <RespondToRequest matchId={match.id} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-body-sm text-ink-muted">No requests yet. Students whose preferences fit your room will see it near the top of their matches.</p>
                  )
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}

      {preference && preference.matches.length > 0 ? (
        <section className="flex flex-col gap-4" aria-labelledby="requests-heading">
          <h2 id="requests-heading" className="text-heading">
            Your requests
          </h2>
          <ul className="flex flex-col gap-3">
            {preference.matches.map((match) => {
              const status = REQUEST_STATUS[match.status];
              return (
                <li key={match.id} className="nn-card flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link href={`/listings/${match.listingId}`} className="font-medium hover:underline">
                      {match.listing.title}
                    </Link>
                    <p className="text-body-sm text-ink-muted">
                      {match.fitScore}% match · requested {formatDate(match.requestedAt)}
                      {match.declineReason ? ` · ${match.declineReason}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {match.transfer ? (
                      <Link href={`/transfers/${match.transfer.id}`} className="nn-btn nn-btn-sm nn-btn-primary">
                        {match.transfer.status === "FULLY_EXECUTED" ? "View transfer" : "Sign lease"}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="matches-heading">
        <div className="flex items-center justify-between">
          <h2 id="matches-heading" className="text-heading">
            Your matches
          </h2>
          {preference ? (
            <Link href="/preferences" className="nn-btn nn-btn-sm">
              Edit preferences
            </Link>
          ) : null}
        </div>

        {!preference ? (
          <EmptyState
            title="Looking for a place?"
            action={
              <Link href="/preferences" className="nn-btn nn-btn-primary">
                Set your preferences
              </Link>
            }
          >
            Tell us your budget, area and dates. We rank every verified listing in {user.market.name} by how well it fits.
          </EmptyState>
        ) : ranked.length === 0 ? (
          <EmptyState title="No listings yet">
            New listings in {user.market.name} appear here as soon as they pass screening. Your preferences are saved.
          </EmptyState>
        ) : (
          <>
            <p className="text-body-sm text-ink-muted">
              {ranked.length} verified listing{ranked.length === 1 ? "" : "s"}, best fit first. Top match: {ranked[0].fit.score}%.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {ranked.map(({ listing, fit }) => (
                <ListingCard
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  title={listing.title}
                  monthlyRent={listing.monthlyRentCents / 100}
                  location={listing.neighborhood ?? user.market.city}
                  dates={formatDateRange(listing.availableFrom, listing.availableUntil ?? listing.leaseEndDate)}
                  photoUrl={listing.photoUrls[0]}
                  tags={[roomTypeLabel(listing.roomType), ...(listing.isFurnished ? ["Furnished"] : []), ...listing.lifestyleTags]}
                  score={fit.score}
                  summary={withBreakdown ? fit.summary : undefined}
                  isSample={listing.isSample}
                  footer={requestedIds.has(listing.id) ? <Badge tone="sky">Requested</Badge> : undefined}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
