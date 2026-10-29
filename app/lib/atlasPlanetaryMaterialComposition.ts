import type {
  AtlasPlanetaryMaterialCompositionSummary,
  AtlasPlanetaryMaterialCompositionVersion,
  AtlasSelectedBodyAtmosphereDepthProfile,
  AtlasSelectedBodyMaterialProfile,
  AtlasSelectedBodyRingProfile,
  AtlasSelectedBodyTerminatorProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION: AtlasPlanetaryMaterialCompositionVersion =
  "v49-planetary-material-composition";

export const ATLAS_PLANETARY_MATERIAL_COMPOSITION_BOUNDARY =
  "Local planetary material composition metadata only; v49 uses developer-refreshed or generated local planet texture maps at runtime, preserves v41 accessibility, v42 cinematic workbench, v43 planetary fidelity, v44 lighting, v45 Chinese interface, v46 deep-space camera, v47 reference backdrop and v48 reference-grade space art boundaries, and does not claim AAA certification, WCAG certification, scientific certification, latest runtime command result, online validation, online catalog completeness, online asset completeness, asset completeness certification, or physics mutation.";

export const ATLAS_SELECTED_BODY_MATERIAL_PROFILES: readonly AtlasSelectedBodyMaterialProfile[] = [
  "overview-local-material",
  "earth-cloud-night-depth",
  "gas-giant-band-depth",
  "saturn-ring-material-depth",
  "solar-granulation-depth",
  "lunar-mars-relief-depth",
  "terrestrial-terminator-depth",
];

export const ATLAS_SELECTED_BODY_ATMOSPHERE_DEPTH_PROFILES: readonly AtlasSelectedBodyAtmosphereDepthProfile[] = [
  "overview-atmosphere",
  "thin-earth-limb-depth",
  "gas-giant-soft-limb-depth",
  "solar-edge-controlled-depth",
  "airless-relief-limb",
];

export const ATLAS_SELECTED_BODY_TERMINATOR_PROFILES: readonly AtlasSelectedBodyTerminatorProfile[] = [
  "overview-terminator",
  "earth-night-cloud-terminator",
  "gas-band-low-fill-terminator",
  "solar-limb-darkening",
  "airless-relief-terminator",
];

export const ATLAS_SELECTED_BODY_RING_PROFILES: readonly AtlasSelectedBodyRingProfile[] = [
  "no-ring-profile",
  "saturn-cassini-layered-ring",
];

export function createAtlasPlanetaryMaterialCompositionSummary(): AtlasPlanetaryMaterialCompositionSummary {
  return {
    version: ATLAS_PLANETARY_MATERIAL_COMPOSITION_VERSION,
    status: "informational",
    materialTarget: "closeup-body-material-depth",
    assetPolicy: "dev-refresh-prepared-local-runtime",
    runtimeAssetSource: "prepared-local-planet-textures-only",
    supportedMaterialProfiles: ATLAS_SELECTED_BODY_MATERIAL_PROFILES,
    supportedAtmosphereDepthProfiles: ATLAS_SELECTED_BODY_ATMOSPHERE_DEPTH_PROFILES,
    supportedTerminatorProfiles: ATLAS_SELECTED_BODY_TERMINATOR_PROFILES,
    supportedRingProfiles: ATLAS_SELECTED_BODY_RING_PROFILES,
    earthMaterialProfile: "earth-cloud-night-depth",
    gasGiantMaterialProfile: "gas-giant-band-depth",
    saturnMaterialProfile: "saturn-ring-material-depth",
    solarMaterialProfile: "solar-granulation-depth",
    lunarMarsMaterialProfile: "lunar-mars-relief-depth",
    terrestrialMaterialProfile: "terrestrial-terminator-depth",
    defaultMaterialProfile: "overview-local-material",
    earthAtmosphereProfile: "thin-earth-limb-depth",
    gasGiantAtmosphereProfile: "gas-giant-soft-limb-depth",
    solarAtmosphereProfile: "solar-edge-controlled-depth",
    airlessAtmosphereProfile: "airless-relief-limb",
    defaultAtmosphereProfile: "overview-atmosphere",
    earthTerminatorProfile: "earth-night-cloud-terminator",
    gasGiantTerminatorProfile: "gas-band-low-fill-terminator",
    solarTerminatorProfile: "solar-limb-darkening",
    airlessTerminatorProfile: "airless-relief-terminator",
    defaultTerminatorProfile: "overview-terminator",
    saturnRingProfile: "saturn-cassini-layered-ring",
    defaultRingProfile: "no-ring-profile",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    cinematicBoundaryPreserved: "v42-cinematic-boundary-preserved",
    planetaryBoundaryPreserved: "v43-planetary-visual-fidelity-preserved",
    lightingBoundaryPreserved: "v44-cinematic-lighting-preserved",
    chineseBoundaryPreserved: "v45-chinese-deep-space-fidelity-preserved",
    deepSpaceCameraBoundaryPreserved: "v46-cinematic-deep-space-camera-preserved",
    universeSandboxReferenceBoundaryPreserved: "v47-universe-sandbox-reference-backdrop-preserved",
    referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved",
    physicsMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    assetCompletenessCertificationStatus: "not-claimed",
    onlineValidationStatus: "not-claimed",
    trustedBoundary: ATLAS_PLANETARY_MATERIAL_COMPOSITION_BOUNDARY,
  };
}
