export type ConstellationScreenRectV638 = Readonly<{ x: number; y: number; width: number; height: number }>;
export type ConstellationDomBlockerV638 = Readonly<{
  id: string;
  kind: "navigation" | "topline" | "passport" | "footer" | "other";
  rect: ConstellationScreenRectV638;
}>;
export type ConstellationDomMeasurementV638 = Readonly<{
  canvas: ConstellationScreenRectV638;
  viewport: ConstellationScreenRectV638;
  blockers: readonly ConstellationDomBlockerV638[];
}>;
export type ConstellationProjectedNodeV638 = Readonly<{ id: string; x: number; y: number; radius: number }>;
export type ConstellationProjectedSegmentV638 = Readonly<{ ax: number; ay: number; bx: number; by: number }>;
export type ConstellationLabelCandidateV638 = Readonly<{
  id: string; x: number; y: number; width: number; height: number;
}>;
export type ConstellationLabelPlacementV638 = Readonly<{
  id: string; left: number; top: number; width: number; height: number; offsetX: number; offsetY: number;
  leader: Readonly<{ x1: number; y1: number; x2: number; y2: number }> | null;
}>;
export type ConstellationLabelLayoutV638 = Readonly<{
  status: "ready" | "pending" | "unobserved";
  labelStatus: "ready" | "pending" | "unobserved";
  figureStatus: "measured-visible" | "pending" | "unobserved";
  placements: readonly ConstellationLabelPlacementV638[];
  pending: readonly Readonly<{ id: string; reason: "unobserved" | "unprojected" | "unmeasured" | "no-space" }>[];
  occludedNodeIds: readonly string[];
  clippedNodeIds: readonly string[];
  unprojectedNodeIds: readonly string[];
}>;

const NAVIGATION = 'nav[data-atlas-scale-band], [data-mainline-a-workspace-navigation="v637"]';
const TOPLINE = '[data-mainline-a-observation-topline="true"]';
const PASSPORT = '[data-celestial-object-passport-open="true"], [data-atlas-camera-safe-occluder="passport"]';
const FOOTER_BODY = '[data-atlas-cinematic-hud="bottom-dock"]';
const FOOTER = `footer[data-bottom-control-bar="true"], ${FOOTER_BODY}`;
const OTHER = '[data-atlas-camera-safe-occluder]';
const BOUNDARIES = `${NAVIGATION}, ${TOPLINE}, ${PASSPORT}, ${FOOTER}, ${OTHER}`;
const GAP = 5;
const finite = (values: readonly number[]) => values.every(Number.isFinite);
const validRect = (rect: ConstellationScreenRectV638) => finite(Object.values(rect)) && rect.width > 0 && rect.height > 0;
const right = (rect: ConstellationScreenRectV638) => rect.x + rect.width;
const bottom = (rect: ConstellationScreenRectV638) => rect.y + rect.height;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const expand = (rect: ConstellationScreenRectV638, padding: number): ConstellationScreenRectV638 => ({
  x: rect.x - padding, y: rect.y - padding, width: rect.width + 2 * padding, height: rect.height + 2 * padding,
});
const intersects = (a: ConstellationScreenRectV638, b: ConstellationScreenRectV638) =>
  a.x < right(b) && right(a) > b.x && a.y < bottom(b) && bottom(a) > b.y;
const contains = (outer: ConstellationScreenRectV638, inner: ConstellationScreenRectV638) =>
  inner.x >= outer.x && inner.y >= outer.y && right(inner) <= right(outer) && bottom(inner) <= bottom(outer);
