"use client";

import { useCallback, useRef, type ReactNode } from "react";
import type {
  AtlasPanelId,
  AtlasPanelSession,
} from "../lib/atlasRuntimeStore";
import type {
  AtlasAnyPanelSession,
  AtlasPanelViewportMode,
} from "../lib/atlasPanelCoordination";
import AtlasPanelCoordinator, {
  type AtlasPanelMountPlan,
} from "./AtlasPanelCoordinator";
import type { AtlasPanelErrorFallback } from "./AtlasPanelBoundary";

export type AtlasPanelRenderSlots = {
  [Id in AtlasPanelId]?: (session: AtlasPanelSession<Id>) => ReactNode;
};

export type AtlasRuntimePanelSurfaceProps = {
  viewportMode: AtlasPanelViewportMode;
  slots: AtlasPanelRenderSlots;
  modalPanelIds?: readonly AtlasPanelId[];
  managedPanelIds?: readonly AtlasPanelId[];
  className?: string;
  fallback?: (panelId: AtlasPanelId, session: AtlasAnyPanelSession) => ReactNode;
  pendingFallback?: (panelId: AtlasPanelId) => ReactNode;
  errorFallback?: AtlasPanelErrorFallback;
  onUnhandledEscape?: () => void;
  onMountPlanChange?: (plan: AtlasPanelMountPlan) => void;
};

function samePanelIds(
  left: readonly AtlasPanelId[],
  right: readonly AtlasPanelId[],
): boolean {
  return left.length === right.length && left.every((panelId, index) => panelId === right[index]);
}

function useStablePanelIds(
  managedPanelIds: readonly AtlasPanelId[] | undefined,
  slots: AtlasPanelRenderSlots,
): readonly AtlasPanelId[] {
  const stablePanelIdsRef = useRef<readonly AtlasPanelId[]>([]);
  const nextPanelIds = managedPanelIds ?? Object.keys(slots) as AtlasPanelId[];
  if (!samePanelIds(stablePanelIdsRef.current, nextPanelIds)) {
    stablePanelIdsRef.current = [...nextPanelIds];
  }
  return stablePanelIdsRef.current;
}

function renderTypedPanelSlot<Id extends AtlasPanelId>(
  slots: AtlasPanelRenderSlots,
  panelId: Id,
  session: AtlasPanelSession<Id>,
): ReactNode | undefined {
  const slot = slots[panelId] as ((value: AtlasPanelSession<Id>) => ReactNode) | undefined;
  return slot?.(session);
}

/**
 * Typed render-slot foundation for the v176 controller migration. Dynamic
 * panel imports remain owned by the caller and are only evaluated for mounted
 * store sessions.
 */
export default function AtlasRuntimePanelSurface({
  viewportMode,
  slots,
  modalPanelIds,
  managedPanelIds,
  className,
  fallback,
  pendingFallback,
  errorFallback,
  onUnhandledEscape,
  onMountPlanChange,
}: AtlasRuntimePanelSurfaceProps) {
  const registeredPanelIds = useStablePanelIds(managedPanelIds, slots);
  const slotsRef = useRef(slots);
  const fallbackRef = useRef(fallback);
  slotsRef.current = slots;
  fallbackRef.current = fallback;
  const renderPanel = useCallback((panelId: AtlasPanelId, session: AtlasAnyPanelSession) => (
    renderTypedPanelSlot(slotsRef.current, panelId, session) ??
    fallbackRef.current?.(panelId, session) ??
    null
  ), []);

  return (
    <AtlasPanelCoordinator
      viewportMode={viewportMode}
      modalPanelIds={modalPanelIds}
      managedPanelIds={registeredPanelIds}
      className={className}
      renderPanel={renderPanel}
      renderPending={pendingFallback}
      renderError={errorFallback}
      onUnhandledEscape={onUnhandledEscape}
      onMountPlanChange={onMountPlanChange}
    />
  );
}
