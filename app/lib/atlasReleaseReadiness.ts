import { createAtlasPhysicsGateSplitSummary } from "./atlasPhysicsGateSplit";
import type {
  AtlasReleaseReadinessSummary,
  HorizonsValidationRun,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RELEASE_READINESS_VERSION =
  "v79-release-readiness-gate-semantics" as const;

export const ATLAS_RELEASE_READINESS_PROFILE =
  "v79-product-ready-scientific-blocker-disclosed" as const;

export const ATLAS_RELEASE_READINESS_BOUNDARY =
  "Local v79 release-readiness documentation and gate-semantics contract. This discloses that product verification is separated from strict Horizons scientific certification; it does not relax Horizons thresholds, claim NASA/JPL precision, claim latest CI status, mutate physics, mutate sky assets, mutate materials, mutate the Kerr kernel, or upgrade backgrounds.";

export function createAtlasReleaseReadinessSummary(
  run: HorizonsValidationRun | null = null,
): AtlasReleaseReadinessSummary {
  const split = createAtlasPhysicsGateSplitSummary(run);
  return {
    version: ATLAS_RELEASE_READINESS_VERSION,
    readinessProfile: ATLAS_RELEASE_READINESS_PROFILE,
    productReleaseGateStatus: split.productReleaseGateStatus,
    scientificHorizonsGateStatus: split.scientificHorizonsGateStatus,
    productFullCommand: split.productFullCommand,
    scientificFullCommand: split.scientificFullCommand,
    strictHorizonsCommand: split.strictHorizonsCommand,
    knownScientificBlocker: split.strictHorizonsFailureMeasured,
    releaseSemantics: "product-ready-scientific-horizons-blocked",
    documentationScope: "readme-technical-overview-evidence-validation-dom",
    budgetMutation: split.budgetMutation,
    physicsMutation: split.physicsMutation,
    skyAssetMutation: split.skyAssetMutation,
    materialMutation: split.materialMutation,
    kerrKernelMutation: split.kerrKernelMutation,
    runtimeCertificationStatus: split.runtimeCertificationStatus,
    scientificCertificationStatus: split.scientificCertificationStatus,
    trustedBoundary: ATLAS_RELEASE_READINESS_BOUNDARY,
  };
}
