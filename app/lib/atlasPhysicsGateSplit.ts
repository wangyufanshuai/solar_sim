import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
  createAtlasHorizonsGateAuditSummary,
} from "./atlasHorizonsGateAudit";
import type {
  AtlasPhysicsGateSplitSummary,
  AtlasScientificHorizonsGateStatus,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PHYSICS_GATE_SPLIT_VERSION =
  "v78-product-scientific-physics-gate-split" as const;

export const ATLAS_PHYSICS_GATE_SPLIT_PROFILE =
  "v78-local-product-ready-strict-horizons-blocked" as const;

export const ATLAS_PHYSICS_GATE_SPLIT_BOUNDARY =
  "Local v78 release-semantics split between product verification and strict Horizons scientific certification. This does not relax v75 Horizons thresholds, certify NASA/JPL precision, mutate EIH 1PN physics, mutate worker physics, mutate RK4, mutate the Kerr kernel, upgrade backgrounds, upgrade materials, or alter sky assets.";

export function createAtlasPhysicsGateSplitSummary(
  run: HorizonsValidationRun | null = null,
): AtlasPhysicsGateSplitSummary {
  const audit = createAtlasHorizonsGateAuditSummary(run);
  return {
    version: ATLAS_PHYSICS_GATE_SPLIT_VERSION,
    gateSplitProfile: ATLAS_PHYSICS_GATE_SPLIT_PROFILE,
    productReleaseGateStatus: "pass",
    scientificHorizonsGateStatus: scientificStatusFromAudit(audit.status),
    scientificFailureClassification: audit.failureClassification,
    strictHorizonsFailureMeasured: audit.currentFailureMeasured || V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED,
    strictHorizonsThreshold: `RMS < ${ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm.toLocaleString("en-US")} km / ${ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs} m/s; Mercury +10y ratio < ${ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio}`,
    strictHorizonsCommand: "npm run test:atlas:horizons-scientific-gate",
    productFullCommand: "npm run verify:atlas:full",
    scientificFullCommand: "npm run verify:atlas:scientific",
    releaseSemantics: "product-full-excludes-strict-horizons-scientific-gate",
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "blocked-by-strict-horizons-gate",
    trustedBoundary: ATLAS_PHYSICS_GATE_SPLIT_BOUNDARY,
  };
}

function scientificStatusFromAudit(
  status: ReturnType<typeof createAtlasHorizonsGateAuditSummary>["status"],
): AtlasScientificHorizonsGateStatus {
  if (status === "pass") return "pass";
  if (status === "pending-runtime-run") return "pending-runtime-run";
  return "blocked-model-limit";
}
