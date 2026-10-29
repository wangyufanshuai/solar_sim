import { ATLAS_UNIVERSAL_FOCUS_VERSION } from "./atlasFocusV2";
import { ATLAS_CAMERA_FRAME_SOLVER_V5_VERSION } from "./atlasCameraFrameSolverV5";
import { LAUNCH_COMPOSITION_V2_VERSION } from "./launchCompositionV2";
import { SCIENTIFIC_PROMOTION_DECISION_V6_VERSION } from "./scientificPromotionDecisionV6";
import { STELLAR_PORTRAIT_PROFILE_V6_VERSION } from "./stellarPortraitProfileV6";

export const ATLAS_CORE_EXPERIENCE_RELEASE_V159_VERSION =
  "v154-v159-core-experience-release" as const;

export function createAtlasCoreExperienceReleaseV159Summary() {
  return {
    version: ATLAS_CORE_EXPERIENCE_RELEASE_V159_VERSION,
    profile: "universal-focus-isolated-search-local-million-pack-scientific-material-launch-composition" as const,
    focusVersion: ATLAS_UNIVERSAL_FOCUS_VERSION,
    runtimeIsolationVersion: "v155-runtime-isolation-v2" as const,
    catalogDeliveryVersion: "v156-million-catalog-local-delivery" as const,
    materialVersion: STELLAR_PORTRAIT_PROFILE_V6_VERSION,
    cameraVersion: ATLAS_CAMERA_FRAME_SOLVER_V5_VERSION,
    launchVersion: LAUNCH_COMPOSITION_V2_VERSION,
    scientificDecisionVersion: SCIENTIFIC_PROMOTION_DECISION_V6_VERSION,
    defaultScientificKernel: "legacy-eih-1pn" as const,
    boundary: "Web/standalone presentation, catalog delivery and decision metadata only; frozen live/worker physics and historical visual budgets are unchanged." as const,
  };
}
