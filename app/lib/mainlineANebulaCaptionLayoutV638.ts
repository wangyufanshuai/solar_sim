import { Vector3, type Camera, type Mesh, type Object3D } from "three";
import type { AtlasSafeViewportRect } from "./atlasCameraFrameSolverV4";

export type NebulaCaptionRectV638 = Readonly<{ x: number; y: number; width: number; height: number }>;
export type NebulaCaptionMeasurementV638 = Readonly<{
  canvas: NebulaCaptionRectV638;
  safeTop: number;
  safeBottom: number;
  safeLeft?: number;
  safeRight?: number;
  naturalHeight: number;
  insetHeight: number;
}>;
export type NebulaCaptionLayoutV638 = Readonly<{
  imageScale: number;
  imageCenterY: number;
  imageHeight: number;
  captionTop: number;
  captionMaxHeight: number;
  captionMaxWidth?: number;
  gap: number;
  scrollable: boolean;
}>;
export type NebulaCaptionProjectionV638 = Readonly<{
  anchorX?: number;
  anchorY: number;
  preferredImageHeight: number;
  unitsPerPixelY: number;
}>;

const GAP = 12;
const HEADER = 'div[data-mainline-a-workspace-navigation="v637"], div[data-mainline-a-observation-topline="true"]';
const FOOTER_BODY = 'div[data-atlas-cinematic-hud="bottom-dock"]';
const FOOTER = `footer[data-bottom-control-bar="true"], ${FOOTER_BODY}`;
const CONTENT = "[data-mainline-a-nebula-caption-content]";
const SCROLL_HINT = "[data-mainline-a-nebula-caption-scroll-hint]";
const finite = (values: readonly number[]) => values.every(Number.isFinite);
const clamp = (value: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, value));

/** Read the camera's measured free rectangle without moving its target or writing scientific state. */
export function constrainMainlineANebulaCaptionMeasurementV638(
  measurement: NebulaCaptionMeasurementV638, runtimeRect: AtlasSafeViewportRect | null,
): NebulaCaptionMeasurementV638 {
  if (!runtimeRect || !finite(Object.values(runtimeRect)) || runtimeRect.viewportWidth <= 0 || runtimeRect.viewportHeight <= 0) return measurement;
  const { canvas } = measurement;
  const sx = canvas.width / runtimeRect.viewportWidth;
  const sy = canvas.height / runtimeRect.viewportHeight;
  return {
    ...measurement,
    safeTop: Math.max(measurement.safeTop, canvas.y + runtimeRect.top * sy + GAP),
    safeBottom: Math.min(measurement.safeBottom, canvas.y + runtimeRect.bottom * sy - GAP),
    safeLeft: Math.max(canvas.x, canvas.x + runtimeRect.left * sx),
    safeRight: Math.min(canvas.x + canvas.width, canvas.x + runtimeRect.right * sx),
  };
}

/** Fit the measured inspection image in CSS pixels; camera depth must not turn it into a thumbnail. */
export function fitMainlineANebulaPortraitFrameV638(
  frame: Readonly<{ width: number; height: number }>, projection: NebulaCaptionProjectionV638 | null,
  measurement: NebulaCaptionMeasurementV638 | null,
): Readonly<{ width: number; height: number }> {
  if (!projection || !measurement || !finite([frame.width, frame.height, projection.unitsPerPixelY])
    || frame.width <= 0 || frame.height <= 0 || projection.unitsPerPixelY <= 0) return frame;
  const left = measurement.safeLeft ?? measurement.canvas.x;
  const right = measurement.safeRight ?? measurement.canvas.x + measurement.canvas.width;
  const anchor = projection.anchorX ?? (left + right) / 2;
  const aspect = frame.width / frame.height;
  if (!finite([...Object.values(measurement.canvas), left, right, anchor, aspect])
    || measurement.canvas.width <= 0 || measurement.canvas.height <= 0 || aspect <= 0) return frame;
  const availableWidth = Math.max(0, 2 * Math.min(anchor - left, right - anchor) - 24);
  // Keep the established screen-height target. The caption layout below owns
  // vertical shrinking/scrolling; this pass only contains the complete image
  // horizontally. The world-bounded frame remains the unmeasured fallback.
  const heightPx = Math.min(measurement.canvas.height * 0.42 * 1.4, availableWidth / aspect);
  const height = heightPx * projection.unitsPerPixelY;
  const width = height * aspect;
  return finite([width, height]) ? { width, height } : frame;
}

