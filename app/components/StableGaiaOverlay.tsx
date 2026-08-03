"use client";

import { lazy, Suspense, useMemo, useRef, type MutableRefObject } from "react";
import { useThree } from "@react-three/fiber";
import type { AtlasCanvasSimulationGroups } from "./AtlasCanvasSimulationContract";
import GaiaStarOverlay from "./GaiaStarOverlay";
import GaiaStarLabels from "./GaiaStarLabels";
import StellarPickController from "./StellarPickController";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET } from "../lib/atlasGaiaStarfieldExpansionV255";
import { useGaiaCatalogSnapshot } from "../lib/gaiaCatalogStore";
import { getGaiaStarIndex } from "../lib/gaiaCatalogIndex";
import { stellarDocumentToGaiaIndex } from "../lib/stellarSearchCatalog";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import AtlasScaleLayerGroupV273 from "./AtlasScaleLayerGroupV273";

const CosmicScaleDataLayerV260 = lazy(() => import("./CosmicScaleDataLayerV260"));


/**
 * Gaia's presentation-only subtree is stable across launch/Kerr scene
 * branches. Scene changes update visibility and budgets, but do not recreate
 * the 46k-row index, HTML labels, pointer controller or InstancedMesh.
 */
export default function StableGaiaOverlay({
  simulationGroups,
  selectionEpochRef: externalSelectionEpochRef,
}: {
  simulationGroups: AtlasCanvasSimulationGroups;
  selectionEpochRef?: MutableRefObject<number>;
}) {
  const { refs, actions, interactiveState, visualProfiles } = simulationGroups;
  const viewportSize = useThree((state) => state.size);
  const catalogSnapshot = useGaiaCatalogSnapshot();
  const scaleBand = useAtlasRuntimeStore((snapshot) => snapshot.scaleBand);
  const scaleJourney = useAtlasRuntimeStore((snapshot) => snapshot.scaleJourney);
  const targetScaleBand = scaleJourney.lifecycle === "transition" ? scaleJourney.to : scaleBand;
  const gaiaBaseIndex = useMemo(
    () => catalogSnapshot.catalog ? getGaiaStarIndex(catalogSnapshot.catalog.stars) : [],
    [catalogSnapshot.catalog],
  );
  const gaiaIndex = useMemo(() => {
    const supplemental = interactiveState.selectedStellarSearchDocument;
    if (!supplemental || gaiaBaseIndex.some((entry) => entry.sourceId === supplemental.sourceId)) {
      return gaiaBaseIndex;
    }
    return [stellarDocumentToGaiaIndex(supplemental), ...gaiaBaseIndex];
  }, [gaiaBaseIndex, interactiveState.selectedStellarSearchDocument]);

  const orbitAtlas = visualProfiles.presentationMode === "orbit-atlas";
  const launchRuntimeActive = Boolean(interactiveState.localLaunchActive);
  const showKerrSceneVisual = Boolean(
    visualProfiles.viewSettings.showKerrBlackHole &&
    !visualProfiles.selectedBodyCloseupActive &&
    !launchRuntimeActive,
  );
  const showSelectedCatalogFocus = interactiveState.selectedCelestialCatalogId !== "";
  const showGaiaOverlay =
    (scaleBand === "solar" || scaleBand === "stellar" || scaleBand === "galactic" || targetScaleBand === "stellar" || targetScaleBand === "galactic") &&
    interactiveState.sceneMode !== "exoplanet-system" &&
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    visualProfiles.viewSettings.showDeepSkyObjects &&
    (!orbitAtlas || visualProfiles.atlasRenderBudget === "dense");
  const gaiaOverlayQualityTier: AtlasGaiaStarfieldEnhancementQualityTier =
    viewportSize.width > 0 && viewportSize.width < 640
      ? "mobile"
      : visualProfiles.atlasRenderBudget === "dense"
        ? "dense"
        : "balanced";
  const gaiaOverlayCloseupSuppressed = Boolean(
    visualProfiles.selectedBodyCloseupActive ||
    visualProfiles.cinematicCameraProfile === "selected-body-cinematic",
  );
  const selectedGaiaSourceId = gaiaIndex.find(
    (entry) => entry.id === interactiveState.selectedCelestialCatalogId,
  )?.sourceId ?? (
    interactiveState.selectedCelestialCatalogId.startsWith("gaia-dr3:")
      ? interactiveState.selectedCelestialCatalogId.slice("gaia-dr3:".length)
      : ""
  );
  const showCatalogLabels =
    !launchRuntimeActive &&
    !showKerrSceneVisual &&
    visualProfiles.viewSettings.showCatalogLabels &&
    (!orbitAtlas || visualProfiles.atlasRenderBudget === "dense" || showSelectedCatalogFocus);
  const localSelectionEpochRef = useRef(0);
  const selectionEpochRef = externalSelectionEpochRef ?? localSelectionEpochRef;
  const maxGaiaPickCandidates = ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET[gaiaOverlayQualityTier];
  const cosmicIntent = targetScaleBand === "local-group" || targetScaleBand === "near-universe"
    || (scaleJourney.lifecycle === "transition" && (
      scaleJourney.from === "local-group" || scaleJourney.to === "local-group"
      || scaleJourney.from === "near-universe" || scaleJourney.to === "near-universe"
    ));

  return (
    <>
      <AtlasScaleLayerGroupV273 band={["solar", "stellar", "galactic"]}>
        <GaiaStarOverlay
          floatingOriginRef={refs.floatingOriginRef}
          enabled={showGaiaOverlay}
          qualityTier={gaiaOverlayQualityTier}
          closeupSuppressed={gaiaOverlayCloseupSuppressed}
          catalogStreamEnabled={targetScaleBand === "stellar" || targetScaleBand === "galactic"}
          selectedSourceId={selectedGaiaSourceId}
        />
        <GaiaStarLabels
          floatingOriginRef={refs.floatingOriginRef}
          index={gaiaIndex}
          enabled={showCatalogLabels && showGaiaOverlay}
          selectedSourceId={selectedGaiaSourceId}
          closeupSuppressed={gaiaOverlayCloseupSuppressed}
          onSelectStar={(entry) => {
            selectionEpochRef.current += 1;
            actions.onSelectGaiaStar?.(entry);
          }}
        />
        <StellarPickController
          floatingOriginRef={refs.floatingOriginRef}
          gaiaIndex={gaiaIndex}
          gaiaEnabled={showGaiaOverlay && !gaiaOverlayCloseupSuppressed}
          maxGaiaCandidates={maxGaiaPickCandidates}
          selectedGaiaSourceId={selectedGaiaSourceId}
          selectionEpochRef={selectionEpochRef}
          onPickBrightStar={actions.onSelectBrightStar}
          onPickGaiaStar={actions.onSelectGaiaStar}
        />
      </AtlasScaleLayerGroupV273>
      {cosmicIntent ? <Suspense fallback={null}><CosmicScaleDataLayerV260 /></Suspense> : null}
    </>
  );
}
