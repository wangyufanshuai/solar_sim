import { describe, expect, it, vi } from "vitest";
import {
  attachMainlineAPanelBoundaryV637,
  createMainlineAPanelNavigationV637,
  focusMainlineATargetV637,
  isMainlineAPanelIdV637,
  mainlineAPanelFocusableElementsV637,
  mainlineAPanelKeyDecisionV637,
  mainlineAPanelOpenerKeyV637,
  reduceMainlineAPanelNavigationV637,
  restoreMainlineAPanelFocusV637,
  type MainlineAPanelIdV637,
} from "./mainlineAPanelNavigationV637";

type Listener = (event: Event) => void;

class TestEvents {
  listeners = new Map<string, { listener: Listener; capture: boolean }[]>();
  addEventListener(type: string, listener: Listener, capture = false) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), { listener, capture }]);
  }
  removeEventListener(type: string, listener: Listener, capture = false) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item.listener !== listener || item.capture !== capture));
  }
  emit(type: string, event: unknown) {
    for (const { listener } of this.listeners.get(type) ?? []) listener(event as Event);
  }
  count() {
    return [...this.listeners.values()].reduce((total, listeners) => total + listeners.length, 0);
  }
}

class TestMutationObserver {
  active = false;
  constructor(readonly callback: () => void) {}
  observe() { this.active = true; }
  disconnect() { this.active = false; }
  trigger() { if (this.active) this.callback(); }
}

class TestDocument extends TestEvents {
  activeElement: TestElement | null = null;
  frames = new Map<number, () => void>();
  observers: TestMutationObserver[] = [];
  frameSequence = 0;
  defaultView = {
    getComputedStyle: (element: TestElement) => element.style,
    requestAnimationFrame: (callback: () => void) => {
      const id = ++this.frameSequence;
      this.frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (id: number) => { this.frames.delete(id); },
    MutationObserver: class extends TestMutationObserver {},
  };
  constructor() {
    super();
    const observers = this.observers;
    this.defaultView.MutationObserver = class extends TestMutationObserver {
      constructor(callback: () => void) {
        super(callback);
        observers.push(this);
      }
    };
  }
  flushFrames() {
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    callbacks.forEach((callback) => callback());
  }
}

class TestElement extends TestEvents {
  parent: TestElement | null = null;
  children: TestElement[] = [];
  attributes = new Map<string, string>();
  style = { display: "block", visibility: "visible" };
  isConnected = true;
  layoutVisible = true;
  disabled = false;
  acceptsFocus = true;
  tabIndex = 0;
  tagName: string;
  type = "";
  name = "";
  form: TestElement | null = null;
  checked = false;
  id = "";
  focus = vi.fn(() => {
    if (!this.acceptsFocus || !this.isConnected || this.disabled) return;
    this.ownerDocument.activeElement = this;
    this.ownerDocument.emit("focusin", { target: this });
  });
  constructor(readonly ownerDocument: TestDocument, tag = "button") {
    super();
    this.tagName = tag.toUpperCase();
    if (tag === "div" || tag === "dialog") this.tabIndex = -1;
  }
  add(child: TestElement) { child.parent = this; this.children.push(child); return child; }
  contains(candidate: TestElement | null): boolean {
    return !!candidate && (candidate === this || this.children.some((child) => child.contains(candidate)));
  }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
    if (name === "tabindex") this.tabIndex = Number(value);
  }
  removeAttribute(name: string) { this.attributes.delete(name); }
  getClientRects() { return this.layoutVisible ? [{}] : []; }
  matches(selector: string): boolean {
    if (selector === ":disabled") return this.disabled || !!this.parent?.matches(":disabled");
    return selector === "dialog" && this.tagName === "DIALOG";
  }
  closest(): TestElement | null {
    if (this.attributes.has("hidden") || this.attributes.has("inert") || this.getAttribute("aria-hidden") === "true") return this;
    return this.parent?.closest() ?? null;
  }
  descendants(): TestElement[] {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }
  querySelectorAll() { return this.descendants(); }
  querySelector(selector: string): TestElement | null {
    if (selector === "dialog") return this.descendants().find((child) => child.tagName === "DIALOG") ?? null;
    return this.descendants().find((child) => child.attributes.has("data-mainline-a-initial-focus") || child.attributes.has("autofocus")) ?? null;
  }
  asElement() { return this as unknown as HTMLElement; }
}

function keyboardEvent(key: string, overrides: Record<string, unknown> = {}) {
  const event = {
    key, shiftKey: false, isComposing: false, defaultPrevented: false,
    stopPropagation: vi.fn(),
    preventDefault: vi.fn(() => { event.defaultPrevented = true; }),
    ...overrides,
  };
  return event;
}

