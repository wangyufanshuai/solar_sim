"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { AtlasSafeViewportRect } from "./atlasCameraFrameSolverV4";
import type { AtlasScaleBand } from "./atlasRuntimeStateV256";
import type { AtlasVisualProfileV299 } from "./atlasVisualProfileV299";
import {
  createIdleAtlasScaleJourneyV268,
  type AtlasScaleJourneyV268,
} from "./atlasScaleJourneyV268";
import {
  ATLAS_PANEL_IDS,
  createAtlasRuntimePanelSliceV270,
  createInitialAtlasPanelStateV270,
  type AtlasExperienceMode,
  type AtlasObserverPresentationV266,
  type AtlasPanelBooleanSetter,
  type AtlasPanelId,
  type AtlasPanelOpenStateAction,
  type AtlasPanelPayloadMap,
  type AtlasPanelSession,
  type AtlasPanelSessionResult,
  type AtlasPanelState,
  type AtlasResearchOverlayV266,
} from "./atlasRuntimePanelSliceV270";
import { createAtlasRuntimeScaleSliceV270 } from "./atlasRuntimeScaleSliceV270";
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

export { ATLAS_PANEL_IDS };
export type {
  AtlasExperienceMode,
  AtlasObserverPresentationV266,
  AtlasPanelBooleanSetter,
  AtlasPanelId,
  AtlasPanelOpenStateAction,
  AtlasPanelPayloadMap,
  AtlasPanelSession,
  AtlasPanelSessionResult,
  AtlasPanelState,
  AtlasResearchOverlayV266,
};

export type AtlasRuntimeContext = Pick<
  AtlasRuntimeStoreState,
  "sceneMode" | "qualityTier" | "selectedObjectId"
>;

export type AtlasRuntimeStoreState = {
  experienceMode: AtlasExperienceMode;
  scaleBand: AtlasScaleBand;
  scaleJourney: AtlasScaleJourneyV268;
  visualProfile: AtlasVisualProfileV299;
  sceneMode: AtlasSceneModeV2;
  qualityTier: "balanced" | "mobile-safe" | "launch-cinematic" | "closeup-inspect";
  selectedObjectId: string;
  researchOverlay: AtlasResearchOverlayV266;
  observerPresentation: AtlasObserverPresentationV266;
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

const INITIAL_STATE: AtlasRuntimeStoreState = {
  experienceMode: "explore",
  scaleBand: "solar",
  scaleJourney: createIdleAtlasScaleJourneyV268("solar"),
  visualProfile: "legacy-v9",
  sceneMode: "atlas",
  qualityTier: "balanced",
  selectedObjectId: "",
  researchOverlay: "none",
  observerPresentation: {
    enabled: false,
    targetId: "",
    widthDeg: 0,
    heightDeg: 0,
    rotationDeg: 0,
  },
  focusTransition: "idle",
  focusCommandAtMs: 0,
  sceneRevision: 0,
  safeViewportRect: null,
  safeViewportRevision: 0,
  focusRequestId: 0,
  focusCommand: null,
  panels: createInitialAtlasPanelStateV270(),
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

const panelSlice = createAtlasRuntimePanelSliceV270({
  getState: () => state,
  patchState: (patch) => patchState(patch),
});
const scaleSlice = createAtlasRuntimeScaleSliceV270({
  getState: () => state,
  patchState: (patch) => patchState(patch),
});

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
  ...panelSlice,
  ...scaleSlice,
  setSceneMode(sceneMode: AtlasSceneModeV2): void {
    if (state.sceneMode === sceneMode) return;
    patchState({ sceneMode, sceneRevision: state.sceneRevision + 1 });
  },
  setVisualProfile(visualProfile: AtlasVisualProfileV299): void {
    patchState({ visualProfile });
  },
  openResearchOverlay(researchOverlay: Exclude<AtlasResearchOverlayV266, "none">): void {
    patchState({ experienceMode: "research", researchOverlay });
  },
  closeResearchOverlay(researchOverlay?: Exclude<AtlasResearchOverlayV266, "none">): void {
    if (researchOverlay && state.researchOverlay !== researchOverlay) return;
    patchState({
      researchOverlay: "none",
      observerPresentation: state.observerPresentation.enabled
        ? { ...state.observerPresentation, enabled: false }
        : state.observerPresentation,
    });
  },
  setObserverPresentation(observerPresentation: AtlasObserverPresentationV266): void {
    const previous = state.observerPresentation;
    if (
      previous.enabled === observerPresentation.enabled &&
      previous.targetId === observerPresentation.targetId &&
      previous.widthDeg === observerPresentation.widthDeg &&
      previous.heightDeg === observerPresentation.heightDeg &&
      previous.rotationDeg === observerPresentation.rotationDeg
    ) return;
    // Presentation-only state: deliberately does not increment sceneRevision.
    patchState({ observerPresentation });
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
