"use client";

import { useEffect, useMemo } from "react";

import {
  createCelestialCatalogSummary,
  createCelestialObjectPassport,
  createCelestialVisualLayerSummary,
} from "./celestialCatalog";
import { createAtlasPerformanceBudgetSummary } from "./atlasPerformanceBudget";
import { useGaiaCatalogSource } from "./gaiaCatalogSourceState";
import { ensureGaiaCatalogLoaded, useGaiaCatalogSnapshot } from "./gaiaCatalogStore";
import { gaiaIndexedStarToCatalogEntry, getGaiaStarIndex } from "./gaiaCatalogIndex";
import type {
  OrbitAtlasRenderBudget,
  OrbitAtlasScaleMode,
  SolarPresentationMode,
} from "./orbitAtlasPresentation";
import type { SimulationViewSettings } from "./simulationViewSettings";
import { stellarDocumentToGaiaIndex, type StellarSearchDocument } from "./stellarSearchCatalog";

type UseAtlasWorkbenchCatalogDomainArgs = {
  selectedCelestialCatalogId: string;
  selectedStellarSearchDocument: StellarSearchDocument | null;
  viewSettings: SimulationViewSettings;
  orbitAtlas: boolean;
  mobile: boolean;
  viewportWidth: number;
  devicePixelRatio: number;
  presentationMode: SolarPresentationMode;
  scaleMode: OrbitAtlasScaleMode;
  renderBudget: OrbitAtlasRenderBudget;
  workbenchOpen: boolean;
  canvasReady: boolean;
  skyReady: boolean;
  coreBodiesReady: boolean;
  readinessFallback: boolean;
  visualEnhance: boolean;
};

