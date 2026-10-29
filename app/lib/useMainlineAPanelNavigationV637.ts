"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  attachMainlineAPanelBoundaryV637,
  createMainlineAPanelNavigationV637,
  isMainlineAPanelIdV637,
  mainlineAPanelOpenerKeyV637,
  reduceMainlineAPanelNavigationV637,
  restoreMainlineAPanelFocusV637,
  type MainlineAPanelCloseReasonV637,
  type MainlineAPanelIdV637,
  type MainlineAPanelNavigationActionV637,
} from "./mainlineAPanelNavigationV637";

type Options = Readonly<{ fallbackFocus?: () => HTMLElement | null }>;

export function useMainlineAPanelNavigationV637(options: Options = {}) {
  const [state, dispatch] = useReducer(reduceMainlineAPanelNavigationV637, undefined, createMainlineAPanelNavigationV637);
  const [boundary, setBoundary] = useState<HTMLElement | null>(null);
  const stateRef = useRef(state);
  const boundaryElementRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const nativeCancelSessionRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  const mountedRef = useRef(false);
  stateRef.current = state;
  optionsRef.current = options;

  const apply = useCallback((action: MainlineAPanelNavigationActionV637) => {
    const current = stateRef.current;
    const next = reduceMainlineAPanelNavigationV637(current, action);
    if (next === current) return false;
    stateRef.current = next;
    dispatch(action);
    return true;
  }, []);

  const boundaryRef = useCallback((node: HTMLElement | null) => {
    boundaryElementRef.current = node;
    setBoundary(node);
  }, []);

  const openPanel = useCallback((panel: MainlineAPanelIdV637, opener?: HTMLElement | null) => {
    if (!isMainlineAPanelIdV637(panel) || stateRef.current.activePanel === panel) return;
    const focused = typeof document === "undefined" ? null : document.activeElement;
    const candidate = opener ?? (focused instanceof HTMLElement ? focused : null);
    if (candidate && !boundaryElementRef.current?.contains(candidate)) openerRef.current = candidate;
    if (stateRef.current.phase === "closed" && !candidate) openerRef.current = null;
    apply({ type: "open", panel, openerKey: mainlineAPanelOpenerKeyV637(openerRef.current, panel) });
  }, [apply]);

  const session = state.session;
  const closePanel = useCallback((
    reason: MainlineAPanelCloseReasonV637 = "close-button",
    expectedPanel?: MainlineAPanelIdV637,
  ) => {
    if (session === null) return;
    const closeReason = reason === "close-button" && nativeCancelSessionRef.current === session ? "escape" : reason;
    apply({ type: "close", reason: closeReason, expectedSession: session, expectedPanel });
  }, [apply, session]);

  const togglePanel = useCallback((panel: MainlineAPanelIdV637, opener?: HTMLElement | null) => {
    const current = stateRef.current;
    if (current.phase === "open" && current.activePanel === panel) {
      apply({ type: "close", reason: "close-button", expectedSession: current.session, expectedPanel: panel });
    } else openPanel(panel, opener);
  }, [apply, openPanel]);

  useEffect(() => {
    if (state.phase !== "open" || !boundary) return;
    const expectedSession = state.session;
    const controller = attachMainlineAPanelBoundaryV637(boundary, {
      panel: state.activePanel,
      onClose: (reason) => apply({ type: "close", reason, expectedSession, expectedPanel: state.activePanel }),
      onNativeCancel: () => {
        nativeCancelSessionRef.current = expectedSession;
        queueMicrotask(() => {
          if (nativeCancelSessionRef.current === expectedSession) nativeCancelSessionRef.current = null;
        });
      },
    });
    return () => controller.stop();
  }, [apply, boundary, state.activePanel, state.phase, state.session]);

  useEffect(() => {
    if (state.phase !== "closed" || state.revision === 0) return;
    const revision = state.revision;
    const frame = window.requestAnimationFrame(() => {
      if (stateRef.current.phase !== "closed" || stateRef.current.revision !== revision) return;
      restoreMainlineAPanelFocusV637(openerRef.current, optionsRef.current.fallbackFocus?.() ?? null);
      openerRef.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.phase, state.revision]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const opener = openerRef.current;
      const wasOpen = stateRef.current.phase === "open";
      queueMicrotask(() => {
        if (mountedRef.current || !wasOpen) return;
        restoreMainlineAPanelFocusV637(opener, optionsRef.current.fallbackFocus?.() ?? null);
      });
    };
  }, []);

  return { activePanel: state.activePanel, state, openPanel, togglePanel, closePanel, boundaryRef };
}
