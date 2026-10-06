import Link from "next/link";
import { ReviewActions } from "@/components/client/actions";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { HEURISTIC_FLAG_LABELS, type HeuristicFlag } from "@/lib/scam/heuristics";
import { requireAdmin } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ReviewQueuePage() {
  await requireAdmin();

  const held = await prisma.listing.findMany({
    where: { state: "UNDER_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: { market: true, owner: { select: { email: true, createdAt: true } }, scamChecks: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        overline="Trust and safety"
        title="Review queue"
        description="Listings held by scam screening. Your decision is recorded and feeds the precision and false-positive metrics."
      />
      {held.length === 0 ? (
        <EmptyState title="Nothing to review">Held listings appear here.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-4">
          {held.map((listing) => {
            const check = listing.scamChecks[0];
            return (
              <li key={listing.id} className="nn-card flex flex-col gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/listings/${listing.id}`} className="text-heading-sm hover:underline">
                      {listing.title}
                    </Link>
                    <p className="text-body-sm text-ink-muted">
                      {listing.market.name} · {formatCurrency(listing.monthlyRentCents / 100)}/mo (market avg {formatCurrency(listing.market.marketAvgRentCents / 100)}) ·{" "}
                      {listing.owner.email} · account since {formatDate(listing.owner.createdAt)}
                    </p>
                  </div>
                  {check?.claudeRiskScore !== null && check?.claudeRiskScore !== undefined ? (
                    <Badge tone={check.claudeRiskScore > check.threshold ? "red" : "amber"}>Claude risk {check.claudeRiskScore}</Badge>
                  ) : (
                    <Badge>Claude: {check?.claudeError ?? "n/a"}</Badge>
                  )}
                </div>
                {check ? (
                  <div className="flex flex-col gap-2 text-body-sm">
                    {check.heuristicFlags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {check.heuristicFlags.map((flag) => (
                          <Badge key={flag} tone="amber">
                            {HEURISTIC_FLAG_LABELS[flag as HeuristicFlag] ?? flag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {check.claudeReasoning ? <p className="text-ink-muted">Claude: {check.claudeReasoning}</p> : null}
                    {check.claudeFlags.length > 0 ? <p className="text-caption text-ink-faint">{check.claudeFlags.join(" · ")}</p> : null}
                  </div>
                ) : null}
                <p className="whitespace-pre-line rounded-md bg-surface-sunken p-3 text-body-sm">{listing.description}</p>
                {listing.appealNote ? <p className="text-body-sm">Poster’s note: “{listing.appealNote}”</p> : null}
                <ReviewActions listingId={listing.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
