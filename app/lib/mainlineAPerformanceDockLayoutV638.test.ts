import { afterEach, describe, expect, it, vi } from "vitest";
import { observeMainlineAPerformanceDockLayoutV638, resolveMainlineAPerformanceDockLayoutV638, restoreMainlineAPerformanceDockFocusV638, type MainlineAPerformanceDockFrameV638, type MainlineAPerformanceDockLayoutV638 } from "./mainlineAPerformanceDockLayoutV638";

type Rect = { x: number; y: number; width: number; height: number };
function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

const DESKTOP: MainlineAPerformanceDockFrameV638 = {
  viewportWidth: 1280, viewportHeight: 720,
  headerBottom: 106, bottomBarTop: 662, controlWidth: 107, controlHeight: 48,
};

describe("V638 observation restore control layout; geometry evidence only", () => {
  it("removes the collision captured in the 068b 1280x720 browser observation", () => {
    const oldRestore = { x: 1161, y: 660, width: 107, height: 48 };
    const search = { x: 1224, y: 673.5, width: 36, height: 36 };
    expect(intersects(oldRestore, search)).toBe(true);
    const layout = resolveMainlineAPerformanceDockLayoutV638(DESKTOP);
    expect(layout.status).toBe("fits");
    expect(layout.restoreRect).toEqual({ x: 1161, y: 602, width: 107, height: 48 });
    expect(intersects(layout.restoreRect!, search)).toBe(false);
    expect(layout.restoreRect!.y + layout.restoreRect!.height).toBeLessThanOrEqual(DESKTOP.bottomBarTop - 12);
  });

  it.each([
    { name: "desktop-720", width: 1280, height: 720, header: 106, footer: 58 },
    { name: "desktop-1080", width: 1920, height: 1080, header: 114, footer: 82 },
    { name: "mobile-portrait", width: 390, height: 844, header: 178, footer: 116 },
    { name: "mobile-narrow", width: 320, height: 568, header: 202, footer: 82 },
    { name: "mobile-landscape", width: 844, height: 390, header: 118, footer: 79 },
    { name: "small-landscape", width: 667, height: 375, header: 146, footer: 82 },
  ])("preserves a full restore target between header and footer in $name", ({ width, height, header, footer }) => {
    const layout = resolveMainlineAPerformanceDockLayoutV638({
      viewportWidth: width, viewportHeight: height, headerBottom: header,
      bottomBarTop: height - footer, controlWidth: 172, controlHeight: 48,
    });
    expect(layout.status).toBe("fits");
    const restore = layout.restoreRect!;
    const headerRect = { x: 0, y: 0, width, height: header };
    const footerRect = { x: 0, y: height - footer, width, height: footer };
    expect(intersects(restore, headerRect)).toBe(false);
    expect(intersects(restore, footerRect)).toBe(false);
    expect(restore.height).toBe(48);
    expect(restore.width).toBe(172);
    expect(restore.x).toBeGreaterThanOrEqual(12);
    expect(restore.x + restore.width).toBeLessThanOrEqual(width - 12);
    expect(restore.y).toBeGreaterThanOrEqual(header + 12);
    expect(height - layout.bottom).toBeLessThanOrEqual(height - footer - 12);
  });

  it("follows a taller footer or wrapped header without relying on a viewport resize", () => {
    const before = resolveMainlineAPerformanceDockLayoutV638(DESKTOP);
    const tallerFooter = resolveMainlineAPerformanceDockLayoutV638({ ...DESKTOP, bottomBarTop: 604 });
    const tallerHeader = resolveMainlineAPerformanceDockLayoutV638({ ...DESKTOP, headerBottom: 250 });
    expect(tallerFooter.bottom - before.bottom).toBe(58);
    expect(tallerFooter.restoreRect!.y).toBe(before.restoreRect!.y - 58);
    expect(tallerHeader.bottom).toBe(before.bottom);
    expect(tallerHeader.maxHeight).toBe(before.maxHeight - 144);
    expect(tallerHeader.restoreRect!.y).toBeGreaterThanOrEqual(262);
  });

  it("does not advertise a full target when the two reserved bars leave insufficient space", () => {
    const result = resolveMainlineAPerformanceDockLayoutV638({
      ...DESKTOP, viewportHeight: 200, headerBottom: 142, bottomBarTop: 164,
    });
    expect(result.status).toBe("insufficient-space");
    expect(result.maxHeight).toBe(0);
    expect(result.restoreRect).toBeNull();
  });

  it("keeps bounds finite for missing space and rejects malformed measurements", () => {
    for (const override of [
      { viewportWidth: 0 }, { viewportHeight: NaN }, { headerBottom: Infinity },
      { bottomBarTop: NaN }, { controlHeight: -1 }, { controlWidth: 0 },
    ]) {
      const result = resolveMainlineAPerformanceDockLayoutV638({ ...DESKTOP, ...override });
      expect(result.status).toBe("invalid");
      expect(result.restoreRect).toBeNull();
      expect(result.maxHeight).toBe(0);
    }
  });

  it.each([
    { name: "passport", extra: [] },
    { name: "passport and browser", extra: [{ x: 0, y: 114, width: 286, height: 606 }] },
    { name: "passport, browser and expanded workbench", extra: [{ x: 0, y: 114, width: 286, height: 606 }, { x: 12, y: 178, width: 430, height: 472 }] },
  ])("avoids the 068c reading area with $name visible at 1280x720", ({ extra }) => {
    const passport = { x: 880, y: 64, width: 384, height: 610 };
    expect(intersects({ x: 1161, y: 565, width: 107, height: 48 }, passport)).toBe(true);
    const layout = resolveMainlineAPerformanceDockLayoutV638({ ...DESKTOP, controlWidth: 172, occluders: [passport, ...extra] });
    expect(layout.status).toBe("fits");
    expect(layout.restoreRect).toEqual({ x: 696, y: 602, width: 172, height: 48 });
    for (const rect of [passport, ...extra]) expect(intersects(layout.restoreRect!, rect)).toBe(false);
  });

  it("uses a complete compact control in the measured mobile passport/footer band", () => {
    const passport = { x: 8, y: 14, width: 374, height: 734 };
    const footer = { x: 0, y: 786, width: 390, height: 58 };
    const layout = resolveMainlineAPerformanceDockLayoutV638({
      viewportWidth: 390, viewportHeight: 844, headerBottom: 106,
      bottomBarTop: footer.y, controlWidth: 172, controlHeight: 48, occluders: [passport],
    });
    expect(layout.status).toBe("compact");
    expect(layout.restoreRect).toEqual({ x: 310, y: 754, width: 76, height: 28 });
    expect(intersects(layout.restoreRect!, passport)).toBe(false);
    expect(intersects(layout.restoreRect!, footer)).toBe(false);
  });

  it("keeps the M42 observation caption and right passport readable together", () => {
    const caption = { x: 172, y: 484, width: 520, height: 179 };
    const passport = { x: 880, y: 64, width: 384, height: 610 };
    const layout = resolveMainlineAPerformanceDockLayoutV638({ ...DESKTOP, controlWidth: 172, occluders: [caption, passport] });
    expect(layout.restoreRect).toEqual({ x: 696, y: 424, width: 172, height: 48 });
    expect(intersects(layout.restoreRect!, caption)).toBe(false);
    expect(intersects(layout.restoreRect!, passport)).toBe(false);
  });

  it("requests a real flow slot instead of clipping a restore control when no floating target fits", () => {
    const layout = resolveMainlineAPerformanceDockLayoutV638({
      viewportWidth: 160, viewportHeight: 120, headerBottom: 60, bottomBarTop: 90,
      controlWidth: 172, controlHeight: 48, occluders: [{ x: 0, y: 0, width: 160, height: 90 }],
    });
    expect(layout).toMatchObject({ status: "insufficient-space", mode: "inline", restoreRect: null });
    expect(Number.isFinite(layout.right) && Number.isFinite(layout.bottom)).toBe(true);
  });
});

