"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { getMainlineAObservationStepCatalogIdV607 } from "../data/mainlineAObservationRoutesV607";
import { atlasRuntimeStore, useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { atlasCameraPresentationCanWriteV273 } from "../lib/atlasCameraPresentationLeaseV273";
import { captureMainlineAObservationBookmarkM4, restoreMainlineAObservationBookmarkM4 } from "../lib/mainlineAObservationCameraBookmarkM4";
import { createObservationJourneyM4, observationJourneyAllowedM4, ORION_JOURNEY_M4, type ObservationJourneyStateM4 } from "../lib/mainlineAObservationJourneyM4";
import styles from "./MainlineAObservationJourneyM4.module.css";
import { registerMainlineAJourneyViewportM4 } from "../lib/mainlineAJourneyViewportM4";

const JourneyContext = createContext<{ start: () => boolean; end: () => void; enabled: boolean; active: boolean; state: ObservationJourneyStateM4 | null } | null>(null);
const emptySnapshot = () => null;

/** Reuses the measured passport header, leaving the restored sky composition unobstructed. */
export function ObservationJourneyReturnNoticeM4({ children }: { children: ReactNode }) {
  const journey = useContext(JourneyContext);
  const state = journey?.state;
  const hostRef = useRef<HTMLDivElement>(null);
  const previousReturn = useRef(false);
  const returning = Boolean(state && ["returning", "returned"].includes(state.status));
  useEffect(() => {
    const selector = returning && !previousReturn.current ? "button" : !returning && previousReturn.current ? "h2" : null;
    previousReturn.current = returning;
    if (!selector) return;
    // Let the passport's selection effect finish before handing focus to the new control.
    const frame = requestAnimationFrame(() => hostRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [returning]);
  if (!state || !returning) return <div ref={hostRef}>{children}</div>;
  return <div ref={hostRef} className={styles.returnNotice} data-mainline-a-journey="orion-clouds-and-stars"
    data-mainline-a-journey-return-in-passport="true" data-mainline-a-journey-status={state.status}
    data-mainline-a-journey-index={state.index} data-mainline-a-journey-target={state.target}
    data-mainline-a-journey-request={state.requestId}>
    <div className={styles.returnIdentity}>{children}</div>
    <button type="button" onClick={journey.end} aria-label="结束观测旅程">
      <span role="status">{state.status === "returning" ? "正在返回出发视点…" : "已回到出发视点"}</span>
      <span className={styles.eyebrow}>结束旅程</span>
    </button>
  </div>;
}

export function ObservationJourneyStartM4({ objectId, onStarted }: { objectId: string; onStarted?: () => void }) {
  const journey = useContext(JourneyContext);
  const belongs = ORION_JOURNEY_M4.steps.some((step) => step.objectId === objectId || getMainlineAObservationStepCatalogIdV607(step) === objectId);
  if (!journey || !belongs || journey.active) return null;
  return <button type="button" className={styles.start} disabled={!journey.enabled}
    data-mainline-a-journey-start="orion-clouds-and-stars" onClick={() => { if (journey.start()) onStarted?.(); }}>
    开始猎户座旅程 <span>5 站 →</span>
  </button>;
}

export function MainlineAObservationJourneyProviderM4({ children, onFocus, blocked = false }: {
  children: ReactNode; onFocus: (catalogId: string) => void; blocked?: boolean;
}) {
  const host = useRef({ onFocus, blocked });
  host.current = { onFocus, blocked };
  const [controller] = useState(() => createObservationJourneyM4({
    read: atlasRuntimeStore.getSnapshot,
    subscribe: atlasRuntimeStore.subscribe,
    available: () => !host.current.blocked && atlasCameraPresentationCanWriteV273("focus-lock"),
    focus: (catalogId) => host.current.onFocus(catalogId),
    capture: captureMainlineAObservationBookmarkM4,
    restore: restoreMainlineAObservationBookmarkM4,
  }));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, emptySnapshot);
  const active = state !== null && state.status !== "returning" && state.status !== "returned";
  const runtime = useAtlasRuntimeStore((snapshot) => snapshot);
  useEffect(() => { controller.connect(); return () => controller.dispose(); }, [controller]);
  useEffect(() => { controller.synchronize(); }, [blocked, controller]);
  useEffect(() => active ? registerMainlineAJourneyViewportM4() : undefined, [active]);
  const enabled = !blocked && observationJourneyAllowedM4(runtime) && runtime.focusTransition === "locked"
    && atlasCameraPresentationCanWriteV273("focus-lock");
  const step = state ? ORION_JOURNEY_M4.steps[state.index] : null;
  return <JourneyContext.Provider value={{ start: controller.start, end: controller.end, enabled, active: state !== null, state }}>
    {children}
    {state && step && active ? <aside className={styles.journey} aria-label="猎户座观测旅程"
      data-atlas-camera-safe-occluder="observation-route"
      data-mainline-a-journey="orion-clouds-and-stars" data-mainline-a-journey-status={state.status}
      data-mainline-a-journey-index={state.index} data-mainline-a-journey-target={state.target}
      data-mainline-a-journey-request={state.requestId}>
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}>猎户座旅程 · {state.index + 1} / 5</span><h3>{step.titleCn}</h3></div>
        <button type="button" className={styles.end} onClick={controller.end} aria-label="结束观测旅程">结束</button>
      </div>
      <details className={styles.story}><summary>本站看什么</summary>
        <p>{step.whyCn}</p><p className={styles.relation}>{step.relationType} · {step.relationNoteCn}</p>
      </details>
      <p className={styles.status} role="status">{state.reason || (state.status === "travelling" ? "正在前往本站…" : state.index === 4 ? "已到终站，可返回出发视点。" : "可自由观看，再前往下一站。")}</p>
      <div className={styles.actions}>
        <button type="button" onClick={() => controller.move(-1)} disabled={state.status !== "ready" || state.index === 0}>上一站</button>
        {state.status === "paused" ? <button type="button" onClick={controller.resume} disabled={blocked || !observationJourneyAllowedM4(runtime)}>继续旅程</button>
          : <button type="button" onClick={() => controller.move(1)} disabled={state.status !== "ready" || state.index === 4}>下一站</button>}
        <button type="button" onClick={controller.returnToStart} disabled={!state.canReturn || blocked}>返回出发视点</button>
      </div>
    </aside> : null}
  </JourneyContext.Provider>;
}
