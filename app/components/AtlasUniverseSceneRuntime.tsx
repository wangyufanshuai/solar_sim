"use client";

import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { addAfterEffect, addEffect, useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BloomSceneProvider } from "../context/BloomSceneContext";
import { LabelOcclusionProvider } from "../context/LabelOcclusionContext";
import { RelativisticOpticsProvider } from "../context/RelativisticOpticsContext";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { mainlineAFocusBodyViewSettingsV638, mainlineASolarAnnotationsSuppressedV638 } from "../lib/mainlineAFocusPresentationV638";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { getOptionalTextureRendererCacheSnapshotV594 } from "../lib/useOptionalTexture";
import {
  publishAtlasBrowserObservabilityV294,
  startAtlasBrowserObservabilityResourceBridgeV300,
} from "../lib/atlasBrowserObservabilityV294";
import { TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY, TRUE_VOID_CINEMATIC_HEMISPHERE_INTENSITY } from "../lib/trueVoid";
import SolarSystemIntegrator from "./SolarSystemIntegrator";
import SolarSystemBodies from "./SolarSystemBodies";
import ScienceBackdrop from "./ScienceBackdrop";
import ReferenceOrbitDecor from "./ReferenceOrbitDecor";
import PostProcessingGate from "./PostProcessingGate";
import RelativisticOpticsBridge from "./RelativisticOpticsBridge";
import LagrangePointsViz from "./LagrangePointsViz";
import OrbitAtlasLabels from "./OrbitAtlasLabels";
import AtlasLabelLayoutCoordinator from "./AtlasLabelLayoutCoordinator";
import {
  BrightStarTierBridge,
  CameraFocusBodyBridge,
  CameraZoomBridge,
  CinematicSubjectFramingBridge,
  FloatingOriginBridge,
  LodOrbitControlsBridge,
  PresentationCameraBridge,
  SelectionMetricsBridge,
  type AtlasReferenceGradeSubjectState,
} from "./AtlasSceneCameraBridges";
import type {
  AtlasCanvasSimulationGroups,
  UniverseCanvasSimulationProps,
} from "./AtlasCanvasSimulationContract";
import { LazyKerrBlackHole } from "./AtlasSceneLazyModules";
import KerrCameraFramingBridge from "./KerrCameraFramingBridge";
import ObservationFovOverlayV266 from "./ObservationFovOverlayV266";
import AtlasScaleTransitionBridgeV268 from "./AtlasScaleTransitionBridgeV268";
import AtlasScaleLayerGroupV273 from "./AtlasScaleLayerGroupV273";
import {
  createAtlasPerformanceRingV275,
  pushAtlasPerformanceSampleV275,
  readAtlasPerformanceRingV275,
} from "../lib/atlasPerformanceRingV275";
import { percentile } from "../lib/atlasVisualIntegrationRelease";
import { createAtlasGpuTimerM5, readAtlasWebglRasterMetricsM5 } from "../lib/atlasWebglContextMetricsM5";
import PostV594RelativityExactPresentationNode from "./PostV594RelativityExactPresentationNode";
import V594ExactAbR3fConsumer from "./V594ExactAbR3fConsumer";
import PostV595RelativityExactPresentationNode from "./PostV595RelativityExactPresentationNode";
import V595ExactAbR3fConsumer from "./V595ExactAbR3fConsumer";
import V596VisualCheckpointR3fConsumer from "./V596VisualCheckpointR3fConsumer";
import {
  V594_EXACT_AB_RUNTIME_VERSION,
  type V594ExactAbConsumerReceipt,
} from "../lib/v594ExactAbContract";
import {
  V595_EXACT_AB_RUNTIME_VERSION,
  type V595ExactAbConsumerReceipt,
} from "../lib/v595ExactAbContract";
import {
  V596_VISUAL_CHECKPOINT_RUNTIME_VERSION,
  type V596VisualCheckpointConsumerReceipt,
} from "../lib/v596VisualCheckpointContract";

const DiagnosticsMonitorBridge = lazy(() => import("./AtlasSceneDiagnostics"));
const AtlasDeepSpacePresentationSubtreeV275 = lazy(() => import("./AtlasDeepSpacePresentationSubtreeV275"));
const AtlasSolarSkyPrimerV286 = lazy(() => import("./AtlasSolarSkyPrimerV286"));

