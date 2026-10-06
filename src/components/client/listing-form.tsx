"use client";

import { useState } from "react";
import { TagPicker } from "@/components/client/tag-picker";
import { FormError, useApi } from "@/components/client/use-api";
import { LIFESTYLE_TAGS, ROOM_TYPE_OPTIONS } from "@/lib/markets";

export function ListingForm({ neighborhoods, universityName }: { neighborhoods: { slug: string; name: string }[]; universityName: string }) {
  const { call, error, isPending, router } = useApi();
  const [tags, setTags] = useState<string[]>([]);
  const [furnished, setFurnished] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();

    call<{ listing: { id: string } }>(
      "/api/listings",
      {
        title: text("title"),
        description: text("description"),
        streetLine1: text("streetLine1"),
        neighborhood: text("neighborhood"),
        monthlyRent: text("monthlyRent"),
        leaseStartDate: text("leaseStartDate"),
        leaseEndDate: text("leaseEndDate"),
        availableFrom: text("availableFrom"),
        roomType: text("roomType"),
        isFurnished: furnished,
        furnitureNotes: furnished ? text("furnitureNotes") || undefined : undefined,
        lifestyleTags: tags,
        photoUrls: text("photoUrls")
          .split(/\s+/)
          .filter(Boolean),
        landlordName: text("landlordName") || undefined,
        landlordEmail: text("landlordEmail") || undefined
      },
      (payload) => {
        router.push(`/listings/${payload.listing.id}?created=1`);
        router.refresh();
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-heading">The room</h2>
        <div>
          <label htmlFor="title" className="nn-label">
            Title
          </label>
          <input id="title" name="title" required minLength={8} maxLength={120} className="nn-input" placeholder="Private room in a 3-bed, 5 min from campus" />
        </div>
        <div>
          <label htmlFor="description" className="nn-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            minLength={30}
            maxLength={2000}
            rows={5}
            className="nn-input"
            placeholder="What the room and apartment are like, roommates, utilities, why you're leaving."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="roomType" className="nn-label">
              Room type
            </label>
            <select id="roomType" name="roomType" required className="nn-input" defaultValue="PRIVATE_ROOM">
              {ROOM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="monthlyRent" className="nn-label">
              Monthly rent ($)
            </label>
            <input id="monthlyRent" name="monthlyRent" type="number" min={100} max={20000} required className="nn-input" inputMode="numeric" />
          </div>
        </div>
        <TagPicker name="Lifestyle" options={LIFESTYLE_TAGS} selected={tags} onChange={setTags} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="neighborhood" className="nn-label">
              Neighborhood near {universityName}
            </label>
            <select id="neighborhood" name="neighborhood" required className="nn-input">
              {neighborhoods.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="streetLine1" className="nn-label">
              Street address
            </label>
            <input id="streetLine1" name="streetLine1" required className="nn-input" autoComplete="street-address" />
            <p className="nn-help">Shared only after you accept a match.</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading">Dates</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="leaseStartDate" className="nn-label">
              Your lease started
            </label>
            <input id="leaseStartDate" name="leaseStartDate" type="date" required className="nn-input" />
          </div>
          <div>
            <label htmlFor="availableFrom" className="nn-label">
              Available from
            </label>
            <input id="availableFrom" name="availableFrom" type="date" required className="nn-input" />
          </div>
          <div>
            <label htmlFor="leaseEndDate" className="nn-label">
              Lease ends
            </label>
            <input id="leaseEndDate" name="leaseEndDate" type="date" required className="nn-input" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading">Furniture and photos</h2>
        <label className="flex min-h-[44px] items-center gap-3">
          <input type="checkbox" checked={furnished} onChange={(event) => setFurnished(event.target.checked)} className="h-5 w-5 accent-[var(--nest)]" />
          <span>Furniture is included</span>
        </label>
        {furnished ? (
          <div>
            <label htmlFor="furnitureNotes" className="nn-label">
              What’s included
            </label>
            <input id="furnitureNotes" name="furnitureNotes" maxLength={500} className="nn-input" placeholder="Full bed, desk, chair, dresser" />
          </div>
        ) : null}
        <div>
          <label htmlFor="photoUrls" className="nn-label">
            Photo links (optional)
          </label>
          <textarea id="photoUrls" name="photoUrls" rows={2} className="nn-input" placeholder="https://… one per line" />
          <p className="nn-help">Up to 8 https image links.</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-heading">Landlord (optional)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="landlordName" className="nn-label">
              Landlord or property manager
            </label>
            <input id="landlordName" name="landlordName" maxLength={120} className="nn-input" />
          </div>
          <div>
            <label htmlFor="landlordEmail" className="nn-label">
              Landlord email
            </label>
            <input id="landlordEmail" name="landlordEmail" type="email" className="nn-input" />
          </div>
        </div>
        <p className="text-body-sm text-ink-muted">Used on the lease assignment document. Many leases need landlord consent to transfer, so check yours.</p>
      </section>

      <p className="rounded-md bg-sky-soft px-4 py-3 text-body-sm text-sky">
        Every listing is screened for scams before it goes live. Most listings are live within seconds; a few are held for a quick manual review.
      </p>
      <FormError message={error} />
      <button type="submit" className="nn-btn nn-btn-primary nn-btn-lg" disabled={isPending}>
        {isPending ? "Screening your listing…" : "Publish listing"}
      </button>
    </form>
  );
}
