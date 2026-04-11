import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { StatusBadge } from "@/components/status-badge";
import { filterListings, getNeighborhoodOptions, formatCurrency } from "@/lib/marketplace";

type SearchParams = Promise<{
  minRent?: string;
  maxRent?: string;
  moveIn?: string;
  furnished?: string;
  leaseTerm?: string;
  radius?: string;
  neighborhood?: string;
}>;

export default async function ListingsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filteredListings = filterListings({
    minRent: params.minRent ? Number(params.minRent) : undefined,
    maxRent: params.maxRent ? Number(params.maxRent) : undefined,
    moveIn: params.moveIn,
    furnishedOnly: params.furnished === "true",
    leaseTerm: params.leaseTerm,
    radius: params.radius ? Number(params.radius) : undefined,
    neighborhood: params.neighborhood
  });

  const neighborhoods = getNeighborhoodOptions();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[2rem] border border-[hsl(var(--border))] bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
              Discovery
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Find the right takeover before orientation begins.</h1>
            <p className="mt-4 text-base leading-7 text-[hsl(var(--muted-foreground))]">
              The filters below mirror the product requirements: rent range, move-in date, campus radius,
              furnished-only toggle, and lease term segmentation.
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white"
          >
            Post a lease takeover
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <form className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">
                Monthly rent
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  name="minRent"
                  defaultValue={params.minRent ?? "1200"}
                  className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
                  placeholder="Min"
                />
                <input
                  name="maxRent"
                  defaultValue={params.maxRent ?? "2400"}
                  className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">
                Move-in date
              </label>
              <input
                type="date"
                name="moveIn"
                defaultValue={params.moveIn ?? "2026-06-15"}
                className="mt-3 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">
                Campus radius
              </label>
              <select
                name="radius"
                defaultValue={params.radius ?? "0.5"}
                className="mt-3 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
              >
                <option value="0.5">Within 0.5 miles</option>
                <option value="1">Within 1 mile</option>
                <option value="2">Within 2 miles</option>
              </select>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                Google Maps geocoding can resolve a campus building here later. Neighborhood fallback already works.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">
                Neighborhood fallback
              </label>
              <select
                name="neighborhood"
                defaultValue={params.neighborhood ?? "all"}
                className="mt-3 w-full rounded-2xl border border-[hsl(var(--border))] px-4 py-3"
              >
                <option value="all">All neighborhoods</option>
                {neighborhoods.map((neighborhood) => (
                  <option key={neighborhood} value={neighborhood}>
                    {neighborhood}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3 rounded-2xl bg-[hsl(var(--background))] px-4 py-4">
                <input type="checkbox" name="furnished" value="true" defaultChecked={params.furnished === "true"} />
                <span className="text-sm font-medium">Furnished only</span>
              </label>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">Lease term</p>
              <div className="mt-3 grid gap-2">
                {[
                  ["all", "All"],
                  ["lt3", "&lt; 3 months"],
                  ["3to6", "3-6 months"],
                  ["gt6", "6+ months"]
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
                    <input type="radio" name="leaseTerm" value={value} defaultChecked={(params.leaseTerm ?? "all") === value} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="w-full rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white">
              Apply filters
            </button>
          </form>
        </aside>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-[hsl(var(--border))] bg-white/80 px-5 py-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              <span className="font-semibold text-[hsl(var(--foreground))]">{filteredListings.length}</span> listings
              match the current search.
            </p>
            <div className="flex items-center gap-2">
              <StatusBadge value="Live" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Distance and landlord workflow states are surfaced in cards.
              </span>
            </div>
          </div>

          {filteredListings.length ? (
            filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[hsl(var(--border))] bg-white/75 p-10 text-center">
              <h2 className="text-2xl font-semibold">No listings match this filter set.</h2>
              <p className="mt-3 text-[hsl(var(--muted-foreground))]">
                Try widening the radius or increasing the max budget above {formatCurrency(2400)}.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
