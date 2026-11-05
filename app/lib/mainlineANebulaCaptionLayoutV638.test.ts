import { afterEach, describe, expect, it, vi } from "vitest";
import { Group, Mesh, MeshBasicMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Texture, Vector3 } from "three";
import {
  applyMainlineANebulaCaptionFrameV638,
  applyMainlineANebulaCaptionLayoutV638,
  createMainlineANebulaCaptionBindingV638,
  constrainMainlineANebulaCaptionMeasurementV638,
  fitMainlineANebulaPortraitFrameV638,
  observeMainlineANebulaCaptionV638,
  projectMainlineANebulaCaptionV638,
  resolveMainlineANebulaCaptionLayoutV638,
  type NebulaCaptionMeasurementV638,
  type NebulaCaptionRectV638,
} from "./mainlineANebulaCaptionLayoutV638";
import { createNebulaRenderObserverV638 } from "./mainlineANebulaRenderV638";
import { createNebulaLoadAttemptV638, transitionNebulaLoadAttemptV638 } from "./mainlineANebulaLoadV638";

const measurement: NebulaCaptionMeasurementV638 = {
  canvas: { x: 0, y: 0, width: 1280, height: 720 }, safeTop: 116.8333, safeBottom: 650,
  naturalHeight: 203, insetHeight: 22,
};
const resolve = (overrides: Partial<NebulaCaptionMeasurementV638> = {}, hasImage = true) => resolveMainlineANebulaCaptionLayoutV638({
  measurement: { ...measurement, ...overrides }, anchorY: 370.7, preferredImageHeight: 227, hasImage,
});