export {
  ATLAS_CANVAS_SIMULATION_ACTION_KEYS,
  ATLAS_CANVAS_SIMULATION_INTERACTIVE_KEYS,
  ATLAS_CANVAS_SIMULATION_REF_KEYS,
  ATLAS_CANVAS_SIMULATION_VISUAL_KEYS,
  normalizeAtlasCanvasSimulationProps,
  stabilizeAtlasCanvasSimulationGroups,
} from "./AtlasCanvasSimulationContract";
export type {
  AtlasCanvasSimulationGroups,
  CameraBodyFocusRequest,
  UniverseCanvasSimulationProps,
} from "./AtlasCanvasSimulationContract";
export type { AtlasReferenceGradeSubjectState } from "./AtlasSceneCameraBridges";

export function AtlasUniverseSceneRuntime({
  simulationGroups,
  selectionEpochRef: externalSelectionEpochRef,
}: {
  simulationGroups: AtlasCanvasSimulationGroups;
  selectionEpochRef?: MutableRefObject<number>;
}) {
  return <AtlasRuntimeScene simulationGroups={simulationGroups} selectionEpochRef={externalSelectionEpochRef} />;
}

export function AtlasRenderMetricsProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const sceneRevision = useAtlasRuntimeStore((snapshot) => snapshot.sceneRevision);
  const rootRef = useRef<HTMLElement | null>(null);
  const lastRef = useRef(0);
  const textureMemoryMbRef = useRef(0);
  const r3fFrameRingRef = useRef(createAtlasPerformanceRingV275(720));
  const gpuFrameRingRef = useRef(createAtlasPerformanceRingV275(240));
  const lastFrameMsRef = useRef<number | null>(null);
  const gpuTimerStatusRef = useRef("unavailable-no-disjoint-query");

  useEffect(() => {
    const auditTextures = () => {
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          for (const value of Object.values(material)) {
            if (value instanceof THREE.Texture) textures.add(value);
          }
        }
      });
      let bytes = 0;
      textures.forEach((texture) => {
        const image = texture.image as { width?: number; height?: number } | undefined;
        const width = image?.width ?? 0;
        const height = image?.height ?? 0;
        if (width > 0 && height > 0) bytes += width * height * 4 * 1.333;
      });
      textureMemoryMbRef.current = bytes / (1024 * 1024);
      const root = rootRef.current
        ?? document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]")
        ?? document.querySelector<HTMLElement>("[data-atlas-v594-lifecycle-root]");
      rootRef.current = root;
      root?.setAttribute("data-atlas-render-texture-audit-revision", String(sceneRevision));
      root?.setAttribute("data-atlas-scene-revision-v294", String(sceneRevision));
    };

    auditTextures();
    const settledAudit = window.setTimeout(auditTextures, 1200);
    return () => window.clearTimeout(settledAudit);
  }, [scene, sceneRevision]);

  useEffect(() => {
    if (!gl.capabilities.isWebGL2) return;
    const context = gl.getContext() as WebGL2RenderingContext;
    const timer = createAtlasGpuTimerM5(context, gl.domElement, {
      sample: (milliseconds) => pushAtlasPerformanceSampleV275(gpuFrameRingRef.current, milliseconds),
      reset: () => { gpuFrameRingRef.current = createAtlasPerformanceRingV275(240); },
      status: (status) => { gpuTimerStatusRef.current = status; },
    });
    const releaseBefore = addEffect(timer.before);
    const releaseAfter = addAfterEffect(timer.after);
    return () => {
      releaseBefore();
      releaseAfter();
      timer.dispose();
    };
  }, [gl]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const nowMs = now * 1000;
    if (lastFrameMsRef.current !== null) {
      pushAtlasPerformanceSampleV275(r3fFrameRingRef.current, nowMs - lastFrameMsRef.current);
    }
    lastFrameMsRef.current = nowMs;
    if (now - lastRef.current < 0.2) return;
    lastRef.current = now;
    rootRef.current ??= document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]")
      ?? document.querySelector<HTMLElement>("[data-atlas-v594-lifecycle-root]");
    const root = rootRef.current;
    if (!root) return;
    const raster = readAtlasWebglRasterMetricsM5(gl.getContext());
    const rendererReady = raster.status === "ready";
    const resources = getAtlasResourceSnapshot();
    const optionalTextures = getOptionalTextureRendererCacheSnapshotV594(gl);
    root.setAttribute("data-atlas-render-context-status", raster.status);
    root.setAttribute("data-atlas-render-draw-calls", rendererReady ? String(gl.info.render.calls) : "unavailable");
    root.setAttribute("data-atlas-render-triangles", rendererReady ? String(gl.info.render.triangles) : "unavailable");
    root.setAttribute("data-atlas-render-programs", rendererReady ? String(gl.info.programs?.length ?? 0) : "unavailable");
    root.setAttribute("data-atlas-render-textures", rendererReady ? String(gl.info.memory.textures) : "unavailable");
    root.setAttribute("data-atlas-render-texture-memory-estimate-mb", textureMemoryMbRef.current.toFixed(1));
    root.setAttribute("data-atlas-render-targets", String(resources.gpuRenderTargets));
    root.setAttribute("data-atlas-render-resource-estimated-bytes", String(resources.estimatedBytes));
    root.setAttribute("data-atlas-render-resource-estimated-gpu-bytes", String(resources.estimatedGpuBytes));
    for (const markerRoot of [
      root,
      document.querySelector<HTMLElement>("[data-atlas-app-shell]"),
    ]) {
      markerRoot?.setAttribute("data-atlas-optional-texture-cache-status", optionalTextures.status);
      markerRoot?.setAttribute("data-atlas-optional-texture-cache-entries", String(optionalTextures.entries));
      markerRoot?.setAttribute("data-atlas-optional-texture-cache-pending", String(optionalTextures.pending));
      markerRoot?.setAttribute("data-atlas-optional-texture-cache-retained", String(optionalTextures.retainedTextures));
      markerRoot?.setAttribute("data-atlas-optional-texture-cache-registered", String(optionalTextures.registeredTextures));
    }
    const r3fFrames = readAtlasPerformanceRingV275(r3fFrameRingRef.current);
    root.setAttribute("data-atlas-render-r3f-frame-p50-ms", percentile(r3fFrames, 0.5).toFixed(1));
    root.setAttribute("data-atlas-render-r3f-frame-p95-ms", percentile(r3fFrames, 0.95).toFixed(1));
    root.setAttribute("data-atlas-render-r3f-frame-samples", String(r3fFrames.length));
    const gpuFrames = readAtlasPerformanceRingV275(gpuFrameRingRef.current);
    root.setAttribute("data-atlas-render-gpu-frame-p50-ms", rendererReady && gpuFrames.length > 0 ? percentile(gpuFrames, 0.5).toFixed(2) : "unavailable");
    root.setAttribute("data-atlas-render-gpu-frame-p95-ms", rendererReady && gpuFrames.length > 0 ? percentile(gpuFrames, 0.95).toFixed(2) : "unavailable");
    root.setAttribute("data-atlas-render-gpu-frame-samples", String(gpuFrames.length));
    root.setAttribute("data-atlas-render-gpu-timer", gpuTimerStatusRef.current);
    root.setAttribute("data-atlas-render-viewport", raster.viewport);
    root.setAttribute("data-atlas-render-scissor", raster.scissor);
    root.setAttribute("data-atlas-render-drawing-buffer", raster.drawingBuffer);
  });
  return null;
}

