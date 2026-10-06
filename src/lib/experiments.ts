/**
 * Experiment assignment (spec: "Experimentation").
 * Groups are fixed at signup and stored on User.experimentGroups.
 */

export type Variant = "control" | "treatment";

export type ExperimentGroups = {
  fit_score_transparency?: Variant;
  onboarding_sample_matches?: Variant;
};

/**
 * Experiment 1 assigns new signups alternately; experiment 2 uses the
 * opposite parity so the two experiments are not perfectly confounded.
 */
export function assignExperimentGroups(signupIndex: number): ExperimentGroups {
  const even = signupIndex % 2 === 0;
  const second = Math.floor(signupIndex / 2) % 2 === 0;

  return {
    fit_score_transparency: even ? "control" : "treatment",
    onboarding_sample_matches: second ? "control" : "treatment"
  };
}

export function readExperimentGroups(value: unknown): ExperimentGroups {
  return value && typeof value === "object" ? (value as ExperimentGroups) : {};
}

export function showsFitBreakdown(groups: unknown) {
  return readExperimentGroups(groups).fit_score_transparency !== "control";
}
