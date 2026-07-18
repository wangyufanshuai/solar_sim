import { ATLAS_CONTENT_PACK_DELIVERY_VERSION } from "./atlasContentPackContractV3";
import { ATLAS_ASSET_RESOLVER_VERSION } from "./atlasAssetResolver";
import { ATLAS_VISUAL_DIRECTOR_V4_VERSION } from "./atlasVisualDirectorV4";
import { PLANET_RENDER_GRAPH_V3_VERSION } from "./planetRenderGraphV3";
import { STELLAR_PORTRAIT_PROFILE_V7_VERSION } from "./stellarPortraitProfileV7";
import { ORBIT_DIRECTOR_V3_VERSION } from "./orbitDirectorV3";
import { LAUNCH_CINEMATIC_V3_VERSION } from "./launchCinematicV3";
import { CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7 } from "./scientificExperienceEvidenceV7";

export const ATLAS_EXTREME_RELEASE_V166_VERSION =
  "v160-v166-extreme-visual-runtime-convergence" as const;

export function createAtlasExtremeReleaseV166Summary() {
  return {
    version: ATLAS_EXTREME_RELEASE_V166_VERSION,
    profile: "production-content-packs-single-canvas-material-v7-million-discovery-launch-v3-science-v7" as const,
    assetDeliveryVersion: ATLAS_CONTENT_PACK_DELIVERY_VERSION,
    assetResolverVersion: ATLAS_ASSET_RESOLVER_VERSION,
    runtimeArchitectureVersion: "v161-selector-scene-host" as const,
    visualDirectorVersion: ATLAS_VISUAL_DIRECTOR_V4_VERSION,
    planetRenderGraphVersion: PLANET_RENDER_GRAPH_V3_VERSION,
    stellarMaterialVersion: STELLAR_PORTRAIT_PROFILE_V7_VERSION,
    orbitDirectorVersion: ORBIT_DIRECTOR_V3_VERSION,
    launchVersion: LAUNCH_CINEMATIC_V3_VERSION,
    scienceVersion: CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.version,
    contentPackInstalledLimitBytes: 3 * 1024 ** 3,
    gpuResidencyLimitBytes: 2.2 * 1024 ** 3,
    defaultScientificKernel: "legacy-eih-1pn" as const,
    releaseStatus: CURRENT_SCIENTIFIC_EXPERIENCE_EVIDENCE_V7.releaseDecision,
    boundary: "web-next-standalone-webgl2-presentation-upgrade-frozen-live-worker-physics-and-v9" as const,
  };
}

export const CURRENT_ATLAS_EXTREME_RELEASE_V166 =
  createAtlasExtremeReleaseV166Summary();
