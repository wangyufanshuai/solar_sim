"use client";

import { useMemo, type MutableRefObject } from "react";
import type { AtlasGaiaStarfieldEnhancementQualityTier } from "../lib/simulationDiagnosticsTypes";
import { getGaiaStarIndex } from "../lib/gaiaCatalogIndex";
import { useGaiaCatalogSnapshot } from "../lib/gaiaCatalogStore";
import { stellarDocumentToGaiaIndex } from "../lib/stellarSearchCatalog";
import type { UniverseCanvasSimulationProps } from "./AtlasCanvasSimulationContract";
import {
  GalacticOverlayGate,
} from "./AtlasSceneCameraBridges";
import AtlasScaleLayerGroupV273 from "./AtlasScaleLayerGroupV273";
import BrightGalaxyMarkers from "./BrightGalaxyMarkers";
import CelestialCatalogFocusMarker from "./CelestialCatalogFocusMarker";
import CelestialCatalogLabels from "./CelestialCatalogLabels";
import ConstellationLabels from "./ConstellationLabels";
import ConstellationLines from "./ConstellationLines";
import GalacticScaleField from "./GalacticScaleField";
import NebulaMarkers from "./NebulaMarkers";
import PulsarField from "./PulsarField";
import SelectedSkyTargetProxy from "./SelectedSkyTargetProxy";
import StarClusterMarkers from "./StarClusterMarkers";

export type AtlasDeepSpacePresentationPropsV275 = {
  simulation: UniverseCanvasSimulationProps;
  selectionEpochRef: MutableRefObject<number>;
  orbitAtlas: boolean;
  qualityTier: AtlasGaiaStarfieldEnhancementQualityTier;
  showConstellationOverlay: boolean;
  showDeepSkyOverlay: boolean;
  showCatalogLabels: boolean;
  showSelectedCatalogFocus: boolean;
  showSyntheticGalacticScaleField: boolean;
  closeupSuppressed: boolean;
};

/** Presentation-only deep-space chunk. It owns no physics state and never creates a Canvas. */
export default function AtlasDeepSpacePresentationSubtreeV275({
  simulation,
  selectionEpochRef,
  orbitAtlas,
  qualityTier,
  showConstellationOverlay,
  showDeepSkyOverlay,
  showCatalogLabels,
  showSelectedCatalogFocus,
  showSyntheticGalacticScaleField,
  closeupSuppressed,
}: AtlasDeepSpacePresentationPropsV275) {
  const catalogSnapshot = useGaiaCatalogSnapshot();
  const baseIndex = useMemo(
    () => catalogSnapshot.catalog ? getGaiaStarIndex(catalogSnapshot.catalog.stars) : [],
    [catalogSnapshot.catalog],
  );
  const gaiaIndex = useMemo(() => {
    const supplemental = simulation.selectedStellarSearchDocument;
    if (!supplemental || baseIndex.some((star) => star.sourceId === supplemental.sourceId)) return baseIndex;
    return [stellarDocumentToGaiaIndex(supplemental), ...baseIndex];
  }, [baseIndex, simulation.selectedStellarSearchDocument]);

  return (
    <AtlasScaleLayerGroupV273 band={["solar", "stellar", "galactic"]}>
      <SelectedSkyTargetProxy
        selectedCatalogId={simulation.selectedCelestialCatalogId}
        gaiaIndex={gaiaIndex}
        enabled={showSelectedCatalogFocus}
      />
      <GalacticOverlayGate floatingOriginRef={simulation.floatingOriginRef}>
        {!orbitAtlas ? (
          <>
            {showSyntheticGalacticScaleField ? <GalacticScaleField floatingOriginRef={simulation.floatingOriginRef} /> : null}
          </>
        ) : null}
        <ConstellationLines
          floatingOriginRef={simulation.floatingOriginRef}
          enabled={showConstellationOverlay}
          orbitAtlas={orbitAtlas}
          cinematicCameraProfile={simulation.cinematicCameraProfile ?? "overview-atlas"}
          qualityTier={qualityTier}
          asterismEnabled={qualityTier !== "mobile" && !closeupSuppressed}
        />
        <ConstellationLabels
          enabled={showConstellationOverlay && showCatalogLabels}
          selectedCatalogId={simulation.selectedCelestialCatalogId}
          closeupSuppressed={closeupSuppressed}
        />
        <NebulaMarkers
          floatingOriginRef={simulation.floatingOriginRef}
          enabled={showDeepSkyOverlay}
          orbitAtlas={orbitAtlas}
          cinematicCameraProfile={simulation.cinematicCameraProfile ?? "overview-atlas"}
          qualityTier={qualityTier}
        />
        <StarClusterMarkers
          floatingOriginRef={simulation.floatingOriginRef}
          enabled={showDeepSkyOverlay}
          orbitAtlas={orbitAtlas}
          cinematicCameraProfile={simulation.cinematicCameraProfile ?? "overview-atlas"}
        />
        <BrightGalaxyMarkers
          floatingOriginRef={simulation.floatingOriginRef}
          enabled={showDeepSkyOverlay}
          orbitAtlas={orbitAtlas}
          cinematicCameraProfile={simulation.cinematicCameraProfile ?? "overview-atlas"}
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
          labelBudget={qualityTier === "mobile" && typeof simulation.catalogLabelBudget === "number"
            ? Math.min(simulation.catalogLabelBudget, 4)
            : simulation.catalogLabelBudget}
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
    </AtlasScaleLayerGroupV273>
  );
}
