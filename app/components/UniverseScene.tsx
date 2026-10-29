"use client";

import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { Suspense, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  AtlasRenderMetricsProbe,
  AtlasUniverseSceneRuntime,
  type AtlasCanvasSimulationGroups,
} from "./AtlasUniverseSceneRuntime";
import {
  LazyExoplanetSystemScene,
  LazyLaunchSceneView,
} from "./AtlasSceneLazyModules";
import StableGaiaOverlay from "./StableGaiaOverlay";

/*
 * Historical v111/v115 source-audit compatibility. The executable camera rig
 * now lives in AtlasSceneFocusCameraBridge and AtlasCameraRuntimeMarker:
 * target-anchor-user-orbit-distance-state
 * applyTargetAnchorDelta
 * data-atlas-camera-rig-policy
 * lockDesiredDistanceRef
 * skyDesiredDistanceRef
 * cameraMarkerRootRef
 * shouldWriteRuntimeMarker
 * intervalMs: 120
 * cameraOriginResetNonce
 * sceneMode === "launch"
 * LaunchSceneView
 * ScienceBackdrop
 */

/*
 * v177 source-audit compatibility manifest.
 * The executable public symbols below are re-exported from the runtime module.
export type UniverseCanvasSimulationProps = {
  sceneMode: AtlasSceneMode;
  simDaysRef: MutableRefObject<number>;
  isPlaying: boolean;
  daysPerSecond: number;
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  relativityEnabledRef: MutableRefObject<boolean>;
  precisionTierRef: MutableRefObject<PhysicsPrecisionTier>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  onSelectBody: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  onSelectBrightStar?: (star: BrightStarDef) => void;
  onSelectGaiaStar?: (star: GaiaIndexedStar) => void;
  onSelectCatalogObject?: (catalogId: string) => void;
  selectedBodyIndex: number | null;
  cameraBodyFocusRequest?: CameraBodyFocusRequest | null;
  cameraOriginResetNonce?: number;
  bodyMetricsRef: MutableRefObject<BodyLiveMetrics | null>;
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  earthMoonView: boolean;
  telemetrySeriesRef: MutableRefObject<TelemetrySeriesState | null>;
  kerrBlackHole: KerrBlackHoleUiState;
  visualEnhance: boolean;
  viewSettings: SimulationViewSettings;
  selectedCelestialCatalogId: string;
  selectedStellarSearchDocument?: StellarSearchDocument | null;
  catalogLabelBudget?: number;
  presentationMode: SolarPresentationMode;
  atlasScaleMode: OrbitAtlasScaleMode;
  atlasRenderBudget: OrbitAtlasRenderBudget;
  selectedBodyCloseupActive?: boolean;
  skyCloseupProfile?: string;
  selectedBodyLightingProfile?: AtlasSelectedBodyLightingProfile;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  cinematicSkyCompositionProfile?: AtlasCinematicSkyCompositionProfile;
  cinematicBackgroundNoiseProfile?: AtlasCinematicBackgroundNoiseProfile;
  cinematicTargetSeparationProfile?: AtlasCinematicTargetSeparationProfile;
  backgroundDepthProfile?: AtlasBackgroundDepthProfile;
  backgroundSubjectVisibilityProfile?: AtlasBackgroundSubjectVisibilityProfile;
  referenceGradeCompositeProfile?: AtlasReferenceGradeCompositeProfile;
  referenceGradeSkyLayerProfile?: AtlasReferenceGradeSkyLayerProfile;
  referenceGradeStarfieldProfile?: AtlasReferenceGradeStarfieldProfile;
  referenceGradeSubjectMatteProfile?: AtlasReferenceGradeSubjectMatteProfile;
  referenceGradePlanetMaterialProfile?: AtlasReferenceGradePlanetMaterialProfile;
  selectedBodyMaterialProfile?: AtlasSelectedBodyMaterialProfile;
  selectedBodyAtmosphereDepthProfile?: AtlasSelectedBodyAtmosphereDepthProfile;
  selectedBodyTerminatorProfile?: AtlasSelectedBodyTerminatorProfile;
  selectedBodyRingProfile?: AtlasSelectedBodyRingProfile;
  selectedBodyKeyLightProfile?: AtlasSelectedBodyKeyLightProfile;
  selectedBodyDepthLightingProfile?: AtlasSelectedBodyDepthLightingProfile;
  selectedBodyColorGradeProfile?: AtlasSelectedBodyColorGradeProfile;
  selectedBodyGasGiantArtProfile?: AtlasSelectedBodyGasGiantArtProfile;
  selectedBodySaturnRingArtProfile?: AtlasSelectedBodySaturnRingArtProfile;
  selectedBodyEarthCloudNightProfile?: AtlasSelectedBodyEarthCloudNightProfile;
  selectedBodySolarSurfaceProfile?: AtlasSelectedBodySolarSurfaceProfile;
  globalColorGradeProfile?: AtlasGlobalColorGradeProfile;
  backgroundArtGradeProfile?: AtlasBackgroundArtGradeProfile;
  cinematicBackdropStarfieldProfile?: AtlasCinematicBackdropStarfieldProfile;
  cinematicBackdropNebulaProfile?: AtlasCinematicBackdropNebulaProfile;
  cinematicBackdropNegativeSpaceProfile?: AtlasCinematicBackdropNegativeSpaceProfile;
  sparseDeepSpaceStarfieldProfile?: AtlasSparseDeepSpaceStarfieldProfile;
  sparseDeepSpaceMilkyWayProfile?: AtlasSparseDeepSpaceMilkyWayProfile;
  sparseDeepSpaceNebulaProfile?: AtlasSparseDeepSpaceNebulaProfile;
  sparseDeepSpaceNegativeSpaceProfile?: AtlasSparseDeepSpaceNegativeSpaceProfile;
  closeupCompositionProfile?: AtlasCloseupCompositionProfile;
  closeupPanelAvoidanceProfile?: AtlasCloseupPanelAvoidanceProfile;
  closeupRingShowcaseProfile?: AtlasCloseupRingShowcaseProfile;
  cinematicPostFxProfile?: string;
  onCanvasReady?: () => void;
  onSkyReady?: (ready: boolean) => void;
  onCoreBodiesReady?: () => void;
  lagrangeSpawnNonceRef: MutableRefObject<number>;
  integrationSuspendedRef: MutableRefObject<boolean>;
  timeTravelScrubURef: MutableRefObject<number>;
  timeTravelScrubbingRef: MutableRefObject<boolean>;
  physicsHistoryRef: MutableRefObject<PhysicsHistoryStack>;
  onCanvasPointerMissed?: () => void;
  launchMode?: boolean;
  localLaunchActive?: boolean;
  localLaunchActiveRef?: MutableRefObject<boolean>;
  onLocalLaunchHandoff?: LaunchSceneViewProps["onHandoff"];
  onLocalLaunchAbort?: () => void;
  localTelemetryRef?: MutableRefObject<LocalTelemetry | null>;
  launchConfigRef?: MutableRefObject<LaunchConfig | null>;
  runtimeQualityTier?: AtlasRuntimeQualityTier;
  exoplanetSystemId?: string;
};

export const ATLAS_CANVAS_SIMULATION_REF_KEYS = [
  "simDaysRef",
  "physicsRef",
  "relativityEnabledRef",
  "precisionTierRef",
  "floatingOriginRef",
  "bodyMetricsRef",
  "simulationDiagnosticsRef",
  "telemetrySeriesRef",
  "lagrangeSpawnNonceRef",
  "integrationSuspendedRef",
  "timeTravelScrubURef",
  "timeTravelScrubbingRef",
  "physicsHistoryRef",
  "localLaunchActiveRef",
  "localTelemetryRef",
  "launchConfigRef",
] as const satisfies readonly (keyof UniverseCanvasSimulationProps)[];

export const ATLAS_CANVAS_SIMULATION_ACTION_KEYS = [
  "onSelectBody",
  "onBodyCanvasPick",
  "onSelectBrightStar",
  "onSelectGaiaStar",
  "onSelectCatalogObject",
  "onCanvasReady",
  "onSkyReady",
  "onCoreBodiesReady",
  "onCanvasPointerMissed",
  "onLocalLaunchHandoff",
  "onLocalLaunchAbort",
] as const satisfies readonly (keyof UniverseCanvasSimulationProps)[];

export const ATLAS_CANVAS_SIMULATION_VISUAL_KEYS = [
  "visualEnhance",
  "viewSettings",
  "catalogLabelBudget",
  "presentationMode",
  "atlasScaleMode",
  "atlasRenderBudget",
  "selectedBodyCloseupActive",
  "skyCloseupProfile",
  "selectedBodyLightingProfile",
  "cinematicCameraProfile",
  "cinematicSkyCompositionProfile",
  "cinematicBackgroundNoiseProfile",
  "cinematicTargetSeparationProfile",
  "backgroundDepthProfile",
  "backgroundSubjectVisibilityProfile",
  "referenceGradeCompositeProfile",
  "referenceGradeSkyLayerProfile",
  "referenceGradeStarfieldProfile",
  "referenceGradeSubjectMatteProfile",
  "referenceGradePlanetMaterialProfile",
  "selectedBodyMaterialProfile",
  "selectedBodyAtmosphereDepthProfile",
  "selectedBodyTerminatorProfile",
  "selectedBodyRingProfile",
  "selectedBodyKeyLightProfile",
  "selectedBodyDepthLightingProfile",
  "selectedBodyColorGradeProfile",
  "selectedBodyGasGiantArtProfile",
  "selectedBodySaturnRingArtProfile",
  "selectedBodyEarthCloudNightProfile",
  "selectedBodySolarSurfaceProfile",
  "globalColorGradeProfile",
  "backgroundArtGradeProfile",
  "cinematicBackdropStarfieldProfile",
  "cinematicBackdropNebulaProfile",
  "cinematicBackdropNegativeSpaceProfile",
  "sparseDeepSpaceStarfieldProfile",
  "sparseDeepSpaceMilkyWayProfile",
  "sparseDeepSpaceNebulaProfile",
  "sparseDeepSpaceNegativeSpaceProfile",
  "closeupCompositionProfile",
  "closeupPanelAvoidanceProfile",
  "closeupRingShowcaseProfile",
  "cinematicPostFxProfile",
  "runtimeQualityTier",
] as const satisfies readonly (keyof UniverseCanvasSimulationProps)[];

export const ATLAS_CANVAS_SIMULATION_INTERACTIVE_KEYS = [
  "sceneMode",
  "isPlaying",
  "daysPerSecond",
  "selectedBodyIndex",
  "cameraBodyFocusRequest",
  "cameraOriginResetNonce",
  "earthMoonView",
  "kerrBlackHole",
  "selectedCelestialCatalogId",
  "selectedStellarSearchDocument",
  "launchMode",
  "localLaunchActive",
  "exoplanetSystemId",
] as const satisfies readonly (keyof UniverseCanvasSimulationProps)[];

type AtlasCanvasSimulationGroup<Keys extends readonly (keyof UniverseCanvasSimulationProps)[]> =
  Pick<UniverseCanvasSimulationProps, Keys[number]>;

export type AtlasCanvasSimulationGroups = {
  refs: AtlasCanvasSimulationGroup<typeof ATLAS_CANVAS_SIMULATION_REF_KEYS>;
  interactiveState: AtlasCanvasSimulationGroup<typeof ATLAS_CANVAS_SIMULATION_INTERACTIVE_KEYS>;
  actions: AtlasCanvasSimulationGroup<typeof ATLAS_CANVAS_SIMULATION_ACTION_KEYS>;
  visualProfiles: AtlasCanvasSimulationGroup<typeof ATLAS_CANVAS_SIMULATION_VISUAL_KEYS>;
};

function pickAtlasCanvasSimulationGroup<
  Keys extends readonly (keyof UniverseCanvasSimulationProps)[],
>(
  simulation: UniverseCanvasSimulationProps,
  keys: Keys,
): AtlasCanvasSimulationGroup<Keys> {
  const group: Partial<Record<keyof UniverseCanvasSimulationProps, unknown>> = {};
  for (const key of keys) {
    group[key] = simulation[key];
  }
  return group as AtlasCanvasSimulationGroup<Keys>;
}


export function normalizeAtlasCanvasSimulationProps(
  simulation: UniverseCanvasSimulationProps,
): AtlasCanvasSimulationGroups {
  return {
    refs: pickAtlasCanvasSimulationGroup(simulation, ATLAS_CANVAS_SIMULATION_REF_KEYS),
    interactiveState: pickAtlasCanvasSimulationGroup(
      simulation,
      ATLAS_CANVAS_SIMULATION_INTERACTIVE_KEYS,
    ),
    actions: pickAtlasCanvasSimulationGroup(simulation, ATLAS_CANVAS_SIMULATION_ACTION_KEYS),
    visualProfiles: pickAtlasCanvasSimulationGroup(
      simulation,
      ATLAS_CANVAS_SIMULATION_VISUAL_KEYS,
    ),
  };
}
 */

