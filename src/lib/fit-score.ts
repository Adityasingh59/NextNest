import { distanceMiles, type LatLng } from "@/lib/geo";

/**
 * Deterministic fit score (spec: "AI Component > Fit Score Model").
 * Pure function: no I/O, so it can be unit tested and run for every
 * listing in a market on each request.
 */

export type RoomTypeValue = "PRIVATE_ROOM" | "SHARED_ROOM" | "STUDIO" | "ENTIRE_APARTMENT";

export type FitListing = {
  monthlyRentCents: number;
  location: LatLng;
  availableFrom: Date;
  availableUntil: Date;
  roomType: RoomTypeValue;
  isFurnished: boolean;
  lifestyleTags: string[];
};

export type FitPreference = {
  budgetMinCents: number;
  budgetMaxCents: number;
  areaLabel: string;
  area: LatLng;
  commuteRadiusMiles: number;
  moveInDate: Date;
  leaseDurationMonths: number;
  roomType: RoomTypeValue | null;
  wantsFurnished: boolean;
  lifestyleTags: string[];
};

export type FitDimensionKey = "budget" | "location" | "dates" | "roomType" | "lifestyle" | "furniture";

export type FitDimension = {
  key: FitDimensionKey;
  label: string;
  weight: number;
  /** 0-100 score for this dimension alone. */
  score: number;
  /** Weighted points this dimension adds to the total (0-weight). */
  points: number;
  /** Short value for the breakdown row, e.g. "Aligned" or "0.8 mi". */
  value: string;
  /** Plain-language explanation used in the summary sentence. */
  detail: string;
};

export type FitResult = {
  score: number;
  dimensions: FitDimension[];
  summary: string;
};

export const FIT_WEIGHTS: Record<FitDimensionKey, number> = {
  budget: 30,
  location: 25,
  dates: 20,
  roomType: 10,
  lifestyle: 10,
  furniture: 5
};

/** Price this far above max budget (as a fraction of max) scores 0. */
const BUDGET_DECAY_FRACTION = 0.3;
const DAY_MS = 24 * 60 * 60 * 1000;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function addMonths(date: Date, months: number) {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function formatDollars(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

function scoreBudget(listing: FitListing, pref: FitPreference): Omit<FitDimension, "key" | "label" | "weight" | "points"> {
  const price = listing.monthlyRentCents;

  if (price <= pref.budgetMaxCents) {
    const under = price < pref.budgetMinCents;
    return {
      score: 100,
      value: under ? "Under budget" : "Aligned",
      detail: under ? "under your budget" : "budget aligned"
    };
  }

  const overFraction = (price - pref.budgetMaxCents) / pref.budgetMaxCents;
  const score = clamp(100 * (1 - overFraction / BUDGET_DECAY_FRACTION));
  const overBy = formatDollars(price - pref.budgetMaxCents);

  return { score, value: `${overBy} over`, detail: `${overBy}/mo over budget` };
}

function scoreLocation(listing: FitListing, pref: FitPreference): Omit<FitDimension, "key" | "label" | "weight" | "points"> {
  const distance = distanceMiles(listing.location, pref.area);
  const radius = Math.max(pref.commuteRadiusMiles, 0.1);
  const rounded = distance < 10 ? distance.toFixed(1) : Math.round(distance).toString();
  const value = `${rounded} mi`;
  const detail = `${rounded} mi from ${pref.areaLabel}`;

  if (distance <= radius) {
    return { score: 100, value, detail };
  }

  // Linear decay: reaches 0 once the listing is a full radius beyond the boundary
  // (at least 1 mile, so tiny radii do not collapse to a cliff).
  const decayDistance = Math.max(radius, 1);
  return { score: clamp(100 * (1 - (distance - radius) / decayDistance)), value, detail };
}

function scoreDates(listing: FitListing, pref: FitPreference): Omit<FitDimension, "key" | "label" | "weight" | "points"> {
  const desiredStart = pref.moveInDate.getTime();
  const desiredEnd = addMonths(pref.moveInDate, pref.leaseDurationMonths).getTime();
  const desiredDays = Math.max(1, (desiredEnd - desiredStart) / DAY_MS);

  const overlapStart = Math.max(desiredStart, listing.availableFrom.getTime());
  const overlapEnd = Math.min(desiredEnd, listing.availableUntil.getTime());
  const overlapDays = Math.max(0, (overlapEnd - overlapStart) / DAY_MS);

  const score = clamp((overlapDays / desiredDays) * 100);
  const overlapMonths = Math.round((overlapDays / 30.44) * 10) / 10;

  if (overlapDays === 0) {
    return { score: 0, value: "No overlap", detail: "dates do not overlap" };
  }

  const monthsLabel = Number.isInteger(overlapMonths) ? `${overlapMonths}` : overlapMonths.toFixed(1);
  return {
    score,
    value: `${monthsLabel} mo overlap`,
    detail: `dates overlap by ${monthsLabel} of ${pref.leaseDurationMonths} months`
  };
}

const ROOM_LABELS: Record<RoomTypeValue, string> = {
  PRIVATE_ROOM: "Private room",
  SHARED_ROOM: "Shared room",
  STUDIO: "Studio",
  ENTIRE_APARTMENT: "Entire apartment"
};

export function roomTypeLabel(roomType: RoomTypeValue) {
  return ROOM_LABELS[roomType];
}

function scoreRoomType(listing: FitListing, pref: FitPreference): Omit<FitDimension, "key" | "label" | "weight" | "points"> {
  if (!pref.roomType) {
    return { score: 50, value: "No preference", detail: "no room type preference" };
  }

  if (pref.roomType === listing.roomType) {
    return { score: 100, value: "Match", detail: "room type matches" };
  }

  return { score: 0, value: ROOM_LABELS[listing.roomType], detail: `${ROOM_LABELS[listing.roomType].toLowerCase()}, not your pick` };
}

function normalizeTags(tags: string[]) {
  return new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean));
}

