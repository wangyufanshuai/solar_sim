import { MAINLINE_A_OBSERVATION_ROUTES_V607, getMainlineAObservationStepCatalogIdV607 } from "../data/mainlineAObservationRoutesV607";
import type { AtlasRuntimeStoreState } from "./atlasRuntimeStore";

export const ORION_JOURNEY_M4 = MAINLINE_A_OBSERVATION_ROUTES_V607.find((route) => route.id === "orion-clouds-and-stars")!;
export type ObservationBookmarkM4 = { readonly catalogId: string };
export type ObservationJourneyStateM4 = {
  readonly index: number;
  readonly status: "travelling" | "ready" | "paused" | "returning" | "returned";
  readonly reason: string;
  readonly requestId: number;
  readonly target: string;
  readonly canReturn: boolean;
};
type Runtime = Pick<AtlasRuntimeStoreState, "experienceMode" | "sceneMode" | "sceneRevision" | "scaleBand" | "scaleJourney" | "selectedObjectId" | "focusRequestId" | "focusTransition">;
type Host<B extends ObservationBookmarkM4> = {
  read: () => Runtime;
  subscribe: (listener: () => void) => () => void;
  available: () => boolean;
  focus: (catalogId: string) => void;
  capture: () => B | null;
  restore: (bookmark: B, requestId: number) => boolean;
};
export function observationJourneyAllowedM4(runtime: Runtime): boolean {
  return runtime.experienceMode !== "research" && ["atlas", "inspect"].includes(runtime.sceneMode)
    && runtime.scaleJourney.lifecycle === "idle";
}
function contextKey(runtime: Runtime): string {
  return `${runtime.sceneMode}|${runtime.sceneRevision}|${runtime.scaleBand}|${runtime.scaleJourney.requestId}`;
}

/** Owns only a reading sequence. Selection and camera writes stay in the existing focus controller. */
export function createObservationJourneyM4<B extends ObservationBookmarkM4>(host: Host<B>) {
  let state: ObservationJourneyStateM4 | null = null;
  let bookmark: B | null = null;
  let originalContext = "";
  let ownedContext = "";
  let issuing = false;
  let connected = false;
  let disconnect: (() => void) | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  const clearDeadline = () => { if (timeout !== null) clearTimeout(timeout); timeout = null; };
  function publish(next: ObservationJourneyStateM4 | null) {
    state = next;
    listeners.forEach((listener) => listener());
  }
  function pause(reason: string, invalidate = false) {
    if (!state) return;
    clearDeadline();
    if (invalidate) bookmark = null;
    if (state.status === "paused" && state.reason === reason && state.canReturn === Boolean(bookmark)) return;
    publish({ ...state, status: "paused", reason, canReturn: Boolean(bookmark) });
  }
  function synchronize() {
    if (issuing || !state) return;
    const current = host.read();
    if (!host.available() || !observationJourneyAllowedM4(current)) {
      pause("当前视图暂不支持旅程；回到星空后可继续。", !observationJourneyAllowedM4(current));
      return;
    }
    if (contextKey(current) !== ownedContext) {
      pause("视图或尺度已改变；保留站点，继续时重新聚焦。", true);
      return;
    }
    if (state.status === "paused" || state.status === "returned") return;
    if (current.focusRequestId !== state.requestId || current.selectedObjectId !== state.target
      || current.focusTransition === "idle") {
      pause("已暂停，保留你的当前视点。", false);
      return;
    }
    if (current.focusTransition !== "locked" || state.status === "ready") return;
    clearDeadline();
    if (state.status === "returning") {
      const requestId = state.requestId;
      const restored = bookmark && originalContext === contextKey(current) && host.restore(bookmark, requestId);
      if (!restored) { pause("出发视点已失效；可继续路线或结束旅程。", true); return; }
      publish({ ...state, status: "returned", reason: "已回到出发视点。", canReturn: false });
    } else publish({ ...state, status: "ready", reason: "" });
  }
  function issue(index: number, returning = false): boolean {
    if (!connected || !state || !Number.isInteger(index) || index < 0 || index >= ORION_JOURNEY_M4.steps.length) return false;
    const before = host.read();
    if (!host.available() || !observationJourneyAllowedM4(before)) {
      pause("镜头暂被其他视图使用；稍后继续。", false);
      return false;
    }
    const target = returning ? bookmark?.catalogId : getMainlineAObservationStepCatalogIdV607(ORION_JOURNEY_M4.steps[index]);
    if (!target || (returning && originalContext !== contextKey(before))) {
      pause("出发视点已失效；可继续路线或结束旅程。", true);
      return false;
    }
    clearDeadline();
    issuing = true;
    try { host.focus(target); } finally { issuing = false; }
    const after = host.read();
    if (after.focusRequestId <= before.focusRequestId || after.selectedObjectId !== target) {
      pause("未能聚焦本站，请重试。", false);
      return false;
    }
    ownedContext = contextKey(after);
    publish({ index, status: returning ? "returning" : "travelling", reason: "", requestId: after.focusRequestId,
      target, canReturn: Boolean(bookmark) });
    const requestId = after.focusRequestId;
    timeout = setTimeout(() => {
      if (state?.requestId === requestId && ["travelling", "returning"].includes(state.status)) pause("镜头尚未到达，可重试或结束旅程。");
    }, 12_000);
    synchronize();
    return true;
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    connect() {
      if (connected) return;
      connected = true;
      disconnect = host.subscribe(synchronize);
    },
    dispose() { connected = false; disconnect?.(); disconnect = null; clearDeadline(); bookmark = null; state = null; },
    synchronize,
    start(): boolean {
      const current = host.read();
      if (!connected || !host.available() || !observationJourneyAllowedM4(current) || current.focusTransition !== "locked") return false;
      const captured = host.capture();
      if (!captured) return false;
      bookmark = captured;
      originalContext = contextKey(current);
      ownedContext = originalContext;
      state = { index: 0, status: "paused", reason: "", requestId: current.focusRequestId,
        target: current.selectedObjectId, canReturn: true };
      return issue(0);
    },
    move(delta: -1 | 1) { return state?.status === "ready" ? issue(state.index + delta) : false; },
    resume() { return state?.status === "paused" ? issue(state.index) : false; },
    returnToStart() { return state && bookmark ? issue(state.index, true) : false; },
    end() { clearDeadline(); bookmark = null; publish(null); },
  };
}
