"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { BloomSceneProvider } from "../context/BloomSceneContext";
import { LabelOcclusionProvider } from "../context/LabelOcclusionContext";
import { RelativisticOpticsProvider } from "../context/RelativisticOpticsContext";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { getAtlasResourceSnapshot } from "../lib/atlasResourceLifecycle";
import { useGaiaCatalogSnapshot } from "../lib/gaiaCatalogStore";
import { getGaiaStarIndex } from "../lib/gaiaCatalogIndex";
import { stellarDocumentToGaiaIndex } from "../lib/stellarSearchCatalog";
import { ATLAS_GAIA_STARFIELD_RENDER_BUDGET } from "../lib/atlasGaiaStarfieldEnhancement";
import { TRUE_VOID_CINEMATIC_AMBIENT_INTENSITY, TRUE_VOID_CINEMATIC_HEMISPHERE_INTENSITY } from "../lib/trueVoid";
import SolarSystemIntegrator from "./SolarSystemIntegrator";
import SolarSystemBodies from "./SolarSystemBodies";
import ScienceBackdrop from "./ScienceBackdrop";
import ReferenceOrbitDecor from "./ReferenceOrbitDecor";
import PostProcessingGate from "./PostProcessingGate";
import RelativisticOpticsBridge from "./RelativisticOpticsBridge";
import LagrangePointsViz from "./LagrangePointsViz";
import GalacticScaleField from "./GalacticScaleField";
import GalacticLandmarks from "./GalacticLandmarks";
import MajorStarBeacons from "./MajorStarBeacons";
import ConstellationLines from "./ConstellationLines";
import ConstellationLabels from "./ConstellationLabels";
import GaiaStarOverlay from "./GaiaStarOverlay";
import GaiaStarLabels from "./GaiaStarLabels";
import NebulaMarkers from "./NebulaMarkers";
import StarClusterMarkers from "./StarClusterMarkers";
import PulsarField from "./PulsarField";
import BrightGalaxyMarkers from "./BrightGalaxyMarkers";
import CelestialCatalogFocusMarker from "./CelestialCatalogFocusMarker";
import CelestialCatalogLabels from "./CelestialCatalogLabels";
import SelectedSkyTargetProxy from "./SelectedSkyTargetProxy";
import StellarPickController from "./StellarPickController";
import OrbitAtlasLabels from "./OrbitAtlasLabels";
import AtlasLabelLayoutCoordinator from "./AtlasLabelLayoutCoordinator";
import {
  BrightStarTierBridge,
  CameraFocusBodyBridge,
  CameraZoomBridge,
  CinematicSubjectFramingBridge,
  FloatingOriginBridge,
  GalacticOverlayGate,
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

const DiagnosticsMonitorBridge = lazy(() => import("./AtlasSceneDiagnostics"));

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
}: {
  simulationGroups: AtlasCanvasSimulationGroups;
}) {
  return <AtlasRuntimeScene simulationGroups={simulationGroups} />;
}

export function AtlasRenderMetricsProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const sceneRevision = useAtlasRuntimeStore((snapshot) => snapshot.sceneRevision);
  const rootRef = useRef<HTMLElement | null>(null);
  const lastRef = useRef(0);
  const textureMemoryMbRef = useRef(0);

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
        ?? document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]");
      rootRef.current = root;
      root?.setAttribute("data-atlas-render-texture-audit-revision", String(sceneRevision));
    };

    auditTextures();
    const settledAudit = window.setTimeout(auditTextures, 1200);
    return () => window.clearTimeout(settledAudit);
  }, [scene, sceneRevision]);

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - lastRef.current < 0.2) return;
    lastRef.current = now;
    rootRef.current ??= document.querySelector<HTMLElement>("[data-atlas-browser-acceptance-version]");
    const root = rootRef.current;
    if (!root) return;
    const resources = getAtlasResourceSnapshot();
    root.setAttribute("data-atlas-render-draw-calls", String(gl.info.render.calls));
    root.setAttribute("data-atlas-render-triangles", String(gl.info.render.triangles));
    root.setAttribute("data-atlas-render-programs", String(gl.info.programs?.length ?? 0));
    root.setAttribute("data-atlas-render-textures", String(gl.info.memory.textures));
    root.setAttribute("data-atlas-render-texture-memory-estimate-mb", textureMemoryMbRef.current.toFixed(1));
    root.setAttribute("data-atlas-render-targets", String(resources.gpuRenderTargets));
    const context = gl.getContext();
    const viewport = context.getParameter(context.VIEWPORT) as Int32Array;
    const scissor = context.getParameter(context.SCISSOR_BOX) as Int32Array;
    root.setAttribute("data-atlas-render-viewport", Array.from(viewport).join(","));
    root.setAttribute("data-atlas-render-scissor", Array.from(scissor).join(","));
    root.setAttribute("data-atlas-render-drawing-buffer", `${context.drawingBufferWidth}x${context.drawingBufferHeight}`);
  });
  return null;
}

