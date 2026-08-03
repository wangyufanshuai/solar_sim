"use client";

import AtlasSceneHost from "./AtlasSceneHost";
import type {
  AtlasRuntimeLaunchDomain,
  AtlasRuntimeNavigationFocusDomain,
  AtlasRuntimeSceneDomain,
  AtlasRuntimeShellHudDomain,
  AtlasRuntimeTimelinePhysicsDomain,
} from "./atlasRuntimeWorkbenchDomains";

export default function AtlasRuntimeSceneLayer({
  scene,
  shellHud,
  navigationFocus,
  launch,
  timelinePhysics,
}: {
  scene: AtlasRuntimeSceneDomain;
  shellHud: AtlasRuntimeShellHudDomain;
  navigationFocus: AtlasRuntimeNavigationFocusDomain;
  launch: AtlasRuntimeLaunchDomain;
  timelinePhysics: AtlasRuntimeTimelinePhysicsDomain;
}) {
  const {
    atlasSceneMode, orbitAtlas,
    atlasPerformanceBudgetSummary, presentation, selectedBodyCloseupActive,
    atlasSkyCloseupProfile, selectedBodyLightingProfile, atlasCinematicCameraProfile,
    atlasCinematicSkyCompositionProfile, atlasCinematicBackgroundNoiseProfile,
    atlasCinematicTargetSeparationProfile, atlasBackgroundDepthProfile,
    atlasBackgroundSubjectVisibilityProfile, atlasReferenceGradeCompositeProfile,
    atlasReferenceGradeSkyLayerProfile, atlasReferenceGradeStarfieldProfile,
    atlasReferenceGradeSubjectMatteProfile, atlasReferenceGradePlanetMaterialProfile,
    atlasSelectedBodyMaterialProfile, atlasSelectedBodyAtmosphereDepthProfile,
    atlasSelectedBodyTerminatorProfile, atlasSelectedBodyRingProfile,
    atlasSelectedBodyKeyLightProfile, atlasSelectedBodyDepthLightingProfile,
    atlasSelectedBodyColorGradeProfile, atlasSelectedBodyGasGiantArtProfile,
    atlasSelectedBodySaturnRingArtProfile, atlasSelectedBodyEarthCloudNightProfile,
    atlasSelectedBodySolarSurfaceProfile, atlasGlobalColorGradeProfile,
    atlasBackgroundArtGradeProfile, atlasCinematicBackdropStarfieldProfile,
    atlasCinematicBackdropNebulaProfile, atlasCinematicBackdropNegativeSpaceProfile,
    atlasSparseDeepSpaceStarfieldProfile, atlasSparseDeepSpaceMilkyWayProfile,
    atlasSparseDeepSpaceNebulaProfile, atlasSparseDeepSpaceNegativeSpaceProfile,
    atlasCloseupCompositionProfile, atlasCloseupPanelAvoidanceProfile,
    atlasCloseupRingShowcaseProfile, atlasCinematicLightingSummary, handleCanvasReady,
    setSkyReady, handleCoreBodiesReady, lagrangeSpawnNonceRef, atlasRuntimeQualityTier,
    kerrBlackHole,
  } = scene;
  const { visualEnhance, viewSettings } = shellHud;
  const {
    selectedExoplanetSystemId, selectedCelestialCatalogId, selectedBodyIndex,
    selectedStellarSearchDocument, onSelectBody, onAtlasBodyCanvasPick, onBodyCanvasPick,
    onBrightStarFocus, requestGaiaStarFocus, requestCatalogObjectFocus, cameraBodyFocusRequest,
    cameraOriginResetNonce, earthMoonView, clearFocusLock,
  } = navigationFocus;
  const {
    launchMode, localLaunchActive, localLaunchActiveRef, handleLocalLaunchHandoff,
    handleLaunchAbort, localTelemetryRef, launchConfigRef,
  } = launch;
  const {
    simDaysRef, isPlaying, daysPerSecond, physicsRef, relativityEnabledRef,
    precisionTierRef, floatingOriginRef, bodyMetricsRef, simulationDiagnosticsRef,
    telemetrySeriesRef, integrationSuspendedRef, timeTravelScrubURef,
    timeTravelScrubbingRef, physicsHistoryRef,
  } = timelinePhysics;

  return (
    <div className="absolute inset-0 touch-none" data-atlas-runtime-domain="scene-overlay">
      <AtlasSceneHost
        simulation={{
          sceneMode: atlasSceneMode,
          exoplanetSystemId: selectedExoplanetSystemId,
          simDaysRef,
          isPlaying,
          daysPerSecond,
          physicsRef,
          relativityEnabledRef,
          precisionTierRef,
          floatingOriginRef,
          onSelectBody,
          onBodyCanvasPick: orbitAtlas ? onAtlasBodyCanvasPick : onBodyCanvasPick,
          onSelectBrightStar: onBrightStarFocus,
          onSelectGaiaStar: requestGaiaStarFocus,
          onSelectCatalogObject: requestCatalogObjectFocus,
          selectedBodyIndex,
          cameraBodyFocusRequest,
          cameraOriginResetNonce,
          bodyMetricsRef,
          simulationDiagnosticsRef,
          earthMoonView,
          telemetrySeriesRef,
          kerrBlackHole,
          visualEnhance,
          viewSettings,
          selectedCelestialCatalogId,
          selectedStellarSearchDocument,
          catalogLabelBudget: atlasPerformanceBudgetSummary.deepSkyLabelBudget,
          presentationMode: presentation.presentationMode,
          atlasScaleMode: presentation.scaleMode,
          atlasRenderBudget: presentation.renderBudget,
          selectedBodyCloseupActive,
          skyCloseupProfile: atlasSkyCloseupProfile,
          selectedBodyLightingProfile,
          cinematicCameraProfile: atlasCinematicCameraProfile,
          cinematicSkyCompositionProfile: atlasCinematicSkyCompositionProfile,
          cinematicBackgroundNoiseProfile: atlasCinematicBackgroundNoiseProfile,
          cinematicTargetSeparationProfile: atlasCinematicTargetSeparationProfile,
          backgroundDepthProfile: atlasBackgroundDepthProfile,
          backgroundSubjectVisibilityProfile: atlasBackgroundSubjectVisibilityProfile,
          referenceGradeCompositeProfile: atlasReferenceGradeCompositeProfile,
          referenceGradeSkyLayerProfile: atlasReferenceGradeSkyLayerProfile,
          referenceGradeStarfieldProfile: atlasReferenceGradeStarfieldProfile,
          referenceGradeSubjectMatteProfile: atlasReferenceGradeSubjectMatteProfile,
          referenceGradePlanetMaterialProfile: atlasReferenceGradePlanetMaterialProfile,
          selectedBodyMaterialProfile: atlasSelectedBodyMaterialProfile,
          selectedBodyAtmosphereDepthProfile: atlasSelectedBodyAtmosphereDepthProfile,
          selectedBodyTerminatorProfile: atlasSelectedBodyTerminatorProfile,
          selectedBodyRingProfile: atlasSelectedBodyRingProfile,
          selectedBodyKeyLightProfile: atlasSelectedBodyKeyLightProfile,
          selectedBodyDepthLightingProfile: atlasSelectedBodyDepthLightingProfile,
          selectedBodyColorGradeProfile: atlasSelectedBodyColorGradeProfile,
          selectedBodyGasGiantArtProfile: atlasSelectedBodyGasGiantArtProfile,
          selectedBodySaturnRingArtProfile: atlasSelectedBodySaturnRingArtProfile,
          selectedBodyEarthCloudNightProfile: atlasSelectedBodyEarthCloudNightProfile,
          selectedBodySolarSurfaceProfile: atlasSelectedBodySolarSurfaceProfile,
          globalColorGradeProfile: atlasGlobalColorGradeProfile,
          backgroundArtGradeProfile: atlasBackgroundArtGradeProfile,
          cinematicBackdropStarfieldProfile: atlasCinematicBackdropStarfieldProfile,
          cinematicBackdropNebulaProfile: atlasCinematicBackdropNebulaProfile,
          cinematicBackdropNegativeSpaceProfile: atlasCinematicBackdropNegativeSpaceProfile,
          sparseDeepSpaceStarfieldProfile: atlasSparseDeepSpaceStarfieldProfile,
          sparseDeepSpaceMilkyWayProfile: atlasSparseDeepSpaceMilkyWayProfile,
          sparseDeepSpaceNebulaProfile: atlasSparseDeepSpaceNebulaProfile,
          sparseDeepSpaceNegativeSpaceProfile: atlasSparseDeepSpaceNegativeSpaceProfile,
          closeupCompositionProfile: atlasCloseupCompositionProfile,
          closeupPanelAvoidanceProfile: atlasCloseupPanelAvoidanceProfile,
          closeupRingShowcaseProfile: atlasCloseupRingShowcaseProfile,
          cinematicPostFxProfile: atlasCinematicLightingSummary.postFxProfile,
          onCanvasReady: handleCanvasReady,
          onSkyReady: setSkyReady,
          onCoreBodiesReady: handleCoreBodiesReady,
          lagrangeSpawnNonceRef,
          integrationSuspendedRef,
          timeTravelScrubURef,
          timeTravelScrubbingRef,
          physicsHistoryRef,
          onCanvasPointerMissed: clearFocusLock,
          launchMode,
          localLaunchActive,
          localLaunchActiveRef,
          onLocalLaunchHandoff: handleLocalLaunchHandoff,
          onLocalLaunchAbort: handleLaunchAbort,
          localTelemetryRef,
          launchConfigRef,
          runtimeQualityTier: atlasRuntimeQualityTier,
        }}
      />
    </div>
  );
}
