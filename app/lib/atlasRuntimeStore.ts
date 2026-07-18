"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { AtlasSafeViewportRect } from "./atlasCameraFrameSolverV4";
import {
  ATLAS_UNIVERSAL_FOCUS_VERSION,
  type AtlasFocusCommandV2,
  type AtlasFocusSource,
  type AtlasFocusTargetV2,
} from "./atlasFocusV2";

export type AtlasSceneModeV2 =
  | AtlasSceneMode
  | "relativity-lab"
  | "scene-lab";

export type AtlasFocusTransitionState =
  | "idle"
  | "command"
  | "transition"
  | "locked";

export type AtlasExperienceMode = "explore" | "research";

export const ATLAS_PANEL_IDS = [
  "atlas-tools",
  "body-detail",
  "science-telemetry",
  "orbit-analysis",
  "kerr-lab",
  "evidence-ledger",
  "object-passport",
  "navigator",
  "workflow",
  "mission-hub",
  "scientific-report",
  "validation-console",
  "observatory-deck",
  "relativity-observables",
  "observational-astrophysics",
  "scene-lab",
  "launch-control",
] as const;

export type AtlasPanelId = (typeof ATLAS_PANEL_IDS)[number];

const ATLAS_RESEARCH_PANEL_IDS = new Set<AtlasPanelId>([
  "science-telemetry",
  "orbit-analysis",
  "kerr-lab",
  "evidence-ledger",
  "scientific-report",
  "validation-console",
  "relativity-observables",
  "observational-astrophysics",
]);

type AtlasPanelMetadata = Readonly<Record<string, string | number | boolean | null>>;

export type AtlasPanelPayloadMap = {
  "atlas-tools": { sectionId?: string; metadata?: AtlasPanelMetadata };
  "body-detail": { bodyId?: string; metadata?: AtlasPanelMetadata };
  "science-telemetry": { bodyId?: string; metricId?: string; metadata?: AtlasPanelMetadata };
  "orbit-analysis": { bodyId?: string; analysisId?: string; metadata?: AtlasPanelMetadata };
  "kerr-lab": { presetId?: string; metadata?: AtlasPanelMetadata };
  "evidence-ledger": { entryId?: string; metadata?: AtlasPanelMetadata };
  "object-passport": { objectId?: string; metadata?: AtlasPanelMetadata };
  navigator: { itemId?: string; query?: string; metadata?: AtlasPanelMetadata };
  workflow: { workflowId?: string; stepId?: string; metadata?: AtlasPanelMetadata };
  "mission-hub": { itemId?: string; metadata?: AtlasPanelMetadata };
  "scientific-report": { templateId?: string; sectionId?: string; metadata?: AtlasPanelMetadata };
  "validation-console": { domainId?: string; issueId?: string; metadata?: AtlasPanelMetadata };
  "observatory-deck": { zoneId?: string; metadata?: AtlasPanelMetadata };
  "relativity-observables": { observableId?: string; metadata?: AtlasPanelMetadata };
  "observational-astrophysics": { targetId?: string; metadata?: AtlasPanelMetadata };
  "scene-lab": { sceneId?: string; metadata?: AtlasPanelMetadata };
  "launch-control": { profileId?: string; metadata?: AtlasPanelMetadata };
};

export type AtlasPanelSession<Id extends AtlasPanelId = AtlasPanelId> = {
  id: Id;
  isOpen: boolean;
  revision: number;
  payload: AtlasPanelPayloadMap[Id];
};

export type AtlasPanelOpenStateAction = SetStateAction<boolean>;
export type AtlasPanelBooleanSetter = Dispatch<AtlasPanelOpenStateAction>;

export type AtlasPanelSessionResult<Id extends AtlasPanelId> = {
  id: Id;
  isOpen: boolean;
  revision: number;
  payload: AtlasPanelPayloadMap[Id];
  open: (payload?: Partial<AtlasPanelPayloadMap[Id]>) => void;
  close: () => void;
  toggle: (payload?: Partial<AtlasPanelPayloadMap[Id]>) => void;
  patch: (payload: Partial<AtlasPanelPayloadMap[Id]>) => void;
  setOpen: AtlasPanelBooleanSetter;
};

export type AtlasPanelState = {
  activePanelId: AtlasPanelId | null;
  openPanelIds: readonly AtlasPanelId[];
  sessions: { [Id in AtlasPanelId]: AtlasPanelSession<Id> };
};

export type AtlasRuntimeContext = Pick<
  AtlasRuntimeStoreState,
  "sceneMode" | "qualityTier" | "selectedObjectId"
>;

