import { focusMainlineATargetV637 } from "./mainlineAPanelNavigationV637";

export type MainlineAPerformanceDockRectV638 = Readonly<{ x: number; y: number; width: number; height: number }>;
export type MainlineAPerformanceDockFrameV638 = Readonly<{
  viewportWidth: number;
  viewportHeight: number;
  headerBottom: number;
  bottomBarTop: number;
  controlWidth: number;
  controlHeight: number;
  occluders?: readonly MainlineAPerformanceDockRectV638[];
}>;

export type MainlineAPerformanceDockLayoutV638 = Readonly<{
  status: "fits" | "compact" | "insufficient-space" | "invalid";
  mode: "full" | "compact" | "inline";
  hitStatus: "pending" | "clear" | "blocked";
  right: number;
  bottom: number;
  maxWidth: number;
  maxHeight: number;
  restoreRect: MainlineAPerformanceDockRectV638 | null;
}>;

const EDGE_GAP = 12;
export const MAINLINE_A_PERFORMANCE_DOCK_SIZE_V638 = { width: 172, height: 48 } as const;
export const MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638 = { width: 76, height: 28 } as const;

function validRect(rect: MainlineAPerformanceDockRectV638): boolean {
  return [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) && rect.width > 0 && rect.height > 0;
}

function freePosition(frame: MainlineAPerformanceDockFrameV638, width: number, height: number, gap: number) {
  const left = gap, right = frame.viewportWidth - gap;
  const top = Math.max(gap, frame.headerBottom + gap);
  const bottom = Math.min(frame.viewportHeight - gap, frame.bottomBarTop - gap);
  const obstacles = frame.occluders ?? [];
  // Rectangle edges enumerate every possible bottom/right-aligned free pocket.
  const xs = [right - width, left, ...obstacles.flatMap((r) => [r.x - gap - width, r.x + r.width + gap])];
  const ys = [bottom - height, top, ...obstacles.flatMap((r) => [r.y - gap - height, r.y + r.height + gap])];
  for (const y of [...new Set(ys)].sort((a, b) => b - a)) {
    for (const x of [...new Set(xs)].sort((a, b) => b - a)) {
      if (x < left || x + width > right || y < top || y + height > bottom) continue;
      if (obstacles.some((r) => x < r.x + r.width + gap && x + width > r.x - gap
        && y < r.y + r.height + gap && y + height > r.y - gap)) continue;
      return { x, y, width, height };
    }
  }
  return null;
}

export function resolveMainlineAPerformanceDockLayoutV638(
  frame: MainlineAPerformanceDockFrameV638,
): MainlineAPerformanceDockLayoutV638 {
  const { occluders = [], ...measurements } = frame;
  if (Object.values(measurements).some((value) => !Number.isFinite(value))
    || frame.viewportWidth <= 0 || frame.viewportHeight <= 0
    || frame.controlWidth <= 0 || frame.controlHeight <= 0 || occluders.some((r) => !validRect(r))) {
    return { status: "invalid", mode: "inline", hitStatus: "pending", right: EDGE_GAP, bottom: EDGE_GAP, maxWidth: 0, maxHeight: 0, restoreRect: null };
  }
  const top = Math.min(frame.viewportHeight, Math.max(EDGE_GAP, frame.headerBottom + EDGE_GAP));
  const lower = Math.max(0, Math.min(frame.viewportHeight - EDGE_GAP, frame.bottomBarTop - EDGE_GAP));
  const maxHeight = Math.max(0, lower - top);
  const maxWidth = Math.max(0, frame.viewportWidth - EDGE_GAP * 2);
  const full = freePosition(frame, frame.controlWidth, frame.controlHeight, EDGE_GAP);
  const compact = full ? null : freePosition(frame, MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638.width, MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638.height, 4);
  const rect = full ?? compact;
  return {
    status: full ? "fits" : compact ? "compact" : "insufficient-space",
    mode: full ? "full" : compact ? "compact" : "inline",
    hitStatus: "pending",
    right: rect ? frame.viewportWidth - rect.x - rect.width : EDGE_GAP,
    bottom: rect ? frame.viewportHeight - rect.y - rect.height : EDGE_GAP,
    maxWidth: rect ? Math.max(rect.width, maxWidth) : 0,
    maxHeight: rect ? Math.max(rect.height, maxHeight) : 0,
    restoreRect: rect,
  };
}