// DOM-protocol fixtures execute the same measurement and observer callbacks as
// the surface. They do not claim browser layout, screenshots or React mounting.
class DockElement {
  nodeType = 1;
  children: DockElement[] = [];
  parentElement: DockElement | null = null;
  attributes = new Map<string, string>();
  style = { display: "block", visibility: "visible", opacity: "1", cssText: "" };
  rect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  constructor(readonly ownerDocument: DockDocument, readonly tagName = "div") {}
  get isConnected(): boolean { return this === this.ownerDocument.body || Boolean(this.parentElement?.isConnected); }
  get firstChild() { return this.children[0] ?? null; }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  matches(selector: string): boolean {
    return selector.split(",").some((part) => {
      const value = part.trim();
      const tag = value.match(/^[a-z][\w-]*/i)?.[0];
      const id = value.match(/#([\w-]+)/)?.[1];
      if (tag && this.tagName.toLowerCase() !== tag.toLowerCase()) return false;
      if (id && this.attributes.get("id") !== id) return false;
      const attributes = [...value.matchAll(/\[([^\]=]+)(?:=["']([^"']*)["'])?\]/g)];
      return Boolean(tag || id || attributes.length) && attributes.every(([, name, wanted]) => this.attributes.has(name) && (wanted === undefined || this.attributes.get(name) === wanted));
    });
  }
  closest(selector: string): DockElement | null { return this.matches(selector) ? this : this.parentElement?.closest(selector) ?? null; }
  contains(element: DockElement): boolean { return element === this || this.children.some((child) => child.contains(element)); }
  querySelectorAll(selector: string): DockElement[] {
    return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; }
  insertBefore(child: DockElement, before: DockElement | null) {
    child.remove(); child.parentElement = this;
    this.children.splice(before ? this.children.indexOf(before) : this.children.length, 0, child);
  }
  remove() {
    if (this.parentElement) this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
    this.parentElement = null;
  }
  getBoundingClientRect() {
    const bounds = this.attributes.get("data-mainline-a-observer-inline-slot") === "true" && this.parentElement
      ? { ...this.parentElement.rect, height: 36 } : this.rect;
    const { x, y, width, height } = bounds;
    // DOMRect coordinates may be inherited, not enumerable own properties.
    return Object.create({ x, y, width, height, left: x, right: x + width, top: y, bottom: y + height });
  }
  getClientRects() { return this.rect.width && this.rect.height ? [this.getBoundingClientRect()] : []; }
  focus() { this.ownerDocument.activeElement = this; }
}
class DockWindow extends EventTarget {
  innerWidth = 1280; innerHeight = 720;
  visualViewport = new EventTarget();
  frames = new Map<number, FrameRequestCallback>();
  sequence = 0;
  getComputedStyle(element: DockElement) { return element.style; }
  requestAnimationFrame(callback: FrameRequestCallback) { const id = ++this.sequence; this.frames.set(id, callback); return id; }
  cancelAnimationFrame(id: number) { this.frames.delete(id); }
  flush() { const callbacks = [...this.frames.values()]; this.frames.clear(); callbacks.forEach((callback) => callback(0)); }
}
class DockDocument extends EventTarget {
  defaultView = new DockWindow();
  body = new DockElement(this, "body");
  activeElement: DockElement | null = this.body;
  hitTest: ((x: number, y: number) => DockElement | null) | null = null;
  querySelectorAll(selector: string) { return this.body.querySelectorAll(selector); }
  querySelector(selector: string) { return this.body.querySelector(selector); }
  createElement(tag: string) { return new DockElement(this, tag); }
  add(attributes: Record<string, string>, rect: Rect, parent = this.body, tag = "div") {
    const element = this.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    element.rect = rect; parent.insertBefore(element, null); return element;
  }
  passport(rect: Rect, parent = this.body) {
    return this.add({ "data-celestial-object-passport-open": "true", "data-atlas-camera-safe-occluder": "passport", "aria-label": "天体档案" }, rect, parent, "aside");
  }
  elementFromPoint(x: number, y: number): DockElement | null {
    if (this.hitTest) return this.hitTest(x, y);
    const visit = (element: DockElement): DockElement[] => [element, ...element.children.flatMap(visit)];
    return visit(this.body).reverse().find((element) => {
      if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
      for (let current: DockElement | null = element; current; current = current.parentElement) {
        if (current.style.display === "none" || current.style.visibility === "hidden" || current.style.opacity === "0") return false;
      }
      const rect = element.getBoundingClientRect();
      return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
    }) ?? null;
  }
}

