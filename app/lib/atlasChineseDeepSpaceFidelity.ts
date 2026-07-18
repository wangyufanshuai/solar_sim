import type {
  AtlasChineseDeepSpaceFidelitySummary,
  AtlasChineseDeepSpaceFidelityVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION: AtlasChineseDeepSpaceFidelityVersion =
  "v45-chinese-deep-space-fidelity";

export const ATLAS_CHINESE_DEEP_SPACE_FIDELITY_BOUNDARY =
  "Local zh-CN interface and deep-space visual presentation metadata only; uses public textures and curated local catalogs at runtime, preserves v41 accessibility, v42 cinematic workbench, v43 planetary visual fidelity, and v44 cinematic lighting boundaries, and does not claim runtime certification, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, or physics mutation.";

export function createAtlasChineseDeepSpaceFidelitySummary(): AtlasChineseDeepSpaceFidelitySummary {
  return {
    version: ATLAS_CHINESE_DEEP_SPACE_FIDELITY_VERSION,
    status: "informational",
    uiLanguage: "zh-CN",
    localizationMode: "zh-cn-primary-scientific-ids-preserved",
    visualProfile: "milky-way-constellation-nebula-balanced",
    assetPolicy: "local-runtime-assets",
    runtimeAssetSource: "public-textures-and-curated-local-catalogs",
    featuredLayerCount: 4,
    featuredLayers: ["milky-way", "constellations", "nebulae", "planetary-closeups"],
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_CHINESE_DEEP_SPACE_FIDELITY_BOUNDARY,
  };
}
