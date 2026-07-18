"use client";

import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { BrightStarDef } from "../data/brightStarCatalog";
import { EARTH_BODY_INDEX, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import type { CameraBodyFocusRequest } from "../components/UniverseScene";
import {
  CAMERA_FOCUS_ORIGIN_EVENT,
  dispatchCameraFocusDirection,
  dispatchCameraFocusEarthMoon,
  dispatchCameraFocusOrigin,
} from "./camera-bridge";
import {
  celestialEntryToDirection,
  selectCelestialCatalogEntry,
} from "./celestialCatalog";
import {
  gaiaIndexedStarToDirection,
  type GaiaIndexedStar,
} from "./gaiaCatalogIndex";
import { catalogIdentityFromSourceId, type AtlasFocusSource } from "./atlasFocusV2";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { getAtlasStellarSearchDocument } from "./atlasStellarSearchRuntime";
import {
  stellarDocumentToGaiaIndex,
  type StellarSearchDocument,
} from "./stellarSearchCatalog";
import type { AtlasNavigatorItem } from "./simulationDiagnosticsTypes";

export type AtlasFocusControllerState = {
  selectedBodyIndex: number | null;
  selectedCelestialCatalogId: string;
  selectedStellarSearchDocument: StellarSearchDocument | null;
  selectedExoplanetSystemId: string;
  cameraBodyFocusRequest: CameraBodyFocusRequest | null;
};

export type AtlasFocusControllerSetters = {
  setSelectedBodyIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedCelestialCatalogId: Dispatch<SetStateAction<string>>;
  setSelectedStellarSearchDocument: Dispatch<SetStateAction<StellarSearchDocument | null>>;
  setSelectedExoplanetSystemId: Dispatch<SetStateAction<string>>;
  setCameraBodyFocusRequest: Dispatch<SetStateAction<CameraBodyFocusRequest | null>>;
  setEarthMoonView: Dispatch<SetStateAction<boolean>>;
};

export type AtlasFocusNavigationActions = {
  closeNavigator: () => void;
  recordNavigatorItem: (item: AtlasNavigatorItem) => void;
  openEvidenceClaim: (claimId: string) => void;
  openMissionHub: () => void;
  openObservatoryDeck: () => void;
  openScientificReport: () => void;
  openValidationConsole: () => void;
  openRelativityObservables: () => void;
  openObservationalAstrophysics: () => void;
  openWorkflow: () => void;
  openKerrLab: () => void;
  openOrbitAnalysis: () => void;
  openObjectBrowser: () => void;
  openViewPanel: () => void;
  openToolsPanel: () => void;
};

export type AtlasFocusControllerOptions = {
  state: AtlasFocusControllerState;
  setters: AtlasFocusControllerSetters;
  gaiaIndexBySourceId: ReadonlyMap<string, GaiaIndexedStar>;
  orbitAtlas: boolean;
  hasForegroundPanel: boolean;
  escapeHandledByCoordinator?: boolean;
  closeOrbitAnalysis: () => void;
  openSearch: () => void;
  navigation: AtlasFocusNavigationActions;
};

export type AtlasFocusControllerResult = {
  clearFocusLock: () => void;
  focusSelected: () => void;
  focusEarthMoon: () => void;
  requestBodyFocus: (bodyIndex: number, mode: "inspect" | "lock", source: AtlasFocusSource) => void;
  onBodyFocusFromList: (bodyIndex: number) => void;
  onBodyCanvasPick: (bodyIndex: number) => void;
  onAtlasBodyCanvasPick: (bodyIndex: number) => void;
  onSelectBody: (bodyIndex: number) => void;
  requestCatalogObjectFocus: (catalogId: string, source?: AtlasFocusSource) => void;
  onNearbyStarFocus: (direction: [number, number, number], catalogId?: string) => void;
  requestGaiaStarFocus: (indexed: GaiaIndexedStar, source?: AtlasFocusSource) => void;
  onBrightStarFocus: (star: BrightStarDef) => void;
  executeNavigatorItem: (item: AtlasNavigatorItem) => void;
};

export const ATLAS_FOCUS_COMMAND_DISPATCH_EVENT = "atlas:focus-command-dispatched";

type AtlasFocusCommandDispatchDetail = {
  durationMs: number;
  kind: "solar-body" | "catalog-object" | "stellar" | "exoplanet-system";
  objectId: string;
  source: AtlasFocusSource;
};

function publishFocusCommandDispatch(detail: AtlasFocusCommandDispatchDetail): void {
  window.dispatchEvent(new CustomEvent<AtlasFocusCommandDispatchDetail>(
    ATLAS_FOCUS_COMMAND_DISPATCH_EVENT,
    { detail },
  ));
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}

export function useAtlasFocusController({
  state,
  setters,
  gaiaIndexBySourceId,
  orbitAtlas,
  hasForegroundPanel,
  escapeHandledByCoordinator = false,
  closeOrbitAnalysis,
  openSearch,
  navigation,
}: AtlasFocusControllerOptions): AtlasFocusControllerResult {
  const exoplanetDeepLinkInitializedRef = useRef(false);
  const {
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedStellarSearchDocument,
    setSelectedExoplanetSystemId,
    setCameraBodyFocusRequest,
    setEarthMoonView,
  } = setters;

  useEffect(() => {
    const clearEarthMoon = () => setEarthMoonView(false);
    window.addEventListener(CAMERA_FOCUS_ORIGIN_EVENT, clearEarthMoon);
    return () => window.removeEventListener(CAMERA_FOCUS_ORIGIN_EVENT, clearEarthMoon);
  }, [setEarthMoonView]);

  useEffect(() => {
    if (!exoplanetDeepLinkInitializedRef.current) {
      exoplanetDeepLinkInitializedRef.current = true;
      const deepLinkedSystemId = new URLSearchParams(window.location.search).get("system");
      if (deepLinkedSystemId) {
        setSelectedExoplanetSystemId(deepLinkedSystemId);
        return;
      }
    }
    const url = new URL(window.location.href);
    if (state.selectedExoplanetSystemId) {
      url.searchParams.set("system", state.selectedExoplanetSystemId);
      try {
        const key = "atlas-recent-exoplanet-systems-v2";
        const current = JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
        const next = [
          state.selectedExoplanetSystemId,
          ...current.filter((id) => id !== state.selectedExoplanetSystemId),
        ].slice(0, 8);
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Deep links remain functional when storage is unavailable.
      }
    } else {
      url.searchParams.delete("system");
    }
    window.history.replaceState(null, "", url);
  }, [setSelectedExoplanetSystemId, state.selectedExoplanetSystemId]);

  useEffect(() => {
    const restoreExoplanetDeepLink = () => {
      setSelectedExoplanetSystemId(
        new URLSearchParams(window.location.search).get("system") ?? "",
      );
    };
    window.addEventListener("popstate", restoreExoplanetDeepLink);
    return () => window.removeEventListener("popstate", restoreExoplanetDeepLink);
  }, [setSelectedExoplanetSystemId]);

  useEffect(() => {
    if (state.selectedBodyIndex === null) closeOrbitAnalysis();
  }, [closeOrbitAnalysis, state.selectedBodyIndex]);

  const clearFocusLock = useCallback(() => {
    atlasRuntimeStore.resetFocus();
    setEarthMoonView(false);
    setSelectedBodyIndex(null);
    setSelectedCelestialCatalogId("");
    setSelectedStellarSearchDocument(null);
    setSelectedExoplanetSystemId("");
    setCameraBodyFocusRequest(null);
    dispatchCameraFocusOrigin();
  }, [
    setCameraBodyFocusRequest,
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);

  useEffect(() => {
    if (escapeHandledByCoordinator) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const element = event.target as HTMLElement | null;
      const objectSearchFocused = element?.matches('[data-atlas-object-search="true"]');
      if (!objectSearchFocused && element?.closest(
        "input, textarea, select, [contenteditable=true], [data-no-escape-clear]",
      )) return;
      if (hasForegroundPanel || atlasRuntimeStore.getSnapshot().panels.openPanelIds.length > 0) return;
      clearFocusLock();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFocusLock, escapeHandledByCoordinator, hasForegroundPanel]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;
      if (isEditableKeyboardTarget(event.target)) return;
      event.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  const focusSelected = useCallback(() => {
    setEarthMoonView(false);
    if (state.selectedBodyIndex !== null) {
      setCameraBodyFocusRequest((previous) => ({
        bodyIndex: state.selectedBodyIndex as number,
        mode: "lock",
        nonce: (previous?.nonce ?? 0) + 1,
      }));
    } else {
      dispatchCameraFocusOrigin();
    }
  }, [setCameraBodyFocusRequest, setEarthMoonView, state.selectedBodyIndex]);

  const focusEarthMoon = useCallback(() => {
    setEarthMoonView(true);
    if (EARTH_BODY_INDEX >= 0) setSelectedBodyIndex(EARTH_BODY_INDEX);
    dispatchCameraFocusEarthMoon();
  }, [setEarthMoonView, setSelectedBodyIndex]);

  const requestBodyFocus = useCallback((
    bodyIndex: number,
    mode: "inspect" | "lock",
    source: AtlasFocusSource,
  ) => {
    const startedAt = performance.now();
    const body = SOLAR_SYSTEM_BODIES[bodyIndex];
    if (!body) return;
    atlasRuntimeStore.requestFocus({ kind: "solar-body", objectId: body.id, bodyIndex, mode }, source);
    setEarthMoonView(false);
    setSelectedExoplanetSystemId("");
    setSelectedStellarSearchDocument(null);
    setSelectedCelestialCatalogId("");
    setSelectedBodyIndex(bodyIndex);
    setCameraBodyFocusRequest((previous) => ({
      bodyIndex,
      mode,
      nonce: (previous?.nonce ?? 0) + 1,
    }));
    publishFocusCommandDispatch({
      durationMs: performance.now() - startedAt,
      kind: "solar-body",
      objectId: body.id,
      source,
    });
  }, [
    setCameraBodyFocusRequest,
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);

  const requestCatalogObjectFocus = useCallback((
    catalogId: string,
    source: AtlasFocusSource = "scene-label",
  ) => {
    const startedAt = performance.now();
    const entry = selectCelestialCatalogEntry(catalogId);
    const direction = entry ? celestialEntryToDirection(entry) : null;
    if (!entry || !direction) return;
    atlasRuntimeStore.requestFocus({
      kind: "catalog-object",
      objectId: entry.id,
      catalogId: entry.id,
      direction,
    }, source);
    setEarthMoonView(false);
    setSelectedExoplanetSystemId("");
    setSelectedStellarSearchDocument(null);
    setSelectedCelestialCatalogId(entry.id);
    setSelectedBodyIndex(null);
    dispatchCameraFocusDirection(direction);
    publishFocusCommandDispatch({
      durationMs: performance.now() - startedAt,
      kind: "catalog-object",
      objectId: entry.id,
      source,
    });
  }, [
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);

  const onNearbyStarFocus = useCallback((direction: [number, number, number], catalogId = "") => {
    if (catalogId && selectCelestialCatalogEntry(catalogId)) {
      requestCatalogObjectFocus(catalogId, "object-browser");
      return;
    }
    const startedAt = performance.now();
    const objectId = catalogId || "catalog-direction-target";
    atlasRuntimeStore.requestFocus({
      kind: "catalog-object",
      objectId,
      catalogId: objectId,
      direction,
    }, "object-browser");
    setEarthMoonView(false);
    setSelectedExoplanetSystemId("");
    setSelectedStellarSearchDocument(null);
    setSelectedCelestialCatalogId(catalogId);
    setSelectedBodyIndex(null);
    dispatchCameraFocusDirection(direction);
    publishFocusCommandDispatch({
      durationMs: performance.now() - startedAt,
      kind: "catalog-object",
      objectId,
      source: "object-browser",
    });
  }, [
    requestCatalogObjectFocus,
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);

  const requestGaiaStarFocus = useCallback((
    indexed: GaiaIndexedStar,
    source: AtlasFocusSource = "scene-pointer",
  ) => {
    const startedAt = performance.now();
    const searchDocument = getAtlasStellarSearchDocument(indexed.sourceId);
    const direction = gaiaIndexedStarToDirection(indexed);
    atlasRuntimeStore.requestFocus({
      kind: "stellar",
      objectId: indexed.id,
      catalogId: indexed.id,
      direction,
      identity: catalogIdentityFromSourceId({
        objectId: indexed.id,
        sourceId: indexed.sourceId,
        designation: searchDocument?.designation,
      }),
    }, source);
    setEarthMoonView(false);
    setSelectedExoplanetSystemId("");
    setSelectedBodyIndex(null);
    setSelectedStellarSearchDocument(searchDocument);
    setSelectedCelestialCatalogId(indexed.id);
    dispatchCameraFocusDirection(direction);
    publishFocusCommandDispatch({
      durationMs: performance.now() - startedAt,
      kind: "stellar",
      objectId: indexed.id,
      source,
    });
  }, [
    setEarthMoonView,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
  ]);

  const onBrightStarFocus = useCallback((star: BrightStarDef) => {
    const nearbyId = `nearby-star:${star.id}`;
    const catalogId = selectCelestialCatalogEntry(nearbyId) ? nearbyId : `bright-star:${star.id}`;
    requestCatalogObjectFocus(catalogId, "scene-pointer");
  }, [requestCatalogObjectFocus]);

  const executeNavigatorItem = useCallback((item: AtlasNavigatorItem) => {
    if (item.disabled) return;
    navigation.closeNavigator();
    navigation.recordNavigatorItem(item);
    if (item.action === "focus-body" && item.bodyIndex != null) {
      requestBodyFocus(item.bodyIndex, "inspect", "object-browser");
      return;
    }
    if ((item.action === "focus-catalog-object" || item.action === "open-object-passport") && item.catalogObjectId) {
      requestCatalogObjectFocus(item.catalogObjectId, "navigator");
      return;
    }
    if (item.action === "focus-gaia-star" && item.gaiaSourceId) {
      const indexed = gaiaIndexBySourceId.get(item.gaiaSourceId);
      const searchDocument = getAtlasStellarSearchDocument(item.gaiaSourceId);
      const effectiveIndexed = indexed ?? (searchDocument ? stellarDocumentToGaiaIndex(searchDocument) : null);
      if (effectiveIndexed) requestGaiaStarFocus(effectiveIndexed, "navigator");
      return;
    }
    if (item.action === "open-exoplanet-system" && item.exoplanetSystemId) {
      const startedAt = performance.now();
      atlasRuntimeStore.requestFocus({
        kind: "exoplanet-system",
        objectId: `exoplanet-system:${item.exoplanetSystemId}`,
        systemId: item.exoplanetSystemId,
      }, "navigator");
      setSelectedBodyIndex(null);
      setSelectedCelestialCatalogId("");
      setSelectedStellarSearchDocument(null);
      setSelectedExoplanetSystemId(item.exoplanetSystemId);
      publishFocusCommandDispatch({
        durationMs: performance.now() - startedAt,
        kind: "exoplanet-system",
        objectId: `exoplanet-system:${item.exoplanetSystemId}`,
        source: "navigator",
      });
      return;
    }
    if (item.action === "open-evidence-claim" && item.evidenceClaimId) {
      navigation.openEvidenceClaim(item.evidenceClaimId);
      return;
    }
    if (item.action !== "open-panel") return;
    switch (item.panelId) {
      case "mission-hub": navigation.openMissionHub(); break;
      case "observatory-deck": navigation.openObservatoryDeck(); break;
      case "scientific-report": navigation.openScientificReport(); break;
      case "validation-console": navigation.openValidationConsole(); break;
      case "relativity-observables": navigation.openRelativityObservables(); break;
      case "observational-astrophysics": navigation.openObservationalAstrophysics(); break;
      case "atlas-workflows": navigation.openWorkflow(); break;
      case "evidence-ledger": navigation.openEvidenceClaim(""); break;
      case "kerr-lab": navigation.openKerrLab(); break;
      case "orbit-analysis": if (orbitAtlas && state.selectedBodyIndex !== null && state.selectedBodyIndex > 0) navigation.openOrbitAnalysis(); break;
      case "object-browser": navigation.openObjectBrowser(); break;
      case "view-panel": navigation.openViewPanel(); break;
      case "tools-panel": navigation.openToolsPanel(); break;
      default: break;
    }
  }, [
    gaiaIndexBySourceId,
    navigation,
    orbitAtlas,
    requestBodyFocus,
    requestCatalogObjectFocus,
    requestGaiaStarFocus,
    setSelectedBodyIndex,
    setSelectedCelestialCatalogId,
    setSelectedExoplanetSystemId,
    setSelectedStellarSearchDocument,
    state.selectedBodyIndex,
  ]);

  return {
    clearFocusLock,
    focusSelected,
    focusEarthMoon,
    requestBodyFocus,
    onBodyFocusFromList: (bodyIndex) => requestBodyFocus(bodyIndex, "inspect", "object-browser"),
    onBodyCanvasPick: (bodyIndex) => requestBodyFocus(bodyIndex, "inspect", "scene-pointer"),
    onAtlasBodyCanvasPick: (bodyIndex) => requestBodyFocus(bodyIndex, "inspect", "scene-pointer"),
    onSelectBody: (bodyIndex) => requestBodyFocus(bodyIndex, "lock", "scene-pointer"),
    requestCatalogObjectFocus,
    onNearbyStarFocus,
    requestGaiaStarFocus,
    onBrightStarFocus,
    executeNavigatorItem,
  };
}
