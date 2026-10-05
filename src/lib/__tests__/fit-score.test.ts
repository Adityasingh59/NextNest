import { describe, expect, it } from "vitest";
import { addMonths, computeFitScore, FIT_WEIGHTS, type FitListing, type FitPreference } from "@/lib/fit-score";

const campus = { lat: 40.7295, lng: -73.9965 };

function listing(overrides: Partial<FitListing> = {}): FitListing {
  return {
    monthlyRentCents: 150_000,
    location: campus,
    availableFrom: new Date("2026-06-01T00:00:00Z"),
    availableUntil: new Date("2026-12-01T00:00:00Z"),
    roomType: "PRIVATE_ROOM",
    isFurnished: true,
    lifestyleTags: ["quiet", "pet-friendly"],
    ...overrides
  };
}

function preference(overrides: Partial<FitPreference> = {}): FitPreference {
  return {
    budgetMinCents: 100_000,
    budgetMaxCents: 160_000,
    areaLabel: "campus",
    area: campus,
    commuteRadiusMiles: 1,
    moveInDate: new Date("2026-06-01T00:00:00Z"),
    leaseDurationMonths: 6,
    roomType: "PRIVATE_ROOM",
    wantsFurnished: true,
    lifestyleTags: ["quiet", "pet-friendly"],
    ...overrides
  };
}

const dim = (result: ReturnType<typeof computeFitScore>, key: string) => result.dimensions.find((d) => d.key === key)!;

describe("computeFitScore", () => {
  it("weights sum to 100", () => {
    expect(Object.values(FIT_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("scores a perfect match at 100", () => {
    const result = computeFitScore(listing(), preference());
    expect(result.score).toBe(100);
    expect(result.summary.startsWith("100% match: budget aligned")).toBe(true);
  });

  it("decays budget linearly to 0 at 30% over max", () => {
    expect(dim(computeFitScore(listing({ monthlyRentCents: 176_000 }), preference()), "budget").score).toBe(67);
    expect(dim(computeFitScore(listing({ monthlyRentCents: 208_000 }), preference()), "budget").score).toBe(0);
    expect(dim(computeFitScore(listing({ monthlyRentCents: 300_000 }), preference()), "budget").score).toBe(0);
  });

  it("treats under-budget listings as aligned", () => {
    const budget = dim(computeFitScore(listing({ monthlyRentCents: 80_000 }), preference()), "budget");
    expect(budget.score).toBe(100);
    expect(budget.value).toBe("Under budget");
  });

  it("decays location beyond the commute radius", () => {
    // ~1.5 miles north of campus with a 1 mile radius -> about half credit
    const far = listing({ location: { lat: campus.lat + 1.5 / 69, lng: campus.lng } });
    const location = dim(computeFitScore(far, preference()), "location");
    expect(location.score).toBeGreaterThan(40);
    expect(location.score).toBeLessThan(60);
    expect(location.value).toBe("1.5 mi");
  });

  it("scores dates by share of desired duration covered", () => {
    const partial = listing({ availableUntil: addMonths(new Date("2026-06-01T00:00:00Z"), 3) });
    const dates = dim(computeFitScore(partial, preference()), "dates");
    expect(dates.score).toBeGreaterThanOrEqual(49);
    expect(dates.score).toBeLessThanOrEqual(51);

    const none = listing({ availableFrom: new Date("2027-01-01T00:00:00Z"), availableUntil: new Date("2027-06-01T00:00:00Z") });
    expect(dim(computeFitScore(none, preference()), "dates")).toMatchObject({ score: 0, value: "No overlap" });
  });

  it("gives room type 50 when there is no preference and 0 on mismatch", () => {
    expect(dim(computeFitScore(listing(), preference({ roomType: null })), "roomType").score).toBe(50);
    expect(dim(computeFitScore(listing({ roomType: "STUDIO" }), preference()), "roomType").score).toBe(0);
  });

  it("uses Jaccard similarity for lifestyle tags", () => {
    const result = computeFitScore(listing({ lifestyleTags: ["quiet", "social"] }), preference({ lifestyleTags: ["Quiet", "pet-friendly"] }));
    // intersection {quiet} / union {quiet, social, pet-friendly}
    expect(dim(result, "lifestyle").score).toBe(33);
  });

  it("gives furniture 100 only when furnished and wanted", () => {
    expect(dim(computeFitScore(listing(), preference()), "furniture").score).toBe(100);
    expect(dim(computeFitScore(listing({ isFurnished: false }), preference()), "furniture").score).toBe(50);
    expect(dim(computeFitScore(listing(), preference({ wantsFurnished: false })), "furniture").score).toBe(50);
  });

  it("always returns six dimensions and a score in range", () => {
    const result = computeFitScore(
      listing({ monthlyRentCents: 999_999, location: { lat: 0, lng: 0 }, roomType: "STUDIO", lifestyleTags: [] }),
      preference()
    );
    expect(result.dimensions).toHaveLength(6);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
