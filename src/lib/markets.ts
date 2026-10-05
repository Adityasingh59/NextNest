import type { LatLng } from "@/lib/geo";

/**
 * University markets are configuration, not code (spec: "Scalability").
 * These definitions seed the Market table; adding a market means adding an
 * entry here (or a row in the table) and re-running the seed.
 *
 * Average rents are starting estimates for a room near campus and must be
 * kept current: the scam price heuristic compares against them.
 */

export type Neighborhood = { slug: string; name: string } & LatLng;

export type MarketConfig = {
  slug: string;
  name: string;
  universityName: string;
  emailDomains: string[];
  city: string;
  stateRegion: string;
  campus: LatLng;
  marketAvgRentCents: number;
  neighborhoods: Neighborhood[];
};

export const CAMPUS_AREA_SLUG = "campus";

export const MARKET_CONFIGS: MarketConfig[] = [
  {
    slug: "nyu",
    name: "NYU",
    universityName: "New York University",
    emailDomains: ["nyu.edu"],
    city: "New York",
    stateRegion: "NY",
    campus: { lat: 40.7295, lng: -73.9965 },
    marketAvgRentCents: 190_000,
    neighborhoods: [
      { slug: "greenwich-village", name: "Greenwich Village", lat: 40.7336, lng: -74.0027 },
      { slug: "east-village", name: "East Village", lat: 40.7265, lng: -73.9815 },
      { slug: "lower-east-side", name: "Lower East Side", lat: 40.715, lng: -73.9843 },
      { slug: "chelsea", name: "Chelsea", lat: 40.7465, lng: -74.0014 },
      { slug: "williamsburg", name: "Williamsburg", lat: 40.7081, lng: -73.9571 }
    ]
  },
  {
    slug: "umich",
    name: "Michigan",
    universityName: "University of Michigan",
    emailDomains: ["umich.edu"],
    city: "Ann Arbor",
    stateRegion: "MI",
    campus: { lat: 42.277, lng: -83.7382 },
    marketAvgRentCents: 110_000,
    neighborhoods: [
      { slug: "south-u", name: "South University", lat: 42.2747, lng: -83.735 },
      { slug: "kerrytown", name: "Kerrytown", lat: 42.2847, lng: -83.7466 },
      { slug: "burns-park", name: "Burns Park", lat: 42.2687, lng: -83.729 },
      { slug: "north-campus", name: "North Campus", lat: 42.293, lng: -83.716 },
      { slug: "old-west-side", name: "Old West Side", lat: 42.278, lng: -83.76 }
    ]
  },
  {
    slug: "ucsd",
    name: "UC San Diego",
    universityName: "University of California San Diego",
    emailDomains: ["ucsd.edu"],
    city: "San Diego",
    stateRegion: "CA",
    campus: { lat: 32.8811, lng: -117.2376 },
    marketAvgRentCents: 125_000,
    neighborhoods: [
      { slug: "utc", name: "University City (UTC)", lat: 32.87, lng: -117.211 },
      { slug: "la-jolla-shores", name: "La Jolla Shores", lat: 32.8569, lng: -117.2556 },
      { slug: "pacific-beach", name: "Pacific Beach", lat: 32.7978, lng: -117.24 },
      { slug: "clairemont", name: "Clairemont", lat: 32.8337, lng: -117.2003 },
      { slug: "mira-mesa", name: "Mira Mesa", lat: 32.9156, lng: -117.1439 }
    ]
  }
];

export const LIFESTYLE_TAGS = [
  "quiet",
  "social",
  "pet-friendly",
  "non-smoking",
  "early-riser",
  "night-owl",
  "studious",
  "very-clean"
] as const;

export const ROOM_TYPE_OPTIONS = [
  { value: "PRIVATE_ROOM", label: "Private room" },
  { value: "SHARED_ROOM", label: "Shared room" },
  { value: "STUDIO", label: "Studio" },
  { value: "ENTIRE_APARTMENT", label: "Entire apartment" }
] as const;

/** Domain part of an email, lowercased. */
export function emailDomain(email: string) {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

/** True for `nyu.edu` and subdomains such as `stern.nyu.edu`. */
export function domainMatches(domain: string, allowed: string[]) {
  return allowed.some((candidate) => domain === candidate || domain.endsWith(`.${candidate}`));
}

export function parseNeighborhoods(value: unknown): Neighborhood[] {
  return Array.isArray(value) ? (value as Neighborhood[]) : [];
}
