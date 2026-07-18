import type { MutableRefObject } from "react";
import type { BrightStarDef } from "../data/brightStarCatalog";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { PhysicsHistoryStack } from "../lib/physicsHistoryStack";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type { AtlasBackgroundArtGradeProfile, AtlasBackgroundDepthProfile, AtlasBackgroundSubjectVisibilityProfile, AtlasCinematicBackdropNebulaProfile, AtlasCinematicBackdropNegativeSpaceProfile, AtlasCinematicBackdropStarfieldProfile, AtlasCinematicBackgroundNoiseProfile, AtlasCinematicCameraProfile, AtlasCinematicSkyCompositionProfile, AtlasCinematicTargetSeparationProfile, AtlasCloseupCompositionProfile, AtlasCloseupPanelAvoidanceProfile, AtlasCloseupRingShowcaseProfile, AtlasGlobalColorGradeProfile, AtlasReferenceGradeCompositeProfile, AtlasReferenceGradePlanetMaterialProfile, AtlasReferenceGradeSkyLayerProfile, AtlasReferenceGradeStarfieldProfile, AtlasReferenceGradeSubjectMatteProfile, AtlasRuntimeQualityTier, AtlasSelectedBodyAtmosphereDepthProfile, AtlasSelectedBodyColorGradeProfile, AtlasSelectedBodyDepthLightingProfile, AtlasSelectedBodyEarthCloudNightProfile, AtlasSelectedBodyGasGiantArtProfile, AtlasSelectedBodyKeyLightProfile, AtlasSelectedBodyLightingProfile, AtlasSelectedBodyMaterialProfile, AtlasSelectedBodyRingProfile, AtlasSelectedBodySaturnRingArtProfile, AtlasSelectedBodySolarSurfaceProfile, AtlasSelectedBodyTerminatorProfile, AtlasSparseDeepSpaceMilkyWayProfile, AtlasSparseDeepSpaceNebulaProfile, AtlasSparseDeepSpaceNegativeSpaceProfile, AtlasSparseDeepSpaceStarfieldProfile, SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";
import type { AtlasSceneMode } from "../lib/atlasRuntimeSceneFocusPerformance";
import type { LaunchConfig } from "../lib/launchTelemetryTypes";
import type { LocalTelemetry } from "../lib/localLaunchPhysics";
import type { OrbitAtlasRenderBudget, OrbitAtlasScaleMode, SolarPresentationMode } from "../lib/orbitAtlasPresentation";
import type { GaiaIndexedStar } from "../lib/gaiaCatalogIndex";
import type { StellarSearchDocument } from "../lib/stellarSearchCatalog";
import type { KerrBlackHoleUiState } from "./KerrBlackHolePanel";
import type { LaunchSceneViewProps } from "./LaunchSceneView";
import type { CameraBodyFocusRequest } from "./AtlasSceneCameraBridges";

export type { CameraBodyFocusRequest } from "./AtlasSceneCameraBridges";

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

/** Normalizes the public flat contract into internal scene responsibility groups. */
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

function shallowEqualAtlasCanvasGroup(
  left: Readonly<Record<string, unknown>>,
  right: Readonly<Record<string, unknown>>,
): boolean {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(
    (key) => Object.is(left[key], right[key]),
  );
}

/** Retains unchanged responsibility groups so unrelated scene subtrees remain memo-safe. */
export function stabilizeAtlasCanvasSimulationGroups(
  previous: AtlasCanvasSimulationGroups | null,
  next: AtlasCanvasSimulationGroups,
): AtlasCanvasSimulationGroups {
  if (!previous) return next;
  const refs = shallowEqualAtlasCanvasGroup(previous.refs, next.refs) ? previous.refs : next.refs;
  const actions = shallowEqualAtlasCanvasGroup(previous.actions, next.actions)
    ? previous.actions
    : next.actions;
  const visualProfiles = shallowEqualAtlasCanvasGroup(
    previous.visualProfiles,
    next.visualProfiles,
  ) ? previous.visualProfiles : next.visualProfiles;
  const interactiveState = shallowEqualAtlasCanvasGroup(
    previous.interactiveState,
    next.interactiveState,
  ) ? previous.interactiveState : next.interactiveState;
  if (
    refs === previous.refs &&
    actions === previous.actions &&
    visualProfiles === previous.visualProfiles &&
    interactiveState === previous.interactiveState
  ) return previous;
  return { refs, actions, visualProfiles, interactiveState };
}