// Runtime evidence mirrors data attributes onto the app root. Match actual UI
// elements, never a telemetry marker by itself (068d mirrored passport-open).
const HEADER = 'div[data-mainline-a-workspace-navigation="v637"]';
const DOCK_BODY = 'div[data-atlas-cinematic-hud="bottom-dock"]';
const FOOTER = `footer[data-bottom-control-bar="true"], ${DOCK_BODY}`;
const PASSPORT = 'aside[data-celestial-object-passport-open="true"][data-atlas-camera-safe-occluder="passport"][aria-label="天体档案"]';
const BROWSER = 'aside#universe-object-browser[aria-label="对象浏览器"]';
const WORKBENCH = '#mainline-a-relativity-workbench-content[role="region"][data-mainline-a-relativity-expanded="true"]';
const MODAL = 'dialog[open], [role="dialog"][aria-modal="true"]';
const OCCLUDERS = [
  'aside[data-atlas-camera-safe-occluder="body-detail"][data-atlas-body-detail-sidebar="true"]', PASSPORT, BROWSER, WORKBENCH,
  'button[data-mainline-a-relativity-launcher="true"]', 'button[data-mainline-a-object-browser-toggle="true"]',
  // This DOM figure contains only the scene's readable caption/credit card;
  // the observation image is a separate WebGL mesh, not an excluded canvas.
  "figure[data-mainline-a-scene-nebula]", 'div[aria-label="更多图集工具"]', MODAL,
].join(", ");
const MEASURED = [HEADER, FOOTER, OCCLUDERS].join(", ");
const INLINE_SLOT = "[data-mainline-a-observer-inline-slot]";
const RESTORE = "[data-mainline-a-performance-restore]";

/** Preserve keyboard focus across a portal move without taking it from readers. */
export function restoreMainlineAPerformanceDockFocusV638(host: HTMLElement, inlineTarget: HTMLElement | null = null): boolean {
  const doc = host.ownerDocument;
  const target = host.querySelector<HTMLElement>(RESTORE) ?? inlineTarget?.querySelector<HTMLElement>(RESTORE) ?? null;
  const active = doc.activeElement;
  if (active && active !== doc.body && active !== doc.documentElement && active !== target) return false;
  return focusMainlineATargetV637(target);
}

