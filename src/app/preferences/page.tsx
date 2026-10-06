import { PreferenceForm } from "@/components/client/preference-form";
import { ListingCard, PageHeader } from "@/components/ui";
import { readExperimentGroups } from "@/lib/experiments";
import { CAMPUS_AREA_SLUG, parseNeighborhoods } from "@/lib/markets";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDateRange } from "@/lib/utils";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function PreferencesPage() {
  const user = await requireUser();
  const market = user.market;
  const pref = user.preference;
  const areas = [{ slug: CAMPUS_AREA_SLUG, name: `${market.name} campus` }, ...parseNeighborhoods(market.neighborhoods)];

  // Experiment 2: before the first profile, treatment sees the market's 3 most requested listings.
  const showSamples = !pref && readExperimentGroups(user.experimentGroups).onboarding_sample_matches === "treatment";
  const samples = showSamples
    ? await prisma.listing.findMany({
        where: { marketId: market.id, state: "ACTIVE", ownerId: { not: user.id } },
        orderBy: [{ matches: { _count: "desc" } }, { publishedAt: "desc" }],
        take: 3
      })
    : [];

  const nextMonth = new Date();
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader
        overline={market.universityName}
        title={pref ? "Your preferences" : "What are you looking for?"}
        description="Fill this out once. We score every verified listing against it and show your best matches first."
      />

      {samples.length > 0 ? (
        <section className="flex flex-col gap-3">
          <p className="text-heading-sm">These are what your matches will look like. Complete your preferences to see your real matches.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {samples.map((listing) => (
              <ListingCard
                key={listing.id}
                href={`/listings/${listing.id}`}
                title={listing.title}
                monthlyRent={listing.monthlyRentCents / 100}
                location={listing.neighborhood ?? market.city}
                dates={formatDateRange(listing.availableFrom, listing.availableUntil ?? listing.leaseEndDate)}
                photoUrl={listing.photoUrls[0]}
                tags={listing.lifestyleTags}
                isSample={listing.isSample}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="nn-card p-5 sm:p-6">
        <PreferenceForm
          areas={areas}
          isUpdate={Boolean(pref)}
          defaults={{
            budgetMin: pref ? pref.budgetMinCents / 100 : Math.round((market.marketAvgRentCents * 0.7) / 10000) * 100,
            budgetMax: pref ? pref.budgetMaxCents / 100 : Math.round((market.marketAvgRentCents * 1.1) / 10000) * 100,
            preferredArea: pref?.preferredArea ?? CAMPUS_AREA_SLUG,
            commuteRadiusMiles: pref ? Number(pref.commuteRadiusMiles) : 1.5,
            moveInDate: pref ? isoDate(pref.moveInDate) : isoDate(nextMonth),
            leaseDurationMonths: pref?.leaseDurationMonths ?? 5,
            roomType: pref?.roomType ?? "",
            wantsFurnished: pref?.wantsFurnished ?? true,
            lifestyleTags: pref?.lifestyleTags ?? []
          }}
        />
      </div>
    </div>
  );
}
