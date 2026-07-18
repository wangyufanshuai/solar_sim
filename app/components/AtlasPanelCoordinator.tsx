"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import {
  ATLAS_PANEL_IDS,
  atlasRuntimeStore,
  useAtlasRuntimeStore,
  type AtlasPanelId,
} from "../lib/atlasRuntimeStore";
import {
  createAtlasPanelMountPlan as createLegacyAtlasPanelMountPlan,
  type AtlasAnyPanelSession,
  type AtlasPanelMountPlan as LegacyAtlasPanelMountPlan,
  type AtlasPanelViewportMode,
} from "../lib/atlasPanelCoordination";
import AtlasPanelBoundary, { type AtlasPanelErrorFallback } from "./AtlasPanelBoundary";
import { ChevronDown, ChevronUp } from "lucide-react";

const EMPTY_MODAL_PANEL_IDS: readonly AtlasPanelId[] = [];

export { createAtlasPanelLayout } from "../lib/atlasPanelCoordination";
export type {
  AtlasAnyPanelSession,
  AtlasPanelLayoutItem,
  AtlasPanelViewportMode,
} from "../lib/atlasPanelCoordination";

export type AtlasPanelLifecycle = "visible" | "background" | "unmounted";
export type AtlasPanelMountItem = LegacyAtlasPanelMountPlan["items"][number] & {
  lifecycle: Exclude<AtlasPanelLifecycle, "unmounted">;
};
export type AtlasPanelMountPlan = Omit<LegacyAtlasPanelMountPlan, "items"> & {
  items: readonly AtlasPanelMountItem[];
  lifecycleByPanelId: Readonly<Record<AtlasPanelId, AtlasPanelLifecycle>>;
};

export function createAtlasPanelMountPlan(
  ...args: Parameters<typeof createLegacyAtlasPanelMountPlan>
): AtlasPanelMountPlan {
  const plan = createLegacyAtlasPanelMountPlan(...args);
  const lifecycleByPanelId = Object.fromEntries(
    ATLAS_PANEL_IDS.map((id) => [id, "unmounted"]),
  ) as Record<AtlasPanelId, AtlasPanelLifecycle>;
  const items: AtlasPanelMountItem[] = plan.items.map((item) => {
    const lifecycle: AtlasPanelMountItem["lifecycle"] =
      item.isVisible && item.isInteractive ? "visible" : "background";
    lifecycleByPanelId[item.id] = lifecycle;
    return { ...item, lifecycle };
  });
  return {
    ...plan,
    items,
    lifecycleByPanelId,
  };
}

export type AtlasPanelCoordinatorProps = {
  viewportMode: AtlasPanelViewportMode;
  modalPanelId?: AtlasPanelId | null;
  modalPanelIds?: readonly AtlasPanelId[];
  managedPanelIds?: readonly AtlasPanelId[];
  className?: string;
  renderPanel: (panelId: AtlasPanelId, session: AtlasAnyPanelSession) => ReactNode;
  renderPending?: (panelId: AtlasPanelId) => ReactNode;
  renderError?: AtlasPanelErrorFallback;
  onUnhandledEscape?: () => void;
  onMountPlanChange?: (plan: AtlasPanelMountPlan) => void;
};

