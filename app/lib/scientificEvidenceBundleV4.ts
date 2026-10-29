export const SCIENTIFIC_EVIDENCE_BUNDLE_V4_VERSION = "v145-scientific-evidence-bundle-v4" as const;

export type ScientificEvidenceGate = {
  passed: boolean;
  measured: string;
  threshold: string;
  artifact: string;
  sha256: string;
};

export type ScientificEvidenceBundleV4 = {
  version: typeof SCIENTIFIC_EVIDENCE_BUNDLE_V4_VERSION;
  generatedAt: string;
  ephemeris: {
    tenYearPositionRmsKm: number | null;
    tenYearVelocityRmsMS: number | null;
    convergencePositionRmsKm: number | null;
    reversalPositionRmsM: number | null;
    reversalVelocityRmsMS: number | null;
    gate: ScientificEvidenceGate;
  };
  kerr: ScientificEvidenceGate & {
    maxHamiltonianDrift: number | null;
    maxCarterDrift: number | null;
    turningPointContinuationPassed: boolean;
  };
  performance: ScientificEvidenceGate;
  regression: ScientificEvidenceGate;
  decision: "promoted" | "blocked-shadow-retained";
  defaultKernel: "legacy-eih-1pn" | "relativity-force-model-v2";
  blockers: readonly string[];
  boundary: "single-generated-source-fail-closed-legacy-retained";
};

export function createScientificEvidenceBundleV4(input: {
  generatedAt: string;
  tenYearPositionRmsKm?: number | null;
  tenYearVelocityRmsMS?: number | null;
  convergencePositionRmsKm?: number | null;
  reversalPositionRmsM?: number | null;
  reversalVelocityRmsMS?: number | null;
  ephemerisArtifact?: string;
  ephemerisSha256?: string;
  kerrHamiltonianDrift?: number | null;
  kerrCarterDrift?: number | null;
  turningPointContinuationPassed?: boolean;
  kerrArtifact?: string;
  kerrSha256?: string;
  performancePassed?: boolean;
  performanceArtifact?: string;
  performanceSha256?: string;
  regressionPassed?: boolean;
  regressionArtifact?: string;
  regressionSha256?: string;
}): ScientificEvidenceBundleV4 {
  const ephemerisPassed =
    input.tenYearPositionRmsKm != null && input.tenYearPositionRmsKm < 10_000 &&
    input.tenYearVelocityRmsMS != null && input.tenYearVelocityRmsMS < 1 &&
    input.convergencePositionRmsKm != null && input.convergencePositionRmsKm < 1 &&
    input.reversalPositionRmsM != null && input.reversalPositionRmsM < 10 &&
    input.reversalVelocityRmsMS != null && input.reversalVelocityRmsMS < 1e-4;
  const kerrPassed =
    input.kerrHamiltonianDrift != null && input.kerrHamiltonianDrift < 1e-8 &&
    input.kerrCarterDrift != null && input.kerrCarterDrift < 1e-10 &&
    input.turningPointContinuationPassed === true;
  const blockers: string[] = [];
  if (!ephemerisPassed) blockers.push("ephemeris-v4");
  if (!kerrPassed) blockers.push("kerr-invariants-v4");
  if (input.performancePassed !== true) blockers.push("hardware-performance-v4");
  if (input.regressionPassed !== true) blockers.push("full-regression-v4");
  const promoted = blockers.length === 0;
  return {
    version: SCIENTIFIC_EVIDENCE_BUNDLE_V4_VERSION,
    generatedAt: input.generatedAt,
    ephemeris: {
      tenYearPositionRmsKm: input.tenYearPositionRmsKm ?? null,
      tenYearVelocityRmsMS: input.tenYearVelocityRmsMS ?? null,
      convergencePositionRmsKm: input.convergencePositionRmsKm ?? null,
      reversalPositionRmsM: input.reversalPositionRmsM ?? null,
      reversalVelocityRmsMS: input.reversalVelocityRmsMS ?? null,
      gate: {
        passed: ephemerisPassed,
        measured: `${input.tenYearPositionRmsKm ?? "missing"} km / ${input.tenYearVelocityRmsMS ?? "missing"} m/s; convergence ${input.convergencePositionRmsKm ?? "missing"} km; reversal ${input.reversalPositionRmsM ?? "missing"} m / ${input.reversalVelocityRmsMS ?? "missing"} m/s`,
        threshold: "<10000 km / <1 m/s; convergence <1 km; reversal <10 m / <1e-4 m/s",
        artifact: input.ephemerisArtifact ?? "",
        sha256: input.ephemerisSha256 ?? "",
      },
    },
    kerr: {
      passed: kerrPassed,
      measured: `Hamiltonian ${input.kerrHamiltonianDrift ?? "missing"}; Carter ${input.kerrCarterDrift ?? "missing"}; turning continuation ${input.turningPointContinuationPassed === true}`,
      threshold: "Hamiltonian <1e-8; Carter <1e-10; turning-point continuation required",
      artifact: input.kerrArtifact ?? "",
      sha256: input.kerrSha256 ?? "",
      maxHamiltonianDrift: input.kerrHamiltonianDrift ?? null,
      maxCarterDrift: input.kerrCarterDrift ?? null,
      turningPointContinuationPassed: input.turningPointContinuationPassed === true,
    },
    performance: {
      passed: input.performancePassed === true,
      measured: input.performancePassed === true ? "hardware gate passed" : "pending or failed",
      threshold: "overview >=55 FPS; science scenes >=45 FPS; release resource lifecycle clean",
      artifact: input.performanceArtifact ?? "",
      sha256: input.performanceSha256 ?? "",
    },
    regression: {
      passed: input.regressionPassed === true,
      measured: input.regressionPassed === true ? "serial full regression passed" : "pending or failed",
      threshold: "tsc, focused, full tests, build and browser QA all pass",
      artifact: input.regressionArtifact ?? "",
      sha256: input.regressionSha256 ?? "",
    },
    decision: promoted ? "promoted" : "blocked-shadow-retained",
    defaultKernel: promoted ? "relativity-force-model-v2" : "legacy-eih-1pn",
    blockers,
    boundary: "single-generated-source-fail-closed-legacy-retained",
  };
}

export function validateScientificEvidenceBundleV4(bundle: ScientificEvidenceBundleV4): readonly string[] {
  const errors: string[] = [];
  const gates = [bundle.ephemeris.gate, bundle.kerr, bundle.performance, bundle.regression];
  for (const gate of gates) {
    if (gate.artifact && !/^[a-f0-9]{64}$/.test(gate.sha256)) errors.push(`invalid-checksum:${gate.artifact}`);
  }
  const allPassed = gates.every((gate) => gate.passed);
  if (bundle.defaultKernel === "relativity-force-model-v2" && !allPassed) errors.push("unsafe-v2-promotion");
  if ((bundle.decision === "promoted") !== allPassed) errors.push("decision-gate-mismatch");
  if ((bundle.defaultKernel === "relativity-force-model-v2") !== allPassed) errors.push("kernel-gate-mismatch");
  return errors;
}