describe("nebula image and caption CSS-pixel geometry; not browser or visual approval", () => {
  it("gives the image more room after disclosure collapses without changing the source aspect ratio", () => {
    const band = { ...measurement, safeTop: 120, safeBottom: 460, naturalHeight: 46, insetHeight: 2 };
    const projection = { anchorX: 390, anchorY: 280, preferredImageHeight: 227, unitsPerPixelY: 0.1 };
    const frame = fitMainlineANebulaPortraitFrameV638({ width: 30, height: 22.7 }, projection, band);
    expect(frame.height / projection.unitsPerPixelY).toBeCloseTo(band.canvas.height * 0.42 * 1.4);
    expect(frame.width / frame.height).toBeCloseTo(30 / 22.7);
    const collapsed = resolveMainlineANebulaCaptionLayoutV638({ measurement: band, anchorY: 280, preferredImageHeight: frame.height / 0.1, hasImage: true })!;
    const expanded = resolveMainlineANebulaCaptionLayoutV638({ measurement: { ...band, naturalHeight: 240 }, anchorY: 280, preferredImageHeight: frame.height / 0.1, hasImage: true })!;
    expect(collapsed.imageHeight).toBeGreaterThan(expanded.imageHeight * 2);
    expect(collapsed.captionMaxHeight).toBe(46);
    expect(collapsed.captionTop + collapsed.captionMaxHeight).toBeLessThanOrEqual(460);
  });

  it("keeps the same screen footprint at near and far projection depths", () => {
    const band = { ...measurement, safeLeft: 0, safeRight: 912, naturalHeight: 46, insetHeight: 2 };
    const assetAspect = 1280 / 1096;
    const footprints = [0.08, 1.35, 9.2].map((unitsPerPixelY) => {
      const baseFrame = { width: 680, height: 680 / assetAspect };
      const frame = fitMainlineANebulaPortraitFrameV638(baseFrame,
        { anchorX: 456, anchorY: 340, preferredImageHeight: baseFrame.height / unitsPerPixelY, unitsPerPixelY }, band);
      expect(frame.width / frame.height).toBeCloseTo(assetAspect);
      return { width: frame.width / unitsPerPixelY, height: frame.height / unitsPerPixelY };
    });
    for (const footprint of footprints) {
      expect(footprint.height).toBeCloseTo(423.36);
      expect(footprint.width).toBeCloseTo(423.36 * assetAspect);
    }
  });

  it.each([
    { width: 390, height: 844, safeTop: 120, safeBottom: 638, aspect: 2.1 },
    { width: 844, height: 390, safeTop: 100, safeBottom: 300, aspect: 0.6 },
    { width: 390, height: 844, safeTop: 350, safeBottom: 638, aspect: 1280 / 1096 },
  ])("keeps the measured image and caption inside a $width x $height safe band", (view) => {
    const band = { ...measurement, canvas: { x: 0, y: 0, width: view.width, height: view.height },
      safeLeft: 0, safeRight: view.width, safeTop: view.safeTop, safeBottom: view.safeBottom,
      naturalHeight: 46, insetHeight: 2 };
    const projection = { anchorX: view.width / 2, anchorY: view.height / 2, preferredImageHeight: 50, unitsPerPixelY: 9.2 };
    const frame = fitMainlineANebulaPortraitFrameV638({ width: 680, height: 680 / view.aspect }, projection, band);
    const layout = resolveMainlineANebulaCaptionLayoutV638({ measurement: band, anchorX: projection.anchorX,
      anchorY: projection.anchorY, preferredImageHeight: frame.height / projection.unitsPerPixelY, hasImage: true })!;
    expect(frame.width / projection.unitsPerPixelY).toBeLessThanOrEqual(view.width - 24 + 1e-8);
    expect(frame.width / frame.height).toBeCloseTo(view.aspect);
    expect(layout.imageCenterY - layout.imageHeight / 2).toBeGreaterThanOrEqual(view.safeTop - 1e-8);
    expect(layout.captionTop + layout.captionMaxHeight).toBeLessThanOrEqual(view.safeBottom + 1e-8);
    expect(layout.imageHeight).toBeGreaterThan(0);
    expect(layout.imageScale).toBeLessThanOrEqual(1);
  });

  it("retains the input world frame when projection or measurement cannot establish a finite fit", () => {
    const frame = { width: 680, height: 582.25 };
    const projection = { anchorX: 456, anchorY: 340, preferredImageHeight: 100, unitsPerPixelY: 9.2 };
    expect(fitMainlineANebulaPortraitFrameV638(frame, null, measurement)).toBe(frame);
    expect(fitMainlineANebulaPortraitFrameV638(frame, projection, null)).toBe(frame);
    for (const unitsPerPixelY of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {
      expect(fitMainlineANebulaPortraitFrameV638(frame, { ...projection, unitsPerPixelY }, measurement)).toBe(frame);
    }
    for (const canvas of [{ ...measurement.canvas, width: 0 }, { ...measurement.canvas, height: -1 },
      { ...measurement.canvas, height: NaN }, { ...measurement.canvas, x: Infinity }]) {
      expect(fitMainlineANebulaPortraitFrameV638(frame, projection, { ...measurement, canvas })).toBe(frame);
    }
    expect(fitMainlineANebulaPortraitFrameV638(frame, { ...projection, anchorX: NaN }, measurement)).toBe(frame);
    expect(fitMainlineANebulaPortraitFrameV638(frame, projection, { ...measurement, safeRight: Infinity })).toBe(frame);
  });

  it.each([744, 464.2, 168.8])("respects a mobile passport top at %spx for collapsed, half and full sheets", (bottom) => {
    const measured = { ...measurement, canvas: { x: 0, y: 0, width: 390, height: 844 }, safeTop: 120, safeBottom: 780, naturalHeight: 46, insetHeight: 2 };
    const safe = { left: 0, top: 108, right: 390, bottom, viewportWidth: 390, viewportHeight: 844 };
    const bounded = constrainMainlineANebulaCaptionMeasurementV638(measured, safe);
    const before = JSON.stringify(safe);
    const projection = { anchorX: 195, anchorY: 420, preferredImageHeight: 260, unitsPerPixelY: 0.1 };
    const frame = fitMainlineANebulaPortraitFrameV638({ width: 30, height: 26 }, projection, bounded);
    expect(frame.width / 0.1).toBeLessThanOrEqual(366);
    const layout = resolveMainlineANebulaCaptionLayoutV638({ measurement: bounded, anchorY: 420, anchorX: 195, preferredImageHeight: frame.height / 0.1, hasImage: true })!;
    expect(layout.imageCenterY - layout.imageHeight / 2).toBeGreaterThanOrEqual(120);
    expect(layout.captionTop + layout.captionMaxHeight).toBeLessThanOrEqual(bottom - 12 + 1e-8);
    expect(layout.captionMaxWidth).toBe(366);
    expect(JSON.stringify(safe)).toBe(before);
  });

  it("does not draw through a fully covered safe band and scales CSS offsets from the measured canvas", () => {
    const bounded = constrainMainlineANebulaCaptionMeasurementV638({ ...measurement, canvas: { x: 30, y: 20, width: 640, height: 360 } },
      { left: 0, top: 120, right: 864, bottom: 160, viewportWidth: 1280, viewportHeight: 720 });
    expect(bounded.safeRight).toBe(462);
    expect(bounded.safeBottom).toBe(88);
    expect(resolveMainlineANebulaCaptionLayoutV638({ measurement: bounded, anchorY: 80, preferredImageHeight: 120, hasImage: true })).toBeNull();
    expect(constrainMainlineANebulaCaptionMeasurementV638(measurement, null)).toBe(measurement);
  });

  it("fits the centered image clear of a right passport and rejects horizontal offscreen captions", () => {
    const band = { ...measurement, safeLeft: 0, safeRight: 864 };
    const frame = fitMainlineANebulaPortraitFrameV638({ width: 80, height: 50 },
      { anchorX: 700, anchorY: 300, preferredImageHeight: 500, unitsPerPixelY: 0.1 }, band);
    expect(frame.width / 0.1).toBeCloseTo(304);
    expect(frame.width / frame.height).toBeCloseTo(1.6);
    expect(resolveMainlineANebulaCaptionLayoutV638({ measurement: band, anchorY: 300, anchorX: 900, preferredImageHeight: 200, hasImage: true })).toBeNull();
    expect(resolveMainlineANebulaCaptionLayoutV638({ measurement: band, anchorY: 300, anchorX: NaN, preferredImageHeight: 200, hasImage: true })).toBeNull();
  });

  it("fits the Helix caption above the measured 068e footer without cropping or horizontal movement", () => {
    expect(484.2000122070313 + 203).toBeGreaterThan(662);
    const layout = resolve()!;
    expect(layout.captionTop + layout.captionMaxHeight).toBeCloseTo(650, 6);
    expect(layout.captionMaxHeight).toBe(203);
    expect(layout.imageHeight).toBe(227);
    expect(layout.imageScale).toBe(1);
    expect(layout.scrollable).toBe(false);
    expect(layout.imageCenterY - layout.imageHeight / 2).toBeGreaterThanOrEqual(measurement.safeTop);
  });

  it.each([532, 300, 175, 72])("keeps image and complete or scrollable caption inside a %ipx band", (height) => {
    const layout = resolve({ safeTop: 115, safeBottom: 115 + height, naturalHeight: 460 })!;
    expect(layout.imageHeight).toBeGreaterThan(0);
    expect(layout.imageScale).toBeGreaterThan(0);
    expect(layout.imageScale).toBeLessThanOrEqual(1);
    expect(layout.imageCenterY - layout.imageHeight / 2).toBeGreaterThanOrEqual(115);
    expect(layout.captionTop).toBeGreaterThan(layout.imageCenterY + layout.imageHeight / 2);
    expect(layout.captionTop + layout.captionMaxHeight).toBeLessThanOrEqual(115 + height + 1e-8);
    expect(layout.captionMaxHeight).toBeGreaterThan(22);
    expect(layout.scrollable).toBe(layout.captionMaxHeight < 459.75);
  });

  it("reserves a scrollable caption for loading, cancelled and failed states without an image", () => {
    const layout = resolve({ safeTop: 115, safeBottom: 270, naturalHeight: 302 }, false)!;
    expect(layout).toMatchObject({ imageScale: 0, imageHeight: 0, gap: 0, scrollable: true });
    expect(layout.captionMaxHeight).toBe(155);
    expect(layout.captionTop).toBe(115);
  });

  it.each([
    { safeTop: NaN }, { safeBottom: Infinity }, { naturalHeight: 0 }, { insetHeight: -1 },
    { naturalHeight: 12, insetHeight: 22 }, { safeTop: 651 }, { safeTop: 628 },
  ])("rejects an invalid or contentless band: %j", (override) => {
    expect(resolve(override)).toBeNull();
  });

  it("rejects invalid image and anchor measurements instead of writing NaN to a mesh", () => {
    for (const input of [{ anchorY: NaN, preferredImageHeight: 20 }, { anchorY: 200, preferredImageHeight: 0 }, { anchorY: 200, preferredImageHeight: -1 }]) {
      expect(resolveMainlineANebulaCaptionLayoutV638({ measurement, hasImage: true, ...input })).toBeNull();
    }
  });

  it.each([1, 2.75])("converts pixels at the actual off-axis depth with camera zoom %s", (zoom) => {
    for (const camera of [new PerspectiveCamera(55, 1280 / 720, 0.1, 1000), new OrthographicCamera(-8, 8, 4.5, -4.5, 0.1, 1000)]) {
      camera.position.set(8, -5, 17);
      camera.lookAt(1, 2, -4);
      camera.zoom = zoom;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      const position = new Vector3(3.1, 2.2, -3);
      const canvas = { x: 17, y: 23, width: 1280, height: 720 };
      const projection = projectMainlineANebulaCaptionV638(camera, position, canvas, 2)!;
      const before = position.clone().project(camera);
      const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      const moved = position.clone().addScaledVector(up, projection.unitsPerPixelY * 123.456).project(camera);
      expect((moved.y - before.y) * canvas.height / 2).toBeCloseTo(123.456, 6);
      expect(moved.x).toBeCloseTo(before.x, 10);
      expect(moved.z).toBeCloseTo(before.z, 10);
      const top = position.clone().addScaledVector(up, 1).project(camera);
      const bottom = position.clone().addScaledVector(up, -1).project(camera);
      expect((top.y - bottom.y) * canvas.height / 2).toBeCloseTo(projection.preferredImageHeight, 6);
      expect(projection.anchorY).toBeCloseTo(canvas.y + (1 - before.y) * canvas.height / 2, 8);
    }
  });

  it("does not project behind-camera, clipped-depth or malformed canvas coordinates", () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    camera.updateMatrixWorld(true);
    for (const z of [5, -0.01, -1000]) expect(projectMainlineANebulaCaptionV638(camera, new Vector3(0, 0, z), measurement.canvas, 2)).toBeNull();
    for (const canvas of [{ ...measurement.canvas, height: 0 }, { ...measurement.canvas, width: NaN }]) {
      expect(projectMainlineANebulaCaptionV638(camera, new Vector3(0, 0, -5), canvas, 2)).toBeNull();
    }
  });

  it("moves only the image and caption inside the Billboard, retaining aspect ratio and the camera", () => {
    const image = new Mesh(); const anchor = new Group(); const camera = new PerspectiveCamera();
    const before = camera.toJSON();
    const layout = resolve({ safeTop: 115, safeBottom: 300, naturalHeight: 203 })!;
    const projection = { anchorY: 370.7, preferredImageHeight: 227, unitsPerPixelY: 0.2 };
    applyMainlineANebulaCaptionFrameV638({ image, captionAnchor: anchor, frame: { width: 80, height: 50 }, projection, layout, captionMounted: true });
    expect(image.scale.x / image.scale.y).toBeCloseTo(80 / 50);
    expect(image.position.x).toBe(0); expect(image.position.z).toBe(0);
    expect(anchor.position.x).toBe(0); expect(anchor.position.z).toBe(0);
    expect(image.position.y).toBeCloseTo((370.7 - layout.imageCenterY) * 0.2);
    expect(anchor.position.y).toBeCloseTo((370.7 - layout.captionTop) * 0.2);
    expect(camera.toJSON()).toEqual(before);
  });

  it("keeps Html-suppressed texture ownership drawable and still requires a real draw for readiness", () => {
    const camera = new PerspectiveCamera(50, 1, 0.1, 100);
    const root = new Group(); root.position.z = -5;
    const geometry = new PlaneGeometry(1, 1); const material = new MeshBasicMaterial(); const texture = new Texture();
    texture.userData.atlasVisualAssetSha256 = "a".repeat(64); material.map = texture;
    const image = new Mesh(geometry, material); root.add(image);
    const at = "2026-09-28T00:00:00.000Z";
    let attempt = transitionNebulaLoadAttemptV638(createNebulaLoadAttemptV638(1, at), { type: "decoded", attempt: 1, at });
    const producer = { rendered: vi.fn(() => true), unobserved: vi.fn(() => true) };
    const observer = createNebulaRenderObserverV638({ geometry, material, assetSha256: "a".repeat(64),
      read: () => ({ mesh: image, texture, attempt }), write: (next) => { attempt = next; }, producer, now: () => at });
    const frame = { width: 2, height: 1 };
    applyMainlineANebulaCaptionFrameV638({ image, captionAnchor: null, frame, projection: null, layout: null, captionMounted: false });
    observer.inspect(camera);
    expect(attempt.status).toBe("decoded"); expect(producer.rendered).not.toHaveBeenCalled();
    expect(observer.afterDraw(image, camera, geometry, material)).toBe(true);
    expect(attempt.status).toBe("ready"); expect(material.map).toBe(texture);
    applyMainlineANebulaCaptionFrameV638({ image, captionAnchor: null, frame, projection: null, layout: null, captionMounted: true });
    observer.inspect(camera);
    expect(image.visible).toBe(false); expect(attempt.status).toBe("decoded");
    expect(observer.afterDraw(image, camera, geometry, material)).toBe(false);
    applyMainlineANebulaCaptionFrameV638({ image, captionAnchor: null, frame, projection: null, layout: null, captionMounted: false });
    expect(image.visible).toBe(true); expect(image.scale.toArray()).toEqual([2, 1, 1]);
    expect(image.position.toArray()).toEqual([0, 0, 0]); expect(attempt.status).toBe("decoded");
    geometry.dispose(); material.dispose(); texture.dispose();
  });
});