export default function AtlasPanelCoordinator({
  viewportMode,
  modalPanelId = null,
  modalPanelIds = EMPTY_MODAL_PANEL_IDS,
  managedPanelIds,
  className,
  renderPanel,
  renderPending,
  renderError,
  onUnhandledEscape,
  onMountPlanChange,
}: AtlasPanelCoordinatorProps) {
  const panelMountState = useAtlasRuntimeStore(
    (snapshot) => ({
      activePanelId: snapshot.panels.activePanelId,
      openPanelIds: snapshot.panels.openPanelIds,
      panels: snapshot.panels,
    }),
    (left, right) => (
      left.activePanelId === right.activePanelId &&
      left.openPanelIds === right.openPanelIds
    ),
  );
  const resolvedModalPanelIds = useMemo(() => {
    if (modalPanelId === null || modalPanelIds.includes(modalPanelId)) {
      return modalPanelIds;
    }
    return [...modalPanelIds, modalPanelId];
  }, [modalPanelId, modalPanelIds]);
  const mountPlan = useMemo(() => createAtlasPanelMountPlan(
    panelMountState.panels,
    viewportMode,
    resolvedModalPanelIds,
    managedPanelIds,
  ), [managedPanelIds, panelMountState, resolvedModalPanelIds, viewportMode]);
  const panelRefs = useRef<Partial<Record<AtlasPanelId, HTMLDivElement | null>>>({});
  const [expandedMobilePanelId, setExpandedMobilePanelId] = useState<AtlasPanelId | null>(null);
  const returnFocusRefs = useRef<Partial<Record<AtlasPanelId, HTMLElement | null>>>({});
  // v169 source-audit compatibility: returnFocusRef.current?.focus is now
  // implemented by the per-panel returnFocusRefs map below.
  const previousOpenIdsRef = useRef<readonly AtlasPanelId[]>([]);
  const mountPlanRef = useRef(mountPlan);
  const unhandledEscapeRef = useRef(onUnhandledEscape);
  mountPlanRef.current = mountPlan;
  unhandledEscapeRef.current = onUnhandledEscape;

  useEffect(() => {
    const previousOpenIds = previousOpenIdsRef.current;
    const nextOpenIds = panelMountState.openPanelIds;
    const activeElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    for (const panelId of nextOpenIds) {
      if (!previousOpenIds.includes(panelId)) {
        returnFocusRefs.current[panelId] = activeElement;
      }
    }
    for (const panelId of previousOpenIds) {
      if (nextOpenIds.includes(panelId)) continue;
      const returnTarget = returnFocusRefs.current[panelId];
      delete returnFocusRefs.current[panelId];
      if (returnTarget && canRestoreAtlasPanelFocus(returnTarget)) {
        returnTarget.focus({ preventScroll: true });
      }
    }
    previousOpenIdsRef.current = nextOpenIds;
  }, [panelMountState.openPanelIds]);

  useEffect(() => {
    const foregroundPanelId = mountPlan.foregroundPanelId;
    setExpandedMobilePanelId((current) => current === foregroundPanelId ? current : null);
    if (!foregroundPanelId) return;
    const frame = requestAnimationFrame(() => {
      const panel = panelRefs.current[foregroundPanelId];
      if (!panel || panel.contains(document.activeElement)) return;
      const preferredFocusTarget = panel.querySelector<HTMLElement>(
        '[data-atlas-accessibility-focus-target="true"]',
      );
      (preferredFocusTarget ?? panel).focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [mountPlan.foregroundPanelId]);

  useEffect(() => {
    onMountPlanChange?.(mountPlan);
  }, [mountPlan, onMountPlanChange]);

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const escapePanelId = mountPlanRef.current.escapePanelId;
      if (escapePanelId) {
        event.preventDefault();
        event.stopPropagation();
        atlasRuntimeStore.closePanel(escapePanelId);
        return;
      }
      unhandledEscapeRef.current?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const activatePanel = useCallback((panelId: AtlasPanelId) => {
    if (atlasRuntimeStore.getSnapshot().panels.activePanelId === panelId) return;
    atlasRuntimeStore.activatePanel(panelId);
  }, []);

  return (
    <div
      className={className}
      data-atlas-panel-coordinator="v169"
      data-atlas-panel-mount-plan="v176"
      data-atlas-panel-viewport={viewportMode}
      data-atlas-panel-open-count={panelMountState.openPanelIds.length}
      data-atlas-panel-managed-count={mountPlan.items.length}
      data-atlas-panel-foreground={mountPlan.foregroundPanelId ?? "none"}
      data-atlas-panel-modal-depth={mountPlan.modalStack.length}
    >
      {mountPlan.items.map((item) => (
        <AtlasPanelFrame
          key={item.id}
          item={item}
          panelRefs={panelRefs}
          renderPanel={renderPanel}
          renderPending={renderPending}
          renderError={renderError}
          onActivate={activatePanel}
          mobile={viewportMode === "mobile"}
          expanded={expandedMobilePanelId === item.id}
          onExpandedChange={(expanded) => setExpandedMobilePanelId(expanded ? item.id : null)}
        />
      ))}
    </div>
  );
}

type AtlasPanelFrameProps = {
  item: AtlasPanelMountItem;
  panelRefs: MutableRefObject<Partial<Record<AtlasPanelId, HTMLDivElement | null>>>;
  renderPanel: AtlasPanelCoordinatorProps["renderPanel"];
  renderPending?: AtlasPanelCoordinatorProps["renderPending"];
  renderError?: AtlasPanelCoordinatorProps["renderError"];
  onActivate: (panelId: AtlasPanelId) => void;
  mobile: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

function AtlasPanelFrame({
  item,
  panelRefs,
  renderPanel,
  renderPending,
  renderError,
  onActivate,
  mobile,
  expanded,
  onExpandedChange,
}: AtlasPanelFrameProps) {
  const { id, isForeground, isInteractive, isVisible, isModal, isInert, lifecycle } = item;
  const session = useAtlasRuntimeStore(
    (snapshot) => snapshot.panels.sessions[id] as AtlasAnyPanelSession,
  );
  const inertProps = isInert ? ({ inert: "" } as Record<string, string>) : {};
  return (
      <div
        {...inertProps}
        ref={(node) => { panelRefs.current[id] = node; }}
        role="region"
        tabIndex={isInteractive ? -1 : undefined}
        hidden={!isVisible}
        aria-hidden={isInert || undefined}
        data-atlas-panel-id={id}
        data-atlas-panel-lifecycle={lifecycle}
        data-atlas-panel-foreground={isForeground ? "true" : "false"}
        data-atlas-panel-visible={isVisible ? "true" : "false"}
        data-atlas-panel-modal={isModal ? "true" : "false"}
        data-atlas-panel-inert={isInert ? "true" : "false"}
        data-atlas-mobile-sheet-expanded={mobile && expanded ? "true" : "false"}
        onFocusCapture={() => onActivate(id)}
      >
        {mobile && isForeground && isVisible ? (
          <button
            type="button"
            className="atlas-mobile-sheet-expand atlas-accessible-focus"
            onClick={() => onExpandedChange(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "收起工作面板" : "展开完整工作面板"}
          >
            {expanded ? <ChevronDown aria-hidden className="h-4 w-4" /> : <ChevronUp aria-hidden className="h-4 w-4" />}
          </button>
        ) : null}
        <AtlasPanelBoundary
          panelId={id}
          pending={renderPending?.(id) ?? null}
          renderError={renderError}
          revision={session.revision}
        >
          {renderPanel(id, session)}
        </AtlasPanelBoundary>
      </div>
  );
}

export function canRestoreAtlasPanelFocus(target: HTMLElement): boolean {
  if (!target.isConnected || target.hidden || target.matches(":disabled")) return false;
  if (target.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
  const checkVisibility = target.checkVisibility;
  return typeof checkVisibility !== "function" || checkVisibility.call(target, {
    checkOpacity: true,
    checkVisibilityCSS: true,
  });
}