export function useAtlasWorkbenchCatalogDomain({
  selectedCelestialCatalogId,
  selectedStellarSearchDocument,
  viewSettings,
  orbitAtlas,
  mobile,
  viewportWidth,
  devicePixelRatio,
  presentationMode,
  scaleMode,
  renderBudget,
  workbenchOpen,
  canvasReady,
  skyReady,
  coreBodiesReady,
  readinessFallback,
  visualEnhance,
}: UseAtlasWorkbenchCatalogDomainArgs) {
  const gaiaCatalogSource = useGaiaCatalogSource();
  const gaiaCatalogSnapshot = useGaiaCatalogSnapshot();
  const gaiaIndex = useMemo(
    () => gaiaCatalogSnapshot.catalog ? getGaiaStarIndex(gaiaCatalogSnapshot.catalog.stars) : [],
    [gaiaCatalogSnapshot.catalog],
  );
  const gaiaIndexBySourceId = useMemo(
    () => new Map(gaiaIndex.map((entry) => [entry.sourceId, entry])),
    [gaiaIndex],
  );
  const gaiaIndexById = useMemo(
    () => new Map(gaiaIndex.map((entry) => [entry.id, entry])),
    [gaiaIndex],
  );

  useEffect(() => {
    const requestedPresentation = new URLSearchParams(window.location.search).get("presentation");
    const orbitAtlasIntent = requestedPresentation === "orbitAtlas" || requestedPresentation === "orbit-atlas"
      ? true
      : requestedPresentation === "sandbox"
        ? false
        : orbitAtlas;
    const catalogIntent = orbitAtlasIntent || workbenchOpen || selectedStellarSearchDocument !== null ||
      selectedCelestialCatalogId.startsWith("gaia-dr3:");
    if (catalogIntent) void ensureGaiaCatalogLoaded();
  }, [orbitAtlas, selectedCelestialCatalogId, selectedStellarSearchDocument, workbenchOpen]);

  const celestialCatalogSummary = useMemo(() => createCelestialCatalogSummary(), []);
  const celestialObjectPassport = useMemo(() => {
    const selectedSearchIndex = selectedStellarSearchDocument
      ? stellarDocumentToGaiaIndex(selectedStellarSearchDocument)
      : null;
    const sourceId = selectedCelestialCatalogId.startsWith("gaia-dr3:")
      ? selectedCelestialCatalogId.slice("gaia-dr3:".length)
      : null;
    const effectiveIndexed = gaiaIndexById.get(selectedCelestialCatalogId)
      ?? (sourceId ? gaiaIndexBySourceId.get(sourceId) : null)
      ?? (selectedSearchIndex?.id === selectedCelestialCatalogId ? selectedSearchIndex : null);
    return effectiveIndexed
      ? createCelestialObjectPassport(gaiaIndexedStarToCatalogEntry(effectiveIndexed))
      : createCelestialObjectPassport(selectedCelestialCatalogId);
  }, [gaiaIndexById, gaiaIndexBySourceId, selectedCelestialCatalogId, selectedStellarSearchDocument]);

  const celestialCatalogLayerState = useMemo(
    () => [
      `constellations:${viewSettings.showConstellationLines ? "on" : "off"}`,
      `deep-sky:${viewSettings.showDeepSkyObjects ? "on" : "off"}`,
      `labels:${viewSettings.showCatalogLabels ? "on" : "off"}`,
    ].join(";"),
    [
      viewSettings.showConstellationLines,
      viewSettings.showDeepSkyObjects,
      viewSettings.showCatalogLabels,
    ],
  );

  const prePerformanceCelestialVisualLayerSummary = useMemo(
    () => createCelestialVisualLayerSummary({
      selectedCatalogId: selectedCelestialCatalogId,
      showConstellations: viewSettings.showConstellationLines,
      showDeepSkyObjects: viewSettings.showDeepSkyObjects,
      showCatalogLabels: viewSettings.showCatalogLabels,
      orbitAtlas,
      mobile,
    }),
    [
      mobile,
      orbitAtlas,
      selectedCelestialCatalogId,
      viewSettings.showCatalogLabels,
      viewSettings.showConstellationLines,
      viewSettings.showDeepSkyObjects,
    ],
  );

  const atlasPerformanceBudgetSummary = useMemo(
    () => createAtlasPerformanceBudgetSummary({
      presentationMode,
      scaleMode,
      renderBudget,
      viewportWidth,
      devicePixelRatio,
      showDeepSkyObjects: viewSettings.showDeepSkyObjects,
      showCatalogLabels: viewSettings.showCatalogLabels,
      catalogLabelCount: prePerformanceCelestialVisualLayerSummary.labelCount,
      showKerrBlackHole: viewSettings.showKerrBlackHole,
      workbenchOpen,
      canvasReady,
      skyReady,
      coreBodiesReady,
      readinessFallback,
      visualEnhance,
    }),
    [
      canvasReady,
      coreBodiesReady,
      devicePixelRatio,
      prePerformanceCelestialVisualLayerSummary.labelCount,
      presentationMode,
      readinessFallback,
      renderBudget,
      scaleMode,
      skyReady,
      viewSettings.showCatalogLabels,
      viewSettings.showDeepSkyObjects,
      viewSettings.showKerrBlackHole,
      viewportWidth,
      visualEnhance,
      workbenchOpen,
    ],
  );

  const celestialVisualLayerSummary = useMemo(
    () => createCelestialVisualLayerSummary({
      selectedCatalogId: selectedCelestialCatalogId,
      showConstellations: viewSettings.showConstellationLines,
      showDeepSkyObjects: viewSettings.showDeepSkyObjects,
      showCatalogLabels: viewSettings.showCatalogLabels,
      orbitAtlas,
      mobile,
      labelBudget: atlasPerformanceBudgetSummary.deepSkyLabelBudget,
    }),
    [
      atlasPerformanceBudgetSummary.deepSkyLabelBudget,
      mobile,
      orbitAtlas,
      selectedCelestialCatalogId,
      viewSettings.showCatalogLabels,
      viewSettings.showConstellationLines,
      viewSettings.showDeepSkyObjects,
    ],
  );

  return {
    gaiaCatalogSource,
    gaiaIndex,
    gaiaIndexBySourceId,
    celestialCatalogSummary,
    celestialObjectPassport,
    celestialCatalogLayerState,
    celestialVisualLayerSummary,
    atlasPerformanceBudgetSummary,
  };
}
