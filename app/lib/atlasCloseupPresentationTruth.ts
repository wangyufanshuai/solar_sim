import type {
  AtlasBodyPreviewProfile,
  AtlasBodyPreviewRenderProfile,
  AtlasBodyPreviewRingState,
  AtlasBodyPreviewTexturePolicy,
  AtlasCloseupPresentationTruthSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION =
  "v58-closeup-presentation-truth" as const;
export const ATLAS_BACKGROUND_ORBIT_ART_VERSION =
  "v69-legacy-8k-sky-restore" as const;

export const ATLAS_CLOSEUP_PRESENTATION_TRUTH_BOUNDARY =
  "Local v58 close-up consistency plus v69 legacy 8K sky restore metadata only. The selected-body sidebar preview, restored local blue-gray Milky Way/starfield backdrop, close-up orbit budget, layered depth orbit ribbons, solar limb glow and read-only velocity-color cues are presentation-layer checks; no physics state, EIH 1PN dynamics, worker physics, Kerr kernel behavior, runtime command result, online validation, online asset-completeness status, scientific certification, WCAG certification, AAA certification or Universe Sandbox clone status is claimed.";

export const ATLAS_BODY_PREVIEW_RENDER_PROFILES: readonly AtlasBodyPreviewRenderProfile[] = [
  "solar-procedural-preview",
  "earth-cloud-night-preview",
  "gas-giant-band-preview",
  "saturn-ringed-band-preview",
  "terrestrial-texture-preview",
  "lunar-mars-relief-preview",
  "fallback-procedural-preview",
] as const;

export const ATLAS_BODY_PREVIEW_TEXTURE_POLICIES: readonly AtlasBodyPreviewTexturePolicy[] = [
  "hd-or-v49-local-texture",
  "local-texture",
  "procedural-fallback",
] as const;

export const ATLAS_BODY_PREVIEW_RING_STATES: readonly AtlasBodyPreviewRingState[] = [
  "ringed",
  "no-ring",
] as const;

export type CreateBodyVisualPreviewProfileArgs = {
  id: string;
  variant?: string;
  showRings?: boolean;
  textureMap?: string;
};

const GAS_GIANT_IDS = new Set(["jupiter", "saturn", "uranus", "neptune"]);
const LUNAR_MARS_IDS = new Set(["moon", "mars"]);
const LOCAL_HD_OR_V49_IDS = new Set(["sun", "earth", "moon", "mars", "jupiter", "saturn"]);

export function createBodyVisualPreviewProfile({
  id,
  variant,
  showRings = false,
  textureMap,
}: CreateBodyVisualPreviewProfileArgs): AtlasBodyPreviewProfile {
  const ringState: AtlasBodyPreviewRingState = showRings || id === "saturn" ? "ringed" : "no-ring";
  const texturePolicy: AtlasBodyPreviewTexturePolicy = LOCAL_HD_OR_V49_IDS.has(id)
    ? "hd-or-v49-local-texture"
    : textureMap
      ? "local-texture"
      : "procedural-fallback";

  return {
    bodyId: id,
    renderProfile: previewRenderProfileFor(id, variant, ringState),
    texturePolicy,
    ringState,
    cloudNightCue: id === "earth" ? "earth-cloud-night-cue" : "no-cloud-night-cue",
    solarCue: variant === "sun" || id === "sun" ? "solar-granulation-preview" : "no-solar-cue",
  };
}

function previewRenderProfileFor(
  id: string,
  variant: string | undefined,
  ringState: AtlasBodyPreviewRingState,
): AtlasBodyPreviewRenderProfile {
  if (variant === "sun" || id === "sun") return "solar-procedural-preview";
  if (id === "earth") return "earth-cloud-night-preview";
  if (ringState === "ringed") return "saturn-ringed-band-preview";
  if (GAS_GIANT_IDS.has(id)) return "gas-giant-band-preview";
  if (LUNAR_MARS_IDS.has(id)) return "lunar-mars-relief-preview";
  if (id === "mercury" || id === "venus") return "terrestrial-texture-preview";
  return "fallback-procedural-preview";
}

export function createAtlasCloseupPresentationTruthSummary(): AtlasCloseupPresentationTruthSummary {
  return {
    version: ATLAS_CLOSEUP_PRESENTATION_TRUTH_VERSION,
    backgroundOrbitArtVersion: ATLAS_BACKGROUND_ORBIT_ART_VERSION,
    status: "informational",
    previewSyncTarget: "selected-body-sidebar-preview",
    defaultPreviewSyncStatus: "no-selected-body",
    defaultReviewMode: "standard",
    sceneReviewMode: "scene-review",
    solarBackdropProfile: "solar-clean-negative-space",
    planetReadabilityProfile: "body-specific-closeup-readable",
    backgroundArtProfile: "v69-legacy-blue-dust-starfield",
    orbitHierarchyProfile: "major-identity-minor-restrained",
    orbitPerformanceProfile: "closeup-selected-orbit-budget",
    orbitMaterialProfile: "v67-layered-depth-orbit-ribbons",
    solarCloseupProfile: "solar-limb-controlled-corona",
    velocityTrailProfile: "selected-log-velocity-three-stop",
    orbitOcclusionProfile: "depth-tested-closeup-fade",
    supportedPreviewProfiles: ATLAS_BODY_PREVIEW_RENDER_PROFILES,
    supportedTexturePolicies: ATLAS_BODY_PREVIEW_TEXTURE_POLICIES,
    supportedRingStates: ATLAS_BODY_PREVIEW_RING_STATES,
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    sparseDeepSpaceBoundaryPreserved: "v57-sparse-deep-space-director-preserved",
    planetaryArtBoundaryPreserved: "v55-cinematic-planetary-art-direction-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    ciCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    onlineAssetCompletenessStatus: "not-claimed",
    universeSandboxCloneStatus: "not-claimed",
    trustedBoundary: ATLAS_CLOSEUP_PRESENTATION_TRUTH_BOUNDARY,
  };
}