function intersection(a: ConstellationScreenRectV638, b: ConstellationScreenRectV638): ConstellationScreenRectV638 {
  const x = Math.max(a.x, b.x); const y = Math.max(a.y, b.y);
  return { x, y, width: Math.max(0, Math.min(right(a), right(b)) - x), height: Math.max(0, Math.min(bottom(a), bottom(b)) - y) };
}
function box(element: HTMLElement): ConstellationScreenRectV638 {
  const rect = element.getBoundingClientRect();
  return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
}
function visible(element: HTMLElement): boolean {
  const view = element.ownerDocument.defaultView;
  if (!view || !element.isConnected || element.closest('[hidden]')) return false;
  for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
    const style = view.getComputedStyle(ancestor);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") return false;
  }
  return validRect(box(element));
}
function boundaryElements(canvas: HTMLElement): HTMLElement[] {
  const doc = canvas.ownerDocument;
  return [...new Set(Array.from(doc.querySelectorAll<HTMLElement>(BOUNDARIES))
    .map((element) => element.matches(FOOTER_BODY) ? element.closest<HTMLElement>("footer") ?? element : element))]
    .filter((element) => element !== doc.body && element !== doc.documentElement && !element.contains(canvas)
      && !element.matches('[data-atlas-app-shell], [data-atlas-visual-profile-v294]'));
}
function boundaryKind(element: HTMLElement): ConstellationDomBlockerV638["kind"] {
  if (element.matches(NAVIGATION)) return "navigation";
  if (element.matches(TOPLINE)) return "topline";
  if (element.matches(PASSPORT)) return "passport";
  if (element.matches(`footer, ${FOOTER}`)) return "footer";
  return "other";
}

/** Read current client CSS rectangles; no camera changes or fixed header offsets. */
export function readMainlineAConstellationDomV638(canvas: HTMLElement): ConstellationDomMeasurementV638 | null {
  const view = canvas.ownerDocument.defaultView;
  if (!view || !visible(canvas)) return null;
  const canvasRect = box(canvas);
  const viewport = intersection(canvasRect, {
    x: view.visualViewport?.offsetLeft ?? 0, y: view.visualViewport?.offsetTop ?? 0,
    width: view.visualViewport?.width ?? view.innerWidth, height: view.visualViewport?.height ?? view.innerHeight,
  });
  if (!validRect(viewport)) return null;
  const blockers = boundaryElements(canvas).filter(visible).map((element, index): ConstellationDomBlockerV638 => ({
    id: `${boundaryKind(element)}:${index}`, kind: boundaryKind(element), rect: box(element),
  })).filter((entry) => intersects(entry.rect, viewport));
  return { canvas: canvasRect, viewport, blockers };
}

/** Own only measurement observers; label/Html style writes do not retrigger them. */
export function observeMainlineAConstellationDomV638(
  canvas: HTMLElement, publish: (measurement: ConstellationDomMeasurementV638 | null) => void,
): () => void {
  const doc = canvas.ownerDocument; const view = doc.defaultView;
  if (!view) { publish(null); return () => undefined; }
  let disposed = false; let scheduled: number | null = null; let previous = "";
  let boundaries: HTMLElement[] = [];
  const observed = new Set<Element>();
  const update = () => {
    scheduled = null;
    if (disposed) return;
    boundaries = boundaryElements(canvas);
    const next = new Set<Element>([canvas, ...boundaries]);
    for (const element of observed) if (!next.has(element)) { resize.unobserve(element); observed.delete(element); }
    for (const element of next) if (!observed.has(element)) { resize.observe(element); observed.add(element); }
    const measurement = readMainlineAConstellationDomV638(canvas);
    const identity = JSON.stringify(measurement, (_key, value) => typeof value === "number" ? Math.round(value * 64) / 64 : value);
    if (identity !== previous) { previous = identity; publish(measurement); }
  };
  const schedule = () => { if (!disposed && scheduled === null) scheduled = view.requestAnimationFrame(update); };
  const resize = new ResizeObserver(schedule);
  const relevant = (node: Node): boolean => {
    if (node.nodeType !== 1) return boundaries.some((boundary) => boundary.contains(node));
    const element = node as HTMLElement;
    return element === canvas || element.contains(canvas) || element.matches(BOUNDARIES)
      || Boolean(element.querySelector(BOUNDARIES))
      || boundaries.some((boundary) => element === boundary || element.contains(boundary) || boundary.contains(element));
  };
  const mutation = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList"
      ? boundaries.some((boundary) => boundary.contains(record.target))
        || [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some(relevant)
      : relevant(record.target))) schedule();
  });
  mutation.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["class", "style", "hidden", "inert", "aria-hidden", "data-atlas-scale-band",
      "data-mainline-a-workspace-navigation", "data-mainline-a-observation-topline", "data-atlas-camera-safe-occluder",
      "data-celestial-object-passport-open", "data-atlas-cinematic-hud", "data-bottom-control-bar"] });
  const animation = (event: Event) => { if (event.target && relevant(event.target as Node)) schedule(); };
  view.addEventListener("resize", schedule);
  view.addEventListener("scroll", schedule, true);
  doc.addEventListener("transitionend", animation, true);
  doc.addEventListener("animationend", animation, true);
  view.visualViewport?.addEventListener("resize", schedule);
  view.visualViewport?.addEventListener("scroll", schedule);
  doc.fonts?.addEventListener("loadingdone", schedule);
  doc.fonts?.addEventListener("loadingerror", schedule);
  void doc.fonts?.ready.then(schedule);
  update();
  return () => {
    if (disposed) return;
    disposed = true;
    if (scheduled !== null) view.cancelAnimationFrame(scheduled);
    resize.disconnect(); mutation.disconnect(); observed.clear();
    view.removeEventListener("resize", schedule); view.removeEventListener("scroll", schedule, true);
    doc.removeEventListener("transitionend", animation, true); doc.removeEventListener("animationend", animation, true);
    view.visualViewport?.removeEventListener("resize", schedule); view.visualViewport?.removeEventListener("scroll", schedule);
    doc.fonts?.removeEventListener("loadingdone", schedule); doc.fonts?.removeEventListener("loadingerror", schedule);
  };
}

