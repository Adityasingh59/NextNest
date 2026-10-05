import { describe, expect, it, vi } from "vitest";
import { buildScamPrompt } from "@/lib/scam/claude";
import { decideScamOutcome } from "@/lib/scam/decision";
import { findScamPhrases, runHeuristics, type HeuristicInput } from "@/lib/scam/heuristics";
import { screenListing } from "@/lib/scam/screen";

const campus = { lat: 42.2780, lng: -83.7382 };
const now = new Date("2026-10-01T12:00:00Z");

function input(overrides: Partial<HeuristicInput> = {}): HeuristicInput {
  return {
    monthlyRentCents: 110_000,
    marketAvgRentCents: 120_000,
    text: "Sunny private room two blocks from the Diag. Happy to do a video tour.",
    accountCreatedAt: new Date("2026-08-01T00:00:00Z"),
    now,
    listingLocation: campus,
    campusLocation: campus,
    ...overrides
  };
}

describe("runHeuristics", () => {
  it("passes a normal listing", () => {
    expect(runHeuristics(input()).flags).toEqual([]);
  });

  it("flags price more than 40% below market", () => {
    expect(runHeuristics(input({ monthlyRentCents: 71_000 })).flags).toContain("PRICE_FAR_BELOW_MARKET");
    expect(runHeuristics(input({ monthlyRentCents: 73_000 })).flags).not.toContain("PRICE_FAR_BELOW_MARKET");
  });

  it("flags scam phrases case-insensitively, once per listing", () => {
    const result = runHeuristics(input({ text: "Please send deposit before viewing via Western Union." }));
    expect(result.flags.filter((flag) => flag === "SCAM_PHRASE")).toHaveLength(1);
    expect(result.matchedPhrases).toEqual(expect.arrayContaining(["western union", "send deposit before"]));
  });

  it("flags accounts younger than 24 hours", () => {
    expect(runHeuristics(input({ accountCreatedAt: new Date("2026-10-01T02:00:00Z") })).flags).toContain("NEW_ACCOUNT");
  });

  it("flags listings far outside the market", () => {
    expect(runHeuristics(input({ listingLocation: { lat: 40.7, lng: -74 } })).flags).toContain("LOCATION_OUTSIDE_MARKET");
  });

  it("normalizes curly apostrophes", () => {
    expect(findScamPhrases("Pay by cashier’s check")).toEqual(["cashier's check"]);
  });
});

describe("decideScamOutcome", () => {
  it.each([
    [2, null, "HELD_FOR_REVIEW"],
    [2, 5, "HELD_FOR_REVIEW"],
    [0, 71, "HELD_FOR_REVIEW"],
    [0, 70, "APPROVED"],
    [1, 40, "HELD_FOR_REVIEW"],
    [1, 70, "HELD_FOR_REVIEW"],
    [1, 39, "APPROVED"],
    [0, 55, "APPROVED"],
    [1, null, "APPROVED"],
    [0, null, "APPROVED"]
  ] as const)("flags=%s claude=%s -> %s", (heuristicFlagCount, claudeRiskScore, expected) => {
    expect(decideScamOutcome({ heuristicFlagCount, claudeRiskScore }).decision).toBe(expected);
  });

  it("respects a lowered threshold (experiment 3)", () => {
    expect(decideScamOutcome({ heuristicFlagCount: 0, claudeRiskScore: 60, threshold: 55 }).decision).toBe("HELD_FOR_REVIEW");
  });
});

describe("screenListing", () => {
  it("skips Claude when heuristics are conclusive", async () => {
    const assess = vi.fn();
    const result = await screenListing(input({ monthlyRentCents: 30_000, text: "wire transfer only" }), assess);
    expect(assess).not.toHaveBeenCalled();
    expect(result.outcome.decision).toBe("HELD_FOR_REVIEW");
  });

  it("falls back to heuristics when Claude fails", async () => {
    const assess = vi.fn().mockResolvedValue({ ok: false, error: "timeout" });
    const result = await screenListing(input(), assess);
    expect(assess).toHaveBeenCalledOnce();
    expect(result.outcome.decision).toBe("APPROVED");
  });

  it("holds when Claude scores high risk", async () => {
    const assess = vi.fn().mockResolvedValue({
      ok: true,
      model: "test",
      assessment: { risk_score: 88, flags: ["off_platform_payment"], reasoning: "Asks for payment off platform." }
    });
    expect((await screenListing(input(), assess)).outcome.decision).toBe("HELD_FOR_REVIEW");
  });
});

describe("buildScamPrompt", () => {
  it("wraps untrusted listing text and includes pricing context", () => {
    const prompt = buildScamPrompt({ listingText: "Nice room", monthlyRentCents: 120_000, marketAvgRentCents: 150_000, accountAgeHours: 49.6 });
    expect(prompt).toContain("<listing_text>\nNice room\n</listing_text>");
    expect(prompt).toContain("Price: $1200 per month");
    expect(prompt).toContain("Market average: $1500 per month");
    expect(prompt).toContain("Account age: 50 hours");
  });
});