function AtlasRuntimeScene({
  simulationGroups,
  selectionEpochRef: externalSelectionEpochRef,
}: {
  simulationGroups: AtlasCanvasSimulationGroups;
  selectionEpochRef?: MutableRefObject<number>;
}) {
  const simulation = useMemo<UniverseCanvasSimulationProps>(() => ({
    ...simulationGroups.refs,
    ...simulationGroups.actions,
    ...simulationGroups.visualProfiles,
    ...simulationGroups.interactiveState,
  }), [simulationGroups.actions, simulationGroups.interactiveState, simulationGroups.refs, simulationGroups.visualProfiles]);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const researchDiagnosticsEnabled = useAtlasRuntimeStore(
    (snapshot) => snapshot.panels.sessions["relativity-observables"].isOpen
      || snapshot.panels.sessions["kerr-lab"].isOpen
      || snapshot.panels.sessions["observational-astrophysics"].isOpen,
  );
  const scaleBand = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const researchOverlay = useAtlasRuntimeStore((snapshot) => snapshot.researchOverlay);
  const visualProfile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  const localSelectionEpochRef = useRef(0);
  const selectionEpochRef = externalSelectionEpochRef ?? localSelectionEpochRef;
  const viewportSize = useThree((state) => state.size);
  const orbitAtlas = simulation.presentationMode === "orbit-atlas";
  const exactAbRequest = simulation.exactAbRequest;
  const visualCheckpointRequest = simulation.visualCheckpointRequest;
  const captureRequestActive = Boolean(exactAbRequest || visualCheckpointRequest);
  const selectedBodyLightingProfile = simulation.selectedBodyLightingProfile ?? "overview";
  const cinematicCameraProfile = simulation.cinematicCameraProfile ?? "overview-atlas";
  const cinematicBackgroundNoiseProfile =
    simulation.cinematicBackgroundNoiseProfile ?? "atlas-balanced-low-noise";
  const backgroundDepthProfile =
    simulation.backgroundDepthProfile ?? "overview-sparse-layered-milky-way";
  const referenceGradeSkyLayerProfile =
    simulation.referenceGradeSkyLayerProfile ?? "v48-local-generated-layered-sky";
  const referenceGradeStarfieldProfile =
    simulation.referenceGradeStarfieldProfile ?? "sparse-primary-stars";
  const referenceGradeSubjectMatteProfile =
    simulation.referenceGradeSubjectMatteProfile ?? "overview-no-subject-matte";
  const referenceGradePlanetMaterialProfile =
    simulation.referenceGradePlanetMaterialProfile ?? "overview-local-hd";
  const selectedBodyMaterialProfile =
    simulation.selectedBodyMaterialProfile ?? "overview-local-material";
  const selectedBodyAtmosphereDepthProfile =
    simulation.selectedBodyAtmosphereDepthProfile ?? "overview-atmosphere";
  const selectedBodyTerminatorProfile =
    simulation.selectedBodyTerminatorProfile ?? "overview-terminator";
  const selectedBodyRingProfile =
    simulation.selectedBodyRingProfile ?? "no-ring-profile";
  const selectedBodyKeyLightProfile =
    simulation.selectedBodyKeyLightProfile ?? "overview-natural-phase";
  const selectedBodyDepthLightingProfile =
    simulation.selectedBodyDepthLightingProfile ?? "overview-no-depth-lighting";
  const selectedBodyColorGradeProfile =
    simulation.selectedBodyColorGradeProfile ?? "overview-neutral-color";
  const selectedBodyGasGiantArtProfile =
    simulation.selectedBodyGasGiantArtProfile ?? "overview-no-gas-giant-art";
  const selectedBodySaturnRingArtProfile =
    simulation.selectedBodySaturnRingArtProfile ?? "no-ring-art-profile";
  const selectedBodyEarthCloudNightProfile =
    simulation.selectedBodyEarthCloudNightProfile ?? "overview-no-earth-cloud-night-art";
  const selectedBodySolarSurfaceProfile =
    simulation.selectedBodySolarSurfaceProfile ?? "overview-no-solar-surface-art";
  const globalColorGradeProfile =
    simulation.globalColorGradeProfile ?? "overview-neutral-grade";
  const backgroundArtGradeProfile =
    simulation.backgroundArtGradeProfile ?? "overview-balanced-starfield";
  const cinematicBackdropStarfieldProfile =
    simulation.cinematicBackdropStarfieldProfile ?? "sparse-primary-stars-faint-distant-field";
  const cinematicBackdropNebulaProfile =
    simulation.cinematicBackdropNebulaProfile ?? "soft-local-nebula-haze-layer";
  const cinematicBackdropNegativeSpaceProfile =
    simulation.cinematicBackdropNegativeSpaceProfile ?? "layered-milky-way-negative-space";
  const sparseDeepSpaceStarfieldProfile =
    simulation.sparseDeepSpaceStarfieldProfile ?? "sparse-primary-stars-ultrafaint-distant-field";
  const sparseDeepSpaceMilkyWayProfile =
    simulation.sparseDeepSpaceMilkyWayProfile ?? "deep-cold-gray-blue-dark-lanes";
  const sparseDeepSpaceNebulaProfile =
    simulation.sparseDeepSpaceNebulaProfile ?? "barely-visible-local-haze";
  const sparseDeepSpaceNegativeSpaceProfile =
    simulation.sparseDeepSpaceNegativeSpaceProfile ?? "overview-wide-negative-space";
  const closeupCompositionProfile =
    simulation.closeupCompositionProfile ?? "overview-no-closeup-director";
  const closeupRingShowcaseProfile =
    simulation.closeupRingShowcaseProfile ?? "no-ring-showcase";
  const subjectMatteRef = useRef<AtlasReferenceGradeSubjectState>({
    active: false,
    inFrame: false,
    x: 0.5,
    y: 0.5,
    radius: 0,
  });
  const showSelectedCatalogFocus = simulation.selectedCelestialCatalogId !== "";
  const atlasCloseupBudgetActive = orbitAtlas && !!simulation.selectedBodyCloseupActive;
  const launchRuntimeActive = !!simulation.localLaunchActive;
  const showKerrSceneVisual =
    simulation.viewSettings.showKerrBlackHole &&
    !simulation.selectedBodyCloseupActive &&
    !launchRuntimeActive;
  const atlasDecorativeOverlayEnabled =
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    (!orbitAtlas || (simulation.atlasRenderBudget === "dense" && !atlasCloseupBudgetActive));
  const gaiaOverlayQualityTier: AtlasGaiaStarfieldEnhancementQualityTier =
    viewportSize.width > 0 && viewportSize.width < 640
      ? "mobile"
      : simulation.atlasRenderBudget === "dense"
        ? "dense"
        : "balanced";
  const gaiaOverlayCloseupSuppressed =
    !!simulation.selectedBodyCloseupActive || cinematicCameraProfile === "selected-body-cinematic";
  // Solar Html labels do not inherit the Three scale group's visibility.
  // Keep the bodies mounted and derive annotation visibility from the live focus.
  const solarAnnotationsSuppressed = useAtlasRuntimeStore((snapshot) => mainlineASolarAnnotationsSuppressedV638(snapshot, {
    selectedCatalogId: simulation.selectedCelestialCatalogId,
    sceneMode: simulation.sceneMode,
    researchDiagnosticsActive: researchDiagnosticsEnabled,
    captureActive: captureRequestActive,
    launchActive: launchRuntimeActive || !!simulation.launchMode,
    kerrActive: simulation.viewSettings.showKerrBlackHole,
    closeupActive: gaiaOverlayCloseupSuppressed || simulation.earthMoonView,
  }));
  const solarBodyViewSettings = useMemo(
    () => mainlineAFocusBodyViewSettingsV638(simulation.viewSettings, solarAnnotationsSuppressed),
    [simulation.viewSettings, solarAnnotationsSuppressed],
  );
  const showConstellationOverlay =
    simulation.viewSettings.showConstellationLines &&
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    !gaiaOverlayCloseupSuppressed &&
    (atlasDecorativeOverlayEnabled || scaleBand === "stellar" || scaleBand === "galactic");
  const showDeepSkyOverlay =
    simulation.viewSettings.showDeepSkyObjects && atlasDecorativeOverlayEnabled;
  const showCatalogLabels =
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    simulation.viewSettings.showCatalogLabels &&
    (!orbitAtlas || simulation.atlasRenderBudget === "dense" || showSelectedCatalogFocus);
  const showSyntheticGalacticScaleField =
    !launchRuntimeActive && !orbitAtlas && simulation.atlasRenderBudget === "dense";
  const deepSpaceIntent =
    orbitAtlas ||
    scaleBand !== "solar" ||
    researchOverlay !== "none" ||
    showConstellationOverlay ||
    showDeepSkyOverlay ||
    showCatalogLabels ||
    showSelectedCatalogFocus ||
    simulation.selectedStellarSearchDocument != null;
  const strongGravityRenderMode = showKerrSceneVisual
    ? simulation.kerrBlackHole.strongGravityRenderMode ?? "cinematic"
    : "inactive";
  const postFxPolicy = strongGravityRenderMode === "science"
    ? "science-bypassed"
    : strongGravityRenderMode === "cinematic"
      ? "cinematic-enabled"
      : "scene-default";
  useEffect(() => {
    publishAtlasBrowserObservabilityV294({ deepSpaceIntent, visualProfile, strongGravityRenderMode, postFxPolicy });
  }, [deepSpaceIntent, postFxPolicy, strongGravityRenderMode, visualProfile]);
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-atlas-app-shell]");
    return root ? startAtlasBrowserObservabilityResourceBridgeV300(root) : undefined;
  }, []);

  return (
    <RelativisticOpticsProvider>
      <BloomSceneProvider>
        <AtlasLabelLayoutCoordinator />
        <ObservationFovOverlayV266 />
        <ambientLight intensity={TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY} />
        <hemisphereLight intensity={TRUE_VOID_CINEMATIC_HEMISPHERE_INTENSITY} groundColor="#020204" color="#17223a" />
        <RelativisticOpticsBridge daysPerSecond={simulation.daysPerSecond} relativityEnabledRef={simulation.relativityEnabledRef} viewSettings={simulation.viewSettings} />
        <FloatingOriginBridge floatingOriginRef={simulation.floatingOriginRef} />
        <BrightStarTierBridge floatingOriginRef={simulation.floatingOriginRef}>
          {(tier2) => (
            <ScienceBackdrop
              floatingOriginRef={simulation.floatingOriginRef}
              brightStarTier2={tier2}
              presentationMode={simulation.presentationMode}
              renderBudget={simulation.atlasRenderBudget}
              closeupActive={!!simulation.selectedBodyCloseupActive}
              skyCloseupProfile={simulation.skyCloseupProfile}
              selectedBodyLightingProfile={selectedBodyLightingProfile}
              cinematicCameraProfile={cinematicCameraProfile}
              cinematicBackgroundNoiseProfile={cinematicBackgroundNoiseProfile}
              backgroundDepthProfile={backgroundDepthProfile}
              referenceGradeSkyLayerProfile={referenceGradeSkyLayerProfile}
              referenceGradeStarfieldProfile={referenceGradeStarfieldProfile}
              referenceGradeSubjectMatteProfile={referenceGradeSubjectMatteProfile}
              backgroundArtGradeProfile={backgroundArtGradeProfile}
              globalColorGradeProfile={globalColorGradeProfile}
              cinematicBackdropStarfieldProfile={cinematicBackdropStarfieldProfile}
              cinematicBackdropNebulaProfile={cinematicBackdropNebulaProfile}
              cinematicBackdropNegativeSpaceProfile={cinematicBackdropNegativeSpaceProfile}
              sparseDeepSpaceStarfieldProfile={sparseDeepSpaceStarfieldProfile}
              sparseDeepSpaceMilkyWayProfile={sparseDeepSpaceMilkyWayProfile}
              sparseDeepSpaceNebulaProfile={sparseDeepSpaceNebulaProfile}
              sparseDeepSpaceNegativeSpaceProfile={sparseDeepSpaceNegativeSpaceProfile}
              subjectMatteRef={subjectMatteRef}
              onSkyReady={simulation.onSkyReady}
            />
          )}
        </BrightStarTierBridge>
        {!orbitAtlas ? (
          <Suspense fallback={null}>
            <AtlasSolarSkyPrimerV286 floatingOriginRef={simulation.floatingOriginRef} />
          </Suspense>
        ) : null}
        {deepSpaceIntent ? (
          <Suspense fallback={null}>
            <AtlasDeepSpacePresentationSubtreeV275
              simulation={simulation}
              selectionEpochRef={selectionEpochRef}
              orbitAtlas={orbitAtlas}
              qualityTier={gaiaOverlayQualityTier}
              showConstellationOverlay={showConstellationOverlay}
              showDeepSkyOverlay={showDeepSkyOverlay}
              showCatalogLabels={showCatalogLabels}
              showSelectedCatalogFocus={showSelectedCatalogFocus}
              showSyntheticGalacticScaleField={showSyntheticGalacticScaleField}
              closeupSuppressed={gaiaOverlayCloseupSuppressed}
            />
          </Suspense>
        ) : null}
        <SelectionMetricsBridge selectedBodyIndex={simulation.selectedBodyIndex} physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} bodyMetricsRef={simulation.bodyMetricsRef} />
        {!captureRequestActive ? <CinematicSubjectFramingBridge selectedBodyIndex={simulation.selectedBodyIndex} physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} presentationMode={simulation.presentationMode} atlasScaleMode={simulation.atlasScaleMode} backgroundSubjectVisibilityProfile={simulation.backgroundSubjectVisibilityProfile} closeupRingShowcaseProfile={closeupRingShowcaseProfile} subjectMatteRef={subjectMatteRef} /> : null}
        {researchDiagnosticsEnabled ? (
          <Suspense fallback={null}>
            <DiagnosticsMonitorBridge
              physicsRef={simulation.physicsRef}
              simDaysRef={simulation.simDaysRef}
              selectedBodyIndex={simulation.selectedBodyIndex}
              relativityEnabledRef={simulation.relativityEnabledRef}
              kerrBlackHole={simulation.kerrBlackHole}
              simulationDiagnosticsRef={simulation.simulationDiagnosticsRef}
            />
          </Suspense>
        ) : null}
        <SolarSystemIntegrator physicsRef={simulation.physicsRef} simDaysRef={simulation.simDaysRef} isPlaying={simulation.isPlaying} daysPerSecond={simulation.daysPerSecond} relativityEnabledRef={simulation.relativityEnabledRef} precisionTierRef={simulation.precisionTierRef} integrationSuspendedRef={simulation.integrationSuspendedRef} localLaunchActiveRef={simulation.localLaunchActiveRef} floatingOriginRef={simulation.floatingOriginRef} />
        <OrbitControls ref={controlsRef} makeDefault enableDamping={!captureRequestActive} dampingFactor={0.06} maxDistance={50000} enabled={!captureRequestActive} />
        {!captureRequestActive ? <PresentationCameraBridge presentationMode={simulation.presentationMode} scaleMode={simulation.atlasScaleMode} controlsRef={controlsRef} /> : null}
        {!captureRequestActive ? <AtlasScaleTransitionBridgeV268 controlsRef={controlsRef} /> : null}
        {!captureRequestActive ? <CameraFocusBodyBridge physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} earthMoonView={simulation.earthMoonView} cameraBodyFocusRequest={simulation.cameraBodyFocusRequest} cameraOriginResetNonce={simulation.cameraOriginResetNonce} controlsRef={controlsRef} presentationMode={simulation.presentationMode} atlasScaleMode={simulation.atlasScaleMode} /> : null}
        {simulation.viewSettings.showReferenceOrbits && !showKerrSceneVisual && !solarAnnotationsSuppressed ? (
          <ReferenceOrbitDecor
            presentationMode={simulation.presentationMode}
            scaleMode={simulation.atlasScaleMode}
            renderBudget={simulation.atlasRenderBudget}
            atlasInspectActive={orbitAtlas && simulation.selectedBodyIndex !== null}
            closeupOrbitBudgetActive={atlasCloseupBudgetActive}
            selectedBodyId={simulation.selectedBodyIndex != null ? SOLAR_SYSTEM_BODIES[simulation.selectedBodyIndex]?.id : undefined}
          />
        ) : null}
        {showKerrSceneVisual ? (
          <>
            <KerrCameraFramingBridge controlsRef={controlsRef} />
            <Suspense fallback={null}>
              <LazyKerrBlackHole
                massSolar={simulation.kerrBlackHole.massSolar}
                aOverM={simulation.kerrBlackHole.aOverM}
                impactParameterM={simulation.kerrBlackHole.impactParameterM}
                orbitPresetId={simulation.kerrBlackHole.orbitPresetId}
                highlightTrackKind={simulation.kerrBlackHole.highlightTrackKind}
                frameDragTeachingScale={simulation.kerrBlackHole.frameDragTeachingScale}
                renderMode={simulation.kerrBlackHole.renderMode}
                isPlaying={simulation.isPlaying}
                daysPerSecond={simulation.daysPerSecond}
                rayTraceQuality={simulation.kerrBlackHole.rayTraceQuality ?? "interactive"}
                strongGravityRenderMode={simulation.kerrBlackHole.strongGravityRenderMode ?? "cinematic"}
              />
            </Suspense>
          </>
        ) : null}
        <LagrangePointsViz physicsRef={simulation.physicsRef} earthMoonView={simulation.earthMoonView} enabled={!showKerrSceneVisual && simulation.viewSettings.showLagrangePoints} spawnNonceRef={simulation.lagrangeSpawnNonceRef} isPlaying={simulation.isPlaying} daysPerSecond={simulation.daysPerSecond} />
        {!captureRequestActive ? <LodOrbitControlsBridge floatingOriginRef={simulation.floatingOriginRef} controlsRef={controlsRef} presentationMode={simulation.presentationMode} /> : null}
        {!captureRequestActive ? <CameraZoomBridge controlsRef={controlsRef} /> : null}
        {!showKerrSceneVisual ? <AtlasScaleLayerGroupV273 band="solar"><LabelOcclusionProvider>
              <SolarSystemBodies
                physicsRef={simulation.physicsRef}
                floatingOriginRef={simulation.floatingOriginRef}
                onSelectBody={(bodyIndex) => {
                  selectionEpochRef.current += 1;
                  simulation.onSelectBody(bodyIndex);
                }}
                onBodyCanvasPick={(bodyIndex) => {
                  selectionEpochRef.current += 1;
                  simulation.onBodyCanvasPick(bodyIndex);
                }}
                selectedBodyIndex={simulation.selectedBodyIndex}
                earthMoonView={simulation.earthMoonView}
                viewSettings={solarBodyViewSettings}
                simDaysRef={simulation.simDaysRef}
                presentationMode={simulation.presentationMode}
                atlasScaleMode={simulation.atlasScaleMode}
                resourceSceneMode={simulation.sceneMode}
                closeupOrbitBudgetActive={atlasCloseupBudgetActive}
                selectedBodyLightingProfile={selectedBodyLightingProfile}
                referenceGradePlanetMaterialProfile={referenceGradePlanetMaterialProfile}
                selectedBodyMaterialProfile={selectedBodyMaterialProfile}
                selectedBodyAtmosphereDepthProfile={selectedBodyAtmosphereDepthProfile}
                selectedBodyTerminatorProfile={selectedBodyTerminatorProfile}
                selectedBodyRingProfile={selectedBodyRingProfile}
                selectedBodyKeyLightProfile={selectedBodyKeyLightProfile}
                selectedBodyDepthLightingProfile={selectedBodyDepthLightingProfile}
                selectedBodyColorGradeProfile={selectedBodyColorGradeProfile}
                selectedBodyGasGiantArtProfile={selectedBodyGasGiantArtProfile}
                selectedBodySaturnRingArtProfile={selectedBodySaturnRingArtProfile}
                selectedBodyEarthCloudNightProfile={selectedBodyEarthCloudNightProfile}
                selectedBodySolarSurfaceProfile={selectedBodySolarSurfaceProfile}
                globalColorGradeProfile={globalColorGradeProfile}
                closeupCompositionProfile={closeupCompositionProfile}
                closeupRingShowcaseProfile={closeupRingShowcaseProfile}
                onReady={simulation.onCoreBodiesReady}
              />
              {orbitAtlas && simulation.viewSettings.showBodyLabels && !solarAnnotationsSuppressed ? <OrbitAtlasLabels physicsRef={simulation.physicsRef} scaleMode={simulation.atlasScaleMode} /> : null}
        </LabelOcclusionProvider></AtlasScaleLayerGroupV273> : null}
        {exactAbRequest?.version === V594_EXACT_AB_RUNTIME_VERSION
        && exactAbRequest.frame.archetype === "relativity-workbench" ? (
          <PostV594RelativityExactPresentationNode request={exactAbRequest} />
        ) : null}
        {exactAbRequest?.version === V595_EXACT_AB_RUNTIME_VERSION
        && exactAbRequest.frame.archetype === "relativity-workbench" ? (
          <PostV595RelativityExactPresentationNode request={exactAbRequest} />
        ) : null}
        {exactAbRequest?.version === V594_EXACT_AB_RUNTIME_VERSION
        && simulation.onExactAbReceipt ? (
          <V594ExactAbR3fConsumer
            request={exactAbRequest}
            controlsRef={controlsRef}
            onReceipt={simulation.onExactAbReceipt as (receipt: V594ExactAbConsumerReceipt) => void}
          />
        ) : null}
        {exactAbRequest?.version === V595_EXACT_AB_RUNTIME_VERSION
        && simulation.onExactAbReceipt ? (
          <V595ExactAbR3fConsumer
            request={exactAbRequest}
            controlsRef={controlsRef}
            onReceipt={simulation.onExactAbReceipt as (receipt: V595ExactAbConsumerReceipt) => void}
          />
        ) : null}
        {visualCheckpointRequest?.version === V596_VISUAL_CHECKPOINT_RUNTIME_VERSION
        && simulation.onVisualCheckpointReceipt ? (
          <V596VisualCheckpointR3fConsumer
            request={visualCheckpointRequest}
            controlsRef={controlsRef}
            onReceipt={simulation.onVisualCheckpointReceipt as (
              receipt: V596VisualCheckpointConsumerReceipt
            ) => void}
          />
        ) : null}
        <PostProcessingGate
          visualEnhance={simulation.visualEnhance}
          presentationMode={simulation.presentationMode}
          selectedBodyLightingProfile={selectedBodyLightingProfile}
          cinematicPostFxProfile={simulation.cinematicPostFxProfile}
          referenceGradeCompositeProfile={simulation.referenceGradeCompositeProfile}
          globalColorGradeProfile={globalColorGradeProfile}
          scienceDisplayMode={showKerrSceneVisual && (simulation.kerrBlackHole.strongGravityRenderMode ?? "cinematic") === "science"}
        />
      </BloomSceneProvider>
    </RelativisticOpticsProvider>
  );
}