/** CSS-pixel layout, independent of the current figure transform or scroll offset. */
export function resolveMainlineANebulaCaptionLayoutV638(input: {
  measurement: NebulaCaptionMeasurementV638;
  anchorY: number;
  anchorX?: number;
  preferredImageHeight: number;
  hasImage: boolean;
}): NebulaCaptionLayoutV638 | null {
  const { measurement: m, anchorY, preferredImageHeight, hasImage } = input;
  if (!finite([m.safeTop, m.safeBottom, m.naturalHeight, m.insetHeight, anchorY, preferredImageHeight])
    || !finite([input.anchorX, m.safeLeft, m.safeRight].filter((value): value is number => value !== undefined))
    || m.naturalHeight <= 0 || m.insetHeight < 0 || m.naturalHeight < m.insetHeight
    || preferredImageHeight < 0 || hasImage && preferredImageHeight <= 0) return null;
  const available = m.safeBottom - m.safeTop;
  if (available <= m.insetHeight) return null;
  const captionMaxWidth = m.safeLeft !== undefined && m.safeRight !== undefined
    ? Math.max(0, 2 * Math.min((input.anchorX ?? (m.safeLeft + m.safeRight) / 2) - m.safeLeft,
      m.safeRight - (input.anchorX ?? (m.safeLeft + m.safeRight) / 2)) - 24) : undefined;
  if (captionMaxWidth !== undefined && captionMaxWidth < 1) return null;
  const gap = hasImage ? Math.min(GAP, (available - m.insetHeight) / 4) : 0;
  // Preserve the preferred image whenever the complete caption fits. On short
  // screens reserve part of the content band for the uncropped image, then
  // scroll the caption instead of shrinking its typography or losing links.
  const minimumImage = hasImage
    ? Math.min(preferredImageHeight, (available - gap - m.insetHeight) * 0.25) : 0;
  const captionMaxHeight = Math.min(m.naturalHeight, available - gap - minimumImage);
  const imageHeight = hasImage ? Math.min(preferredImageHeight, available - gap - captionMaxHeight) : 0;
  const total = imageHeight + gap + captionMaxHeight;
  const desiredTop = anchorY - (hasImage ? imageHeight : captionMaxHeight) / 2;
  const top = clamp(desiredTop, m.safeTop, m.safeBottom - total);
  return {
    imageScale: hasImage ? imageHeight / preferredImageHeight : 0,
    imageCenterY: top + imageHeight / 2,
    imageHeight,
    captionTop: top + imageHeight + gap,
    captionMaxHeight,
    ...(captionMaxWidth === undefined ? {} : { captionMaxWidth }),
    gap,
    scrollable: m.naturalHeight - captionMaxHeight > 0.25,
  };
}

/**
 * Convert a CSS-pixel displacement at the target's projected depth into the
 * camera-facing Billboard's local Y units. Euclidean camera distance is not
 * the projection depth for an off-axis target. This also supports ortho/zoom.
 */
export function projectMainlineANebulaCaptionV638(
  camera: Camera, position: Vector3, canvas: NebulaCaptionRectV638, imageHeight: number,
): NebulaCaptionProjectionV638 | null {
  if (!finite([canvas.x, canvas.y, canvas.width, canvas.height, imageHeight])
    || canvas.width <= 0 || canvas.height <= 0 || imageHeight < 0) return null;
  const projected = position.clone().project(camera);
  if (!finite([projected.x, projected.y, projected.z]) || projected.z < -1 || projected.z > 1) return null;
  const cameraUp = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  const onePixelAbove = projected.clone();
  onePixelAbove.y += 2 / canvas.height;
  const unitsPerPixelY = onePixelAbove.unproject(camera).sub(position).dot(cameraUp);
  if (!Number.isFinite(unitsPerPixelY) || unitsPerPixelY <= 0) return null;
  return {
    anchorX: canvas.x + (1 + projected.x) * canvas.width / 2,
    anchorY: canvas.y + (1 - projected.y) * canvas.height / 2,
    preferredImageHeight: imageHeight / unitsPerPixelY,
    unitsPerPixelY,
  };
}

/** Billboard children already use camera-facing axes; retain the original X and aspect ratio. */
export function applyMainlineANebulaCaptionFrameV638(input: {
  image: Mesh | null;
  captionAnchor: Object3D | null;
  frame: Readonly<{ width: number; height: number }>;
  projection: NebulaCaptionProjectionV638 | null;
  layout: NebulaCaptionLayoutV638 | null;
  captionMounted: boolean;
}): void {
  const { image, captionAnchor, frame, projection, layout, captionMounted } = input;
  if (!captionMounted) {
    // Html is intentionally absent in the existing DOM-root soak mode. That
    // mode still owns a real texture and must continue drawing its image.
    if (image) { image.visible = true; image.position.set(0, 0, 0); image.scale.set(frame.width, frame.height, 1); }
    return;
  }
  if (image) image.visible = Boolean(layout && projection);
  if (!layout || !projection) return;
  const { anchorY, unitsPerPixelY } = projection;
  image?.position.set(0, (anchorY - layout.imageCenterY) * unitsPerPixelY, 0);
  image?.scale.set(frame.width * layout.imageScale, frame.height * layout.imageScale, 1);
  captionAnchor?.position.set(0, (anchorY - layout.captionTop) * unitsPerPixelY, 0);
}