function scoreLifestyle(listing: FitListing, pref: FitPreference): Omit<FitDimension, "key" | "label" | "weight" | "points"> {
  const wanted = normalizeTags(pref.lifestyleTags);
  const offered = normalizeTags(listing.lifestyleTags);

  if (wanted.size === 0) {
    return { score: 50, value: "No preference", detail: "no lifestyle preference" };
  }

  const shared = [...wanted].filter((tag) => offered.has(tag)).length;
  const union = new Set([...wanted, ...offered]).size;
  const score = clamp((shared / union) * 100);

  return {
    score,
    // Jaccard counts every tag on either side, so say "of <union>" to match the score.
    value: `${shared} of ${union} tags shared`,
    detail: `${shared} of ${union} lifestyle tags shared`
  };
}

function scoreFurniture(listing: FitListing, pref: FitPreference): Omit<FitDimension, "key" | "label" | "weight" | "points"> {
  if (pref.wantsFurnished && listing.isFurnished) {
    return { score: 100, value: "Included", detail: "furnished as you wanted" };
  }

  return {
    score: 50,
    value: listing.isFurnished ? "Included" : "Not included",
    detail: listing.isFurnished ? "furnished" : "unfurnished"
  };
}

const LABELS: Record<FitDimensionKey, string> = {
  budget: "Budget",
  location: "Location",
  dates: "Dates",
  roomType: "Room type",
  lifestyle: "Lifestyle",
  furniture: "Furniture"
};

const SCORERS: Record<FitDimensionKey, typeof scoreBudget> = {
  budget: scoreBudget,
  location: scoreLocation,
  dates: scoreDates,
  roomType: scoreRoomType,
  lifestyle: scoreLifestyle,
  furniture: scoreFurniture
};

export function computeFitScore(listing: FitListing, pref: FitPreference): FitResult {
  const dimensions = (Object.keys(FIT_WEIGHTS) as FitDimensionKey[]).map((key) => {
    const weight = FIT_WEIGHTS[key];
    const result = SCORERS[key](listing, pref);
    const score = Math.round(result.score);

    return {
      key,
      label: LABELS[key],
      weight,
      score,
      points: Math.round(((result.score * weight) / 100) * 10) / 10,
      value: result.value,
      detail: result.detail
    };
  });

  const total = Math.round(dimensions.reduce((sum, dimension) => sum + (dimension.score * dimension.weight) / 100, 0));

  // Lead with the three heaviest dimensions, as in "85% match: budget aligned, 0.8 mi from campus, ...".
  const summary = `${total}% match: ${dimensions
    .slice(0, 3)
    .map((dimension) => dimension.detail)
    .join(", ")}`;

  return { score: total, dimensions, summary };
}
