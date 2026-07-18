"use client";

import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react";
import type { CameraBodyFocusRequest } from "../components/UniverseScene";
import { preloadAtlasSceneModule } from "../components/AtlasSceneLazyModules";
import type { GaiaIndexedStar } from "./gaiaCatalogIndex";
import {
  useAtlasFocusController,
  type AtlasFocusControllerResult,
  type AtlasFocusNavigationActions,
} from "./useAtlasFocusController";
import type { StellarSearchDocument } from "./stellarSearchCatalog";

export type AtlasWorkbenchFocusDomainOptions = {
  selectedBodyIndex: number | null;
  selectedCelestialCatalogId: string;
  selectedStellarSearchDocument: StellarSearchDocument | null;
  selectedExoplanetSystemId: string;
  cameraBodyFocusRequest: CameraBodyFocusRequest | null;
  gaiaIndexBySourceId: ReadonlyMap<string, GaiaIndexedStar>;
  orbitAtlas: boolean;
  atlasWorkbenchOpen: boolean;
  panelSurfaceActivated: boolean;
  setSelectedBodyIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedCelestialCatalogId: Dispatch<SetStateAction<string>>;
  setSelectedStellarSearchDocument: Dispatch<SetStateAction<StellarSearchDocument | null>>;
  setSelectedExoplanetSystemId: Dispatch<SetStateAction<string>>;
  setCameraBodyFocusRequest: Dispatch<SetStateAction<CameraBodyFocusRequest | null>>;
  setEarthMoonView: Dispatch<SetStateAction<boolean>>;
  closeOrbitAnalysis: () => void;
  openSearch: () => void;
  navigation: AtlasFocusNavigationActions;
};

export function useAtlasWorkbenchFocusDomain({
  selectedBodyIndex,
  selectedCelestialCatalogId,
  selectedStellarSearchDocument,
  selectedExoplanetSystemId,
  cameraBodyFocusRequest,
  gaiaIndexBySourceId,
  orbitAtlas,
  atlasWorkbenchOpen,
  panelSurfaceActivated,
  setSelectedBodyIndex,
  setSelectedCelestialCatalogId,
  setSelectedStellarSearchDocument,
  setSelectedExoplanetSystemId,
  setCameraBodyFocusRequest,
  setEarthMoonView,
  closeOrbitAnalysis,
  openSearch,
  navigation,
}: AtlasWorkbenchFocusDomainOptions): AtlasFocusControllerResult {
  const state = useMemo(() => ({
    selectedBodyIndex,
    selectedCelestialCatalogId,
    selectedStellarSearchDocument,
    selectedExoplanetSystemId,
    cameraBodyFocusRequest,
  }), [
    cameraBodyFocusRequest,
    selectedBodyIndex,
    selectedCelestialCatalogId,
    selectedExoplanetSystemId,
    selectedStellarSearchDocument,
  ]);
  const setExoplanetSystem = useCallback((next: SetStateAction<string>) => {
    setSelectedExoplanetSystemId((current) => {
      const systemId = typeof next === "function" ? next(current) : next;
      if (systemId) void preloadAtlasSceneModule("exoplanet-system");
      return systemId;
    });
  }, [setSelectedExoplanetSystemId]);
  const setters = useMemo(() => ({
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedStellarSearchDocument,
    setSelectedExoplanetSystemId: setExoplanetSystem,
    setCameraBodyFocusRequest,
    setEarthMoonView,
  }), [
    setCameraBodyFocusRequest,
    setEarthMoonView,
    setExoplanetSystem,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedStellarSearchDocument,
  ]);

  return useAtlasFocusController({
    state,
    setters,
    gaiaIndexBySourceId,
    orbitAtlas,
    hasForegroundPanel: atlasWorkbenchOpen,
    escapeHandledByCoordinator: panelSurfaceActivated,
    closeOrbitAnalysis,
    openSearch,
    navigation,
  });
}