/** Only writes properties owned by this layout, and only when they change. */
export function applyMainlineANebulaCaptionLayoutV638(figure: HTMLElement, layout: NebulaCaptionLayoutV638 | null): void {
  const setStyle = (name: "visibility" | "maxHeight" | "maxWidth" | "pointerEvents", value: string) => {
    if (figure.style[name] !== value) figure.style[name] = value;
  };
  setStyle("visibility", layout ? "visible" : "hidden");
  if (!layout) return;
  setStyle("maxHeight", `${layout.captionMaxHeight.toFixed(3)}px`);
  setStyle("maxWidth", layout.captionMaxWidth === undefined ? "" : `${layout.captionMaxWidth.toFixed(3)}px`);
  setStyle("pointerEvents", layout.scrollable ? "auto" : "none");
  const state = layout.scrollable ? "scrolling" : "complete";
  if (figure.getAttribute("data-mainline-a-nebula-caption-layout") !== state) {
    figure.setAttribute("data-mainline-a-nebula-caption-layout", state);
  }
  const tabIndex = layout.scrollable ? 0 : -1;
  if (figure.tabIndex !== tabIndex) figure.tabIndex = tabIndex;
  const hint = figure.querySelector<HTMLElement>(SCROLL_HINT);
  if (hint && hint.hidden === layout.scrollable) hint.hidden = !layout.scrollable;
}

/**
 * Observe natural content, not the max-height-constrained figure. This owner
 * does not follow Html's per-frame translate styles or its own layout writes.
 * Callback-ref callers can attach after Drei's separate DOM root has mounted.
 */