const cleanups: Array<() => void> = [];
afterEach(() => { while (cleanups.length) cleanups.pop()?.(); vi.unstubAllGlobals(); });
function observeDock() {
  let resizeCallback: () => void = () => undefined;
  let mutationCallback: (records: MutationRecord[]) => void = () => undefined;
  const observed = new Set<DockElement>();
  const disconnected = { resize: false, mutation: false };
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resizeCallback = callback; }
    observe(element: DockElement) { observed.add(element); }
    unobserve(element: DockElement) { observed.delete(element); }
    disconnect() { observed.clear(); disconnected.resize = true; }
  });
  vi.stubGlobal("MutationObserver", class {
    constructor(callback: (records: MutationRecord[]) => void) { mutationCallback = callback; }
    observe() {}
    disconnect() { disconnected.mutation = true; }
  });
  const doc = new DockDocument();
  const root = doc.add({ "data-atlas-visual-profile-v294": "candidate", "data-atlas-app-shell": "true", "data-celestial-object-passport-open": "true", "data-mainline-a-scene-nebula": "m42" }, { x: 0, y: 0, width: 1280, height: 720 });
  const header = doc.add({ "data-mainline-a-workspace-navigation": "v637" }, { x: 12, y: 12, width: 1256, height: 94 }, root);
  const footer = doc.add({ "data-bottom-control-bar": "true" }, { x: 0, y: 662, width: 1280, height: 58 }, root, "footer");
  const host = doc.add({}, { x: 0, y: 0, width: 0, height: 0 }, root);
  const panel = doc.add({ "data-mainline-a-performance": "v625", "data-mainline-a-performance-docked": "true" }, host.rect, host);
  doc.add({ "data-mainline-a-performance-restore": "true", "data-mainline-a-performance-restore-mode": "full" }, { x: 1096, y: 602, width: 172, height: 48 }, panel, "button");
  const published: Array<{ layout: MainlineAPerformanceDockLayoutV638; target: HTMLElement | null; restoreHadFocus: boolean }> = [];
  const stop = observeMainlineAPerformanceDockLayoutV638(host as unknown as HTMLElement, (layout, target, restoreHadFocus) => published.push({ layout, target, restoreHadFocus }));
  cleanups.push(stop);
  const mutate = (target: DockElement, type: "attributes" | "childList", attributeName?: string, addedNodes: DockElement[] = [], removedNodes: DockElement[] = []) => {
    mutationCallback([{ target, type, attributeName, addedNodes, removedNodes } as unknown as MutationRecord]);
  };
  return { doc, root, header, footer, host, panel, observed, disconnected, stop, published, mutate, resize: () => resizeCallback(), last: () => published.at(-1)! };
}

