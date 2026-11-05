import { describe, expect, it, vi } from "vitest";
import { createMainlineAPerformanceSessionV625, selectMainlineAPerformanceIdentityRootV625, selectMainlineAPerformanceRootV625 } from "./mainlineAPerformanceSessionV625";

describe("Mainline A V625 session controller", () => {
  it("collects frame and long-task samples and closes once", () => {
    const session = createMainlineAPerformanceSessionV625({ device: "desktop", scenario: "atlas", sequence: 7 });
    session.pushFrame(10, 16);
    session.pushLongTask(72);
    session.pushFrame(26, 16);
    expect(session.snapshot().frameSamples).toBe(2);
    expect(session.snapshot().longTasks).toBe(1);
    const run = session.finish({ notes: ["test"] });
    expect(run?.runId).toMatch(/^r65-desktop-007-/);
    expect(run?.frame.longTaskMaxMs).toBe(72);
    expect(session.finish()).toBeNull();
  });

  it("marks an aborted session blocked", () => {
    const session = createMainlineAPerformanceSessionV625({ device: "mobile", scenario: "repeat-cycle" });
    session.pushFrame(10, 18);
    const run = session.abort("test-abort");
    expect(run?.status).toBe("blocked");
    expect(run?.notes.join(" ")).toContain("test-abort");
    expect(session.state()).toBe("aborted");
  });

  it("ignores samples after finish", () => {
    const session = createMainlineAPerformanceSessionV625({ device: "desktop" });
    session.pushFrame(1, 16);
    session.finish();
    session.pushFrame(2, 16);
    session.pushLongTask(100);
    expect(session.snapshot().frameSamples).toBe(1);
  });

  it("marks a server-side construction as blocked rather than browser evidence", () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined);
    const session = createMainlineAPerformanceSessionV625({ device: "mobile" });
    expect(session.viewport.userAgentClass).toBe("mobile-viewport");
    const run = session.finish();
    expect(run?.status).toBe("blocked");
    expect(run?.notes.join(" ")).toContain("browser-runtime-unavailable");
    vi.stubGlobal("window", originalWindow);
  });

  it("binds panel visibility to the performance surface before the app shell", () => {
    const panel = { id: "performance-panel" } as unknown as HTMLElement;
    const shell = { id: "app-shell" } as unknown as HTMLElement;
    const selectors: string[] = [];
    const root = selectMainlineAPerformanceRootV625((selector) => {
      selectors.push(selector);
      if (selector === "[data-mainline-a-performance]") return panel;
      if (selector === "[data-atlas-app-shell]") return shell;
      return null;
    });
    expect(root).toBe(panel);
    expect(selectors).toEqual(["[data-mainline-a-performance]"]);
  });

  it("binds build identity to the app shell while retaining a panel fallback", () => {
    const panel = { id: "performance-panel" } as unknown as HTMLElement;
    const shell = { id: "app-shell" } as unknown as HTMLElement;
    const selectors: string[] = [];
    const root = selectMainlineAPerformanceIdentityRootV625((selector) => {
      selectors.push(selector);
      if (selector === "[data-atlas-app-shell]") return shell;
      if (selector === "[data-mainline-a-performance]") return panel;
      return null;
    }, panel);
    expect(root).toBe(shell);
    expect(selectors).toEqual(["[data-atlas-app-shell]"]);
  });

  it("uses the supplied root when no identity marker exists", () => {
    const panel = { id: "performance-panel" } as unknown as HTMLElement;
    const root = selectMainlineAPerformanceIdentityRootV625(() => null, panel);
    expect(root).toBe(panel);
  });
});
