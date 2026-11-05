import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { borrowMainlineANebulaImageM3 } from "./mainlineANebulaViewerM3";

// Bounded DOM protocol fixtures exercise ownership only. Actual decode, dialog
// focus and browser request behavior are verified by the browser capture run.
const documentIdentity = {};
class ElementFixture {
  readonly ownerDocument: object;
  readonly attributesMap = new Map<string, string>();
  readonly writes: string[] = [];
  readonly childNodes: ElementFixture[] = [];
  parentNode: ElementFixture | null = null;
  tagName = "DIV";
  nodeType = 1;
  isConnected = true;

  constructor(ownerDocument: object = documentIdentity) { this.ownerDocument = ownerDocument; }
  get parentElement() { return this.parentNode; }
  get nextSibling(): ElementFixture | null {
    const index = this.parentNode?.childNodes.indexOf(this) ?? -1;
    return index < 0 ? null : this.parentNode!.childNodes[index + 1] ?? null;
  }
  get attributes() { return [...this.attributesMap].map(([name, value]) => ({ name, value })); }
  getAttribute(name: string): string | null { return this.attributesMap.get(name) ?? null; }
  hasAttribute(name: string): boolean { return this.attributesMap.has(name); }
  getAttributeNames(): string[] { return [...this.attributesMap.keys()]; }
  setAttribute(name: string, value: string): void {
    this.writes.push(`set:${name}`);
    this.attributesMap.set(name, String(value));
  }
  removeAttribute(name: string): void {
    this.writes.push(`remove:${name}`);
    this.attributesMap.delete(name);
  }
  appendChild(child: ElementFixture): ElementFixture {
    child.parentNode?.removeChild(child);
    this.childNodes.push(child); child.parentNode = this;
    return child;
  }
  append(child: ElementFixture): void { this.appendChild(child); }
  insertBefore(child: ElementFixture, sibling: ElementFixture | null): ElementFixture {
    if (sibling === null) return this.appendChild(child);
    if (sibling.parentNode !== this) throw new Error("not-a-child");
    child.parentNode?.removeChild(child);
    this.childNodes.splice(this.childNodes.indexOf(sibling), 0, child); child.parentNode = this;
    return child;
  }
  removeChild(child: ElementFixture): ElementFixture {
    const index = this.childNodes.indexOf(child);
    if (index < 0) throw new Error("not-a-child");
    this.childNodes.splice(index, 1); child.parentNode = null;
    return child;
  }
  remove(): void { this.parentNode?.removeChild(this); }
  contains(child: ElementFixture): boolean {
    return child === this || this.childNodes.some((entry) => entry.contains(child));
  }
}

class ImageFixture extends ElementFixture {
  tagName = "IMG";
  naturalWidth = 1280;
  naturalHeight = 620;
  complete = true;
  get src() { return this.getAttribute("src") ?? ""; }
  set src(value: string) { this.setAttribute("src", value); }
  get srcset() { return this.getAttribute("srcset") ?? ""; }
  set srcset(value: string) { this.setAttribute("srcset", value); }
  get width() { return Number(this.getAttribute("width") ?? this.naturalWidth); }
  set width(value: number) { this.setAttribute("width", String(value)); }
  get height() { return Number(this.getAttribute("height") ?? this.naturalHeight); }
  set height(value: number) { this.setAttribute("height", String(value)); }
  get alt() { return this.getAttribute("alt") ?? ""; }
  set alt(value: string) { this.setAttribute("alt", value); }
  get draggable() { return this.getAttribute("draggable") === "true"; }
  set draggable(value: boolean) { this.setAttribute("draggable", String(value)); }
  cloneNode(): never { throw new Error("the-decoded-image-must-not-be-cloned"); }
}

