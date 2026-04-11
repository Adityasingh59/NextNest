import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import {
  formatCurrency,
  formatDate,
  getApplicationsForListing,
  getListingById,
  getUserById
} from "@/lib/marketplace";

type Params = Promise<{ listingId: string }>;

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { listingId } = await params;
  const listing = getListingById(listingId);

  if (!listing) {
    notFound();
  }

  const lister = getUserById(listing.listerId);
  const applications = getApplicationsForListing(listing.id);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className={`rounded-[2rem] bg-gradient-to-br ${listing.imageGradient} p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]`}>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[hsl(var(--primary))]">
              Listing detail
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">{listing.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[hsl(var(--muted-foreground))]">
              {listing.summary}
            </p>
          </div>
          <StatusBadge value={listing.status} className="bg-white/80 text-[hsl(var(--foreground))]" />
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-8">
          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Rent", `${formatCurrency(listing.monthlyRent)}/mo`],
                ["Move-in", formatDate(listing.moveInDate)],
                ["Lease end", formatDate(listing.leaseEndDate)],
                ["Distance", `${listing.campusDistanceMiles} mi`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[hsl(var(--background))] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold">Apartment snapshot</h2>
                <ul className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <li>{listing.address}</li>
                  <li>{listing.beds}</li>
                  <li>{listing.baths}</li>
                  <li>{listing.furnishingLabel}</li>
                  <li>{listing.leaseMonthsRemaining} months remaining</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Amenities</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-full bg-stone-100 px-3 py-2 text-sm text-[hsl(var(--muted-foreground))]">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Furniture sale and escrow</h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Buyers pay upfront, funds remain held, and release happens 48 hours after move-in unless disputed.
                </p>
              </div>
              <StatusBadge value={listing.furnitureItems.length ? "Live" : "Queued"} />
            </div>

            {listing.furnitureItems.length ? (
              <div className="mt-6 space-y-3">
                {listing.furnitureItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl bg-[hsl(var(--background))] px-4 py-4">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl bg-[hsl(var(--background))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                This listing does not currently have a furniture package attached.
              </p>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Applicant cards</h2>
                <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                  Listers can compare applicants side by side before locking the match and notifying the landlord.
                </p>
              </div>
              <p className="rounded-full bg-stone-100 px-3 py-1 text-sm">{applications.length} applicants</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {applications.map((application) => (
                <div key={application.id} className="rounded-[1.5rem] border border-[hsl(var(--border))] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{application.seekerName}</h3>
                      <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                        {application.university} · {application.graduationYear}
                      </p>
                    </div>
                    <StatusBadge value={application.badge} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{application.intro}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Lister profile</h2>
            {lister ? (
              <>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{lister.name}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {lister.university} · Class of {lister.graduationYear}
                    </p>
                  </div>
                  <StatusBadge value={lister.badge} />
                </div>
                <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{lister.bio}</p>
              </>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-lg font-semibold">Next workflow milestone</h2>
            <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Once the lister confirms a student, the landlord receives a unique portal link to review the verified
              profile and approve or reject the transfer with a reason.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/workflow" className="rounded-full bg-[hsl(var(--primary))] px-4 py-3 text-center text-sm font-semibold text-white">
                View workflow page
              </Link>
              <Link href="/profile" className="rounded-full border border-[hsl(var(--border))] px-4 py-3 text-center text-sm font-semibold">
                See verification profile
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