export type AtlasRuntimeStoreState = {
  experienceMode: AtlasExperienceMode;
  sceneMode: AtlasSceneModeV2;
  qualityTier: "balanced" | "mobile-safe" | "launch-cinematic" | "closeup-inspect";
  selectedObjectId: string;
  focusTransition: AtlasFocusTransitionState;
  focusCommandAtMs: number;
  sceneRevision: number;
  safeViewportRect: AtlasSafeViewportRect | null;
  safeViewportRevision: number;
  focusRequestId: number;
  focusCommand: AtlasFocusCommandV2 | null;
  panels: AtlasPanelState;
};

export type AtlasRuntimeStoreStateV3 = AtlasRuntimeStoreState;
export type AtlasSceneStoreStateV4 = AtlasRuntimeStoreState;

type AtlasRuntimeListener = () => void;
export type AtlasRuntimeEquality<T> = (left: T, right: T) => boolean;

function createInitialPanelState(): AtlasPanelState {
  const sessions = Object.fromEntries(ATLAS_PANEL_IDS.map((id) => [id, {
    id,
    isOpen: false,
    revision: 0,
    payload: {},
  }])) as AtlasPanelState["sessions"];
  return {
    activePanelId: null,
    openPanelIds: [],
    sessions,
  };
}

const INITIAL_STATE: AtlasRuntimeStoreState = {
  experienceMode: "explore",
  sceneMode: "atlas",
  qualityTier: "balanced",
  selectedObjectId: "",
  focusTransition: "idle",
  focusCommandAtMs: 0,
  sceneRevision: 0,
  safeViewportRect: null,
  safeViewportRevision: 0,
  focusRequestId: 0,
  focusCommand: null,
  panels: createInitialPanelState(),
};

let state = INITIAL_STATE;
const listeners = new Set<AtlasRuntimeListener>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function patchState(patch: Partial<AtlasRuntimeStoreState>): void {
  let changed = false;
  for (const [key, value] of Object.entries(patch)) {
    if (state[key as keyof AtlasRuntimeStoreState] !== value) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...patch };
  emit();
}