/** Liang-Barsky clipping includes an interior crossing even when both endpoints are outside. */
export function constellationSegmentOverlapsRectV638(segment: ConstellationProjectedSegmentV638, rect: ConstellationScreenRectV638): boolean {
  if (!finite(Object.values(segment)) || !validRect(rect)) return false;
  const dx = segment.bx - segment.ax; const dy = segment.by - segment.ay;
  const p = [-dx, dx, -dy, dy];
  const q = [segment.ax - rect.x, right(rect) - segment.ax, segment.ay - rect.y, bottom(rect) - segment.ay];
  let lower = 0; let upper = 1;
  for (let index = 0; index < 4; index++) {
    if (p[index] === 0) { if (q[index] < 0) return false; continue; }
    const ratio = q[index] / p[index];
    if (p[index] < 0) lower = Math.max(lower, ratio); else upper = Math.min(upper, ratio);
    if (lower > upper) return false;
  }
  return true;
}

/** Label placement and figure visibility are separate results; hidden nodes remain pending. */
export function layoutMainlineAConstellationOcclusionV638(input: {
  requiredIds: readonly string[];
  candidates: readonly ConstellationLabelCandidateV638[];
  measurement: ConstellationDomMeasurementV638 | null;
  bounds: ConstellationScreenRectV638;
  nodes: readonly ConstellationProjectedNodeV638[];
  segments: readonly ConstellationProjectedSegmentV638[];
}): ConstellationLabelLayoutV638 {
  const required = [...new Set(input.requiredIds)];
  if (!input.measurement) return { status: "unobserved", labelStatus: "unobserved", figureStatus: "unobserved", placements: [],
    pending: required.map((id) => ({ id, reason: "unobserved" })), occludedNodeIds: [], clippedNodeIds: [], unprojectedNodeIds: required.filter((id) => id !== "title") };
  const { measurement } = input;
  const bounds = intersection(input.bounds, measurement.viewport);
  const blockers = measurement.blockers.map((entry) => expand(entry.rect, GAP));
  const nodes = input.nodes.filter((node) => finite([node.x, node.y, node.radius]) && node.radius >= 0);
  const nodeRect = (node: ConstellationProjectedNodeV638) => ({ x: node.x - node.radius, y: node.y - node.radius,
    width: node.radius * 2, height: node.radius * 2 });
  const nodeObstacles = nodes.map((node) => expand(nodeRect(node), 3));
  const occludedNodeIds = nodes.filter((node) => measurement.blockers.some((entry) => intersects(nodeRect(node), entry.rect))).map((node) => node.id);
  const clippedNodeIds = nodes.filter((node) => !contains(measurement.viewport, nodeRect(node))).map((node) => node.id);
  const unprojectedNodeIds = required.filter((id) => id !== "title" && !nodes.some((node) => node.id === id));
  const placements: ConstellationLabelPlacementV638[] = [];
  const pending: Array<ConstellationLabelLayoutV638["pending"][number]> = [];
  const candidates = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  // Reserve full qualified identities before short names, then place the title
  // around the actual figure. The title may not cover its centroid node/lines.
  const order = [...required].sort((a, b) => Number(a === "title") - Number(b === "title")
    || (candidates.get(b)?.width ?? 0) - (candidates.get(a)?.width ?? 0));
  for (const id of order) {
    const candidate = candidates.get(id);
    if (!candidate || !finite([candidate.x, candidate.y])) { pending.push({ id, reason: "unprojected" }); continue; }
    const { x, y, width, height } = candidate;
    if (!finite([width, height]) || width <= 0 || height <= 0) { pending.push({ id, reason: "unmeasured" }); continue; }
    if (!validRect(bounds) || width > bounds.width || height > bounds.height) { pending.push({ id, reason: "no-space" }); continue; }
    const obstacles = [...blockers, ...nodeObstacles, ...placements.map((entry) => expand({ x: entry.left, y: entry.top, width: entry.width, height: entry.height }, GAP))];
    const fits = (left: number, top: number) => {
      const rect = { x: left, y: top, width, height };
      return contains(bounds, rect) && !obstacles.some((obstacle) => intersects(rect, obstacle))
        && !input.segments.some((segment) => constellationSegmentOverlapsRectV638(segment, expand(rect, 3)));
    };
    const local = [[x + 10, y - height - 10], [x - width - 10, y - height - 10], [x + 10, y + 10],
      [x - width - 10, y + 10], [x - width / 2, y - height - 14], [x - width / 2, y + 14],
      [x + 14, y - height / 2], [x - width - 14, y - height / 2]];
    let position = local.find(([left, top]) => fits(left, top));
    if (!position) {
      // Search measured obstacle edges and a bounded screen grid. This can
      // relocate a long label instead of clipping or abbreviating its identity.
      const xs = new Set([bounds.x, right(bounds) - width, clamp(x - width / 2, bounds.x, right(bounds) - width)]);
      const ys = new Set([bounds.y, bottom(bounds) - height, clamp(y - height / 2, bounds.y, bottom(bounds) - height)]);
      for (const obstacle of obstacles) {
        xs.add(clamp(obstacle.x - width, bounds.x, right(bounds) - width)); xs.add(clamp(right(obstacle), bounds.x, right(bounds) - width));
        ys.add(clamp(obstacle.y - height, bounds.y, bottom(bounds) - height)); ys.add(clamp(bottom(obstacle), bounds.y, bottom(bounds) - height));
      }
      for (let left = bounds.x; left <= right(bounds) - width; left += 24) xs.add(left);
      for (let top = bounds.y; top <= bottom(bounds) - height; top += 24) ys.add(top);
      let best = Infinity;
      for (const left of xs) for (const top of ys) {
        const distance = (clamp(x, left, left + width) - x) ** 2 + (clamp(y, top, top + height) - y) ** 2;
        const centerBias = ((left + width / 2 - x) ** 2 + (top + height / 2 - y) ** 2) * 0.002;
        if (distance + centerBias >= best || !fits(left, top)) continue;
        best = distance + centerBias; position = [left, top];
      }
    }
    if (!position) { pending.push({ id, reason: "no-space" }); continue; }
    const [left, top] = position;
    const edgeX = clamp(x, left, left + width); const edgeY = clamp(y, top, top + height);
    const length = Math.hypot(edgeX - x, edgeY - y);
    const leader = length > 30 ? { x1: (edgeX - x) * 7 / length, y1: (edgeY - y) * 7 / length, x2: edgeX - x, y2: edgeY - y } : null;
    placements.push({ id, left, top, width, height, offsetX: left - x, offsetY: top - y, leader });
  }
  const labelStatus = pending.length ? "pending" : "ready";
  const figureStatus = occludedNodeIds.length || clippedNodeIds.length || unprojectedNodeIds.length ? "pending" : "measured-visible";
  return { status: labelStatus === "ready" && figureStatus === "measured-visible" ? "ready" : "pending",
    labelStatus, figureStatus, placements, pending, occludedNodeIds, clippedNodeIds, unprojectedNodeIds };
}
