import {
  hdTextureManifestEntryForBodyId,
  v49TextureManifestEntryForBodyId,
} from "../data/planetTextureManifest";
import { ORBIT_ATLAS_SKY, ORBIT_ATLAS_V9_SKY } from "./orbitAtlasPresentation";
import type { AtlasCloseupVisualFidelitySummary } from "./simulationDiagnosticsTypes";

export const ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION =
  "v76-closeup-visual-fidelity-pass" as const;

export const ATLAS_CLOSEUP_ASSET_POLICY =
  "v76-local-hd-planets-existing-source-audited" as const;

export const ATLAS_CLOSEUP_VISUAL_BOUNDARY =
  "Local v76 close-up material, exposure and texture presentation pass over Earth, Saturn, Sun and Jupiter. Runtime rendering reads audited local HD/v49/v55 planet textures only; the v69/v71 orbit-atlas-v9 sky direction remains locked. This is not AAA certification, scientific certification, WCAG certification, online asset integrity, EIH 1PN physics mutation, worker physics mutation, sky mutation or Kerr kernel mutation. Under v78 product/scientific gate split, the visual pass can be product-ready while strict Horizons scientific certification remains blocked.";

export const V76_CLOSEUP_VISUAL_PROFILE_IDS = {
  earth: "earth-v76-hd-cloud-night-terminator",
  saturn: "saturn-v76-cassini-ring-occlusion",
  sun: "sun-v76-limb-granulation-bloom-restraint",
  jupiter: "jupiter-v76-band-microcontrast",
} as const;

export const V76_CLOSEUP_VISUAL_BUDGETS = {
  earth: {
    normalScale: [2.34, 2.34] as const,
    nightLayerOpacity: 0.31,
    cloudOpacity: 0.39,
    atmosphereIntensity: 0.2,
    depthLightingOpacity: 0.112,
    colorGradeOpacity: 0.118,
    nightCoolFloor: [0.118, 0.162, 0.22] as const,
    nightCoolFloorMix: 0.4,
  },
  saturn: {
    normalScale: [1.34, 0.82] as const,
    keyFillOpacity: 0.066,
    depthLightingOpacity: 0.235,
    colorGradeOpacity: 0.14,
    ringShadowContribution: 1.78,
    occlusionMixMax: 0.94,
  },
  sun: {
    materialDepth: 1.92,
    exposure: 0.68,
    mobileExposure: 0.27,
    glowOpacity: 0.036,
    mobileGlowOpacity: 0.024,
    granuleFrequencyMax: 78,
    cellFrequencyMax: 178,
  },
  jupiter: {
    normalScale: [1.18, 0.78] as const,
    keyFillOpacity: 0.08,
    colorGradeOpacity: 0.218,
    bandMaskOpacity: 0.46,
  },
  saturnRing: {
    showcaseOpacityMultiplier: 2.08,
    artOpacityMultiplier: 1.82,
    mainRingOpacity: 0.61,
    cassiniGapOpacity: 0.38,
    outerRingOpacity: 0.18,
    shaderArtAlphaBoost: 1.3,
  },
} as const;

export const V76_AUDITED_TEXTURE_FAMILIES = [
  "public/textures/planets/hd",
  "public/textures/planets/v49",
  "public/textures/planets/v55",
  "scripts/fetch-planet-textures-8k.mjs Solar System Scope CC BY 4.0",
] as const;

export const V76_CLOSEUP_REQUIRED_TEXTURES = {
  earth: ["hd.albedo", "hd.clouds", "hd.night", "v49.cloudAlpha", "v49.nightMask", "v49.roughness"],
  saturn: ["hd.albedo", "v49.albedo", "v49.bandMask", "v49.ringColorMap", "v49.ringAlphaMap", "v49.roughness"],
  sun: ["hd.albedo", "v49.albedo", "v49.roughness"],
  jupiter: ["hd.albedo", "v49.albedo", "v49.bandMask", "v49.roughness"],
} as const;

export function createAtlasCloseupVisualFidelitySummary(): AtlasCloseupVisualFidelitySummary {
  return {
    version: ATLAS_CLOSEUP_VISUAL_FIDELITY_VERSION,
    status: "informational",
    assetPolicy: ATLAS_CLOSEUP_ASSET_POLICY,
    backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore",
    backgroundGuardVersion: "v71-background-regression-guard",
    materialProfileVersion: "v72-material-profile-contract",
    physicsBenchmarkGateVersion: "v75-physics-benchmark-release-gate",
    visualTarget: "earth-saturn-sun-jupiter-closeup-fidelity",
    textureSourcePolicy: "local-hd-v49-v55-solarsystemscope-cc-by-4",
    runtimeAssetPolicy: "local-public-textures-only",
    earthProfileId: V76_CLOSEUP_VISUAL_PROFILE_IDS.earth,
    saturnProfileId: V76_CLOSEUP_VISUAL_PROFILE_IDS.saturn,
    sunProfileId: V76_CLOSEUP_VISUAL_PROFILE_IDS.sun,
    jupiterProfileId: V76_CLOSEUP_VISUAL_PROFILE_IDS.jupiter,
    protectedSkyManifest: ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY ? "orbit-atlas-v9" : "orbit-atlas-v9",
    skyAssetMutation: "not-applied",
    physicsMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineAssetCompletenessStatus: "not-claimed",
    fullReleaseGateStatus: "product-ready-scientific-horizons-blocked",
    auditedTextureFamilies: V76_AUDITED_TEXTURE_FAMILIES,
    trustedBoundary: ATLAS_CLOSEUP_VISUAL_BOUNDARY,
  };
}

export function auditedCloseupTextureManifestForBodyId(bodyId: "earth" | "saturn" | "sun" | "jupiter") {
  return {
    hd: hdTextureManifestEntryForBodyId(bodyId),
    v49: v49TextureManifestEntryForBodyId(bodyId),
  };
}

export function isLocalPlanetTextureUrl(url: string | undefined): boolean {
  return typeof url === "string" && url.startsWith("/textures/planets/");
}
