import type {
  AtlasCinematicPlanetaryArtDirectionSummary,
  AtlasSelectedBodyEarthCloudNightProfile,
  AtlasSelectedBodyGasGiantArtProfile,
  AtlasSelectedBodySaturnRingArtProfile,
  AtlasSelectedBodySolarSurfaceProfile,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION =
  "v55-cinematic-planetary-art-direction" as const;

export const ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_BOUNDARY =
  "Local v55 visual art-direction and composition metadata only. Universe Sandbox is used as reference direction for sparse deep-space backgrounds, planet readability and low-interference composition, but no Universe Sandbox clone status or asset copy is claimed; no AAA/WCAG/science/CI/online/asset-completeness certification is claimed, and no physics state, EIH 1PN dynamics, worker physics or Kerr kernel behavior is mutated.";

export const V55_GAS_GIANT_ART_PROFILES: readonly AtlasSelectedBodyGasGiantArtProfile[] = [
  "overview-no-gas-giant-art",
  "gas-giant-band-depth-cinematic",
  "saturn-muted-bands-ring-aware",
] as const;

export const V55_SATURN_RING_ART_PROFILES: readonly AtlasSelectedBodySaturnRingArtProfile[] = [
  "no-ring-art-profile",
  "saturn-cassini-backlit-ring-art",
] as const;

export const V55_EARTH_CLOUD_NIGHT_PROFILES: readonly AtlasSelectedBodyEarthCloudNightProfile[] = [
  "overview-no-earth-cloud-night-art",
  "earth-clean-cloud-night-shadow-art",
] as const;

export const V55_SOLAR_SURFACE_PROFILES: readonly AtlasSelectedBodySolarSurfaceProfile[] = [
  "overview-no-solar-surface-art",
  "solar-granulation-controlled-corona-art",
] as const;

export function createAtlasCinematicPlanetaryArtDirectionSummary(): AtlasCinematicPlanetaryArtDirectionSummary {
  return {
    version: ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_VERSION,
    status: "informational",
    referenceMode: "universe-sandbox-inspired-local-comparison",
    qualityTarget: "aaa-inspired-scientific-space-simulation",
    assetPolicy: "dev-refresh-prepared-local-runtime",
    runtimeAssetSource: "prepared-local-v55-art-direction-assets-only",
    supportedGasGiantArtProfiles: V55_GAS_GIANT_ART_PROFILES,
    supportedSaturnRingArtProfiles: V55_SATURN_RING_ART_PROFILES,
    supportedEarthCloudNightProfiles: V55_EARTH_CLOUD_NIGHT_PROFILES,
    supportedSolarSurfaceProfiles: V55_SOLAR_SURFACE_PROFILES,
    defaultGasGiantArtProfile: "overview-no-gas-giant-art",
    gasGiantArtProfile: "gas-giant-band-depth-cinematic",
    saturnGasGiantArtProfile: "saturn-muted-bands-ring-aware",
    defaultSaturnRingArtProfile: "no-ring-art-profile",
    saturnRingArtProfile: "saturn-cassini-backlit-ring-art",
    defaultEarthCloudNightProfile: "overview-no-earth-cloud-night-art",
    earthCloudNightProfile: "earth-clean-cloud-night-shadow-art",
    defaultSolarSurfaceProfile: "overview-no-solar-surface-art",
    solarSurfaceProfile: "solar-granulation-controlled-corona-art",
    globalColorGradeProfile: "filmic-cool-space-warm-planet-protection",
    defaultBackgroundArtGradeProfile: "sparse-negative-space-milky-way-depth",
    closeupBackgroundArtGradeProfile: "closeup-subject-star-noise-matte",
    backgroundReferenceCue: "sparse-stars-layered-milky-way-negative-space",
    earthNightCue: "dark-side-only-city-light-mask",
    gasBandCue: "nonemissive-banded-microcontrast",
    saturnRingCue: "cassini-gap-backlit-layering",
    solarSurfaceCue: "granulation-controlled-corona",
    aaBoundaryPreserved: "v41-aa-boundary-preserved",
    referenceGradeBoundaryPreserved: "v48-reference-grade-space-art-preserved",
    materialBoundaryPreserved: "v49-planetary-material-composition-preserved",
    colorBoundaryPreserved: "v53-planetary-color-grading-preserved",
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
    trustedBoundary: ATLAS_CINEMATIC_PLANETARY_ART_DIRECTION_BOUNDARY,
  };
}
