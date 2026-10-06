/**
 * Combines both detection paths (spec: "Decision logic").
 * The Claude score is optional: when the API fails or is not configured,
 * the heuristic result alone decides, so a listing never blocks on the API.
 */

export const DEFAULT_CLAUDE_THRESHOLD = 70;
const CLAUDE_REVIEW_FLOOR = 40;

export type ScamDecisionValue = "APPROVED" | "HELD_FOR_REVIEW";

export type DecisionInput = {
  heuristicFlagCount: number;
  claudeRiskScore: number | null;
  /** Experiment 3 lowers this from 70 to 55. */
  threshold?: number;
};

export type DecisionResult = {
  decision: ScamDecisionValue;
  reason: string;
};

export function decideScamOutcome({
  heuristicFlagCount,
  claudeRiskScore,
  threshold = DEFAULT_CLAUDE_THRESHOLD
}: DecisionInput): DecisionResult {
  if (heuristicFlagCount >= 2) {
    return { decision: "HELD_FOR_REVIEW", reason: "Two or more heuristic flags" };
  }

  if (claudeRiskScore !== null) {
    if (claudeRiskScore > threshold) {
      return { decision: "HELD_FOR_REVIEW", reason: `Claude risk score above ${threshold}` };
    }

    if (claudeRiskScore >= CLAUDE_REVIEW_FLOOR && heuristicFlagCount === 1) {
      return { decision: "HELD_FOR_REVIEW", reason: "Moderate Claude risk score plus one heuristic flag" };
    }
  }

  return { decision: "APPROVED", reason: claudeRiskScore === null ? "Heuristics passed (Claude unavailable)" : "Passed both checks" };
}

/** True when the outcome is already decided and Path 2 can be skipped. */
export function heuristicsAreConclusive(heuristicFlagCount: number) {
  return heuristicFlagCount >= 2;
}
