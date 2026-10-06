import { assessWithClaude, type ClaudeScamResult } from "@/lib/scam/claude";
import { DEFAULT_CLAUDE_THRESHOLD, decideScamOutcome, heuristicsAreConclusive, type DecisionResult } from "@/lib/scam/decision";
import { runHeuristics, type HeuristicInput, type HeuristicResult } from "@/lib/scam/heuristics";

export type ScreeningResult = {
  heuristics: HeuristicResult;
  claude: ClaudeScamResult | { ok: false; error: "skipped_heuristics_conclusive" };
  outcome: DecisionResult;
  threshold: number;
};

export function getClaudeThreshold() {
  const configured = Number(process.env.SCAM_CLAUDE_THRESHOLD);
  return Number.isFinite(configured) && configured > 0 && configured <= 100 ? configured : DEFAULT_CLAUDE_THRESHOLD;
}

/** Runs both detection paths and returns the decision. Pure apart from the Claude call. */
export async function screenListing(
  input: HeuristicInput,
  assess: typeof assessWithClaude = assessWithClaude
): Promise<ScreeningResult> {
  const heuristics = runHeuristics(input);
  const threshold = getClaudeThreshold();

  if (heuristicsAreConclusive(heuristics.flags.length)) {
    return {
      heuristics,
      claude: { ok: false, error: "skipped_heuristics_conclusive" },
      outcome: decideScamOutcome({ heuristicFlagCount: heuristics.flags.length, claudeRiskScore: null, threshold }),
      threshold
    };
  }

  const claude = await assess({
    listingText: input.text,
    monthlyRentCents: input.monthlyRentCents,
    marketAvgRentCents: input.marketAvgRentCents,
    accountAgeHours: (input.now.getTime() - input.accountCreatedAt.getTime()) / (60 * 60 * 1000)
  });

  return {
    heuristics,
    claude,
    outcome: decideScamOutcome({
      heuristicFlagCount: heuristics.flags.length,
      claudeRiskScore: claude.ok ? claude.assessment.risk_score : null,
      threshold
    }),
    threshold
  };
}