export const atlasRuntimeStore = {
  getSnapshot: (): AtlasRuntimeStoreState => state,
  getServerSnapshot: (): AtlasRuntimeStoreState => INITIAL_STATE,
  subscribe(listener: AtlasRuntimeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getListenerCount(): number {
    return listeners.size;
  },
  subscribeSelector<T>(
    selector: (snapshot: AtlasRuntimeStoreState) => T,
    listener: AtlasRuntimeListener,
    equality: (left: T, right: T) => boolean = Object.is,
  ): () => void {
    let selected = selector(state);
    return this.subscribe(() => {
      const next = selector(state);
      if (equality(selected, next)) return;
      selected = next;
      listener();
    });
  },
  setSceneMode(sceneMode: AtlasSceneModeV2): void {
    if (state.sceneMode === sceneMode) return;
    patchState({ sceneMode, sceneRevision: state.sceneRevision + 1 });
  },
  setExperienceMode(experienceMode: AtlasExperienceMode): void {
    if (experienceMode === "research") {
      patchState({ experienceMode });
      return;
    }
    const panels = state.panels;
    const closingIds = panels.openPanelIds.filter((panelId) =>
      ATLAS_RESEARCH_PANEL_IDS.has(panelId),
    );
    if (closingIds.length === 0) {
      patchState({ experienceMode });
      return;
    }
    const openPanelIds = panels.openPanelIds.filter((panelId) =>
      !ATLAS_RESEARCH_PANEL_IDS.has(panelId),
    );
    const sessions = { ...panels.sessions };
    for (const panelId of closingIds) {
      const session = sessions[panelId];
      sessions[panelId] = {
        ...session,
        isOpen: false,
        revision: session.revision + 1,
      } as never;
    }
    patchState({
      experienceMode,
      panels: {
        activePanelId: openPanelIds.at(-1) ?? null,
        openPanelIds,
        sessions,
      },
    });
  },
  setRuntimeContext(context: AtlasRuntimeContext): void {
    const sceneChanged = state.sceneMode !== context.sceneMode;
    patchState({
      sceneMode: context.sceneMode,
      qualityTier: context.qualityTier,
      selectedObjectId: context.selectedObjectId,
      sceneRevision: sceneChanged ? state.sceneRevision + 1 : state.sceneRevision,
    });
  },
  setQualityTier(qualityTier: AtlasRuntimeStoreState["qualityTier"]): void {
    patchState({ qualityTier });
  },
  setSelectedObject(selectedObjectId: string): void {
    patchState({ selectedObjectId });
  },
  setSafeViewportRect(safeViewportRect: AtlasSafeViewportRect | null): void {
    const previous = state.safeViewportRect;
    const unchanged = previous === safeViewportRect || (
      previous !== null && safeViewportRect !== null &&
      previous.left === safeViewportRect.left &&
      previous.top === safeViewportRect.top &&
      previous.right === safeViewportRect.right &&
      previous.bottom === safeViewportRect.bottom &&
      previous.viewportWidth === safeViewportRect.viewportWidth &&
      previous.viewportHeight === safeViewportRect.viewportHeight
    );
    if (unchanged) return;
    patchState({
      safeViewportRect,
      safeViewportRevision: state.safeViewportRevision + 1,
    });
  },
  beginFocusCommand(selectedObjectId: string, nowMs = performance.now()): void {
    patchState({
      selectedObjectId,
      focusTransition: "command",
      focusCommandAtMs: nowMs,
    });
  },
  requestFocus(
    target: AtlasFocusTargetV2,
    source: AtlasFocusSource,
    nowMs = performance.now(),
  ): AtlasFocusCommandV2 {
    const requestId = state.focusRequestId + 1;
    const focusCommand: AtlasFocusCommandV2 = {
      version: ATLAS_UNIVERSAL_FOCUS_VERSION,
      requestId,
      issuedAtMs: nowMs,
      source,
      phase: "command",
      target,
    };
    patchState({
      selectedObjectId: target.objectId,
      focusTransition: "command",
      focusCommandAtMs: nowMs,
      focusRequestId: requestId,
      focusCommand,
    });
    return focusCommand;
  },
  setFocusTransition(focusTransition: AtlasFocusTransitionState): void {
    patchState({
      focusTransition,
      focusCommand: state.focusCommand
        ? { ...state.focusCommand, phase: focusTransition }
        : null,
    });
  },
  resetFocus(): void {
    patchState({
      selectedObjectId: "",
      focusTransition: "idle",
      focusCommandAtMs: 0,
      focusCommand: null,
    });
  },
  openPanel<Id extends AtlasPanelId>(
    panelId: Id,
    payload?: Partial<AtlasPanelPayloadMap[Id]>,
  ): void {
    const panels = state.panels;
    const previous = panels.sessions[panelId] as AtlasPanelSession<Id>;
    const nextPayload = payload ? { ...previous.payload, ...payload } : previous.payload;
    const payloadChanged = nextPayload !== previous.payload && Object.entries(payload ?? {}).some(
      ([key, value]) => previous.payload[key as keyof AtlasPanelPayloadMap[Id]] !== value,
    );
    const openChanged = !previous.isOpen;
    const activeChanged = panels.activePanelId !== panelId;
    const researchModeChanged =
      ATLAS_RESEARCH_PANEL_IDS.has(panelId) && state.experienceMode !== "research";
    if (!payloadChanged && !openChanged && !activeChanged && !researchModeChanged) return;

    const nextSession: AtlasPanelSession<Id> = payloadChanged || openChanged
      ? {
        ...previous,
        isOpen: true,
        revision: previous.revision + 1,
        payload: payloadChanged ? nextPayload : previous.payload,
      }
      : previous;
    patchState({
      experienceMode: ATLAS_RESEARCH_PANEL_IDS.has(panelId)
        ? "research"
        : state.experienceMode,
      panels: {
        activePanelId: panelId,
        openPanelIds: openChanged ? [...panels.openPanelIds, panelId] : panels.openPanelIds,
        sessions: {
          ...panels.sessions,
          [panelId]: nextSession,
        },
      },
    });
  },
  closePanel(panelId: AtlasPanelId): void {
    const panels = state.panels;
    const previous = panels.sessions[panelId];
    if (!previous.isOpen) return;
    const openPanelIds = panels.openPanelIds.filter((id) => id !== panelId);
    patchState({
      panels: {
        activePanelId: panels.activePanelId === panelId
          ? openPanelIds.at(-1) ?? null
          : panels.activePanelId,
        openPanelIds,
        sessions: {
          ...panels.sessions,
          [panelId]: {
            ...previous,
            isOpen: false,
            revision: previous.revision + 1,
          },
        },
      },
    });
  },
  togglePanel<Id extends AtlasPanelId>(
    panelId: Id,
    payload?: Partial<AtlasPanelPayloadMap[Id]>,
  ): void {
    if (state.panels.sessions[panelId].isOpen) {
      atlasRuntimeStore.closePanel(panelId);
      return;
    }
    atlasRuntimeStore.openPanel(panelId, payload);
  },
  setPanelOpen<Id extends AtlasPanelId>(
    panelId: Id,
    next: AtlasPanelOpenStateAction,
    payload?: Partial<AtlasPanelPayloadMap[Id]>,
  ): void {
    const previous = state.panels.sessions[panelId].isOpen;
    const shouldOpen = typeof next === "function" ? next(previous) : next;
    if (shouldOpen) {
      atlasRuntimeStore.openPanel(panelId, payload);
      return;
    }
    atlasRuntimeStore.closePanel(panelId);
  },
  patchPanelSession<Id extends AtlasPanelId>(
    panelId: Id,
    payload: Partial<AtlasPanelPayloadMap[Id]>,
  ): void {
    const panels = state.panels;
    const previous = panels.sessions[panelId] as AtlasPanelSession<Id>;
    const changed = Object.entries(payload).some(
      ([key, value]) => previous.payload[key as keyof AtlasPanelPayloadMap[Id]] !== value,
    );
    if (!changed) return;
    patchState({
      panels: {
        ...panels,
        sessions: {
          ...panels.sessions,
          [panelId]: {
            ...previous,
            revision: previous.revision + 1,
            payload: { ...previous.payload, ...payload },
          },
        },
      },
    });
  },
  activatePanel(panelId: AtlasPanelId): void {
    const panels = state.panels;
    if (!panels.sessions[panelId].isOpen || panels.activePanelId === panelId) return;
    patchState({ panels: { ...panels, activePanelId: panelId } });
  },
};

export function useAtlasRuntimeStore<T>(
  selector: (snapshot: AtlasRuntimeStoreState) => T,
  equality: AtlasRuntimeEquality<T> = Object.is,
): T {
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equality);
  selectorRef.current = selector;
  equalityRef.current = equality;
  const selectedRef = useRef(selector(atlasRuntimeStore.getSnapshot()));
  const selectedNow = selector(atlasRuntimeStore.getSnapshot());
  if (!equalityRef.current(selectedRef.current, selectedNow)) selectedRef.current = selectedNow;

  const subscribe = useCallback((listener: AtlasRuntimeListener) => (
    atlasRuntimeStore.subscribeSelector(
      (snapshot) => selectorRef.current(snapshot),
      () => {
        selectedRef.current = selectorRef.current(atlasRuntimeStore.getSnapshot());
        listener();
      },
      (left, right) => equalityRef.current(left, right),
    )
  ), []);
  const getSnapshot = useCallback(() => selectedRef.current, []);
  const serverSnapshotRef = useRef(selector(atlasRuntimeStore.getServerSnapshot()));
  const getServerSnapshot = useCallback(() => serverSnapshotRef.current, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Compatibility bridge for controller code that still expects a React boolean
 * setter. The panel store remains the only source of truth.
 */
export function createAtlasPanelBooleanSetter<Id extends AtlasPanelId>(
  panelId: Id,
  payload?: Partial<AtlasPanelPayloadMap[Id]>,
): AtlasPanelBooleanSetter {
  return (next) => atlasRuntimeStore.setPanelOpen(panelId, next, payload);
}

/** A useState-shaped compatibility adapter backed by the typed panel store. */
export function useAtlasPanelBooleanAdapter<Id extends AtlasPanelId>(
  panelId: Id,
  payload?: Partial<AtlasPanelPayloadMap[Id]>,
): readonly [boolean, AtlasPanelBooleanSetter] {
  const isOpen = useAtlasRuntimeStore(
    (snapshot) => snapshot.panels.sessions[panelId].isOpen,
  );
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const setOpen = useCallback<AtlasPanelBooleanSetter>((next) => {
    atlasRuntimeStore.setPanelOpen(panelId, next, payloadRef.current);
  }, [panelId]);
  return useMemo(() => [isOpen, setOpen] as const, [isOpen, setOpen]);
}

/** Selects one isolated typed session and exposes stable store-backed actions. */
export function useAtlasPanelSession<Id extends AtlasPanelId>(
  panelId: Id,
): AtlasPanelSessionResult<Id> {
  const session = useAtlasRuntimeStore(
    (snapshot) => snapshot.panels.sessions[panelId] as AtlasPanelSession<Id>,
  );
  const open = useCallback((payload?: Partial<AtlasPanelPayloadMap[Id]>) => {
    atlasRuntimeStore.openPanel(panelId, payload);
  }, [panelId]);
  const close = useCallback(() => atlasRuntimeStore.closePanel(panelId), [panelId]);
  const toggle = useCallback((payload?: Partial<AtlasPanelPayloadMap[Id]>) => {
    atlasRuntimeStore.togglePanel(panelId, payload);
  }, [panelId]);
  const patch = useCallback((payload: Partial<AtlasPanelPayloadMap[Id]>) => {
    atlasRuntimeStore.patchPanelSession(panelId, payload);
  }, [panelId]);
  const setOpen = useCallback<AtlasPanelBooleanSetter>((next) => {
    atlasRuntimeStore.setPanelOpen(panelId, next);
  }, [panelId]);

  return useMemo(() => ({
    id: panelId,
    isOpen: session.isOpen,
    revision: session.revision,
    payload: session.payload,
    open,
    close,
    toggle,
    patch,
    setOpen,
  }), [close, open, panelId, patch, session, setOpen, toggle]);
}