// DOM-protocol fixtures exercise subscriptions and measurements only. Actual
// wrapping, scrolling, pointer hits and user acceptance require browser checks.
class CaptionEvents extends EventTarget {
  listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  override addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
    if (listener) { const entries = this.listeners.get(type) ?? new Set(); entries.add(listener); this.listeners.set(type, entries); }
    super.addEventListener(type, listener, options);
  }
  override removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
    if (listener) this.listeners.get(type)?.delete(listener);
    super.removeEventListener(type, listener, options);
  }
  get listenerCount() { return [...this.listeners.values()].reduce((count, set) => count + set.size, 0); }
}
class CaptionText { nodeType = 3; constructor(readonly parentElement: CaptionElement) {} }
class CaptionElement {
  nodeType = 1;
  children: CaptionElement[] = [];
  parentElement: CaptionElement | null = null;
  attributes = new Map<string, string>();
  hidden = false; tabIndex = -1;
  style = { display: "block", visibility: "visible", opacity: "1", paddingTop: "0px", paddingBottom: "0px", borderTopWidth: "0px", borderBottomWidth: "0px", marginTop: "0px", marginBottom: "0px", maxHeight: "", pointerEvents: "" };
  rect: NebulaCaptionRectV638 = { x: 0, y: 0, width: 0, height: 0 };
  constructor(readonly ownerDocument: CaptionDocument, readonly tagName: string) {}
  get isConnected(): boolean { return this === this.ownerDocument.body || Boolean(this.parentElement?.isConnected); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  matches(selector: string): boolean {
    return selector.split(",").some((part) => {
      const tag = part.trim().match(/^[a-z][\w-]*/i)?.[0];
      const attrs = [...part.matchAll(/\[([^\]=]+)(?:=["']([^"']*)["'])?\]/g)];
      return (!tag || tag.toLowerCase() === this.tagName.toLowerCase()) && Boolean(tag || attrs.length)
        && attrs.every(([, name, value]) => (name === "hidden" ? this.hidden : this.attributes.has(name)) && (value === undefined || this.attributes.get(name) === value));
    });
  }
  closest(selector: string): CaptionElement | null { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
  contains(element: CaptionElement | CaptionText): boolean { return element === this || Boolean(element.parentElement && this.contains(element.parentElement)); }
  querySelectorAll(selector: string): CaptionElement[] { return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; }
  getBoundingClientRect() { const { x, y, width, height } = this.rect; return Object.create({ x, y, width, height, left: x, top: y, right: x + width, bottom: y + height }); }
}
class CaptionWindow extends CaptionEvents {
  innerHeight = 720;
  visualViewport = Object.assign(new CaptionEvents(), { offsetTop: 0, height: 720 });
  frames = new Map<number, FrameRequestCallback>(); sequence = 0;
  getComputedStyle(element: CaptionElement) { return element.style; }
  requestAnimationFrame(callback: FrameRequestCallback) { const id = ++this.sequence; this.frames.set(id, callback); return id; }
  cancelAnimationFrame(id: number) { this.frames.delete(id); }
  flush() { const callbacks = [...this.frames.values()]; this.frames.clear(); callbacks.forEach((callback) => callback(0)); }
}
class CaptionDocument {
  defaultView = new CaptionWindow();
  body = new CaptionElement(this, "body"); documentElement = new CaptionElement(this, "html");
  fonts = Object.assign(new CaptionEvents(), { ready: new Promise<void>(() => undefined) });
  querySelectorAll(selector: string) { return this.body.querySelectorAll(selector); }
  add(tag: string, rect: NebulaCaptionRectV638, attributes: Record<string, string> = {}, parent = this.body) {
    const element = new CaptionElement(this, tag); element.rect = rect; element.parentElement = parent;
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    parent.children.push(element); return element;
  }
}
const cleanups: Array<() => void> = [];
afterEach(() => { cleanups.splice(0).forEach((stop) => stop()); vi.unstubAllGlobals(); });
function fixture() {
  const resizes: Array<{ callback: () => void; elements: Set<Element>; disconnected: boolean }> = [];
  const mutations: Array<{ callback: (records: MutationRecord[]) => void; disconnected: boolean }> = [];
  vi.stubGlobal("ResizeObserver", class {
    state: typeof resizes[number];
    constructor(callback: () => void) { this.state = { callback, elements: new Set(), disconnected: false }; resizes.push(this.state); }
    observe(element: Element) { this.state.elements.add(element); }
    unobserve(element: Element) { this.state.elements.delete(element); }
    disconnect() { this.state.elements.clear(); this.state.disconnected = true; }
  });
  vi.stubGlobal("MutationObserver", class {
    state: typeof mutations[number];
    constructor(callback: (records: MutationRecord[]) => void) { this.state = { callback, disconnected: false }; mutations.push(this.state); }
    observe() {}
    disconnect() { this.state.disconnected = true; }
  });
  const doc = new CaptionDocument();
  const root = doc.add("div", measurement.canvas, { "data-atlas-app-shell": "true", "data-mainline-a-workspace-navigation": "v637" });
  const canvas = doc.add("canvas", measurement.canvas, {}, root);
  const header = doc.add("div", { x: 12, y: 12, width: 1256, height: 93.5 }, { "data-mainline-a-workspace-navigation": "v637" }, root);
  const footer = doc.add("footer", { x: 0, y: 662, width: 1280, height: 58 }, {}, root);
  const footerBody = doc.add("div", footer.rect, { "data-atlas-cinematic-hud": "bottom-dock" }, footer);
  const wrapper = doc.add("div", { x: 0, y: 0, width: 0, height: 0 }, {}, root);
  const figure = doc.add("figure", { x: 172, y: 484.2, width: 520, height: 203 }, {}, wrapper);
  Object.assign(figure.style, { paddingTop: "10px", paddingBottom: "10px", borderTopWidth: "1px", borderBottomWidth: "1px" });
  const content = doc.add("figcaption", { x: 186, y: 495.2, width: 492, height: 181 }, { "data-mainline-a-nebula-caption-content": "" }, figure);
  const hint = doc.add("p", { x: 186, y: 495.2, width: 492, height: 32 }, { "data-mainline-a-nebula-caption-scroll-hint": "" }, content);
  hint.hidden = true; hint.style.marginBottom = "8px";
  const published: NebulaCaptionMeasurementV638[] = [];
  const start = () => {
    const stop = observeMainlineANebulaCaptionV638(figure as unknown as HTMLElement, canvas as unknown as HTMLElement, (value) => published.push(value));
    cleanups.push(stop); return stop;
  };
  const mutate = (target: CaptionElement | CaptionText, type: "attributes" | "characterData" | "childList", addedNodes: CaptionElement[] = [], removedNodes: CaptionElement[] = []) => {
    mutations.at(-1)?.callback([{ target, type, addedNodes, removedNodes } as unknown as MutationRecord]);
  };
  return { doc, root, canvas, header, footer, footerBody, wrapper, figure, content, hint, published, resizes, mutations, start, mutate,
    resize: () => resizes.at(-1)?.callback(), last: () => published.at(-1)! };
}

describe("natural caption measurement and DOM ownership; protocol fixtures only", () => {
  it("measures the semantic footer and actual header while excluding root telemetry", () => {
    const test = fixture(); test.start();
    expect(test.last()).toEqual({ ...measurement, safeTop: 117.5 });
    expect(test.resizes[0].elements.has(test.footer as unknown as Element)).toBe(true);
    expect(test.resizes[0].elements.has(test.root as unknown as Element)).toBe(false);
    expect(test.resizes[0].elements.has(test.footerBody as unknown as Element)).toBe(false);
  });

  it("reserves both rows of the real OrbitAtlasHud topline above an observation image", () => {
    const test = fixture();
    const topline = test.doc.add("div", { x: 552, y: 113.5, width: 176, height: 47 }, { "data-mainline-a-observation-topline": "true" }, test.root);
    const badge = test.doc.add("div", { ...topline.rect, height: 28 }, { "data-atlas-cinematic-hud": "orbit-atlas-topline" }, topline);
    test.start();
    expect(test.last().safeTop).toBe(172.5);
    expect(test.resizes[0].elements.has(topline as unknown as Element)).toBe(true);
    expect(test.resizes[0].elements.has(badge as unknown as Element)).toBe(false);
    const layout = resolveMainlineANebulaCaptionLayoutV638({ measurement: test.last(), anchorY: 287.2, preferredImageHeight: 302.4, hasImage: true })!;
    expect(layout.imageCenterY - layout.imageHeight / 2).toBeGreaterThanOrEqual(172.5);
    expect(layout.captionTop + layout.captionMaxHeight).toBeLessThanOrEqual(650);
    expect(layout.imageScale).toBeGreaterThan(0);
    expect(layout.imageScale).toBeLessThan(1);
  });

  it("tracks topline wrapping, late mount, hiding and removal without reserving an invisible badge", () => {
    const test = fixture(); test.start();
    const topline = test.doc.add("div", { x: 552, y: 113.5, width: 176, height: 47 }, { "data-mainline-a-observation-topline": "true" }, test.root);
    test.mutate(test.root, "childList", [topline]); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(172.5);
    topline.rect = { ...topline.rect, height: 64 };
    test.resize(); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(189.5);
    topline.hidden = true; test.mutate(topline, "attributes"); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(117.5);
    topline.hidden = false; test.mutate(topline, "attributes"); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(189.5);
    topline.parentElement = null; test.root.children = test.root.children.filter((child) => child !== topline);
    test.mutate(test.root, "childList", [], [topline]); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(117.5);
    expect(test.resizes[0].elements.has(topline as unknown as Element)).toBe(false);
  });

  it("reflows for fonts, actual content and resized boundaries while coalescing notifications", () => {
    const test = fixture(); test.start();
    test.content.rect = { ...test.content.rect, height: 219 };
    test.header.rect = { ...test.header.rect, height: 130 };
    test.doc.fonts.dispatchEvent(new Event("loadingdone")); test.resize(); test.resize();
    expect(test.doc.defaultView.frames.size).toBe(1);
    test.doc.defaultView.flush();
    expect(test.last()).toMatchObject({ safeTop: 154, naturalHeight: 241 });
    test.content.rect = { ...test.content.rect, height: 263 };
    test.mutate(new CaptionText(test.content), "characterData"); test.doc.defaultView.flush();
    expect(test.last().naturalHeight).toBe(285);
    test.footer.hidden = true; test.mutate(test.footer, "attributes"); test.doc.defaultView.flush();
    expect(test.last().safeBottom).toBe(708);
  });

  it("detects an existing node gaining a boundary marker, then releases a removed boundary", () => {
    const test = fixture(); test.start();
    const added = test.doc.add("div", { x: 0, y: 0, width: 1280, height: 180 }, {}, test.root);
    added.setAttribute("data-mainline-a-workspace-navigation", "v637");
    test.mutate(added, "attributes"); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(192);
    added.parentElement = null; test.root.children = test.root.children.filter((child) => child !== added);
    test.mutate(test.root, "childList", [], [added]); test.doc.defaultView.flush();
    expect(test.last().safeTop).toBe(117.5);
    expect(test.resizes[0].elements.has(added as unknown as Element)).toBe(false);
  });

  it("ignores unrelated ticking text, unrelated mounts, Html translation and its own style writes", () => {
    const test = fixture(); test.start();
    const unrelated = test.doc.add("div", { x: 0, y: 0, width: 40, height: 20 }, {}, test.root);
    test.mutate(new CaptionText(unrelated), "characterData");
    test.mutate(test.root, "childList", [unrelated]);
    test.mutate(test.wrapper, "attributes"); test.mutate(test.figure, "attributes"); test.mutate(test.hint, "attributes");
    expect(test.doc.defaultView.frames.size).toBe(0);
    expect(test.published).toHaveLength(1);
  });

  it("uses the visible viewport and canvas intersection after a keyboard or viewport resize", () => {
    const test = fixture(); test.start();
    test.doc.defaultView.visualViewport.offsetTop = 140;
    test.doc.defaultView.visualViewport.height = 310;
    test.doc.defaultView.visualViewport.dispatchEvent(new Event("resize")); test.doc.defaultView.flush();
    expect(test.last()).toMatchObject({ safeTop: 152, safeBottom: 438 });
    test.canvas.rect = { x: 0, y: 170, width: 1280, height: 200 };
    test.resize(); test.doc.defaultView.flush();
    expect(test.last()).toMatchObject({ safeTop: 182, safeBottom: 358 });
  });

  it("does not count the scroll instruction as body height and leaves scrolling when space returns", () => {
    const test = fixture(); test.start();
    const original = test.last();
    const constrained = resolve({ safeTop: 115, safeBottom: 260 })!;
    applyMainlineANebulaCaptionLayoutV638(test.figure as unknown as HTMLElement, constrained);
    expect(test.hint.hidden).toBe(false); expect(test.figure.tabIndex).toBe(0);
    test.content.rect = { ...test.content.rect, height: 221 };
    test.resize(); test.doc.defaultView.flush();
    expect(test.last()).toEqual(original);
    const sufficient = resolve({ safeTop: 115, safeBottom: 423 })!;
    expect(sufficient.scrollable).toBe(false);
    applyMainlineANebulaCaptionLayoutV638(test.figure as unknown as HTMLElement, sufficient);
    expect(test.hint.hidden).toBe(true); expect(test.figure.tabIndex).toBe(-1);
    expect(test.figure.style.pointerEvents).toBe("none");
  });

  it("retains full credit, links and load controls when applying scroll state", () => {
    const test = fixture();
    const link = test.doc.add("a", test.content.rect, { href: "https://example.test/official" }, test.content);
    const button = test.doc.add("button", test.content.rect, { type: "button" }, test.content);
    const children = [...test.content.children];
    applyMainlineANebulaCaptionLayoutV638(test.figure as unknown as HTMLElement, resolve({ safeTop: 115, safeBottom: 220 })!);
    expect(test.figure.style.pointerEvents).toBe("auto");
    expect(test.content.children).toEqual(children);
    expect(link.getAttribute("href")).toBe("https://example.test/official"); expect(button.getAttribute("type")).toBe("button");
    applyMainlineANebulaCaptionLayoutV638(test.figure as unknown as HTMLElement, null);
    expect(test.figure.style.visibility).toBe("hidden"); expect(test.content.children).toEqual(children);
  });

  it("cleans subscriptions and pending RAF exactly once, including a late font-ready callback", async () => {
    const test = fixture(); let resolveFonts: () => void = () => undefined;
    test.doc.fonts.ready = new Promise<void>((resolveReady) => { resolveFonts = resolveReady; });
    const stop = test.start(); test.resize();
    expect(test.doc.defaultView.frames.size).toBe(1);
    stop(); stop(); resolveFonts(); await Promise.resolve();
    test.doc.defaultView.dispatchEvent(new Event("resize")); test.doc.fonts.dispatchEvent(new Event("loadingdone")); test.resize();
    expect(test.doc.defaultView.frames.size).toBe(0);
    expect(test.doc.defaultView.listenerCount + test.doc.defaultView.visualViewport.listenerCount + test.doc.fonts.listenerCount).toBe(0);
    expect(test.resizes[0].disconnected && test.mutations[0].disconnected).toBe(true);
    expect(test.published).toHaveLength(1);
  });

  it("restarts a ref owner after replay and ignores a stale cleanup from the previous Html root", () => {
    const test = fixture();
    const binding = createMainlineANebulaCaptionBindingV638(test.canvas as unknown as HTMLElement);
    const first = binding.attach(test.figure as unknown as HTMLElement)!;
    expect(binding.read().measurement?.naturalHeight).toBe(203);
    first(); expect(binding.read().figure).toBeNull();
    const second = binding.attach(test.figure as unknown as HTMLElement)!; cleanups.push(second);
    first();
    expect(binding.read().figure).toBe(test.figure);
    expect(test.resizes[1].disconnected).toBe(false);
    test.content.rect = { ...test.content.rect, height: 231 }; test.resize(); test.doc.defaultView.flush();
    expect(binding.read().measurement?.naturalHeight).toBe(253);
    binding.attach(null);
    expect(binding.read()).toEqual({ figure: null, measurement: null });
    expect(test.resizes[1].disconnected).toBe(true);
  });
});
