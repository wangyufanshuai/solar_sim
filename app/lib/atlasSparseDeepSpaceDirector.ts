import type { AtlasSparseDeepSpaceDirectorSummary } from "./simulationDiagnosticsTypes";

export const ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION =
  "v57-sparse-deep-space-director" as const;

export const ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_BOUNDARY =
  "Local v57 sparse deep-space director metadata only. Universe Sandbox is used as a visual reference direction for sparse scientific-space composition, deep Milky Way dark lanes and selected-body negative space, but no Universe Sandbox clone status or asset copy is claimed; NASA SVS 16K inputs are prepared into local runtime assets, no online validation or asset-completeness certification is claimed, and no physics state, EIH 1PN dynamics, worker physics or Kerr kernel behavior is mutated.";

export function createAtlasSparseDeepSpaceDirectorSummary(): AtlasSparseDeepSpaceDirectorSummary {
  return {
    version: ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_VERSION,
    status: "informational",
    referenceMode: "universe-sandbox-inspired-sparse-deep-space",
    sourcePolicy: "nasa-svs-16k-prepared-local-runtime",
    skyManifest: "orbit-atlas-v57",
    runtimeAssetSource: "prepared-local-v57-sky-assets-only",
    sourceInputs: [
      "nasa-svs-deep-star-maps-2020-16k",
      "nasa-svs-elsewhere-starfield-2020-16k",
      "local-v56-v48-v9-fallbacks",
    ],
    starfieldProfile: "sparse-primary-stars-ultrafaint-distant-field",
    closeupStarfieldProfile: "closeup-primary-stars-subject-matte",
    milkyWayProfile: "deep-cold-gray-blue-dark-lanes",
    closeupMilkyWayProfile: "closeup-dark-lane-negative-space",
    nebulaProfile: "barely-visible-local-haze",
    closeupNebulaProfile: "closeup-haze-nearly-suppressed",
    negativeSpaceProfile: "overview-wide-negative-space",
    closeupNegativeSpaceProfile: "selected-body-clean-negative-space",
    backgroundPixelBudget: "overview-tightened-closeup-tightened",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBackdropBoundaryPreserved: "v56-cinematic-deep-space-backdrop-preserved",
    planetaryArtBoundaryPreserved: "v55-cinematic-planetary-art-direction-preserved",
    numericalIntegrityBoundaryPreserved: "v54-numerical-integrity-gate-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    ciCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    onlineAssetCompletenessStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    trustedBoundary: ATLAS_SPARSE_DEEP_SPACE_DIRECTOR_BOUNDARY,
  };
}