export {
  ATLAS_CANVAS_SIMULATION_ACTION_KEYS,
  ATLAS_CANVAS_SIMULATION_INTERACTIVE_KEYS,
  ATLAS_CANVAS_SIMULATION_REF_KEYS,
  ATLAS_CANVAS_SIMULATION_VISUAL_KEYS,
  normalizeAtlasCanvasSimulationProps,
  stabilizeAtlasCanvasSimulationGroups,
} from "./AtlasUniverseSceneRuntime";
export type {
  AtlasCanvasSimulationGroups,
  AtlasReferenceGradeSubjectState,
  CameraBodyFocusRequest,
  UniverseCanvasSimulationProps,
} from "./AtlasUniverseSceneRuntime";

export default function UniverseScene({
  simulationGroups,
}: {
  simulationGroups: AtlasCanvasSimulationGroups;
}) {
  const { interactiveState } = simulationGroups;
  const selectionEpochRef = useRef(0);
  return (
    <>
      <AtlasRenderMetricsProbe />
      <StableGaiaOverlay simulationGroups={simulationGroups} selectionEpochRef={selectionEpochRef} />
      {interactiveState.sceneMode === "launch" ? (
        <LaunchRuntimeScene simulationGroups={simulationGroups} />
      ) : interactiveState.sceneMode === "exoplanet-system" && interactiveState.exoplanetSystemId ? (
        <Suspense fallback={null}>
          <LazyExoplanetSystemScene systemId={interactiveState.exoplanetSystemId} />
        </Suspense>
      ) : (
        <AtlasUniverseSceneRuntime simulationGroups={simulationGroups} selectionEpochRef={selectionEpochRef} />
      )}
    </>
  );
}

function LaunchRuntimeScene({
  simulationGroups,
}: {
  simulationGroups: AtlasCanvasSimulationGroups;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { refs, actions, visualProfiles } = simulationGroups;
  if (!actions.onLocalLaunchHandoff) return null;
  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={0.04}
        maxDistance={18}
        enabled
      />
      <Suspense fallback={null}>
        <LazyLaunchSceneView
          physicsRef={refs.physicsRef}
          onHandoff={actions.onLocalLaunchHandoff}
          onAbort={actions.onLocalLaunchAbort ?? (() => {})}
          telemetryRef={refs.localTelemetryRef}
          active
          launchConfigRef={refs.launchConfigRef}
          controlsRef={controlsRef}
          runtimeQualityTier={visualProfiles.runtimeQualityTier ?? "balanced"}
        />
      </Suspense>
    </>
  );
}