const leases: Array<{ release: () => boolean }> = [];
const options = { objectId: "carina", title: "船底座星云", sha256: "a".repeat(64) };
function borrow(image: ImageFixture, host: ElementFixture, changes = {}) {
  const lease = borrowMainlineANebulaImageM3(image as unknown as HTMLImageElement,
    host as unknown as HTMLElement, { ...options, ...changes });
  leases.push(lease);
  return lease;
}
function sourceImage() {
  const image = new ImageFixture();
  image.attributesMap.set("src", "blob:already-revoked-after-successful-decode");
  image.attributesMap.set("srcset", "");
  image.attributesMap.set("width", "1280");
  image.attributesMap.set("height", "620");
  image.attributesMap.set("alt", "original alternate text");
  image.attributesMap.set("draggable", "true");
  image.attributesMap.set("style", "border: 0; opacity: 0.9;");
  return image;
}
beforeEach(() => {
  vi.stubGlobal("HTMLImageElement", ImageFixture);
  vi.stubGlobal("HTMLElement", ElementFixture);
});
afterEach(() => {
  for (const lease of leases.splice(0).reverse()) lease.release();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("M3 borrowed decoded image node ownership; protocol fixtures only", () => {
  it("moves the exact decoded image without changing its source or dimensions and fully restores it", () => {
    const image = sourceImage(), host = new ElementFixture();
    const original = [...image.attributesMap];
    const lease = borrow(image, host);
    expect(lease.image).toBe(image);
    expect(host.childNodes).toEqual([image]);
    expect(image.parentNode).toBe(host);
    expect(lease.release()).toBe(true);
    expect(lease.release()).toBe(false);
    expect(host.childNodes).toHaveLength(0);
    expect(image.parentNode).toBeNull();
    expect([...image.attributesMap].sort()).toEqual(original.sort());
    expect(image.writes.filter((write) => /:(?:src|srcset|width|height)$/.test(write))).toEqual([]);
    expect(image.naturalWidth).toBe(1280); expect(image.naturalHeight).toBe(620);
  });

  it("restores the exact original sibling position rather than appending a reparented image arbitrarily", () => {
    const original = new ElementFixture(), before = new ElementFixture(), after = new ElementFixture();
    const image = sourceImage();
    original.append(before); original.append(image); original.append(after);
    const lease = borrow(image, new ElementFixture());
    expect(original.childNodes).toEqual([before, after]);
    lease.release();
    expect(original.childNodes).toEqual([before, image, after]);
  });

  it("restores safely if the former next sibling was removed during viewing", () => {
    const original = new ElementFixture(), image = sourceImage(), sibling = new ElementFixture();
    original.append(image); original.append(sibling);
    const lease = borrow(image, new ElementFixture());
    sibling.remove();
    expect(() => lease.release()).not.toThrow();
    expect(original.childNodes).toEqual([image]);
  });

  it("rejects simultaneous borrowing of the same image without disturbing its active owner", () => {
    const image = sourceImage(), firstHost = new ElementFixture(), secondHost = new ElementFixture();
    const first = borrow(image, firstHost);
    const activeAttributes = [...image.attributesMap];
    expect(() => borrow(image, secondHost)).toThrow();
    expect(image.parentNode).toBe(firstHost);
    expect(secondHost.childNodes).toHaveLength(0);
    expect([...image.attributesMap]).toEqual(activeAttributes);
    expect(first.release()).toBe(true);
  });

  it("supports StrictMode-style reattachment and an old cleanup cannot detach the new borrow", () => {
    const image = sourceImage(), firstHost = new ElementFixture(), secondHost = new ElementFixture();
    const first = borrow(image, firstHost);
    first.release();
    const second = borrow(image, secondHost);
    const activeAttributes = [...image.attributesMap];
    expect(first.release()).toBe(false);
    expect(image.parentNode).toBe(secondHost);
    expect([...image.attributesMap]).toEqual(activeAttributes);
    expect(second.release()).toBe(true);
  });

  it("keeps rapid A-to-B image ownership independent while the old image is released", () => {
    const a = sourceImage(), b = sourceImage();
    const aHost = new ElementFixture(), bHost = new ElementFixture();
    const first = borrow(a, aHost), second = borrow(b, bHost, { objectId: "m42", sha256: "b".repeat(64) });
    first.release();
    expect(a.parentNode).toBeNull();
    expect(b.parentNode).toBe(bHost);
    expect(b.getAttribute("data-image-sha256")).toBe("b".repeat(64));
    expect(second.release()).toBe(true);
  });

  it("does not seize an externally moved node or overwrite external attribute changes", () => {
    const image = sourceImage(), host = new ElementFixture(), outside = new ElementFixture();
    const lease = borrow(image, host);
    outside.append(image);
    image.setAttribute("style", "opacity: 0.5;");
    image.setAttribute("alt", "new external owner");
    lease.release();
    expect(image.parentNode).toBe(outside);
    expect(image.getAttribute("style")).toBe("opacity: 0.5;");
    expect(image.getAttribute("alt")).toBe("new external owner");
    expect(image.getAttribute("draggable")).toBe("true");
    expect(image.getAttribute("data-mainline-a-nebula-borrowed")).toBeNull();
  });

  it("rolls back failed attachment so the image can be borrowed successfully afterwards", () => {
    const image = sourceImage(), original = new ElementFixture(), brokenHost = new ElementFixture();
    original.append(image);
    const originalAttributes = [...image.attributesMap];
    vi.spyOn(brokenHost, "appendChild").mockImplementationOnce(() => { throw new Error("attachment failed"); });
    expect(() => borrow(image, brokenHost)).toThrow("attachment failed");
    expect(image.parentNode).toBe(original);
    expect([...image.attributesMap].sort()).toEqual(originalAttributes.sort());
    const healthyHost = new ElementFixture(), retry = borrow(image, healthyHost);
    expect(image.parentNode).toBe(healthyHost);
    expect(retry.release()).toBe(true);
    expect(image.parentNode).toBe(original);
  });

  it("does not use CSS-constrained width and height as the decoded image dimensions", () => {
    const image = sourceImage();
    Object.defineProperty(image, "width", { get: () => 0, set: () => { throw new Error("width mutation"); } });
    Object.defineProperty(image, "height", { get: () => 0, set: () => { throw new Error("height mutation"); } });
    const lease = borrow(image, new ElementFixture());
    expect(lease.image).toBe(image);
    expect(lease.release()).toBe(true);
  });

  it.each([
    { complete: false, naturalWidth: 1280, naturalHeight: 620 },
    { complete: true, naturalWidth: 0, naturalHeight: 620 },
    { complete: true, naturalWidth: 1280, naturalHeight: 0 },
  ])("rejects images without a complete positive intrinsic decode: %j", (invalid) => {
    const image = Object.assign(sourceImage(), invalid), host = new ElementFixture();
    const original = [...image.attributesMap];
    expect(() => borrow(image, host)).toThrow();
    expect(host.childNodes).toHaveLength(0);
    expect(image.parentNode).toBeNull();
    expect([...image.attributesMap]).toEqual(original);
  });
});
