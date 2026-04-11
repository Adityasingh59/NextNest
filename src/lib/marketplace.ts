export type VerificationBadge = "Verified Student" | "ID Verified" | "Pending Review";

export type UserSummary = {
  id: string;
  name: string;
  university: string;
  graduationYear: number;
  bio: string;
  badge: VerificationBadge;
  roleLabel: string;
};

export type FurnitureLineItem = {
  name: string;
  price: number;
};

export type ListingSummary = {
  id: string;
  title: string;
  address: string;
  neighborhood: string;
  campusDistanceMiles: number;
  monthlyRent: number;
  moveInDate: string;
  leaseEndDate: string;
  leaseMonthsRemaining: number;
  isFurnished: boolean;
  furnishingLabel: string;
  beds: string;
  baths: string;
  latitude: number;
  longitude: number;
  status: "ACTIVE" | "MATCH_PENDING" | "READY_FOR_SIGNATURE";
  campusSpot: string;
  amenities: string[];
  imageGradient: string;
  summary: string;
  furnitureItems: FurnitureLineItem[];
  listerId: string;
  introCount: number;
};

export type ApplicationPreview = {
  id: string;
  listingId: string;
  seekerId: string;
  seekerName: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  intro: string;
  university: string;
  graduationYear: number;
  badge: VerificationBadge;
};

export type WorkflowStep = {
  title: string;
  description: string;
  status: "Done" | "Live" | "Queued";
};

export const users: UserSummary[] = [
  {
    id: "u-lena",
    name: "Lena Alvarez",
    university: "Columbia University",
    graduationYear: 2026,
    bio: "Senior studying urban planning. Looking for a clean handoff and a low-stress move for the next tenant.",
    badge: "Verified Student",
    roleLabel: "Outgoing tenant"
  },
  {
    id: "u-omar",
    name: "Omar Rahman",
    university: "New York University",
    graduationYear: 2027,
    bio: "Incoming grad student focused on housing close to campus and flexible furnished options.",
    badge: "Verified Student",
    roleLabel: "Lease seeker"
  },
  {
    id: "u-mei",
    name: "Mei Chen",
    university: "The New School",
    graduationYear: 2027,
    bio: "International student using the manual verification fallback while preparing for summer arrival.",
    badge: "Pending Review",
    roleLabel: "Lease seeker"
  }
];

export const listings: ListingSummary[] = [
  {
    id: "morningside-studio",
    title: "Sunny studio with furniture bundle near Butler",
    address: "519 W 121st St, New York, NY",
    neighborhood: "Morningside Heights",
    campusDistanceMiles: 0.2,
    monthlyRent: 1825,
    moveInDate: "2026-05-25",
    leaseEndDate: "2026-12-20",
    leaseMonthsRemaining: 7,
    isFurnished: true,
    furnishingLabel: "Fully furnished",
    beds: "Studio",
    baths: "1 bath",
    latitude: 40.8101,
    longitude: -73.9601,
    status: "ACTIVE",
    campusSpot: "Columbia Butler Library",
    amenities: ["Laundry", "Elevator", "Wi-Fi", "Dishwasher"],
    imageGradient: "from-amber-200 via-orange-100 to-white",
    summary:
      "Lease takeover with bed frame, desk, and compact sofa included. Ideal for an incoming summer research student.",
    furnitureItems: [
      { name: "Desk + chair set", price: 180 },
      { name: "Convertible sofa", price: 250 },
      { name: "Full bed frame", price: 320 }
    ],
    listerId: "u-lena",
    introCount: 6
  },
  {
    id: "east-village-two-bed",
    title: "2-bed share with flexible takeover and tour slots",
    address: "219 E 11th St, New York, NY",
    neighborhood: "East Village",
    campusDistanceMiles: 0.5,
    monthlyRent: 1490,
    moveInDate: "2026-06-10",
    leaseEndDate: "2026-10-30",
    leaseMonthsRemaining: 4,
    isFurnished: false,
    furnishingLabel: "Unfurnished",
    beds: "1 bed in 2-bed",
    baths: "1 bath",
    latitude: 40.7307,
    longitude: -73.9866,
    status: "MATCH_PENDING",
    campusSpot: "NYU Bobst Library",
    amenities: ["Laundry", "Pet friendly", "Air conditioning"],
    imageGradient: "from-emerald-200 via-lime-100 to-white",
    summary:
      "Outgoing student has already shortlisted applicants and is waiting on landlord review before signature.",
    furnitureItems: [],
    listerId: "u-lena",
    introCount: 3
  },
  {
    id: "brooklyn-heights-loft",
    title: "Lofted room with escrow-backed furniture add-on",
    address: "126 Remsen St, Brooklyn, NY",
    neighborhood: "Brooklyn Heights",
    campusDistanceMiles: 0.8,
    monthlyRent: 2140,
    moveInDate: "2026-07-01",
    leaseEndDate: "2027-02-28",
    leaseMonthsRemaining: 8,
    isFurnished: true,
    furnishingLabel: "Partially furnished",
    beds: "1 bed in 3-bed",
    baths: "2 baths",
    latitude: 40.6956,
    longitude: -73.9932,
    status: "READY_FOR_SIGNATURE",
    campusSpot: "St. Francis College",
    amenities: ["Gym", "Doorman", "Balcony", "Wi-Fi"],
    imageGradient: "from-sky-200 via-cyan-100 to-white",
    summary:
      "Sequential e-sign package is ready. Furniture payment can be held in escrow until 48 hours after move-in.",
    furnitureItems: [
      { name: "Standing desk", price: 240 },
      { name: "Wardrobe rack", price: 90 }
    ],
    listerId: "u-lena",
    introCount: 2
  }
];