/** Observe current DOM geometry, including panels mounted after this observer. */
export function observeMainlineAPerformanceDockLayoutV638(
  host: HTMLElement,
  publish: (layout: MainlineAPerformanceDockLayoutV638, inlineTarget: HTMLElement | null, restoreHadFocus: boolean) => void,
): () => void {
  const doc = host.ownerDocument;
  const view = doc.defaultView;
  if (!view) return () => undefined;
  let scheduled: number | null = null;
  let disposed = false;
  let inlineSlot: HTMLDivElement | null = null;
  const observed = new Set<Element>();
  const rejectedInlineHosts = new Map<HTMLElement, string>();
  const surfaceElements = (selector: string) => [...new Set(Array.from(doc.querySelectorAll<HTMLElement>(selector))
    // OrbitAtlasHud uses an unmarked footer around this named dock body.
    .map((element) => element.matches(DOCK_BODY) ? element.closest<HTMLElement>("footer") : element))]
    .filter((element): element is HTMLElement => element !== null)
    .filter((element) => element !== doc.body && element !== doc.documentElement
      && !element.matches("canvas, [data-atlas-app-shell], [data-atlas-visual-profile-v294]")
      && !element.contains(host) && !host.contains(element) && !element.querySelector("canvas"));
  const visibleRect = (element: HTMLElement | null): MainlineAPerformanceDockRectV638 | null => {
    if (!element?.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) return null;
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = view.getComputedStyle(ancestor);
      if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") return null;
    }
    const rect = element.getBoundingClientRect();
    return validRect(rect) && rect.right > 0 && rect.bottom > 0 && rect.left < view.innerWidth && rect.top < view.innerHeight
      ? { x: rect.left, y: rect.top, width: rect.width, height: rect.height } : null;
  };
  const ownsHitRect = (element: HTMLElement, rect: MainlineAPerformanceDockRectV638): boolean => {
    const { x, y, width: w, height: h } = rect;
    if (typeof doc.elementFromPoint !== "function" || w < 44 || h < 28 || x < 0 || y < 0 || x + w > view.innerWidth || y + h > view.innerHeight) return false;
    // Edge midpoints stay within the rounded button while detecting clipping
    // on every side; inset corner points can fall outside its pointer shape.
    return [[x + w / 2, y + 2], [x + w - 2, y + h / 2], [x + w / 2, y + h / 2], [x + 2, y + h / 2], [x + w / 2, y + h - 2]]
      .every(([px, py]) => { const hit = doc.elementFromPoint(px, py); return Boolean(hit && element.contains(hit)); });
  };
  const usableInlineSlot = (slot: HTMLElement): boolean => {
    const slotRect = visibleRect(slot);
    if (!slotRect || typeof doc.elementFromPoint !== "function") return false;
    const restore = slot.querySelector<HTMLElement>(RESTORE);
    const width = Math.min(MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638.width, slotRect.width - 8);
    const rect = restore ? visibleRect(restore) : {
      x: slotRect.x + slotRect.width - 4 - width, y: slotRect.y + 4,
      width, height: MAINLINE_A_PERFORMANCE_COMPACT_SIZE_V638.height,
    };
    if (!rect || rect.width < 44 || rect.height < 28 || slotRect.height < rect.height + 8
      || rect.x < 0 || rect.y < 0 || rect.x + rect.width > view.innerWidth || rect.y + rect.height > view.innerHeight) return false;
    // Check the actual reserved row after layout. Non-zero geometry alone does
    // not prove it is exposed: a toolbar/ancestor clip can intercept its input.
    return ownsHitRect(restore ?? slot, rect);
  };
  const update = () => {
    scheduled = null;
    if (disposed) return;
    const elements = new Set<Element>(surfaceElements(MEASURED));
    const restore = host.querySelector<HTMLElement>(RESTORE) ?? inlineSlot?.querySelector<HTMLElement>(RESTORE) ?? null;
    const restoreHadFocus = Boolean(restore && doc.activeElement === restore);
    if (restore) elements.add(restore);
    for (const element of observed) if (!elements.has(element)) { resize.unobserve(element); observed.delete(element); }
    for (const element of elements) if (!observed.has(element)) { resize.observe(element); observed.add(element); }
    const header = surfaceElements(HEADER).map(visibleRect).find((rect) => rect !== null);
    const footer = surfaceElements(FOOTER).map(visibleRect).find((rect) => rect !== null);
    const occluders = surfaceElements(OCCLUDERS).map(visibleRect).filter((r) => r !== null);
    const next = resolveMainlineAPerformanceDockLayoutV638({
      viewportWidth: view.innerWidth, viewportHeight: view.innerHeight,
      headerBottom: header ? header.y + header.height : 0,
      bottomBarTop: footer?.y ?? view.innerHeight,
      controlWidth: MAINLINE_A_PERFORMANCE_DOCK_SIZE_V638.width,
      controlHeight: MAINLINE_A_PERFORMANCE_DOCK_SIZE_V638.height,
      occluders,
    });
    // No safe floating pocket: reserve a real row in the visible panel. Its
    // scrollable reading area reflows; the observer session stays mounted.
    const modalOpen = surfaceElements(MODAL).some((element) => visibleRect(element));
    const docked = host.querySelector<HTMLElement>('[data-mainline-a-performance-docked="true"]');
    const fallbacks = next.mode === "inline" && docked && !modalOpen
      ? [PASSPORT, BROWSER, WORKBENCH, FOOTER, HEADER].flatMap(surfaceElements).filter((element) => visibleRect(element))
      : [];
    if (inlineSlot && !fallbacks.includes(inlineSlot.parentElement!)) { inlineSlot.remove(); inlineSlot = null; }
    for (const fallback of fallbacks) {
      const bounds = fallback.getBoundingClientRect();
      const geometryKey = [view.innerWidth, view.innerHeight, bounds.x, bounds.y, bounds.width, bounds.height].join(":");
      if (rejectedInlineHosts.get(fallback) === geometryKey) continue;
      if (inlineSlot && inlineSlot.parentElement !== fallback) { inlineSlot.remove(); inlineSlot = null; }
      if (!inlineSlot) {
        inlineSlot = doc.createElement("div");
        inlineSlot.setAttribute("data-mainline-a-observer-inline-slot", "true");
        inlineSlot.style.cssText = "display:flex;justify-content:flex-end;flex:0 0 auto;min-width:0;min-height:36px;padding:4px;position:relative;pointer-events:auto";
        fallback.insertBefore(inlineSlot, fallback.firstChild);
      }
      if (usableInlineSlot(inlineSlot)) break;
      if (inlineSlot.querySelector(RESTORE)) rejectedInlineHosts.set(fallback, geometryKey);
      inlineSlot.remove(); inlineSlot = null;
    }
    let hitStatus: MainlineAPerformanceDockLayoutV638["hitStatus"] = "pending";
    const actual = visibleRect(restore);
    const expected = next.restoreRect;
    const placed = next.mode === "inline" ? Boolean(restore && inlineSlot?.contains(restore))
      : Boolean(actual && expected && (["x", "y", "width", "height"] as const).every((key) => Math.abs(actual[key] - expected[key]) < 1));
    if (docked && restore && actual && placed && restore.getAttribute("data-mainline-a-performance-restore-mode") === next.mode) {
      hitStatus = ownsHitRect(restore, actual) ? "clear" : "blocked";
    }
    publish(modalOpen ? { ...next, status: "insufficient-space", mode: "inline", hitStatus: "blocked", restoreRect: null } : { ...next, hitStatus }, inlineSlot, restoreHadFocus);
  };
  const schedule = () => { if (!disposed && scheduled === null) scheduled = view.requestAnimationFrame(update); };
  const scheduleExternal = () => { rejectedInlineHosts.clear(); schedule(); };
  const resize = new ResizeObserver((entries = []) => {
    if (entries.some(({ target }) => !host.contains(target) && !inlineSlot?.contains(target))) rejectedInlineHosts.clear();
    schedule();
  });
  const mutation = new MutationObserver((records) => {
    let external = false;
    if (records.some((record) => {
      const element = record.target as HTMLElement;
      const restoreMounted = record.type === "childList" && [...record.addedNodes]
        .some((node) => node.nodeType === 1 && ((node as Element).matches(RESTORE) || (node as Element).querySelector(RESTORE)));
      // Portal commit must get a second check against the real button, even
      // when the empty reserved row passed its preliminary hit test.
      if (element.closest?.(INLINE_SLOT)) return restoreMounted;
      if (record.attributeName === "data-mainline-a-performance-docked") return true;
      if (host.contains(element)) return restoreMounted || (record.attributeName === "style" && element.matches("[data-mainline-a-performance], [data-mainline-a-performance-restore]"));
      if (record.type === "childList") return external = [...record.addedNodes, ...record.removedNodes]
        .some((node) => node.nodeType === 1 && !(node as Element).matches(INLINE_SLOT));
      return external = element.matches?.(MEASURED) || [...observed].some((target) => target === element || element.contains?.(target));
    })) { if (external) rejectedInlineHosts.clear(); schedule(); }
  });
  mutation.observe(doc.body, { subtree: true, childList: true, attributes: true,
    attributeFilter: ["hidden", "inert", "aria-hidden", "class", "style", "open", "data-mainline-a-performance-docked", "data-celestial-object-passport-open", "data-mainline-a-relativity-expanded"] });
  view.addEventListener("resize", scheduleExternal);
  view.addEventListener("scroll", scheduleExternal, true);
  doc.addEventListener("transitionend", scheduleExternal, true);
  view.visualViewport?.addEventListener("resize", scheduleExternal);
  view.visualViewport?.addEventListener("scroll", scheduleExternal);
  update();
  return () => {
    disposed = true;
    resize.disconnect(); mutation.disconnect();
    view.removeEventListener("resize", scheduleExternal);
    view.removeEventListener("scroll", scheduleExternal, true);
    doc.removeEventListener("transitionend", scheduleExternal, true);
    view.visualViewport?.removeEventListener("resize", scheduleExternal);
    view.visualViewport?.removeEventListener("scroll", scheduleExternal);
    if (scheduled !== null) view.cancelAnimationFrame(scheduled);
    inlineSlot?.remove();
  };
}
