import type {
  AtlasCinematicCloseupDirectorSummary,
  AtlasCinematicCloseupDirectorVersion,
  AtlasCloseupCompositionProfile,
  AtlasCloseupPanelAvoidanceProfile,
  AtlasCloseupRingShowcaseProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION: AtlasCinematicCloseupDirectorVersion =
  "v50-cinematic-closeup-director";

export const ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_BOUNDARY =
  "Local cinematic close-up composition metadata only; v50 reads existing selected-body, local planet material and sky presentation state to improve visual framing, subject separation and Saturn ring showcase cues, preserves v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface, v46 deep-space camera, v47 reference backdrop, v48 reference-grade space art and v49 planetary material boundaries, and does not claim AAA certification, WCAG certification, scientific certification, Universe Sandbox clone status, latest runtime command result, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export const ATLAS_CLOSEUP_COMPOSITION_PROFILES: readonly AtlasCloseupCompositionProfile[] = [
  "overview-no-closeup-director",
  "earth-limb-portrait",
  "solar-surface-portrait",
  "gas-giant-band-portrait",
  "saturn-ring-showcase",
  "lunar-mars-relief-portrait",
];

export const ATLAS_CLOSEUP_PANEL_AVOIDANCE_PROFILES: readonly AtlasCloseupPanelAvoidanceProfile[] = [
  "overview-no-panel-avoidance",
  "right-workbench-safe-subject-left",
  "centered-mobile-safe-subject",
];

export const ATLAS_CLOSEUP_RING_SHOWCASE_PROFILES: readonly AtlasCloseupRingShowcaseProfile[] = [
  "no-ring-showcase",
  "saturn-wide-tilted-ring-showcase",
];

export function createAtlasCinematicCloseupDirectorSummary(): AtlasCinematicCloseupDirectorSummary {
  return {
    version: ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_VERSION,
    status: "informational",
    compositionTarget: "aaa-inspired-closeup-subject-composition",
    qualityBudget: "stable-high-fidelity",
    assetPolicy: "local-runtime-assets",
    runtimeAssetSource: "prepared-local-planet-and-sky-textures-only",
    supportedCompositionProfiles: ATLAS_CLOSEUP_COMPOSITION_PROFILES,
    supportedPanelAvoidanceProfiles: ATLAS_CLOSEUP_PANEL_AVOIDANCE_PROFILES,
    supportedRingShowcaseProfiles: ATLAS_CLOSEUP_RING_SHOWCASE_PROFILES,
    defaultCompositionProfile: "overview-no-closeup-director",
    earthCompositionProfile: "earth-limb-portrait",
    solarCompositionProfile: "solar-surface-portrait",
    gasGiantCompositionProfile: "gas-giant-band-portrait",
    saturnCompositionProfile: "saturn-ring-showcase",
    lunarMarsCompositionProfile: "lunar-mars-relief-portrait",
    defaultPanelAvoidanceProfile: "overview-no-panel-avoidance",
    desktopPanelAvoidanceProfile: "right-workbench-safe-subject-left",
    mobilePanelAvoidanceProfile: "centered-mobile-safe-subject",
    defaultRingShowcaseProfile: "no-ring-showcase",
    saturnRingShowcaseProfile: "saturn-wide-tilted-ring-showcase",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved",
    deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved",
    universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved",
    referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved",
    planetaryMaterialBoundaryPreserved: "v49-planetary-material-composition-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    trustedBoundary: ATLAS_CINEMATIC_CLOSEUP_DIRECTOR_BOUNDARY,
  };
}
