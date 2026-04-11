import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { StatusBadge } from "@/components/status-badge";
import { listings, users, workflowSteps } from "@/lib/marketplace";

export default function HomePage() {
  const featuredListings = listings.slice(0, 2);
  const highlightedUser = users[0];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="overflow-hidden rounded-[2.5rem] border border-[hsl(var(--border))] bg-white/90 shadow-[0_28px_100px_rgba(15,23,42,0.1)]">
        <div className="grid gap-10 px-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">NextNest MVP</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-[hsl(var(--foreground))]">
              Secure student lease handoffs with verified identities, landlord approval, and escrow-aware furniture sales.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[hsl(var(--muted-foreground))]">
              The product shell now covers the core feature list: discovery filters, detailed listing views, profile
              verification states, listing creation, and workflow checkpoints for landlord review and signatures.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/listings" className="rounded-full bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-white">
                Explore listings
              </Link>
              <Link href="/listings/new" className="rounded-full border border-[hsl(var(--border))] px-5 py-3 text-sm font-semibold">
                Create a listing
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <StatusBadge value="Live" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                UI coverage is now in place for the highest-value MVP surfaces.
              </p>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] bg-[hsl(var(--background))] p-6">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-sky-200 via-teal-100 to-white p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[hsl(var(--primary))]">Verified profile snapshot</p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">{highlightedUser.name}</h2>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {highlightedUser.university} · {highlightedUser.roleLabel}
                  </p>
                </div>
                <StatusBadge value={highlightedUser.badge} />
              </div>
              <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{highlightedUser.bio}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Search", "Range, radius, date, and furnished filters"],
                ["Workflow", "Landlord review and e-sign checkpoints"],
                ["Escrow", "Furniture hold and dispute milestones"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.5rem] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">{label}</p>
                  <p className="mt-2 text-sm font-medium leading-6">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Featured listings</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Search and compare takeover opportunities.</h2>
            </div>
            <Link href="/listings" className="text-sm font-semibold text-[hsl(var(--primary))]">
              See all listings
            </Link>
          </div>

          <div className="mt-6 space-y-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Workflow readiness</p>
          <div className="mt-5 space-y-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-[1.5rem] bg-[hsl(var(--background))] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    {index + 1}. {step.title}
                  </p>
                  <StatusBadge value={step.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