export function observeMainlineANebulaCaptionV638(
  figure: HTMLElement, canvas: HTMLElement, publish: (measurement: NebulaCaptionMeasurementV638) => void,
): () => void {
  const doc = figure.ownerDocument;
  const view = doc.defaultView;
  const content = figure.querySelector<HTMLElement>(CONTENT);
  const hint = figure.querySelector<HTMLElement>(SCROLL_HINT);
  if (!view || !content) return () => undefined;
  let disposed = false;
  let scheduled: number | null = null;
  let previous = "";
  let boundaries: HTMLElement[] = [];
  const observed = new Set<Element>();
  const box = (element: HTMLElement): NebulaCaptionRectV638 => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
  };
  const visible = (element: HTMLElement): boolean => {
    if (!element.isConnected || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      const style = view.getComputedStyle(ancestor);
      if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") return false;
    }
    const rect = box(element);
    return finite(Object.values(rect)) && rect.width > 0 && rect.height > 0;
  };
  const elements = (selector: string): HTMLElement[] => [...new Set(Array.from(doc.querySelectorAll<HTMLElement>(selector))
    .map((element) => element.matches(FOOTER_BODY) ? element.closest<HTMLElement>("footer") : element))]
    .filter((element): element is HTMLElement => element !== null)
    .filter((element) => element !== doc.body && element !== doc.documentElement
      && !element.matches("[data-atlas-app-shell], [data-atlas-visual-profile-v294]")
      && !element.contains(canvas) && !element.contains(figure) && !figure.contains(element));
  const update = () => {
    scheduled = null;
    if (disposed || !figure.isConnected || !canvas.isConnected) return;
    const headers = elements(HEADER);
    const footers = elements(FOOTER);
    boundaries = [...headers, ...footers];
    const nextObserved = new Set<Element>([canvas, figure, content, ...boundaries]);
    for (const element of observed) if (!nextObserved.has(element)) { resize.unobserve(element); observed.delete(element); }
    for (const element of nextObserved) if (!observed.has(element)) { resize.observe(element); observed.add(element); }
    const canvasRect = box(canvas);
    if (!finite(Object.values(canvasRect)) || canvasRect.width <= 0 || canvasRect.height <= 0) return;
    const visualTop = view.visualViewport?.offsetTop ?? 0;
    const visualBottom = visualTop + (view.visualViewport?.height ?? view.innerHeight);
    const visibleTop = Math.max(canvasRect.y, visualTop);
    const visibleBottom = Math.min(canvasRect.y + canvasRect.height, visualBottom);
    const intersectsCanvas = (rect: NebulaCaptionRectV638) => rect.x < canvasRect.x + canvasRect.width
      && rect.x + rect.width > canvasRect.x && rect.y < visibleBottom && rect.y + rect.height > visibleTop;
    const headerBottom = headers.filter(visible).map(box).filter(intersectsCanvas)
      .reduce((bottom, rect) => Math.max(bottom, rect.y + rect.height), visibleTop);
    const footerTop = footers.filter(visible).map(box).filter(intersectsCanvas)
      .reduce((top, rect) => Math.min(top, rect.y), visibleBottom);
    const style = view.getComputedStyle(figure);
    const px = (value: string) => Number.parseFloat(value) || 0;
    const insetHeight = px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth);
    const hintStyle = hint ? view.getComputedStyle(hint) : null;
    const hintHeight = hint && !hint.hidden && hintStyle
      ? box(hint).height + px(hintStyle.marginTop) + px(hintStyle.marginBottom) : 0;
    const measurement: NebulaCaptionMeasurementV638 = {
      canvas: canvasRect,
      safeTop: headerBottom + GAP,
      safeBottom: footerTop - GAP,
      // The instruction occupies scroll content only when necessary. Exclude
      // it from the fit decision so enlarging the viewport can leave scrolling
      // without needing enough extra room for the instruction itself.
      naturalHeight: Math.max(0, box(content).height - hintHeight) + insetHeight,
      insetHeight,
    };
    // CSS layout is subpixel; ignore transform floating-point noise while
    // retaining changes smaller than a CSS pixel (e.g. a wrapping credit line).
    const identity = JSON.stringify(measurement, (_key, value) => typeof value === "number" ? Math.round(value * 64) / 64 : value);
    if (identity !== previous) { previous = identity; publish(measurement); }
  };
  const schedule = () => { if (!disposed && scheduled === null) scheduled = view.requestAnimationFrame(update); };
  const resize = new ResizeObserver(schedule);
  const relevantTree = (node: Node): boolean => {
    if (node.nodeType !== 1) return content.contains(node);
    const element = node as HTMLElement;
    return element === canvas || element === figure || element.contains(canvas) || element.contains(figure)
      || boundaries.some((boundary) => element === boundary || element.contains(boundary))
      || element.matches(`${HEADER}, ${FOOTER}`) || Boolean(element.querySelector(`${HEADER}, ${FOOTER}`));
  };
  const mutation = new MutationObserver((records) => {
    if (records.some((record) => {
      if (record.type === "characterData") return content.contains(record.target);
      if (record.type === "childList") return content.contains(record.target)
        || [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)].some(relevantTree);
      const target = record.target as HTMLElement;
      // Ignore our figure/hint and Drei's translated wrapper. The natural
      // content ResizeObserver catches width, font and loading-state reflow.
      return target !== hint && target !== figure && (target === canvas || target === doc.body || target === doc.documentElement
        || target.contains?.(canvas) || content.contains(target)
        || target.matches(`${HEADER}, ${FOOTER}`)
        || boundaries.some((boundary) => target === boundary || target.contains?.(boundary) || boundary.contains(target)));
    })) schedule();
  });
  mutation.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["class", "style", "hidden", "inert", "aria-hidden", "data-mainline-a-workspace-navigation", "data-mainline-a-observation-topline", "data-atlas-cinematic-hud", "data-bottom-control-bar"] });
  view.addEventListener("resize", schedule);
  view.addEventListener("scroll", schedule, true);
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
    view.removeEventListener("resize", schedule);
    view.removeEventListener("scroll", schedule, true);
    view.visualViewport?.removeEventListener("resize", schedule);
    view.visualViewport?.removeEventListener("scroll", schedule);
    doc.fonts?.removeEventListener("loadingdone", schedule);
    doc.fonts?.removeEventListener("loadingerror", schedule);
  };
}

/** A callback-ref owner for Drei's independently mounted DOM root, including StrictMode replay. */
export function createMainlineANebulaCaptionBindingV638(canvas: HTMLElement) {
  type Binding = {
    figure: HTMLElement;
    measurement: NebulaCaptionMeasurementV638 | null;
    stop: () => void;
  };
  let current: Binding | null = null;
  const release = (binding: Binding) => {
    binding.stop();
    if (current === binding) current = null;
  };
  return {
    attach(figure: HTMLElement | null): (() => void) | undefined {
      if (current) release(current);
      if (!figure) return undefined;
      const binding: Binding = { figure, measurement: null, stop: () => undefined };
      current = binding;
      binding.stop = observeMainlineANebulaCaptionV638(figure, canvas, (measurement) => {
        if (current === binding) binding.measurement = measurement;
      });
      // Capture this exact owner. A delayed cleanup from an old Html root must
      // not clear the measurement or observer installed by a replacement root.
      return () => release(binding);
    },
    read(): Readonly<{ figure: HTMLElement | null; measurement: NebulaCaptionMeasurementV638 | null }> {
      return current ?? { figure: null, measurement: null };
    },
  };
}
