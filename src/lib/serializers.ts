import type { Listing } from "@prisma/client";

/** Public listing shape: never includes the owner's identity or landlord contact. */
export function publicListing(listing: Listing) {
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    neighborhood: listing.neighborhood,
    monthlyRent: listing.monthlyRentCents / 100,
    leaseEndDate: listing.leaseEndDate.toISOString().slice(0, 10),
    availableFrom: listing.availableFrom.toISOString().slice(0, 10),
    roomType: listing.roomType,
    isFurnished: listing.isFurnished,
    lifestyleTags: listing.lifestyleTags,
    photoUrls: listing.photoUrls,
    isSample: listing.isSample,
    state: listing.state,
    screened: listing.state === "ACTIVE" || listing.state === "MATCHED" || listing.state === "TRANSFERRED"
  };
}