function harness(panel: MainlineAPanelIdV637 = "roster", native = false) {
  const document = new TestDocument();
  const boundary = new TestElement(document, "div");
  const content = native ? boundary.add(new TestElement(document, "dialog")) : boundary;
  const first = content.add(new TestElement(document));
  const last = content.add(new TestElement(document));
  const outside = new TestElement(document);
  document.activeElement = outside;
  const onClose = vi.fn();
  const onNativeCancel = vi.fn();
  const controller = attachMainlineAPanelBoundaryV637(boundary.asElement(), { panel, onClose, onNativeCancel });
  return { document, boundary, content, first, last, outside, onClose, onNativeCancel, controller };
}

describe("V637 exclusive panel navigation", () => {
  it("switches one foreground panel and preserves a programmatic return destination", () => {
    const opened = reduceMainlineAPanelNavigationV637(createMainlineAPanelNavigationV637(), {
      type: "open", panel: "roster", openerKey: "stellar-menu",
    });
    const switched = reduceMainlineAPanelNavigationV637(opened, { type: "open", panel: "stellar-atlas" });
    expect(switched).toMatchObject({
      phase: "open", activePanel: "stellar-atlas", openerKey: "stellar-menu",
      lastTransition: { kind: "switch", from: "roster", to: "stellar-atlas" },
    });
    expect(switched.session).not.toBe(opened.session);
  });

  it("ignores stale close from a panel replaced by a later panel", () => {
    const first = reduceMainlineAPanelNavigationV637(createMainlineAPanelNavigationV637(), { type: "open", panel: "roster" });
    const second = reduceMainlineAPanelNavigationV637(first, { type: "open", panel: "nebula-atlas" });
    expect(reduceMainlineAPanelNavigationV637(second, { type: "close", reason: "escape", expectedSession: first.session! })).toBe(second);
    expect(reduceMainlineAPanelNavigationV637(second, {
      type: "close", reason: "close-button", expectedSession: second.session!, expectedPanel: "roster",
    })).toBe(second);
  });

  it("distinguishes a reopened panel from an earlier instance with the same ID", () => {
    const opened = reduceMainlineAPanelNavigationV637(createMainlineAPanelNavigationV637(), { type: "open", panel: "hero-review" });
    const closed = reduceMainlineAPanelNavigationV637(opened, { type: "close", reason: "scene-focus", expectedSession: opened.session! });
    const reopened = reduceMainlineAPanelNavigationV637(closed, { type: "open", panel: "hero-review" });
    expect(closed.lastTransition?.reason).toBe("scene-focus");
    expect(reduceMainlineAPanelNavigationV637(reopened, { type: "close", reason: "escape", expectedSession: opened.session! })).toBe(reopened);
  });

  it("rejects malformed IDs and makes duplicate open/close callbacks idempotent", () => {
    const initial = createMainlineAPanelNavigationV637();
    expect(isMainlineAPanelIdV637("constructor")).toBe(false);
    expect(isMainlineAPanelIdV637(null)).toBe(false);
    expect(reduceMainlineAPanelNavigationV637(initial, { type: "open", panel: "constructor" as MainlineAPanelIdV637 })).toBe(initial);
    const opened = reduceMainlineAPanelNavigationV637(initial, { type: "open", panel: "nebula-review" });
    expect(reduceMainlineAPanelNavigationV637(opened, { type: "open", panel: "nebula-review" })).toBe(opened);
    const close = { type: "close", reason: "escape", expectedSession: opened.session! } as const;
    const closed = reduceMainlineAPanelNavigationV637(opened, close);
    expect(reduceMainlineAPanelNavigationV637(closed, close)).toBe(closed);
  });

  it("records an explicit new toolbar opener on switch", () => {
    const first = reduceMainlineAPanelNavigationV637(createMainlineAPanelNavigationV637(), { type: "open", panel: "roster", openerKey: "old" });
    const next = reduceMainlineAPanelNavigationV637(first, { type: "open", panel: "nebula-review", openerKey: "nebula-evidence" });
    expect(next.openerKey).toBe("nebula-evidence");
  });
});

