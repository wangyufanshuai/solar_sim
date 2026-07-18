"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { CameraBodyFocusRequest } from "../components/UniverseScene";
import type { BottomControlBarSection } from "../components/BottomControlBar";
import type { StellarSearchDocument } from "./stellarSearchCatalog";
import type { AtlasLaunchControllerSelectionActions } from "./useAtlasLaunchController";

export type AtlasLaunchSelectionActionsOptions = {
  setEarthMoonView: Dispatch<SetStateAction<boolean>>;
  setSelectedBodyIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedCelestialCatalogId: Dispatch<SetStateAction<string>>;
  setSelectedStellarSearchDocument: Dispatch<SetStateAction<StellarSearchDocument | null>>;
  setSelectedExoplanetSystemId: Dispatch<SetStateAction<string>>;
  setCameraBodyFocusRequest: Dispatch<SetStateAction<CameraBodyFocusRequest | null>>;
  setActiveSection: Dispatch<SetStateAction<BottomControlBarSection>>;
  setCameraOriginResetNonce: Dispatch<SetStateAction<number>>;
};

export function useAtlasLaunchSelectionActions({
  setEarthMoonView,
  setSelectedBodyIndex,
  setSelectedCelestialCatalogId,
  setSelectedStellarSearchDocument,
  setSelectedExoplanetSystemId,
  setCameraBodyFocusRequest,
  setActiveSection,
  setCameraOriginResetNonce,
}: AtlasLaunchSelectionActionsOptions): AtlasLaunchControllerSelectionActions {
  return useMemo(() => ({
    clearSelection: () => {
      setEarthMoonView(false);
      setSelectedBodyIndex(null);
      setSelectedCelestialCatalogId("");
      setSelectedStellarSearchDocument(null);
      setSelectedExoplanetSystemId("");
      setCameraBodyFocusRequest(null);
    },
    returnToSimulation: () => setActiveSection("simulation"),
    resetCameraOrigin: () => setCameraOriginResetNonce((nonce) => nonce + 1),
    focusSpacecraft: (bodyIndex, update) => {
      setSelectedBodyIndex(bodyIndex);
      setCameraBodyFocusRequest(update);
    },
  }), [
    setActiveSection,
    setCameraBodyFocusRequest,
    setCameraOriginResetNonce,
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);
}
