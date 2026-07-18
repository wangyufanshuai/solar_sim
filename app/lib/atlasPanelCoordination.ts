import type {
  AtlasPanelId,
  AtlasPanelSession,
  AtlasPanelState,
} from "./atlasRuntimeStore";

export type AtlasPanelViewportMode = "desktop" | "mobile";

export type AtlasAnyPanelSession = {
  [Id in AtlasPanelId]: AtlasPanelSession<Id>;
}[AtlasPanelId];

export type AtlasPanelLayoutItem = {
  id: AtlasPanelId;
  isForeground: boolean;
  isInteractive: boolean;
};

export type AtlasPanelMountItem = AtlasPanelLayoutItem & {
  isMounted: true;
  isVisible: boolean;
  isModal: boolean;
  isInert: boolean;
};

/**
 * The coordinator's complete render plan. In mobile mode every open session is
 * retained in `items`; only `foregroundPanelId` is visible and interactive.
 */
export type AtlasPanelMountPlan = {
  viewportMode: AtlasPanelViewportMode;
  foregroundPanelId: AtlasPanelId | null;
  modalStack: readonly AtlasPanelId[];
  escapePanelId: AtlasPanelId | null;
  items: readonly AtlasPanelMountItem[];
};

/**
 * Resolve low-to-high modal priority. `modalPanelIds` order is the explicit
 * priority contract; the panel open order is the stable tie-breaker.
 */
export function createAtlasPanelModalStack(
  panels: AtlasPanelState,
  modalPanelIds: readonly AtlasPanelId[],
): readonly AtlasPanelId[] {
  const priority = new Map(modalPanelIds.map((id, index) => [id, index]));
  return panels.openPanelIds
    .filter((id) => panels.sessions[id].isOpen && priority.has(id))
    .map((id, openIndex) => ({ id, openIndex, priority: priority.get(id) ?? -1 }))
    .sort((left, right) => (
      left.priority - right.priority || left.openIndex - right.openIndex
    ))
    .map(({ id }) => id);
}

export function createAtlasPanelMountPlan(
  panels: AtlasPanelState,
  viewportMode: AtlasPanelViewportMode,
  modalPanelIds: readonly AtlasPanelId[] = [],
  managedPanelIds?: readonly AtlasPanelId[],
): AtlasPanelMountPlan {
  const managedPanelIdSet = managedPanelIds ? new Set(managedPanelIds) : null;
  const openIds = panels.openPanelIds.filter((id) => (
    panels.sessions[id].isOpen && (managedPanelIdSet === null || managedPanelIdSet.has(id))
  ));
  const modalStack = createAtlasPanelModalStack(panels, modalPanelIds)
    .filter((id) => managedPanelIdSet === null || managedPanelIdSet.has(id));
  const topModalId = modalStack.at(-1) ?? null;
  const foregroundPanelId = topModalId ?? (
    panels.activePanelId && openIds.includes(panels.activePanelId)
      ? panels.activePanelId
      : openIds.at(-1) ?? null
  );

  const items = openIds.map<AtlasPanelMountItem>((id) => {
    const isForeground = id === foregroundPanelId;
    const isVisible = viewportMode === "desktop" || isForeground;
    return {
      id,
      isMounted: true,
      isVisible,
      isForeground,
      isInteractive: isVisible && (topModalId === null || id === topModalId),
      isModal: modalStack.includes(id),
      isInert: !isVisible || topModalId !== null && id !== topModalId,
    };
  });

  return {
    viewportMode,
    foregroundPanelId,
    modalStack,
    escapePanelId: topModalId ?? foregroundPanelId,
    items,
  };
}

export function createAtlasPanelLayout(
  panels: AtlasPanelState,
  viewportMode: AtlasPanelViewportMode,
  modalPanelId: AtlasPanelId | null = null,
): readonly AtlasPanelLayoutItem[] {
  const openIds = panels.openPanelIds.filter((id) => panels.sessions[id].isOpen);
  const foregroundId = modalPanelId && panels.sessions[modalPanelId].isOpen
    ? modalPanelId
    : panels.activePanelId;

  if (viewportMode === "mobile") {
    const visibleId = foregroundId && panels.sessions[foregroundId].isOpen
      ? foregroundId
      : openIds.at(-1) ?? null;
    return visibleId ? [{ id: visibleId, isForeground: true, isInteractive: true }] : [];
  }

  const hasModal = modalPanelId !== null && panels.sessions[modalPanelId].isOpen;
  return openIds.map((id) => ({
    id,
    isForeground: id === foregroundId,
    isInteractive: !hasModal || id === modalPanelId,
  }));
}
