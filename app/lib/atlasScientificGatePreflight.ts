import { createAtlasReleaseReadinessSummary } from "./atlasReleaseReadiness";
import type {
  AtlasScientificGatePreflightCandidate,
  AtlasScientificGatePreflightSummary,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION =
  "v80-scientific-horizons-closure-preflight" as const;

export const ATLAS_SCIENTIFIC_GATE_PREFLIGHT_PROFILE =
  "v80-horizons-model-limit-upgrade-roadmap" as const;

export const ATLAS_SCIENTIFIC_GATE_PREFLIGHT_BOUNDARY =
  "Local v80 strict Horizons certification closure preflight. This records diagnostic upgrade paths for the existing model-limit blocker; it does not relax v75 thresholds, certify NASA/JPL precision, complete a physics upgrade, mutate EIH 1PN or worker physics, mutate RK4, mutate the Kerr kernel, upgrade backgrounds, upgrade materials, or alter sky assets.";

const CANDIDATE_PATHS: readonly AtlasScientificGatePreflightCandidate[] = [
  {
    id: "ephemeris-initial-state-upgrade",
    status: "not-applied",
    target: "Upgrade initial states, epoch alignment, frame centering and Horizons checkpoint mapping before changing force laws.",
    rationale: "A long-horizon RMS gap can be dominated by epoch/frame/initial-condition mismatch even when short analytic checks remain healthy.",
    expectedEvidence: "Lower J2000-to-checkpoint residuals with unchanged v75 budgets and unchanged product gate semantics.",
    physicsMutation: "not-applied",
    budgetMutation: "not-applied",
  },
  {
    id: "solar-system-force-model-upgrade",
    status: "not-applied",
    target: "Evaluate missing solar-system terms such as major asteroid perturbations, solar J2, Earth-Moon barycenter handling and stronger ephemeris force parity.",
    rationale: "The current EIH 1PN demonstrator is credible for education but not yet a full JPL-style force model over 10 years.",
    expectedEvidence: "Per-body residual table showing which missing force terms reduce the 1PN aggregate RMS without weakening thresholds.",
    physicsMutation: "not-applied",
    budgetMutation: "not-applied",
  },
  {
    id: "high-order-integrator-upgrade",
    status: "not-applied",
    target: "Evaluate a long-horizon integrator path beyond fixed-step RK4 while preserving worker/runtime determinism.",
    rationale: "Integrator truncation and accumulated phase error may cap strict Horizons agreement even when numerical-health smoke tests pass.",
    expectedEvidence: "A/B runner comparison showing lower 10-year RMS and stable time-reversal/drift metrics under the same v75 budget.",
    physicsMutation: "not-applied",
    budgetMutation: "not-applied",
  },
];

export function createAtlasScientificGatePreflightSummary(
  run: HorizonsValidationRun | null = null,
): AtlasScientificGatePreflightSummary {
  const readiness = createAtlasReleaseReadinessSummary(run);
  return {
    version: ATLAS_SCIENTIFIC_GATE_PREFLIGHT_VERSION,
    preflightProfile: ATLAS_SCIENTIFIC_GATE_PREFLIGHT_PROFILE,
    status: "product-ready-strict-scientific-blocked-preflight-ready",
    productReleaseGateStatus: readiness.productReleaseGateStatus,
    scientificHorizonsGateStatus: readiness.scientificHorizonsGateStatus,
    knownScientificBlocker: readiness.knownScientificBlocker,
    candidatePathCount: CANDIDATE_PATHS.length,
    candidatePaths: CANDIDATE_PATHS,
    strictHorizonsCommand: readiness.strictHorizonsCommand,
    productFullCommand: readiness.productFullCommand,
    scientificFullCommand: readiness.scientificFullCommand,
    budgetMutation: readiness.budgetMutation,
    physicsMutation: readiness.physicsMutation,
    skyAssetMutation: readiness.skyAssetMutation,
    materialMutation: readiness.materialMutation,
    kerrKernelMutation: readiness.kerrKernelMutation,
    runtimeCertificationStatus: readiness.runtimeCertificationStatus,
    scientificCertificationStatus: readiness.scientificCertificationStatus,
    trustedBoundary: ATLAS_SCIENTIFIC_GATE_PREFLIGHT_BOUNDARY,
  };
}
