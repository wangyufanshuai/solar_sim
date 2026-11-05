import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createObservationJourneyM4, ORION_JOURNEY_M4 } from "./mainlineAObservationJourneyM4";
import { getMainlineAObservationStepCatalogIdV607 } from "../data/mainlineAObservationRoutesV607";
import { atlasRuntimeStore } from "./atlasRuntimeStore";

const targets = ORION_JOURNEY_M4.steps.map((step) => getMainlineAObservationStepCatalogIdV607(step)!);
function setup() {
  let runtime = { ...atlasRuntimeStore.getServerSnapshot(), selectedObjectId: targets[0], focusRequestId: 1,
    focusTransition: "locked" as "locked" | "transition" | "idle", scaleBand: "stellar" as const };
  const subscriptions = new Set<() => void>();
  let available = true;
  const publish = () => subscriptions.forEach((listener) => listener());
  const focus = vi.fn((target: string) => {
    runtime = { ...runtime, selectedObjectId: target, focusRequestId: runtime.focusRequestId + 1, focusTransition: "transition" };
    publish();
  });
  const restore = vi.fn(() => true);
  const controller = createObservationJourneyM4({
    read: () => runtime, subscribe: (listener) => { subscriptions.add(listener); return () => { subscriptions.delete(listener); }; },
    available: () => available, focus, restore,
    capture: () => ({ catalogId: runtime.selectedObjectId, uniquePose: [17, 22, 43] }),
  });
  controller.connect();
  return { controller, focus, restore, subscriptions,
    lock: () => { runtime = { ...runtime, focusTransition: "locked" }; publish(); },
    update: (patch: Partial<typeof runtime>) => { runtime = { ...runtime, ...patch }; publish(); },
    external: (target = runtime.selectedObjectId) => focus(target),
    available: (value: boolean) => { available = value; publish(); },
    read: () => runtime,
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("Orion observation journey ownership", () => {
  it("travels all five existing catalog targets forward and backward, with boundary and rapid-click guards", () => {
    const h = setup();
    expect(h.controller.start()).toBe(true);
    expect(h.controller.move(1)).toBe(false);
    h.lock();
    expect(h.controller.move(-1)).toBe(false);
    for (let i = 1; i < 5; i++) {
      expect(h.controller.move(1)).toBe(true);
      expect(h.controller.move(1)).toBe(false);
      expect(h.controller.getSnapshot()?.target).toBe(targets[i]);
      expect(h.controller.getSnapshot()?.status).toBe("travelling");
      h.lock();
    }
    expect(h.controller.move(1)).toBe(false);
    for (let i = 3; i >= 0; i--) {
      expect(h.controller.move(-1)).toBe(true); h.lock();
      expect(h.controller.getSnapshot()?.target).toBe(targets[i]);
    }
    h.controller.dispose();
  });
  it("pauses for an external request even at the same target, and resumes only explicitly", () => {
    const h = setup(); h.controller.start(); h.lock();
    const own = h.controller.getSnapshot()!.requestId;
    h.external();
    expect(h.controller.getSnapshot()).toMatchObject({ status: "paused", requestId: own, canReturn: true });
    h.lock();
    expect(h.controller.getSnapshot()?.status).toBe("paused");
    expect(h.controller.resume()).toBe(true); h.lock();
    expect(h.controller.getSnapshot()?.status).toBe("ready"); h.controller.dispose();
  });
  it("does not mark another target locked as arrival", () => {
    const h = setup(); h.controller.start();
    h.update({ selectedObjectId: "stellar-hero:sirius-a", focusTransition: "locked" });
    expect(h.controller.getSnapshot()?.status).toBe("paused"); h.controller.dispose();
  });
  it("restores the opaque starting pose only after its own return request is locked", () => {
    const h = setup(); h.controller.start(); h.lock(); h.controller.move(1); h.lock();
    expect(h.controller.returnToStart()).toBe(true);
    expect(h.restore).not.toHaveBeenCalled();
    expect(h.controller.getSnapshot()?.status).toBe("returning");
    h.lock();
    expect(h.restore).toHaveBeenCalledWith({ catalogId: targets[0], uniquePose: [17, 22, 43] }, h.read().focusRequestId);
    expect(h.controller.getSnapshot()).toMatchObject({ status: "returned", canReturn: false });
    h.controller.dispose();
  });
  it("discards stale return completion when the user selects a new object", () => {
    const h = setup(); h.controller.start(); h.lock(); h.controller.returnToStart();
    h.external("stellar-hero:sirius-a"); h.lock();
    expect(h.restore).not.toHaveBeenCalled();
    expect(h.controller.getSnapshot()?.status).toBe("paused"); h.controller.dispose();
  });
  it("does not dispatch selection while a higher camera owner has control", () => {
    const h = setup(); h.controller.start(); h.lock(); h.available(false);
    const calls = h.focus.mock.calls.length;
    expect(h.controller.resume()).toBe(false);
    expect(h.focus).toHaveBeenCalledTimes(calls);
    h.available(true);
    expect(h.controller.getSnapshot()?.status).toBe("paused");
    expect(h.controller.resume()).toBe(true); h.controller.dispose();
  });
  it("invalidates the old bookmark after manual scale or incompatible scene changes", () => {
    const h = setup(); h.controller.start(); h.lock();
    h.update({ scaleJourney: { ...h.read().scaleJourney, requestId: 2 } });
    expect(h.controller.getSnapshot()).toMatchObject({ status: "paused", canReturn: false });
    expect(h.controller.returnToStart()).toBeFalsy();
    expect(h.controller.resume()).toBe(true); h.lock();
    h.update({ experienceMode: "research" });
    expect(h.controller.resume()).toBe(false); h.controller.dispose();
  });
  it("fails closed when bookmark restoration is rejected", () => {
    const h = setup(); h.controller.start(); h.lock(); h.restore.mockReturnValue(false);
    h.controller.returnToStart(); h.lock();
    expect(h.controller.getSnapshot()).toMatchObject({ status: "paused", canReturn: false }); h.controller.dispose();
  });
  it("times out without claiming arrival and releases timer/subscription on unmount", () => {
    const h = setup(); h.controller.start(); vi.advanceTimersByTime(12_000);
    expect(h.controller.getSnapshot()?.status).toBe("paused");
    h.controller.resume(); h.controller.dispose();
    expect(h.subscriptions.size).toBe(0); expect(vi.getTimerCount()).toBe(0);
    h.lock(); expect(h.controller.getSnapshot()).toBeNull();
  });
  it("closing a passport or changing safe-area measurements does not interrupt", () => {
    const h = setup(); h.controller.start(); h.lock();
    h.update({ safeViewportRevision: 100, panels: { ...h.read().panels } });
    expect(h.controller.getSnapshot()?.status).toBe("ready");
    h.controller.end(); expect(h.controller.getSnapshot()).toBeNull();
    expect(h.restore).not.toHaveBeenCalled(); h.controller.dispose();
  });
});