describe("V638 current DOM geometry and observer lifecycle", () => {
  it("reproduces the 068d nested telemetry shell while using the actual aside and caption only", () => {
    const test = observeDock();
    test.header.rect.height = 93.5;
    test.footer.attributes.delete("data-bottom-control-bar");
    const actualDock = test.doc.add({ "data-atlas-cinematic-hud": "bottom-dock" }, test.footer.rect, test.footer);
    const canvasAncestor = test.doc.passport({ x: 0, y: 0, width: 1280, height: 720 }, test.root);
    const canvas = test.doc.add({}, canvasAncestor.rect, canvasAncestor, "canvas");
    test.root.insertBefore(canvasAncestor, test.root.firstChild);
    const observerAncestor = test.doc.passport({ x: 0, y: 0, width: 1280, height: 720 }, test.root);
    observerAncestor.insertBefore(test.host, null);
    const actualPassport = test.doc.passport({ x: 880, y: 64, width: 384, height: 610 }, test.root);
    const htmlAnchor = test.doc.add({}, { x: 0, y: 0, width: 0, height: 0 }, canvasAncestor);
    const caption = test.doc.add({ "data-mainline-a-scene-nebula": "m42" }, { x: 172, y: 484, width: 520, height: 179 }, htmlAnchor, "figure");
    test.doc.add({}, caption.rect, caption, "figcaption");
    test.mutate(test.root, "childList", undefined, [actualPassport, htmlAnchor, actualDock]); test.doc.defaultView.flush();
    expect(test.root.matches('aside[data-celestial-object-passport-open="true"]')).toBe(false);
    expect(actualPassport.matches('aside[data-celestial-object-passport-open="true"][aria-label="天体档案"]')).toBe(true);
    expect(test.observed.has(actualPassport) && test.observed.has(caption)).toBe(true);
    expect(test.observed.has(test.footer)).toBe(true);
    for (const element of [test.root, observerAncestor, canvasAncestor, canvas]) expect(test.observed.has(element)).toBe(false);
    expect(test.last().layout).toMatchObject({ mode: "full", restoreRect: { x: 696, y: 424, width: 172, height: 48 } });
    expect(test.last().target).toBeNull();
    expect(test.doc.querySelector("[data-mainline-a-observer-inline-slot]")).toBeNull();
    const restore = test.host.querySelector("[data-mainline-a-performance-restore]")!;
    restore.rect = test.last().layout.restoreRect!;
    test.mutate(test.panel, "attributes", "style"); test.doc.defaultView.flush();
    expect(test.last().layout.hitStatus).toBe("clear");
  });

  it("reserves the actual OrbitAtlasHud footer without a bottom-control-bar marker", () => {
    const test = observeDock();
    test.footer.attributes.delete("data-bottom-control-bar");
    const dock = test.doc.add({ "data-atlas-cinematic-hud": "bottom-dock" }, test.footer.rect, test.footer);
    test.mutate(test.footer, "childList", undefined, [dock]); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect).toEqual({ x: 1096, y: 602, width: 172, height: 48 });
    expect(test.last().layout.restoreRect!.y + test.last().layout.restoreRect!.height).toBeLessThanOrEqual(test.footer.rect.y - 12);
    expect(test.observed.has(test.footer)).toBe(true);
    expect(test.observed.has(dock)).toBe(false);
  });

  it("ignores mirrored roots and hidden ancestors even if a matching panel appears first", () => {
    const test = observeDock();
    const hidden = test.doc.add({}, { x: 0, y: 0, width: 1280, height: 720 }, test.root);
    hidden.style.opacity = "0";
    const hiddenPassport = test.doc.passport(hidden.rect, hidden);
    const actual = test.doc.passport({ x: 880, y: 64, width: 384, height: 610 }, test.root);
    test.mutate(test.root, "childList", undefined, [hidden, actual]); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect).toEqual({ x: 696, y: 602, width: 172, height: 48 });
    expect(test.last().target).toBeNull();
    test.doc.defaultView.innerWidth = 40; test.doc.defaultView.innerHeight = 40;
    test.header.remove(); test.footer.remove(); actual.remove();
    test.doc.defaultView.dispatchEvent(new Event("resize")); test.doc.defaultView.flush();
    expect(test.last().layout.mode).toBe("inline"); expect(test.last().target).toBeNull();
    expect(hiddenPassport.children).toHaveLength(0);
    expect(test.root.querySelector("[data-mainline-a-observer-inline-slot]")).toBeNull();
  });
  it("re-queries newly mounted panels, reacts to resize/hide/remove and restores the original boundary", () => {
    const test = observeDock();
    const initial = test.last().layout.restoreRect;
    const passport = test.doc.passport({ x: 880, y: 64, width: 384, height: 610 });
    const browser = test.doc.add({ id: "universe-object-browser", "aria-label": "对象浏览器" }, { x: 0, y: 114, width: 286, height: 606 }, test.root, "aside");
    test.mutate(test.doc.body, "childList", undefined, [passport, browser]);
    test.doc.defaultView.flush();
    expect(test.observed.has(passport) && test.observed.has(browser)).toBe(true);
    expect(test.last().layout.restoreRect!.x).toBe(696);
    passport.rect = { ...passport.rect, x: 800, width: 464 };
    test.resize(); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect!.x).toBe(616);
    passport.style.display = "none";
    test.mutate(passport, "attributes", "style"); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect).toEqual(initial);
    passport.remove(); browser.remove();
    test.mutate(test.doc.body, "childList", undefined, [], [passport, browser]); test.doc.defaultView.flush();
    expect(test.observed.has(passport) || test.observed.has(browser)).toBe(false);
    expect(test.last().layout.restoreRect).toEqual(initial);
  });

  it("uses the actual workbench content and tools popup bounds, not display:contents wrappers", () => {
    const test = observeDock();
    test.doc.add({ "data-post-v593-relativity-workbench": "true" }, { x: 0, y: 0, width: 0, height: 0 });
    const workbench = test.doc.add({ id: "mainline-a-relativity-workbench-content", role: "region", "data-mainline-a-relativity-expanded": "true" }, { x: 780, y: 200, width: 488, height: 450 });
    const popup = test.doc.add({ "aria-label": "更多图集工具" }, { x: 780, y: 75, width: 488, height: 125 });
    test.mutate(test.doc.body, "childList", undefined, [workbench, popup]); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect!.x).toBe(596);
    for (const element of [workbench, popup]) expect(intersects(test.last().layout.restoreRect!, element.rect)).toBe(false);
    workbench.style.visibility = "hidden";
    test.mutate(workbench, "attributes", "style"); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect!.x).toBe(1096);
  });

  it("tracks the scene caption's DOM motion without excluding the image or the canvas", () => {
    const test = observeDock();
    test.doc.passport({ x: 880, y: 64, width: 384, height: 610 });
    const htmlAnchor = test.doc.add({}, { x: 0, y: 0, width: 0, height: 0 });
    const caption = test.doc.add({ "data-mainline-a-scene-nebula": "m42" }, { x: 172, y: 484, width: 520, height: 179 }, htmlAnchor, "figure");
    const canvas = test.doc.add({ "data-scene-canvas": "true" }, { x: 0, y: 0, width: 1280, height: 720 }, test.root, "canvas");
    test.mutate(test.doc.body, "childList", undefined, [htmlAnchor, canvas]); test.doc.defaultView.flush();
    expect(test.observed.has(caption)).toBe(true); expect(test.observed.has(canvas)).toBe(false);
    expect(test.last().layout.restoreRect).toEqual({ x: 696, y: 424, width: 172, height: 48 });
    caption.rect = { x: 172, y: 300, width: 520, height: 160 };
    test.mutate(htmlAnchor, "attributes", "style"); test.doc.defaultView.flush();
    expect(test.last().layout.restoreRect).toEqual({ x: 696, y: 602, width: 172, height: 48 });
    expect(intersects(test.last().layout.restoreRect!, caption.rect)).toBe(false);
  });

  it("keeps a compact target on mobile and reserves/removes an owned flow row on extremely small viewports", () => {
    const test = observeDock();
    test.doc.defaultView.innerWidth = 390; test.doc.defaultView.innerHeight = 844;
    test.footer.rect = { x: 0, y: 786, width: 390, height: 58 };
    const passport = test.doc.passport({ x: 8, y: 14, width: 374, height: 734 });
    const content = test.doc.add({ "data-reading-content": "true" }, { x: 12, y: 172, width: 366, height: 572 }, passport);
    test.mutate(test.doc.body, "childList", undefined, [passport]); test.doc.defaultView.flush();
    expect(test.last().layout.mode).toBe("compact"); expect(test.last().target).toBeNull();
    test.doc.defaultView.innerWidth = 160; test.doc.defaultView.innerHeight = 120;
    test.header.rect = { x: 0, y: 0, width: 160, height: 60 };
    test.footer.rect = { x: 0, y: 90, width: 160, height: 30 };
    passport.rect = { x: 0, y: 0, width: 160, height: 90 };
    test.doc.defaultView.dispatchEvent(new Event("resize")); test.doc.defaultView.flush();
    expect(test.last().layout.mode).toBe("inline");
    const slot = test.last().target as unknown as DockElement;
    expect(slot.parentElement).toBe(passport);
    expect(passport.children).toEqual([slot, content]);
    expect(slot.style.cssText).not.toContain("position:fixed");
    expect(slot.style.cssText).not.toContain("position:absolute");
    test.resize(); test.doc.defaultView.flush();
    expect(test.last().target).toBe(slot);
    test.doc.defaultView.innerWidth = 1280; test.doc.defaultView.innerHeight = 720;
    test.header.rect = { x: 12, y: 12, width: 1256, height: 94 };
    test.footer.rect = { x: 0, y: 662, width: 1280, height: 58 };
    passport.rect = { x: 880, y: 64, width: 384, height: 610 };
    test.resize(); test.doc.defaultView.flush();
    expect(test.last().layout.mode).toBe("full");
    expect(slot.isConnected).toBe(false);
    expect(passport.children).toEqual([content]);
  });

  it("coalesces changes and cleans observers, listeners, pending frames and its flow slot", () => {
    const test = observeDock();
    const initialCount = test.published.length;
    test.resize(); test.doc.defaultView.dispatchEvent(new Event("resize"));
    test.doc.defaultView.visualViewport.dispatchEvent(new Event("resize"));
    test.doc.dispatchEvent(new Event("transitionend"));
    expect(test.doc.defaultView.frames.size).toBe(1);
    test.doc.defaultView.flush(); expect(test.published.length).toBe(initialCount + 1);
    test.resize(); expect(test.doc.defaultView.frames.size).toBe(1);
    test.stop();
    expect(test.disconnected).toEqual({ resize: true, mutation: true });
    expect(test.doc.defaultView.frames.size).toBe(0);
    test.resize(); test.doc.defaultView.dispatchEvent(new Event("resize"));
    expect(test.doc.defaultView.frames.size).toBe(0);
  });

  it("keeps the observer below a visible modal and restores its entry when the modal closes", () => {
    const test = observeDock();
    const modal = test.doc.add({ role: "dialog", "aria-modal": "true" }, { x: 50, y: 40, width: 1180, height: 640 });
    test.mutate(test.doc.body, "childList", undefined, [modal]); test.doc.defaultView.flush();
    expect(test.last().layout.mode).toBe("inline"); expect(test.last().target).toBeNull();
    modal.remove(); test.mutate(test.doc.body, "childList", undefined, [], [modal]); test.doc.defaultView.flush();
    expect(test.last().layout.mode).toBe("full"); expect(test.last().layout.restoreRect).not.toBeNull();
  });

  it("restores only the observer's own lost keyboard focus and does not steal the reader's focus", () => {
    const test = observeDock();
    const restore = test.doc.querySelector("[data-mainline-a-performance-restore]")!;
    restore.focus(); test.resize(); test.doc.defaultView.flush();
    expect(test.last().restoreHadFocus).toBe(true);
    test.doc.activeElement = test.doc.body;
    expect(restoreMainlineAPerformanceDockFocusV638(test.host as unknown as HTMLElement)).toBe(true);
    expect(test.doc.activeElement).toBe(restore);
    const reader = test.doc.add({ "data-reader": "true" }, { x: 900, y: 100, width: 100, height: 40 });
    reader.focus();
    expect(restoreMainlineAPerformanceDockFocusV638(test.host as unknown as HTMLElement)).toBe(false);
    expect(test.doc.activeElement).toBe(reader);
    test.resize(); test.doc.defaultView.flush(); expect(test.last().restoreHadFocus).toBe(false);
    test.doc.activeElement = test.doc.body; restore.setAttribute("hidden", "");
    expect(restoreMainlineAPerformanceDockFocusV638(test.host as unknown as HTMLElement)).toBe(false);
  });

  it("never observes or focuses another mounted observer's restore control", () => {
    const test = observeDock();
    const own = test.host.querySelector("[data-mainline-a-performance-restore]")!;
    const foreign = test.doc.add({ "data-mainline-a-performance-restore": "true" }, { x: 0, y: 0, width: 76, height: 28 });
    test.doc.body.insertBefore(foreign, test.doc.body.firstChild);
    foreign.focus(); test.resize(); test.doc.defaultView.flush();
    expect(test.last().restoreHadFocus).toBe(false);
    expect(test.observed.has(foreign)).toBe(false);
    expect(restoreMainlineAPerformanceDockFocusV638(test.host as unknown as HTMLElement)).toBe(false);
    test.doc.activeElement = test.doc.body;
    expect(restoreMainlineAPerformanceDockFocusV638(test.host as unknown as HTMLElement)).toBe(true);
    expect(test.doc.activeElement).toBe(own);
  });

  it("removes only its owned flow slot on cleanup and preserves existing panel content", () => {
    const test = observeDock();
    test.doc.defaultView.innerWidth = 160; test.doc.defaultView.innerHeight = 120;
    test.header.rect = { x: 0, y: 0, width: 160, height: 60 };
    test.footer.rect = { x: 0, y: 90, width: 160, height: 30 };
    const passport = test.doc.passport({ x: 0, y: 0, width: 160, height: 90 });
    const existing = test.doc.add({ "data-mainline-a-observer-inline-slot": "other-owner" }, { x: 0, y: 0, width: 10, height: 10 }, passport);
    test.resize(); test.doc.defaultView.flush();
    const owned = test.last().target as unknown as DockElement;
    expect(owned).not.toBe(existing);
    test.mutate(owned, "childList", undefined, [new DockElement(test.doc)]);
    expect(test.doc.defaultView.frames.size).toBe(0);
    test.stop();
    expect(owned.isConnected).toBe(false);
    expect(passport.children).toEqual([existing]);
    expect(test.panel.isConnected).toBe(true);
  });

  it("rechecks the real portal button and rejects a covering tool in the same passport", () => {
    const test = observeDock();
    test.doc.defaultView.innerWidth = 160; test.doc.defaultView.innerHeight = 120;
    test.header.rect = { x: 0, y: 0, width: 160, height: 60 };
    test.footer.rect = { x: 0, y: 90, width: 160, height: 30 };
    const passport = test.doc.passport({ x: 0, y: 0, width: 160, height: 90 }, test.root);
    test.resize(); test.doc.defaultView.flush();
    const slot = test.last().target as unknown as DockElement;
    expect(slot.parentElement).toBe(passport);
    const restore = test.host.querySelector("[data-mainline-a-performance-restore]")!;
    restore.setAttribute("data-mainline-a-performance-restore-mode", "inline");
    restore.rect = { x: 80, y: 4, width: 76, height: 28 };
    slot.insertBefore(restore, null);
    test.mutate(slot, "childList", undefined, [restore]);
    expect(test.doc.defaultView.frames.size).toBe(1);
    test.doc.defaultView.flush(); expect(test.last().layout.hitStatus).toBe("clear");
    const tools = test.doc.add({ "aria-label": "图集与工具" }, restore.rect, passport);
    test.mutate(passport, "childList", undefined, [tools]); test.doc.defaultView.flush();
    expect(test.last().target).not.toBe(slot);
    expect(slot.isConnected).toBe(false);
    expect(test.last().layout.hitStatus).not.toBe("clear");
  });

  it.each(["full", "inline"] as const)("accepts the rounded pointer shape of a %s restore button", (mode) => {
    const test = observeDock();
    const restore = test.host.querySelector("[data-mainline-a-performance-restore]")!;
    if (mode === "inline") {
      test.doc.defaultView.innerWidth = 160; test.doc.defaultView.innerHeight = 120;
      test.header.rect = { x: 0, y: 0, width: 160, height: 60 };
      test.footer.rect = { x: 0, y: 90, width: 160, height: 30 };
      test.doc.passport({ x: 0, y: 0, width: 160, height: 90 }, test.root);
      test.resize(); test.doc.defaultView.flush();
      const slot = test.last().target as unknown as DockElement;
      restore.setAttribute("data-mainline-a-performance-restore-mode", mode);
      restore.rect = { x: 80, y: 4, width: 76, height: 28 }; slot.insertBefore(restore, null);
    }
    // Model the actual rounded-lg pointer silhouette (uniform radius 8px),
    // including empty corner pixels that hit the button's parent instead.
    test.doc.hitTest = (x, y) => {
      const { x: left, y: top, width, height } = restore.rect;
      const px = x - left, py = y - top;
      const cx = Math.max(8, Math.min(width - 8, px));
      const cy = Math.max(8, Math.min(height - 8, py));
      return px >= 0 && px < width && py >= 0 && py < height && Math.hypot(px - cx, py - cy) <= 8
        ? restore : restore.parentElement;
    };
    test.mutate(restore.parentElement!, "childList", undefined, [restore]); test.doc.defaultView.flush();
    expect(test.last().layout).toMatchObject({ mode, hitStatus: "clear" });
    expect(restore.isConnected).toBe(true);
  });

  it("rejects a portal whose centre hits but its edge is clipped by an ancestor", () => {
    const test = observeDock();
    test.doc.defaultView.innerWidth = 160; test.doc.defaultView.innerHeight = 120;
    test.header.rect = { x: 0, y: 0, width: 160, height: 60 };
    test.footer.rect = { x: 0, y: 90, width: 160, height: 30 };
    const passport = test.doc.passport({ x: 0, y: 0, width: 160, height: 90 }, test.root);
    test.resize(); test.doc.defaultView.flush();
    const slot = test.last().target as unknown as DockElement;
    const restore = test.host.querySelector("[data-mainline-a-performance-restore]")!;
    restore.setAttribute("data-mainline-a-performance-restore-mode", "inline");
    restore.rect = { x: 80, y: 4, width: 76, height: 28 }; slot.insertBefore(restore, null);
    test.doc.hitTest = (x) => x >= 153 ? passport : restore;
    test.mutate(slot, "childList", undefined, [restore]); test.doc.defaultView.flush();
    expect(test.last().target).not.toBe(slot);
    expect(slot.isConnected).toBe(false);
    expect(test.last().layout.hitStatus).not.toBe("clear");
  });

  it("rechecks a floating restore after commit and distinguishes a foreign pointer hit", () => {
    const test = observeDock();
    expect(test.last().layout.hitStatus).toBe("clear");
    const restore = test.host.querySelector("[data-mainline-a-performance-restore]")!;
    const foreign = test.doc.add({ "aria-label": "图集与工具" }, restore.rect, test.root);
    test.doc.hitTest = () => foreign;
    test.mutate(test.panel, "childList", undefined, [restore]); test.doc.defaultView.flush();
    expect(test.last().layout.hitStatus).toBe("blocked");
    const label = test.doc.add({}, restore.rect, restore, "span");
    test.doc.hitTest = () => label;
    test.mutate(restore, "attributes", "style"); test.doc.defaultView.flush();
    expect(test.last().layout.hitStatus).toBe("clear");
  });
});
