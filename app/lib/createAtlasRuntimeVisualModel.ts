import type { MutableRefObject } from "react";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { hasHdTextureForBodyId } from "../data/planetTextureManifest";
import type {
  AtlasBackgroundSubjectVisibilityProfile,
  AtlasCinematicBackgroundNoiseProfile,
  AtlasCinematicSkyCompositionProfile,
  AtlasCinematicTargetSeparationProfile,
  AtlasSelectedBodyLightingProfile,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";
import { createAtlasNumericalIntegritySummary } from "./atlasNumericalIntegrity";
import { createBodyVisualPreviewProfile } from "./atlasCloseupPresentationTruth";
import {
  ATLAS_RUNTIME_VISUAL_COMPACT_SUMMARIES_V198,
  type AtlasRuntimeVisualStaticSummariesV198,
} from "./atlasRuntimeVisualCompactV198";

const GAS_GIANTS = new Set(["jupiter", "saturn", "uranus", "neptune"]);
const LUNAR_MARS = new Set(["moon", "mars"]);
export function createAtlasRuntimeVisualModel({
  selectedBodyIndex,
  mobile,
  visualEnhance,
  diagnosticsRef,
  staticSummaries = ATLAS_RUNTIME_VISUAL_COMPACT_SUMMARIES_V198,
}: {
  selectedBodyIndex: number | null;
  mobile: boolean;
  visualEnhance: boolean;
  diagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  staticSummaries?: AtlasRuntimeVisualStaticSummariesV198;
}) {
  const s = staticSummaries;
  const selectedBodyDef = selectedBodyIndex === null ? undefined : SOLAR_SYSTEM_BODIES[selectedBodyIndex];
  const selectedBodyVisualId = selectedBodyDef?.id ?? "";
  const selectedBodyVisualTier = selectedBodyDef
    ? hasHdTextureForBodyId(selectedBodyDef.id) ? "selected-hd-local" : "selected-standard-local"
    : "overview";
  const selectedBodyAtmosphereProfile = selectedBodyDef
    ? selectedBodyDef.variant === "sun" ? "solar-corona"
      : selectedBodyDef.atmosphereColor ? selectedBodyDef.id === "earth" ? "earth-cloud-night-atmosphere" : "body-atmosphere-rim"
        : "surface-only"
    : "none";
  const selectedBodyCloseupActive = selectedBodyIndex !== null;
  const selectedBodyLightingProfile: AtlasSelectedBodyLightingProfile = selectedBodyDef
    ? selectedBodyDef.variant === "sun" ? "solar-closeup"
      : selectedBodyDef.id === "earth" ? "earth-night-closeup"
        : LUNAR_MARS.has(selectedBodyDef.id) ? "lunar-mars-closeup"
          : GAS_GIANTS.has(selectedBodyDef.id) ? "gas-giant-closeup" : "terrestrial-closeup"
    : "overview";
  const atlasSkyCloseupProfile = selectedBodyCloseupActive ? s.atlasCinematicLightingSummary.skyCloseupProfile : "overview-layered-deep-space";
  const atlasCinematicCameraProfile = selectedBodyCloseupActive
    ? s.atlasCinematicDeepSpaceCameraSummary.closeupCameraProfile
    : visualEnhance && !mobile ? s.atlasCinematicDeepSpaceCameraSummary.showcaseCameraProfile : s.atlasCinematicDeepSpaceCameraSummary.defaultCameraProfile;
  const closeup = atlasCinematicCameraProfile === "selected-body-cinematic";
  const showcase = atlasCinematicCameraProfile === "showcase-deep-space";
  const atlasCinematicSkyCompositionProfile: AtlasCinematicSkyCompositionProfile = closeup ? "subject-separated-deep-space" : showcase ? "layered-milky-way-showcase" : "layered-atlas-overview";
  const atlasCinematicBackgroundNoiseProfile: AtlasCinematicBackgroundNoiseProfile = closeup ? "closeup-low-noise" : showcase ? "showcase-structured-low-noise" : "atlas-balanced-low-noise";
  const atlasCinematicTargetSeparationProfile: AtlasCinematicTargetSeparationProfile = closeup ? "selected-body-limb-and-negative-space" : showcase ? "showcase-deep-space-band" : "overview-orbit-depth";
  const atlasBackgroundDepthProfile = closeup ? s.atlasUniverseSandboxReferenceBackdropSummary.closeupDepthProfile : showcase ? s.atlasUniverseSandboxReferenceBackdropSummary.showcaseDepthProfile : s.atlasUniverseSandboxReferenceBackdropSummary.defaultDepthProfile;
  const atlasBackgroundSubjectVisibilityProfile: AtlasBackgroundSubjectVisibilityProfile = closeup ? s.atlasUniverseSandboxReferenceBackdropSummary.subjectVisibilityProfile : showcase ? "showcase-subject-separated" : "overview-orbit-readable";
  const atlasReferenceGradeCompositeProfile = closeup ? s.atlasReferenceGradeSpaceArtSummary.closeupCompositeProfile : showcase ? s.atlasReferenceGradeSpaceArtSummary.showcaseCompositeProfile : s.atlasReferenceGradeSpaceArtSummary.defaultCompositeProfile;
  const atlasReferenceGradeSkyLayerProfile = closeup ? s.atlasReferenceGradeSpaceArtSummary.closeupSkyLayerProfile : showcase ? s.atlasReferenceGradeSpaceArtSummary.showcaseSkyLayerProfile : s.atlasReferenceGradeSpaceArtSummary.defaultSkyLayerProfile;
  const atlasReferenceGradeStarfieldProfile = closeup ? s.atlasReferenceGradeSpaceArtSummary.closeupStarfieldProfile : showcase ? s.atlasReferenceGradeSpaceArtSummary.showcaseStarfieldProfile : s.atlasReferenceGradeSpaceArtSummary.defaultStarfieldProfile;
  const atlasReferenceGradeSubjectMatteProfile = closeup ? s.atlasReferenceGradeSpaceArtSummary.closeupSubjectMatteProfile : showcase ? s.atlasReferenceGradeSpaceArtSummary.showcaseSubjectMatteProfile : s.atlasReferenceGradeSpaceArtSummary.defaultSubjectMatteProfile;
  const atlasReferenceGradePlanetMaterialProfile = selectedBodyLightingProfile === "solar-closeup" ? s.atlasReferenceGradeSpaceArtSummary.solarPlanetMaterialProfile : selectedBodyLightingProfile === "gas-giant-closeup" ? s.atlasReferenceGradeSpaceArtSummary.gasGiantPlanetMaterialProfile : selectedBodyCloseupActive ? s.atlasReferenceGradeSpaceArtSummary.closeupPlanetMaterialProfile : s.atlasReferenceGradeSpaceArtSummary.defaultPlanetMaterialProfile;
  const kind = selectedBodyDef?.variant === "sun" ? "solar" : selectedBodyDef?.id === "earth" ? "earth" : selectedBodyDef?.id === "saturn" ? "saturn" : selectedBodyDef && GAS_GIANTS.has(selectedBodyDef.id) ? "gasGiant" : selectedBodyDef && LUNAR_MARS.has(selectedBodyDef.id) ? "lunarMars" : selectedBodyDef ? "terrestrial" : "default";
  const material = s.atlasPlanetaryMaterialCompositionSummary;
  const atlasSelectedBodyMaterialProfile = kind === "solar" ? material.solarMaterialProfile : kind === "earth" ? material.earthMaterialProfile : kind === "saturn" ? material.saturnMaterialProfile : kind === "gasGiant" ? material.gasGiantMaterialProfile : kind === "lunarMars" ? material.lunarMarsMaterialProfile : kind === "terrestrial" ? material.terrestrialMaterialProfile : material.defaultMaterialProfile;
  const atlasSelectedBodyAtmosphereDepthProfile = kind === "solar" ? material.solarAtmosphereProfile : kind === "earth" ? material.earthAtmosphereProfile : kind === "gasGiant" || kind === "saturn" ? material.gasGiantAtmosphereProfile : selectedBodyDef ? material.airlessAtmosphereProfile : material.defaultAtmosphereProfile;
  const atlasSelectedBodyTerminatorProfile = kind === "solar" ? material.solarTerminatorProfile : kind === "earth" ? material.earthTerminatorProfile : kind === "gasGiant" || kind === "saturn" ? material.gasGiantTerminatorProfile : selectedBodyDef ? material.airlessTerminatorProfile : material.defaultTerminatorProfile;
  const atlasSelectedBodyRingProfile = kind === "saturn" ? material.saturnRingProfile : material.defaultRingProfile;
  const closeupDirector = s.atlasCinematicCloseupDirectorSummary;
  const atlasCloseupCompositionProfile = kind === "solar" ? closeupDirector.solarCompositionProfile : kind === "earth" ? closeupDirector.earthCompositionProfile : kind === "saturn" ? closeupDirector.saturnCompositionProfile : kind === "gasGiant" ? closeupDirector.gasGiantCompositionProfile : selectedBodyDef ? closeupDirector.lunarMarsCompositionProfile : closeupDirector.defaultCompositionProfile;
  const atlasCloseupPanelAvoidanceProfile = selectedBodyDef ? mobile ? closeupDirector.mobilePanelAvoidanceProfile : closeupDirector.desktopPanelAvoidanceProfile : closeupDirector.defaultPanelAvoidanceProfile;
  const atlasCloseupRingShowcaseProfile = kind === "saturn" ? closeupDirector.saturnRingShowcaseProfile : closeupDirector.defaultRingShowcaseProfile;
  const keyLight = s.atlasCinematicKeyLightDirectorSummary;
  const atlasSelectedBodyKeyLightProfile = kind === "solar" ? keyLight.solarKeyLightProfile : kind === "earth" ? keyLight.earthKeyLightProfile : kind === "saturn" ? keyLight.saturnKeyLightProfile : kind === "gasGiant" ? keyLight.gasGiantKeyLightProfile : selectedBodyDef ? keyLight.lunarMarsKeyLightProfile : keyLight.defaultKeyLightProfile;
  const depth = s.atlasPlanetaryDepthLightingSummary;
  const atlasSelectedBodyDepthLightingProfile = kind === "solar" ? depth.solarDepthLightingProfile : kind === "earth" ? depth.earthDepthLightingProfile : kind === "saturn" ? depth.saturnDepthLightingProfile : kind === "gasGiant" ? depth.gasGiantDepthLightingProfile : selectedBodyDef ? depth.lunarMarsDepthLightingProfile : depth.defaultDepthLightingProfile;
  const grade = s.atlasPlanetaryColorGradingSummary;
  const atlasSelectedBodyColorGradeProfile = kind === "solar" ? grade.solarColorGradeProfile : kind === "earth" ? grade.earthColorGradeProfile : kind === "saturn" ? grade.saturnColorGradeProfile : kind === "gasGiant" ? grade.gasGiantColorGradeProfile : selectedBodyDef ? grade.lunarMarsColorGradeProfile : grade.defaultColorGradeProfile;
  const art = s.atlasCinematicPlanetaryArtDirectionSummary;
  const atlasSelectedBodyGasGiantArtProfile = kind === "saturn" ? art.saturnGasGiantArtProfile : kind === "gasGiant" ? art.gasGiantArtProfile : art.defaultGasGiantArtProfile;
  const atlasSelectedBodySaturnRingArtProfile = kind === "saturn" ? art.saturnRingArtProfile : art.defaultSaturnRingArtProfile;
  const atlasSelectedBodyEarthCloudNightProfile = kind === "earth" ? art.earthCloudNightProfile : art.defaultEarthCloudNightProfile;
  const atlasSelectedBodySolarSurfaceProfile = kind === "solar" ? art.solarSurfaceProfile : art.defaultSolarSurfaceProfile;
  const atlasGlobalColorGradeProfile = art.globalColorGradeProfile;
  const atlasBackgroundArtGradeProfile = selectedBodyCloseupActive ? art.closeupBackgroundArtGradeProfile : art.defaultBackgroundArtGradeProfile;
  const backdrop = s.atlasCinematicDeepSpaceBackdropSummary;
  const atlasCinematicBackdropStarfieldProfile = selectedBodyCloseupActive ? backdrop.closeupStarfieldProfile : backdrop.starfieldProfile;
  const atlasCinematicBackdropNebulaProfile = selectedBodyCloseupActive ? backdrop.closeupNebulaProfile : backdrop.nebulaProfile;
  const atlasCinematicBackdropNegativeSpaceProfile = selectedBodyCloseupActive ? backdrop.closeupNegativeSpaceProfile : backdrop.negativeSpaceProfile;
  const sparse = s.atlasSparseDeepSpaceDirectorSummary;
  const atlasSparseDeepSpaceStarfieldProfile = selectedBodyCloseupActive ? sparse.closeupStarfieldProfile : sparse.starfieldProfile;
  const atlasSparseDeepSpaceMilkyWayProfile = selectedBodyCloseupActive ? sparse.closeupMilkyWayProfile : sparse.milkyWayProfile;
  const atlasSparseDeepSpaceNebulaProfile = selectedBodyCloseupActive ? sparse.closeupNebulaProfile : sparse.nebulaProfile;
  const atlasSparseDeepSpaceNegativeSpaceProfile = selectedBodyCloseupActive ? sparse.closeupNegativeSpaceProfile : sparse.negativeSpaceProfile;
  const atlasBodyPreviewProfile = selectedBodyDef ? createBodyVisualPreviewProfile(selectedBodyDef) : null;
  const atlasCloseupPreviewSyncStatus = selectedBodyDef && atlasBodyPreviewProfile?.bodyId === selectedBodyVisualId ? "selected-body-synced" : "no-selected-body";
  const atlasCloseupSolarBackdropProfile = kind === "solar" ? s.atlasCloseupPresentationTruthSummary.solarBackdropProfile : "overview-sparse-sky";
  const atlasCloseupPlanetReadabilityProfile = selectedBodyCloseupActive ? s.atlasCloseupPresentationTruthSummary.planetReadabilityProfile : "overview-readable";
  const atlasCloseupReviewMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("review") === "scene" ? s.atlasCloseupPresentationTruthSummary.sceneReviewMode : s.atlasCloseupPresentationTruthSummary.defaultReviewMode;

  return {
    ...s,
    atlasNumericalIntegritySummary: createAtlasNumericalIntegritySummary(diagnosticsRef.current),
    selectedBodyDef, selectedBodyVisualId, selectedBodyVisualTier, selectedBodyAtmosphereProfile,
    selectedBodyCloseupActive, selectedBodyLightingProfile, atlasSkyCloseupProfile,
    atlasCinematicCameraProfile, atlasCinematicSkyCompositionProfile, atlasCinematicBackgroundNoiseProfile,
    atlasCinematicTargetSeparationProfile, atlasBackgroundDepthProfile, atlasBackgroundSubjectVisibilityProfile,
    atlasReferenceGradeCompositeProfile, atlasReferenceGradeSkyLayerProfile, atlasReferenceGradeStarfieldProfile,
    atlasReferenceGradeSubjectMatteProfile, atlasReferenceGradePlanetMaterialProfile, atlasSelectedBodyMaterialProfile,
    atlasSelectedBodyAtmosphereDepthProfile, atlasSelectedBodyTerminatorProfile, atlasSelectedBodyRingProfile,
    atlasCloseupCompositionProfile, atlasCloseupPanelAvoidanceProfile, atlasCloseupRingShowcaseProfile,
    atlasSelectedBodyKeyLightProfile, atlasSelectedBodyDepthLightingProfile, atlasSelectedBodyColorGradeProfile,
    atlasSelectedBodyGasGiantArtProfile, atlasSelectedBodySaturnRingArtProfile,
    atlasSelectedBodyEarthCloudNightProfile, atlasSelectedBodySolarSurfaceProfile, atlasGlobalColorGradeProfile,
    atlasBackgroundArtGradeProfile, atlasCinematicBackdropStarfieldProfile, atlasCinematicBackdropNebulaProfile,
    atlasCinematicBackdropNegativeSpaceProfile, atlasSparseDeepSpaceStarfieldProfile,
    atlasSparseDeepSpaceMilkyWayProfile, atlasSparseDeepSpaceNebulaProfile, atlasSparseDeepSpaceNegativeSpaceProfile,
    atlasBodyPreviewProfile, atlasCloseupPreviewSyncStatus, atlasCloseupSolarBackdropProfile,
    atlasCloseupPlanetReadabilityProfile, atlasCloseupReviewMode,
  };
}
