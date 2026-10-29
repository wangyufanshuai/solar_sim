import type { ScientificPromotionDecisionV7 } from "./scientificPromotionDecisionV7";

export const SCIENTIFIC_EVIDENCE_BUNDLE_V5_VERSION = "v150-scientific-evidence-bundle-v5" as const;

export type ScientificEvidenceGateV5 = {
  passed: boolean;
  measured: string;
  threshold: string;
  artifact: string;
  sha256: string;
  independent: boolean;
};

export type IndependentEphemerisReportV5 = {
  version: "v150-scipy-dop853-independent-reference-v5";
  fixture: string;
  fixtureSha256: string;
  coordinateFrame: "DE440-sun-centered-J2000-ecliptic";
  timeScale: "TDB";
  durationDays: number;
  eps2Meters: 0;
  solver: { name: string; method: "DOP853"; scipyVersion: string; rtol: number; atol: number; maxStepDays: number };
  modes: readonly { mode: "newton" | "legacy-eih-1pn" | "eih-1pn-2pn-lt"; checkpoints: readonly { label: string; offsetDays: number; rmsPositionKm: number; rmsVelocityMs: number }[] }[];
  convergence: { durationDays: number; coarseStepDays: number; fineStepDays: number; positionRmsKm: number; velocityRmsMS: number };
  timeReversal: { durationDays: number; positionRmsM: number; velocityRmsMS: number };
  liveStateMutated: false;
};

export type KerrIndependentFixtureV5 = {
  version: "v150-kerr-independent-fixtures-v5";
  coordinateSystem: "Boyer-Lindquist";
  units: "G=c=M=1";
  fixtureCount: number;
  sha256: string;
};

export type ScientificEvidenceBundleV5 = {
  version: typeof SCIENTIFIC_EVIDENCE_BUNDLE_V5_VERSION;
  generatedAt: string;
  dataCatalog: ScientificEvidenceGateV5;
  observationModels: ScientificEvidenceGateV5 & { transitRmsPpm: number | null; radialVelocityRmsMS: number | null };
  ephemeris: ScientificEvidenceGateV5 & {
    tenYearPositionRmsKm: number | null;
    tenYearVelocityRmsMS: number | null;
    convergencePositionRmsKm: number | null;
    reversalPositionRmsM: number | null;
    reversalVelocityRmsMS: number | null;
    durationDays: number | null;
  };
  kerr: ScientificEvidenceGateV5 & {
    maxHamiltonianDrift: number | null;
    maxCarterDrift: number | null;
    turningPointContinuationPassed: boolean;
  };
  performance: ScientificEvidenceGateV5;
  regression: ScientificEvidenceGateV5;
  promotionEligible: boolean;
  promotionApplied: boolean;
  decision: "promoted" | "promotion-eligible-shadow-retained" | "blocked-shadow-retained";
  defaultKernel: "legacy-eih-1pn" | "relativity-force-model-v2";
  blockers: readonly string[];
  canonicalPromotionVersion?: ScientificPromotionDecisionV7["version"];
  canonicalPromotionStatus?: ScientificPromotionDecisionV7["status"];
  canonicalPromotionBlockers?: readonly string[];
  boundary: "independent-artifacts-required-no-v4-fallback-fail-closed";
};

type GateInput = Partial<Omit<ScientificEvidenceGateV5, "measured" | "threshold">> & { measured?: string; threshold?: string };

