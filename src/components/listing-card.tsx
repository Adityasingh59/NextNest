import Link from "next/link";
import { ListingSummary, formatCurrency, formatDate } from "@/lib/marketplace";
import { StatusBadge } from "@/components/status-badge";

export function ListingCard({ listing }: { listing: ListingSummary }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[hsl(var(--border))] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className={`h-40 bg-gradient-to-br ${listing.imageGradient} p-6`}>
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
              {listing.neighborhood}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
              {listing.title}
            </h3>
          </div>
          <StatusBadge value={listing.status} />
        </div>
      </div>

      <div className="space-y-5 p-6">
        <p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">{listing.summary}</p>

        <div className="grid gap-3 text-sm text-[hsl(var(--muted-foreground))] sm:grid-cols-2">
          <div className="rounded-2xl bg-[hsl(var(--background))] p-4">
            <p className="text-xs uppercase tracking-[0.25em]">Rent</p>
            <p className="mt-2 text-lg font-semibold text-[hsl(var(--foreground))]">
              {formatCurrency(listing.monthlyRent)}/mo
            </p>
          </div>
          <div className="rounded-2xl bg-[hsl(var(--background))] p-4">
            <p className="text-xs uppercase tracking-[0.25em]">Move-in</p>
            <p className="mt-2 text-lg font-semibold text-[hsl(var(--foreground))]">
              {formatDate(listing.moveInDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))]">
          <span className="rounded-full bg-stone-100 px-3 py-1">{listing.beds}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">{listing.baths}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">{listing.furnishingLabel}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            {listing.leaseMonthsRemaining} months left
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            {listing.campusDistanceMiles} mi to {listing.campusSpot}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{listing.address}</p>
          <Link
            href={`/listings/${listing.id}`}
            className="rounded-full bg-[hsl(var(--primary))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