function AtlasRuntimeScene({ simulationGroups }: { simulationGroups: AtlasCanvasSimulationGroups }) {
  const simulation = useMemo<UniverseCanvasSimulationProps>(() => ({
    ...simulationGroups.refs,
    ...simulationGroups.actions,
    ...simulationGroups.visualProfiles,
    ...simulationGroups.interactiveState,
  }), [simulationGroups.actions, simulationGroups.interactiveState, simulationGroups.refs, simulationGroups.visualProfiles]);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const researchDiagnosticsEnabled = useAtlasRuntimeStore(
    (snapshot) => snapshot.experienceMode === "research",
  );
  const selectionEpochRef = useRef(0);
  const viewportSize = useThree((state) => state.size);
  const gaiaCatalogSnapshot = useGaiaCatalogSnapshot();
  const gaiaBaseIndex = useMemo(
    () =>
      gaiaCatalogSnapshot.catalog
        ? getGaiaStarIndex(gaiaCatalogSnapshot.catalog.stars)
        : [],
    [gaiaCatalogSnapshot.catalog],
  );
  const gaiaIndex = useMemo(() => {
    const supplemental = simulation.selectedStellarSearchDocument;
    if (
      !supplemental ||
      gaiaBaseIndex.some((star) => star.sourceId === supplemental.sourceId)
    ) {
      return gaiaBaseIndex;
    }
    return [stellarDocumentToGaiaIndex(supplemental), ...gaiaBaseIndex];
  }, [gaiaBaseIndex, simulation.selectedStellarSearchDocument]);
  const orbitAtlas = simulation.presentationMode === "orbit-atlas";
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
  const runtimeQualityTier = simulation.runtimeQualityTier ?? "balanced";
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
  const selectedGaiaSourceId = gaiaIndex.find(
    (entry) => entry.id === simulation.selectedCelestialCatalogId,
  )?.sourceId ?? (
    simulation.selectedCelestialCatalogId.startsWith("gaia-dr3:")
      ? simulation.selectedCelestialCatalogId.slice("gaia-dr3:".length)
      : ""
  );
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
  const maxGaiaPickCandidates = ATLAS_GAIA_STARFIELD_RENDER_BUDGET[gaiaOverlayQualityTier];
  const gaiaOverlayCloseupSuppressed =
    !!simulation.selectedBodyCloseupActive || cinematicCameraProfile === "selected-body-cinematic";
  const showGaiaOverlay =
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    simulation.viewSettings.showDeepSkyObjects &&
    (!orbitAtlas || simulation.atlasRenderBudget === "dense");
  const showConstellationOverlay =
    simulation.viewSettings.showConstellationLines && atlasDecorativeOverlayEnabled;
  const showDeepSkyOverlay =
    simulation.viewSettings.showDeepSkyObjects && atlasDecorativeOverlayEnabled;
  const showCatalogLabels =
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    simulation.viewSettings.showCatalogLabels &&
    (!orbitAtlas || simulation.atlasRenderBudget === "dense" || showSelectedCatalogFocus);
  const showSyntheticGalacticScaleField =
    !launchRuntimeActive && !orbitAtlas && simulation.atlasRenderBudget === "dense";

  return (
    <RelativisticOpticsProvider>
      <BloomSceneProvider>
        <AtlasLabelLayoutCoordinator />
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
        <GaiaStarOverlay
          floatingOriginRef={simulation.floatingOriginRef}
          enabled={showGaiaOverlay}
          qualityTier={gaiaOverlayQualityTier}
          closeupSuppressed={gaiaOverlayCloseupSuppressed}
        />
        <GaiaStarLabels
          floatingOriginRef={simulation.floatingOriginRef}
          index={gaiaIndex}
          enabled={showCatalogLabels && showGaiaOverlay}
          selectedSourceId={selectedGaiaSourceId}
          closeupSuppressed={gaiaOverlayCloseupSuppressed}
          onSelectStar={(entry) => {
            selectionEpochRef.current += 1;
            simulation.onSelectGaiaStar?.(entry);
          }}
        />
        <StellarPickController
          floatingOriginRef={simulation.floatingOriginRef}
          gaiaIndex={gaiaIndex}
          gaiaEnabled={showGaiaOverlay && !gaiaOverlayCloseupSuppressed}
          maxGaiaCandidates={maxGaiaPickCandidates}
          selectedGaiaSourceId={selectedGaiaSourceId}
          selectionEpochRef={selectionEpochRef}
          onPickBrightStar={simulation.onSelectBrightStar}
          onPickGaiaStar={simulation.onSelectGaiaStar}
        />
        <SelectedSkyTargetProxy
          selectedCatalogId={simulation.selectedCelestialCatalogId}
          gaiaIndex={gaiaIndex}
          enabled={showSelectedCatalogFocus}
        />
        {!orbitAtlas || showConstellationOverlay || showDeepSkyOverlay || showCatalogLabels || showSelectedCatalogFocus ? (
          <GalacticOverlayGate floatingOriginRef={simulation.floatingOriginRef}>
            {!orbitAtlas ? (
              <>
                {showSyntheticGalacticScaleField ? (
                  <GalacticScaleField floatingOriginRef={simulation.floatingOriginRef} />
                ) : null}
                <GalacticLandmarks floatingOriginRef={simulation.floatingOriginRef} />
                <MajorStarBeacons floatingOriginRef={simulation.floatingOriginRef} />
              </>
            ) : null}
            <ConstellationLines
              floatingOriginRef={simulation.floatingOriginRef}
              enabled={showConstellationOverlay}
              orbitAtlas={orbitAtlas}
              cinematicCameraProfile={cinematicCameraProfile}
              qualityTier={gaiaOverlayQualityTier}
            />
            <ConstellationLabels
              enabled={showConstellationOverlay && showCatalogLabels}
              selectedCatalogId={simulation.selectedCelestialCatalogId}
              closeupSuppressed={gaiaOverlayCloseupSuppressed}
            />
            <NebulaMarkers
              floatingOriginRef={simulation.floatingOriginRef}
              enabled={showDeepSkyOverlay}
              orbitAtlas={orbitAtlas}
              cinematicCameraProfile={cinematicCameraProfile}
              qualityTier={gaiaOverlayQualityTier}
            />
            <StarClusterMarkers
              floatingOriginRef={simulation.floatingOriginRef}
              enabled={showDeepSkyOverlay}
              orbitAtlas={orbitAtlas}
              cinematicCameraProfile={cinematicCameraProfile}
            />
            <BrightGalaxyMarkers
              floatingOriginRef={simulation.floatingOriginRef}
              enabled={showDeepSkyOverlay}
              orbitAtlas={orbitAtlas}
              cinematicCameraProfile={cinematicCameraProfile}
            />
            <PulsarField
              floatingOriginRef={simulation.floatingOriginRef}
              enabled={showDeepSkyOverlay}
              orbitAtlas={orbitAtlas}
            />
            <CelestialCatalogLabels
              floatingOriginRef={simulation.floatingOriginRef}
              enabled={showCatalogLabels || showSelectedCatalogFocus}
              orbitAtlas={orbitAtlas}
              selectedCatalogId={simulation.selectedCelestialCatalogId}
              labelBudget={
                gaiaOverlayQualityTier === "mobile" && typeof simulation.catalogLabelBudget === "number"
                  ? Math.min(simulation.catalogLabelBudget, 4)
                  : simulation.catalogLabelBudget
              }
              onSelectCatalogObject={(catalogId) => {
                selectionEpochRef.current += 1;
                simulation.onSelectCatalogObject?.(catalogId);
              }}
            />
            <CelestialCatalogFocusMarker
              selectedCatalogId={simulation.selectedCelestialCatalogId}
              enabled={showSelectedCatalogFocus}
              orbitAtlas={orbitAtlas}
            />
          </GalacticOverlayGate>
        ) : null}
        <SelectionMetricsBridge selectedBodyIndex={simulation.selectedBodyIndex} physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} bodyMetricsRef={simulation.bodyMetricsRef} />
        <CinematicSubjectFramingBridge selectedBodyIndex={simulation.selectedBodyIndex} physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} presentationMode={simulation.presentationMode} atlasScaleMode={simulation.atlasScaleMode} backgroundSubjectVisibilityProfile={simulation.backgroundSubjectVisibilityProfile} closeupRingShowcaseProfile={closeupRingShowcaseProfile} subjectMatteRef={subjectMatteRef} />
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
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.06} maxDistance={50000} enabled />
        <PresentationCameraBridge presentationMode={simulation.presentationMode} scaleMode={simulation.atlasScaleMode} controlsRef={controlsRef} />
        <CameraFocusBodyBridge physicsRef={simulation.physicsRef} floatingOriginRef={simulation.floatingOriginRef} earthMoonView={simulation.earthMoonView} cameraBodyFocusRequest={simulation.cameraBodyFocusRequest} cameraOriginResetNonce={simulation.cameraOriginResetNonce} controlsRef={controlsRef} presentationMode={simulation.presentationMode} atlasScaleMode={simulation.atlasScaleMode} />
        {simulation.viewSettings.showReferenceOrbits && !showKerrSceneVisual ? (
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
              />
            </Suspense>
          </>
        ) : null}
        <LagrangePointsViz physicsRef={simulation.physicsRef} earthMoonView={simulation.earthMoonView} enabled={!showKerrSceneVisual && simulation.viewSettings.showLagrangePoints} spawnNonceRef={simulation.lagrangeSpawnNonceRef} isPlaying={simulation.isPlaying} daysPerSecond={simulation.daysPerSecond} />
        <LodOrbitControlsBridge floatingOriginRef={simulation.floatingOriginRef} controlsRef={controlsRef} presentationMode={simulation.presentationMode} />
        <CameraZoomBridge controlsRef={controlsRef} />
        {!showKerrSceneVisual ? <LabelOcclusionProvider>
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
                viewSettings={simulation.viewSettings}
                simDaysRef={simulation.simDaysRef}
                presentationMode={simulation.presentationMode}
                atlasScaleMode={simulation.atlasScaleMode}
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
              {orbitAtlas && simulation.viewSettings.showBodyLabels ? <OrbitAtlasLabels physicsRef={simulation.physicsRef} scaleMode={simulation.atlasScaleMode} /> : null}
        </LabelOcclusionProvider> : null}
        <PostProcessingGate
          visualEnhance={simulation.visualEnhance}
          presentationMode={simulation.presentationMode}
          selectedBodyLightingProfile={selectedBodyLightingProfile}
          cinematicPostFxProfile={simulation.cinematicPostFxProfile}
          referenceGradeCompositeProfile={simulation.referenceGradeCompositeProfile}
          globalColorGradeProfile={globalColorGradeProfile}
        />
      </BloomSceneProvider>
    </RelativisticOpticsProvider>
  );
}
