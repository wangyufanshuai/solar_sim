"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ATLAS_MISSION_HUB_STORAGE_KEY,
  parseAtlasMissionHubStoredState,
  serializeAtlasMissionHubStoredState,
} from "./atlasMissionHub";
import {
  ATLAS_MISSION_CAPSULE_HASH_KEY,
  ATLAS_MISSION_CAPSULE_VERSION,
  capsuleFromLocationHash,
  createAtlasMissionCapsule,
  missionCapsuleToHash,
  parseAtlasMissionCapsule,
  restoreAtlasMissionCapsule,
  type CreateAtlasMissionCapsuleArgs,
} from "./atlasMissionCapsule";
import type {
  AtlasMissionCapsule,
  AtlasMissionCapsuleRestoreSummary,
  AtlasMissionHubStoredState,
  AtlasNavigatorSummary,
  AtlasWorkflowSummary,
} from "./simulationDiagnosticsTypes";

export type AtlasMissionSessionOptions = {
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  createCapsuleArgs: (storedState: AtlasMissionHubStoredState) => CreateAtlasMissionCapsuleArgs;
  applyCapsule: (
    capsule: AtlasMissionCapsule,
    restoreStoredState: (state: AtlasMissionHubStoredState) => void,
  ) => void;
  openMissionHub: () => void;
};

export type AtlasMissionSessionResult = {
  storedState: AtlasMissionHubStoredState;
  setStoredState: Dispatch<SetStateAction<AtlasMissionHubStoredState>>;
  restoreSummary: AtlasMissionCapsuleRestoreSummary;
  createCurrentCapsule: () => AtlasMissionCapsule;
  applyParsedCapsule: (
    capsule: AtlasMissionCapsule | null,
    warnings: readonly AtlasMissionCapsuleRestoreSummary["warnings"][number][],
    source: AtlasMissionCapsuleRestoreSummary["source"],
  ) => void;
  copyCapsuleLink: () => void;
  exportCapsule: () => void;
  importCapsuleFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  clearCapsuleHash: () => void;
};

export function emptyAtlasMissionCapsuleRestoreSummary(): AtlasMissionCapsuleRestoreSummary {
  return {
    version: ATLAS_MISSION_CAPSULE_VERSION,
    source: "none",
    active: false,
    createdAt: "",
    restoredCount: 0,
    warningCount: 0,
    warnings: [],
  };
}

export function loadAtlasMissionHubStoredState(
  storage: Pick<Storage, "getItem"> | null = typeof window === "undefined" ? null : window.localStorage,
): AtlasMissionHubStoredState {
  if (!storage) return { recentActions: [], pinnedItems: [] };
  try {
    return parseAtlasMissionHubStoredState(storage.getItem(ATLAS_MISSION_HUB_STORAGE_KEY));
  } catch {
    return { recentActions: [], pinnedItems: [] };
  }
}

export function useAtlasMissionSession({
  navigatorSummary,
  workflowSummary,
  createCapsuleArgs,
  applyCapsule,
  openMissionHub,
}: AtlasMissionSessionOptions): AtlasMissionSessionResult {
  const [storedState, setStoredState] = useState<AtlasMissionHubStoredState>(
    loadAtlasMissionHubStoredState,
  );
  const [restoreSummary, setRestoreSummary] = useState<AtlasMissionCapsuleRestoreSummary>(
    emptyAtlasMissionCapsuleRestoreSummary,
  );
  const restoredCapsuleHashRef = useRef("");

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ATLAS_MISSION_HUB_STORAGE_KEY,
        serializeAtlasMissionHubStoredState(storedState),
      );
    } catch {
      // The in-memory session remains authoritative when storage is unavailable.
    }
  }, [storedState]);

  const createCurrentCapsule = useCallback(
    () => createAtlasMissionCapsule(createCapsuleArgs(storedState)),
    [createCapsuleArgs, storedState],
  );

  const applyParsedCapsule = useCallback<AtlasMissionSessionResult["applyParsedCapsule"]>(
    (capsule, warnings, source) => {
      const summary = restoreAtlasMissionCapsule({
        capsule,
        warnings,
        source,
        navigatorSummary,
        workflowSummary,
      });
      setRestoreSummary(summary);
      if (capsule) applyCapsule(capsule, setStoredState);
      openMissionHub();
    },
    [applyCapsule, navigatorSummary, openMissionHub, workflowSummary],
  );

  const copyCapsuleLink = useCallback(() => {
    const capsule = createCurrentCapsule();
    const hash = missionCapsuleToHash(capsule);
    const url = new URL(window.location.href);
    url.hash = hash.slice(1);
    window.history.replaceState(null, "", url);
    restoredCapsuleHashRef.current = hash;
    setRestoreSummary(restoreAtlasMissionCapsule({
      capsule,
      source: "copy-link",
      navigatorSummary,
      workflowSummary,
    }));
    void navigator.clipboard?.writeText(url.toString()).catch(() => undefined);
  }, [createCurrentCapsule, navigatorSummary, workflowSummary]);

  const exportCapsule = useCallback(() => {
    const capsule = createCurrentCapsule();
    const blob = new Blob([JSON.stringify(capsule, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `orbit-atlas-mission-capsule-v27-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setRestoreSummary(restoreAtlasMissionCapsule({
      capsule,
      source: "export-json",
      navigatorSummary,
      workflowSummary,
    }));
  }, [createCurrentCapsule, navigatorSummary, workflowSummary]);

  const importCapsuleFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const parsed = parseAtlasMissionCapsule(await file.text());
    applyParsedCapsule(parsed.capsule, parsed.warnings, "json-import");
  }, [applyParsedCapsule]);

  const clearCapsuleHash = useCallback(() => {
    if (window.location.hash.replace(/^#/, "").startsWith(`${ATLAS_MISSION_CAPSULE_HASH_KEY}=`)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    restoredCapsuleHashRef.current = "";
    setRestoreSummary(emptyAtlasMissionCapsuleRestoreSummary());
  }, []);

  useEffect(() => {
    const restoreFromHash = () => {
      const hash = window.location.hash;
      if (!hash || hash === restoredCapsuleHashRef.current) return;
      const parsed = capsuleFromLocationHash(hash);
      if (!parsed.capsule && parsed.warnings.length === 0) return;
      restoredCapsuleHashRef.current = hash;
      applyParsedCapsule(parsed.capsule, parsed.warnings, "url-hash");
    };
    restoreFromHash();
    window.addEventListener("hashchange", restoreFromHash);
    return () => window.removeEventListener("hashchange", restoreFromHash);
  }, [applyParsedCapsule]);

  return {
    storedState,
    setStoredState,
    restoreSummary,
    createCurrentCapsule,
    applyParsedCapsule,
    copyCapsuleLink,
    exportCapsule,
    importCapsuleFile,
    clearCapsuleHash,
  };
}
