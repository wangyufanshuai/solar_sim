import type { Dispatch, SetStateAction } from "react";

export const ATLAS_RUNTIME_PANEL_SLICE_VERSION = "v270-runtime-panel-slice-v1" as const;

export type AtlasExperienceMode = "explore" | "research";
export type AtlasResearchOverlayV266 = "none" | "observing-planner" | "gaia-analysis";

export type AtlasObserverPresentationV266 = {
  enabled: boolean;
  targetId: string;
  widthDeg: number;
  heightDeg: number;
  rotationDeg: number;
};

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

export type AtlasRuntimePanelSliceStateV270 = {
  experienceMode: AtlasExperienceMode;
  researchOverlay: AtlasResearchOverlayV266;
  observerPresentation: AtlasObserverPresentationV266;
  panels: AtlasPanelState;
};

type AtlasRuntimePanelSliceHostV270 = {
  getState: () => AtlasRuntimePanelSliceStateV270;
  patchState: (patch: Partial<AtlasRuntimePanelSliceStateV270>) => void;
};

export function createInitialAtlasPanelStateV270(): AtlasPanelState {
  const sessions = Object.fromEntries(ATLAS_PANEL_IDS.map((id) => [id, {
    id,
    isOpen: false,
    revision: 0,
    payload: {},
  }])) as AtlasPanelState["sessions"];
  return { activePanelId: null, openPanelIds: [], sessions };
}

export function createAtlasRuntimePanelSliceV270(host: AtlasRuntimePanelSliceHostV270) {
  const setExperienceMode = (experienceMode: AtlasExperienceMode): void => {
    const state = host.getState();
    if (experienceMode === "research") {
      host.patchState({ experienceMode });
      return;
    }
    const panels = state.panels;
    const closingIds = panels.openPanelIds.filter((panelId) => ATLAS_RESEARCH_PANEL_IDS.has(panelId));
    if (closingIds.length === 0) {
      host.patchState({
        experienceMode,
        researchOverlay: "none",
        observerPresentation: state.observerPresentation.enabled
          ? { ...state.observerPresentation, enabled: false }
          : state.observerPresentation,
      });
      return;
    }
    const openPanelIds = panels.openPanelIds.filter((panelId) => !ATLAS_RESEARCH_PANEL_IDS.has(panelId));
    const sessions = { ...panels.sessions };
    for (const panelId of closingIds) {
      const session = sessions[panelId];
      sessions[panelId] = { ...session, isOpen: false, revision: session.revision + 1 } as never;
    }
    host.patchState({
      experienceMode,
      researchOverlay: "none",
      observerPresentation: { ...state.observerPresentation, enabled: false },
      panels: { activePanelId: openPanelIds.at(-1) ?? null, openPanelIds, sessions },
    });
  };

  const openPanel = <Id extends AtlasPanelId>(
    panelId: Id,
    payload?: Partial<AtlasPanelPayloadMap[Id]>,
  ): void => {
    const state = host.getState();
    const panels = state.panels;
    const previous = panels.sessions[panelId] as AtlasPanelSession<Id>;
    const nextPayload = payload ? { ...previous.payload, ...payload } : previous.payload;
    const payloadChanged = nextPayload !== previous.payload && Object.entries(payload ?? {}).some(
      ([key, value]) => previous.payload[key as keyof AtlasPanelPayloadMap[Id]] !== value,
    );
    const openChanged = !previous.isOpen;
    const activeChanged = panels.activePanelId !== panelId;
    const researchModeChanged = ATLAS_RESEARCH_PANEL_IDS.has(panelId) && state.experienceMode !== "research";
    if (!payloadChanged && !openChanged && !activeChanged && !researchModeChanged) return;
    const nextSession: AtlasPanelSession<Id> = payloadChanged || openChanged
      ? { ...previous, isOpen: true, revision: previous.revision + 1, payload: payloadChanged ? nextPayload : previous.payload }
      : previous;
    host.patchState({
      experienceMode: ATLAS_RESEARCH_PANEL_IDS.has(panelId) ? "research" : state.experienceMode,
      panels: {
        activePanelId: panelId,
        openPanelIds: openChanged ? [...panels.openPanelIds, panelId] : panels.openPanelIds,
        sessions: { ...panels.sessions, [panelId]: nextSession },
      },
    });
  };

  const closePanel = (panelId: AtlasPanelId): void => {
    const panels = host.getState().panels;
    const previous = panels.sessions[panelId];
    if (!previous.isOpen) return;
    const openPanelIds = panels.openPanelIds.filter((id) => id !== panelId);
    host.patchState({
      panels: {
        activePanelId: panels.activePanelId === panelId ? openPanelIds.at(-1) ?? null : panels.activePanelId,
        openPanelIds,
        sessions: {
          ...panels.sessions,
          [panelId]: { ...previous, isOpen: false, revision: previous.revision + 1 },
        },
      },
    });
  };

  const togglePanel = <Id extends AtlasPanelId>(panelId: Id, payload?: Partial<AtlasPanelPayloadMap[Id]>): void => {
    if (host.getState().panels.sessions[panelId].isOpen) closePanel(panelId);
    else openPanel(panelId, payload);
  };

  const setPanelOpen = <Id extends AtlasPanelId>(
    panelId: Id,
    next: AtlasPanelOpenStateAction,
    payload?: Partial<AtlasPanelPayloadMap[Id]>,
  ): void => {
    const previous = host.getState().panels.sessions[panelId].isOpen;
    const shouldOpen = typeof next === "function" ? next(previous) : next;
    if (shouldOpen) openPanel(panelId, payload);
    else closePanel(panelId);
  };

  const patchPanelSession = <Id extends AtlasPanelId>(
    panelId: Id,
    payload: Partial<AtlasPanelPayloadMap[Id]>,
  ): void => {
    const panels = host.getState().panels;
    const previous = panels.sessions[panelId] as AtlasPanelSession<Id>;
    const changed = Object.entries(payload).some(
      ([key, value]) => previous.payload[key as keyof AtlasPanelPayloadMap[Id]] !== value,
    );
    if (!changed) return;
    host.patchState({
      panels: {
        ...panels,
        sessions: {
          ...panels.sessions,
          [panelId]: { ...previous, revision: previous.revision + 1, payload: { ...previous.payload, ...payload } },
        },
      },
    });
  };

  const activatePanel = (panelId: AtlasPanelId): void => {
    const panels = host.getState().panels;
    if (!panels.sessions[panelId].isOpen || panels.activePanelId === panelId) return;
    host.patchState({ panels: { ...panels, activePanelId: panelId } });
  };

  return { setExperienceMode, openPanel, closePanel, togglePanel, setPanelOpen, patchPanelSession, activatePanel };
}
