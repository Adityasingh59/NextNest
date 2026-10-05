import { distanceMiles, type LatLng } from "@/lib/geo";

/**
 * Path 1 of scam detection: deterministic rules that always run
 * (spec: "Scam Detection Model > Path 1: Heuristic rules").
 */

export type HeuristicFlag = "PRICE_FAR_BELOW_MARKET" | "SCAM_PHRASE" | "NEW_ACCOUNT" | "LOCATION_OUTSIDE_MARKET";

export type HeuristicInput = {
  monthlyRentCents: number;
  marketAvgRentCents: number;
  text: string;
  accountCreatedAt: Date;
  now: Date;
  listingLocation: LatLng;
  campusLocation: LatLng;
};

export type HeuristicResult = {
  flags: HeuristicFlag[];
  matchedPhrases: string[];
  details: Record<string, string | number>;
};

/** Listing priced more than 40% below the market average is too good to be true. */
export const PRICE_BELOW_MARKET_FRACTION = 0.4;
export const NEW_ACCOUNT_HOURS = 24;
/** A listing this far from campus does not belong to the stated university market. */
export const MAX_MARKET_DISTANCE_MILES = 25;

export const SCAM_PHRASES = [
  "wire transfer",
  "western union",
  "moneygram",
  "send deposit before",
  "deposit before viewing",
  "before viewing",
  "gift card",
  "cashier's check",
  "out of the country",
  "currently abroad",
  "keys will be mailed",
  "mail you the keys"
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ");
}

export function findScamPhrases(text: string) {
  const normalized = normalize(text);
  return SCAM_PHRASES.filter((phrase) => normalized.includes(phrase));
}

export function runHeuristics(input: HeuristicInput): HeuristicResult {
  const flags: HeuristicFlag[] = [];
  const details: Record<string, string | number> = {};

  const priceFloor = input.marketAvgRentCents * (1 - PRICE_BELOW_MARKET_FRACTION);
  if (input.marketAvgRentCents > 0 && input.monthlyRentCents < priceFloor) {
    flags.push("PRICE_FAR_BELOW_MARKET");
    details.priceVsMarket = Math.round((input.monthlyRentCents / input.marketAvgRentCents) * 100) / 100;
  }

  const matchedPhrases = findScamPhrases(input.text);
  if (matchedPhrases.length > 0) {
    flags.push("SCAM_PHRASE");
  }

  const accountAgeHours = (input.now.getTime() - input.accountCreatedAt.getTime()) / (60 * 60 * 1000);
  details.accountAgeHours = Math.round(accountAgeHours * 10) / 10;
  if (accountAgeHours < NEW_ACCOUNT_HOURS) {
    flags.push("NEW_ACCOUNT");
  }

  const distance = distanceMiles(input.listingLocation, input.campusLocation);
  details.distanceFromCampusMiles = Math.round(distance * 10) / 10;
  if (distance > MAX_MARKET_DISTANCE_MILES) {
    flags.push("LOCATION_OUTSIDE_MARKET");
  }

  return { flags, matchedPhrases, details };
}

export const HEURISTIC_FLAG_LABELS: Record<HeuristicFlag, string> = {
  PRICE_FAR_BELOW_MARKET: "Price far below market average",
  SCAM_PHRASE: "Contains known scam phrases",
  NEW_ACCOUNT: "Account created less than 24 hours ago",
  LOCATION_OUTSIDE_MARKET: "Location outside the university market"
};