export const applicationPreviews: ApplicationPreview[] = [
  {
    id: "app-1",
    listingId: "morningside-studio",
    seekerId: "u-omar",
    seekerName: "Omar Rahman",
    status: "PENDING",
    intro: "Incoming NYU graduate student. Clean timeline, guarantor ready, and can sign within 48 hours.",
    university: "New York University",
    graduationYear: 2027,
    badge: "Verified Student"
  },
  {
    id: "app-2",
    listingId: "morningside-studio",
    seekerId: "u-mei",
    seekerName: "Mei Chen",
    status: "PENDING",
    intro: "International student arriving in June. Passport and enrollment PDF already uploaded for review.",
    university: "The New School",
    graduationYear: 2027,
    badge: "Pending Review"
  },
  {
    id: "app-3",
    listingId: "east-village-two-bed",
    seekerId: "u-omar",
    seekerName: "Omar Rahman",
    status: "ACCEPTED",
    intro: "Looking for a four-month sublease close to campus with a straightforward landlord portal review.",
    university: "New York University",
    graduationYear: 2027,
    badge: "Verified Student"
  }
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Student verification",
    description: "Magic-link `.edu` flow with manual passport and enrollment fallback for international students.",
    status: "Live"
  },
  {
    title: "Listing drafts + autosave",
    description: "Structured lease, landlord, amenities, and furniture data ready for draft and publish states.",
    status: "Live"
  },
  {
    title: "Application review",
    description: "Side-by-side applicant cards, intro messages, and match handoff logic for the selected seeker.",
    status: "Live"
  },
  {
    title: "Landlord approvals",
    description: "Email-triggered approval or rejection state with a reason requirement before the listing reopens.",
    status: "Queued"
  },
  {
    title: "Escrow + disputes",
    description: "Furniture payment hold, timed release, and an admin dispute path tied to move-in windows.",
    status: "Queued"
  },
  {
    title: "Sequential e-signature",
    description: "Outgoing tenant signs first, incoming tenant co-signs, then the final PDF is archived securely.",
    status: "Queued"
  }
];

export const integrationReadiness = [
  {
    name: "Google Maps",
    state: "Ready for API wiring",
    detail: "Campus spot distance filter, geocoding fallback, and neighborhood dropdown are represented in the UI."
  },
  {
    name: "Resend / SendGrid",
    state: "Ready for API wiring",
    detail: "Landlord approval touchpoint has copy, unique-link placeholder, and rejection reason states."
  },
  {
    name: "Stripe Connect",
    state: "Ready for API wiring",
    detail: "Escrow and dispute checkpoints are modeled in both the schema and the workflow surface."
  },
  {
    name: "DocuSign / HelloSign",
    state: "Ready for API wiring",
    detail: "Envelope status and signed-document placeholders are already represented in the data model."
  },
  {
    name: "Google Calendar",
    state: "Ready for API wiring",
    detail: "Virtual tour scheduling can attach to the available-slot model without changing the page structure."
  }
];

export function getListingById(listingId: string) {
  return listings.find((listing) => listing.id === listingId);
}

export function getApplicationsForListing(listingId: string) {
  return applicationPreviews.filter((application) => application.listingId === listingId);
}

export function getUserById(userId: string) {
  return users.find((user) => user.id === userId);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

export function matchesLeaseBucket(monthsRemaining: number, leaseTerm?: string) {
  if (!leaseTerm || leaseTerm === "all") {
    return true;
  }

  if (leaseTerm === "lt3") {
    return monthsRemaining < 3;
  }

  if (leaseTerm === "3to6") {
    return monthsRemaining >= 3 && monthsRemaining <= 6;
  }

  return monthsRemaining > 6;
}

export function filterListings(filters: {
  minRent?: number;
  maxRent?: number;
  moveIn?: string;
  furnishedOnly?: boolean;
  leaseTerm?: string;
  radius?: number;
  neighborhood?: string;
}) {
  return listings.filter((listing) => {
    if (filters.minRent && listing.monthlyRent < filters.minRent) {
      return false;
    }

    if (filters.maxRent && listing.monthlyRent > filters.maxRent) {
      return false;
    }

    if (filters.moveIn && listing.moveInDate > filters.moveIn) {
      return false;
    }

    if (filters.furnishedOnly && !listing.isFurnished) {
      return false;
    }

    if (!matchesLeaseBucket(listing.leaseMonthsRemaining, filters.leaseTerm)) {
      return false;
    }

    if (filters.radius && listing.campusDistanceMiles > filters.radius) {
      return false;
    }

    if (filters.neighborhood && filters.neighborhood !== "all") {
      return listing.neighborhood === filters.neighborhood;
    }

    return true;
  });
}

export function getNeighborhoodOptions() {
  return Array.from(new Set(listings.map((listing) => listing.neighborhood))).sort();
}