export function createScientificEvidenceBundleV5(input: {
  generatedAt: string;
  dataCatalog?: GateInput;
  observationModels?: GateInput & { transitRmsPpm?: number | null; radialVelocityRmsMS?: number | null };
  ephemeris?: GateInput & {
    tenYearPositionRmsKm?: number | null;
    tenYearVelocityRmsMS?: number | null;
    convergencePositionRmsKm?: number | null;
    reversalPositionRmsM?: number | null;
    reversalVelocityRmsMS?: number | null;
    durationDays?: number | null;
  };
  kerr?: GateInput & { maxHamiltonianDrift?: number | null; maxCarterDrift?: number | null; turningPointContinuationPassed?: boolean };
  performance?: GateInput;
  regression?: GateInput;
  applyPromotion?: boolean;
  promotionDecision?: ScientificPromotionDecisionV7;
}): ScientificEvidenceBundleV5 {
  const makeGate = (gate: GateInput | undefined, threshold: string): ScientificEvidenceGateV5 => ({
    passed: gate?.passed === true,
    measured: gate?.measured ?? "missing",
    threshold,
    artifact: gate?.artifact ?? "",
    sha256: gate?.sha256 ?? "",
    independent: gate?.independent === true,
  });
  const dataCatalog = makeGate(input.dataCatalog, ">=1224219 objects; >=180000 parameter-rich; >=15000 priority rich; provenance/checksum clean");
  const observationBase = makeGate(input.observationModels, "batman transit RMS <50 ppm; independent RV RMS <0.1 m/s");
  const observationModels = { ...observationBase, transitRmsPpm: input.observationModels?.transitRmsPpm ?? null, radialVelocityRmsMS: input.observationModels?.radialVelocityRmsMS ?? null };
  const ephemerisBase = makeGate(input.ephemeris, "independent ten-year DOP853 <10000 km / <1 m/s; convergence <1 km; reversal <10 m / <1e-4 m/s");
  const ephemeris = {
    ...ephemerisBase,
    tenYearPositionRmsKm: input.ephemeris?.tenYearPositionRmsKm ?? null,
    tenYearVelocityRmsMS: input.ephemeris?.tenYearVelocityRmsMS ?? null,
    convergencePositionRmsKm: input.ephemeris?.convergencePositionRmsKm ?? null,
    reversalPositionRmsM: input.ephemeris?.reversalPositionRmsM ?? null,
    reversalVelocityRmsMS: input.ephemeris?.reversalVelocityRmsMS ?? null,
    durationDays: input.ephemeris?.durationDays ?? null,
  };
  const kerrBase = makeGate(input.kerr, "independent Kerr fixtures; Hamiltonian <1e-8; Carter <1e-10; turning continuation");
  const kerr = { ...kerrBase, maxHamiltonianDrift: input.kerr?.maxHamiltonianDrift ?? null, maxCarterDrift: input.kerr?.maxCarterDrift ?? null, turningPointContinuationPassed: input.kerr?.turningPointContinuationPassed === true };
  const performance = makeGate(input.performance, "overview >=55 FPS; science scenes >=45 FPS; lifecycle returns to baseline");
  const regression = makeGate(input.regression, "serial tsc, focused tests, full regression, build and browser QA");
  const namedGates = { dataCatalog, observationModels, ephemeris, kerr, performance, regression };
  const evidenceBlockers = Object.entries(namedGates).flatMap(([name, gate]) => gate.passed && gate.independent ? [] : [name]);
  const canonicalBlockers = input.promotionDecision?.blockers ?? [];
  const blockers = [...evidenceBlockers, ...canonicalBlockers];
  const evidenceGatesPassed = evidenceBlockers.length === 0;
  const promotionEligible = input.promotionDecision
    ? evidenceGatesPassed && input.promotionDecision.promotionQualified
    : evidenceGatesPassed;
  const promotionApplied = input.promotionDecision
    ? false
    : promotionEligible && input.applyPromotion === true;
  return {
    version: SCIENTIFIC_EVIDENCE_BUNDLE_V5_VERSION,
    generatedAt: input.generatedAt,
    ...namedGates,
    promotionEligible,
    promotionApplied,
    decision: promotionApplied
      ? "promoted"
      : promotionEligible
        ? "promotion-eligible-shadow-retained"
        : "blocked-shadow-retained",
    defaultKernel: promotionApplied ? "relativity-force-model-v2" : "legacy-eih-1pn",
    blockers,
    ...(input.promotionDecision
      ? {
          canonicalPromotionVersion: input.promotionDecision.version,
          canonicalPromotionStatus: input.promotionDecision.status,
          canonicalPromotionBlockers: input.promotionDecision.blockers,
        }
      : {}),
    boundary: "independent-artifacts-required-no-v4-fallback-fail-closed",
  };
}

export function validateScientificEvidenceBundleV5(bundle: ScientificEvidenceBundleV5): readonly string[] {
  const errors: string[] = [];
  const gates = [bundle.dataCatalog, bundle.observationModels, bundle.ephemeris, bundle.kerr, bundle.performance, bundle.regression];
  for (const gate of gates) {
    if (gate.passed && !gate.independent) errors.push(`passed-gate-not-independent:${gate.artifact || "missing"}`);
    if (gate.passed && !gate.artifact) errors.push("passed-gate-missing-artifact");
    if (gate.artifact && !/^[a-f0-9]{64}$/.test(gate.sha256)) errors.push(`invalid-checksum:${gate.artifact}`);
  }
  if (bundle.ephemeris.passed && (bundle.ephemeris.durationDays ?? 0) < 3_652.5) errors.push("ephemeris-not-ten-year");
  const allPassed = gates.every((gate) => gate.passed && gate.independent);
  const canonicalQualified = bundle.canonicalPromotionStatus
    ? bundle.canonicalPromotionStatus === "promotion-qualified-not-applied"
    : true;
  const expectedEligibility = allPassed && canonicalQualified;
  if (bundle.promotionEligible !== expectedEligibility) errors.push("eligibility-gate-mismatch");
  if (bundle.promotionApplied && !expectedEligibility) errors.push("applied-without-eligibility");
  if ((bundle.decision === "promoted") !== bundle.promotionApplied) errors.push("decision-application-mismatch");
  if ((bundle.decision === "promotion-eligible-shadow-retained") !== (expectedEligibility && !bundle.promotionApplied)) errors.push("decision-eligibility-mismatch");
  if (bundle.canonicalPromotionStatus && bundle.promotionApplied) errors.push("canonical-research-decision-cannot-apply-promotion");
  if ((bundle.defaultKernel === "relativity-force-model-v2") !== bundle.promotionApplied) errors.push("kernel-application-mismatch");
  if (bundle.defaultKernel === "relativity-force-model-v2" && bundle.blockers.length > 0) errors.push("unsafe-v2-promotion");
  return errors;
}
