import type { AtlasCinematicDeepSpaceBackdropSummary } from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION =
  "v56-cinematic-deep-space-backdrop" as const;

export const ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_BOUNDARY =
  "Local v56 deep-space backdrop composition metadata only. Universe Sandbox is used as a visual reference direction for sparse stars, layered Milky Way dark lanes, soft nebula haze and low-interference composition, but no Universe Sandbox clone status or asset copy is claimed; NASA SVS inputs are prepared into local runtime assets, no online validation or asset-completeness certification is claimed, and no physics state, EIH 1PN dynamics, worker physics or Kerr kernel behavior is mutated.";

export function createAtlasCinematicDeepSpaceBackdropSummary(): AtlasCinematicDeepSpaceBackdropSummary {
  return {
    version: ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_VERSION,
    status: "informational",
    referenceMode: "universe-sandbox-inspired-local-comparison",
    sourcePolicy: "nasa-svs-prepared-local-runtime",
    skyManifest: "orbit-atlas-v56",
    runtimeAssetSource: "prepared-local-v56-sky-assets-only",
    sourceInputs: [
      "nasa-svs-deep-star-maps-2020",
      "nasa-svs-elsewhere-starfield-2020",
      "local-v48-v9-fallbacks",
    ],
    starfieldProfile: "sparse-primary-stars-faint-distant-field",
    closeupStarfieldProfile: "closeup-subject-star-noise-suppressed",
    nebulaProfile: "soft-local-nebula-haze-layer",
    closeupNebulaProfile: "closeup-nebula-haze-restrained",
    negativeSpaceProfile: "layered-milky-way-negative-space",
    closeupNegativeSpaceProfile: "selected-body-clean-dark-backdrop",
    backgroundHighlightPolicy: "bright-wall-suppressed",
    milkyWayDarkLanePolicy: "cold-gray-blue-dark-lane-preserved",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved",
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
    trustedBoundary: ATLAS_CINEMATIC_DEEP_SPACE_BACKDROP_BOUNDARY,
  };
}