describe("V637 keyboard and focus boundary adapter", () => {
  it("moves initial custom-panel focus inside and cycles both Tab boundaries", () => {
    const h = harness();
    h.document.flushFrames();
    expect(h.document.activeElement).toBe(h.first);
    const reverse = keyboardEvent("Tab", { shiftKey: true });
    h.document.emit("keydown", reverse);
    expect(h.document.activeElement).toBe(h.last);
    expect(reverse.defaultPrevented).toBe(true);
    const forward = keyboardEvent("Tab");
    h.document.emit("keydown", forward);
    expect(h.document.activeElement).toBe(h.first);
    h.controller.stop();
  });

  it("preserves normal Tab movement between controls", () => {
    const h = harness();
    h.first.focus();
    const event = keyboardEvent("Tab");
    h.document.emit("keydown", event);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
    h.controller.stop();
  });

  it("honors deliberate initial focus before generic first button", () => {
    const h = harness();
    h.last.setAttribute("data-mainline-a-initial-focus", "true");
    h.document.flushFrames();
    expect(h.document.activeElement).toBe(h.last);
    h.controller.stop();
  });

  it("contains focus after external focus and repairs a removed focused control", () => {
    const h = harness();
    h.document.flushFrames();
    h.last.focus();
    h.outside.focus();
    expect(h.document.activeElement).toBe(h.last);
    h.last.isConnected = false;
    h.document.observers[0].trigger();
    h.document.flushFrames();
    expect(h.document.activeElement).toBe(h.first);
    h.controller.stop();
  });

  it("excludes disabled, inert, hidden and non-rendered controls before wrapping", () => {
    const h = harness();
    h.first.disabled = true;
    const hidden = h.boundary.add(new TestElement(h.document));
    hidden.setAttribute("hidden", "");
    const inert = h.boundary.add(new TestElement(h.document, "div"));
    inert.setAttribute("inert", "");
    inert.add(new TestElement(h.document));
    const unpainted = h.boundary.add(new TestElement(h.document));
    unpainted.layoutVisible = false;
    expect(mainlineAPanelFocusableElementsV637(h.boundary.asElement())).toEqual([h.last]);
    h.document.flushFrames();
    expect(h.document.activeElement).toBe(h.last);
    h.controller.stop();
  });

  it("matches positive-tabindex priority and keeps only the selected radio in each form", () => {
    const document = new TestDocument();
    const boundary = new TestElement(document, "div");
    const normal = boundary.add(new TestElement(document));
    const priority = boundary.add(new TestElement(document));
    priority.tabIndex = 2;
    const before = boundary.add(new TestElement(document));
    before.tabIndex = 1;
    const unchecked = boundary.add(new TestElement(document, "input"));
    const checked = boundary.add(new TestElement(document, "input"));
    for (const element of [unchecked, checked]) { element.type = "radio"; element.name = "projection"; }
    checked.checked = true;
    const otherForm = boundary.add(new TestElement(document, "input"));
    otherForm.type = "radio";
    otherForm.name = "projection";
    otherForm.form = new TestElement(document, "form");
    expect(mainlineAPanelFocusableElementsV637(boundary.asElement())).toEqual([before, priority, normal, checked, otherForm]);
  });

  it("uses a temporary boundary focus target if a loading/error surface has no controls", () => {
    const h = harness();
    h.first.disabled = true;
    h.last.disabled = true;
    h.document.flushFrames();
    expect(h.document.activeElement).toBe(h.boundary);
    expect(h.boundary.getAttribute("tabindex")).toBe("-1");
    const event = keyboardEvent("Tab");
    h.document.emit("keydown", event);
    expect(event.defaultPrevented).toBe(true);
    h.controller.stop();
    expect(h.boundary.getAttribute("tabindex")).toBeNull();
  });

  it("does not erase a tabindex changed by the consuming component", () => {
    const h = harness();
    h.first.disabled = true;
    h.last.disabled = true;
    h.document.flushFrames();
    h.boundary.setAttribute("tabindex", "0");
    h.controller.stop();
    expect(h.boundary.getAttribute("tabindex")).toBe("0");
  });

  it("closes a custom panel on Escape and prevents outer journey handling", () => {
    const h = harness();
    const event = keyboardEvent("Escape");
    h.document.emit("keydown", event);
    expect(h.onClose).toHaveBeenCalledExactlyOnceWith("escape");
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
    expect(h.document.listeners.get("keydown")?.[0].capture).toBe(true);
    h.controller.stop();
  });

  it("leaves native focus and cancel defaults intact while intercepting outer Escape", () => {
    const h = harness("stellar-atlas", true);
    h.document.flushFrames();
    expect(h.controller.mode()).toBe("native-modal");
    expect(h.document.activeElement).toBe(h.outside);
    const tab = keyboardEvent("Tab");
    h.document.emit("keydown", tab);
    expect(tab.preventDefault).not.toHaveBeenCalled();
    const escape = keyboardEvent("Escape");
    h.document.emit("keydown", escape);
    expect(escape.stopPropagation).toHaveBeenCalledOnce();
    expect(escape.preventDefault).not.toHaveBeenCalled();
    expect(h.onClose).not.toHaveBeenCalled();
    h.boundary.emit("cancel", { target: h.content, defaultPrevented: false });
    expect(h.onNativeCancel).toHaveBeenCalledOnce();
    expect(h.onClose).not.toHaveBeenCalled();
    h.controller.stop();
  });

  it("ignores cancellation from a nested unrelated dialog", () => {
    const h = harness("nebula-review", true);
    const nested = h.content.add(new TestElement(h.document, "dialog"));
    h.boundary.emit("cancel", { target: nested, defaultPrevented: false });
    h.boundary.emit("cancel", { target: h.content, defaultPrevented: true });
    expect(h.onClose).not.toHaveBeenCalled();
    expect(h.onNativeCancel).not.toHaveBeenCalled();
    h.controller.stop();
  });

  it("does not trap or close the modeless performance observer", () => {
    const h = harness("performance");
    h.document.flushFrames();
    expect(h.document.activeElement).toBe(h.outside);
    h.first.focus();
    h.outside.focus();
    for (const key of ["Tab", "Escape"]) {
      const event = keyboardEvent(key);
      h.document.emit("keydown", event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    }
    expect(h.document.activeElement).toBe(h.outside);
    expect(h.onClose).not.toHaveBeenCalled();
    h.controller.stop();
  });

  it("does not close while composing text or after an earlier handler consumes the key", () => {
    const h = harness();
    h.document.emit("keydown", keyboardEvent("Escape", { isComposing: true }));
    h.document.emit("keydown", keyboardEvent("Escape", { defaultPrevented: true }));
    expect(h.onClose).not.toHaveBeenCalled();
    h.controller.stop();
  });

  it("cleans up all handlers, observers and pending focus work exactly once", () => {
    const h = harness();
    expect(h.document.count()).toBe(2);
    expect(h.boundary.count()).toBe(1);
    expect(h.document.frames.size).toBe(1);
    h.controller.stop();
    h.controller.stop();
    expect(h.document.count()).toBe(0);
    expect(h.boundary.count()).toBe(0);
    expect(h.document.frames.size).toBe(0);
    expect(h.document.observers.every((observer) => !observer.active)).toBe(true);
    h.document.emit("keydown", keyboardEvent("Escape"));
    h.document.observers[0].trigger();
    h.document.flushFrames();
    expect(h.onClose).not.toHaveBeenCalled();
    expect(h.document.activeElement).toBe(h.outside);
  });

  it("cannot hijack keys after the owner DOM subtree is detached", () => {
    const h = harness();
    h.boundary.isConnected = false;
    h.document.emit("keydown", keyboardEvent("Escape"));
    h.document.flushFrames();
    expect(h.onClose).not.toHaveBeenCalled();
    expect(h.document.activeElement).toBe(h.outside);
    h.controller.stop();
  });
});

describe("V637 return focus", () => {
  it("restores a connected opener without scrolling", () => {
    const document = new TestDocument();
    const opener = new TestElement(document);
    expect(restoreMainlineAPanelFocusV637(opener.asElement())).toBe(true);
    expect(opener.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(opener);
  });

  it("uses the live toolbar fallback when an opener was removed or cannot receive focus", () => {
    const document = new TestDocument();
    const opener = new TestElement(document);
    const fallback = new TestElement(document);
    opener.isConnected = false;
    expect(restoreMainlineAPanelFocusV637(opener.asElement(), fallback.asElement())).toBe(true);
    opener.isConnected = true;
    opener.acceptsFocus = false;
    expect(restoreMainlineAPanelFocusV637(opener.asElement(), fallback.asElement())).toBe(true);
    fallback.setAttribute("aria-hidden", "true");
    expect(restoreMainlineAPanelFocusV637(opener.asElement(), fallback.asElement())).toBe(false);
  });

  it("rejects hidden openers and preserves semantic opener identity", () => {
    const document = new TestDocument();
    const opener = new TestElement(document);
    opener.style.visibility = "hidden";
    expect(focusMainlineATargetV637(opener.asElement())).toBe(false);
    opener.id = "toolbar-stellar";
    expect(mainlineAPanelOpenerKeyV637(opener.asElement(), "roster")).toBe("toolbar-stellar");
    opener.setAttribute("data-mainline-a-panel-trigger", "stellar-atlas");
    expect(mainlineAPanelOpenerKeyV637(opener.asElement(), "roster")).toBe("stellar-atlas");
  });

  it("handles focus on a non-tabstop heading consistently in both directions", () => {
    const input = {
      key: "Tab", shiftKey: false, isComposing: false, defaultPrevented: false,
      mode: "custom-modal" as const, focusInside: true, focusIndex: -1, focusableCount: 3,
    };
    expect(mainlineAPanelKeyDecisionV637(input)).toBe("focus-first");
    expect(mainlineAPanelKeyDecisionV637({ ...input, shiftKey: true })).toBe("focus-last");
  });
});
