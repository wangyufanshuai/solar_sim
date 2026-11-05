import { describe, expect, it } from "vitest";
import { createMainlineAFrameClockV638, validateMainlineAFrameClockV638 } from "./mainlineAFrameClockV638";

describe("callback timestamp accounting", () => {
  const normal = () => {
    const clock = createMainlineAFrameClockV638(1000);
    [1001, 1017, 1033].forEach((time) => clock.accept(time, time + 1));
    return clock.snapshot();
  };
  const summary = { sampleCount: 2, totalMs: 32 };

  it("binds counted intervals to actual accepted callback endpoints", () => {
    expect(validateMainlineAFrameClockV638(normal(), summary, 33)).toEqual([]);
    expect(validateMainlineAFrameClockV638(normal(), { ...summary, totalMs: 31 }, 33)).toContain("frame-clock:interval-accounting");
    expect(validateMainlineAFrameClockV638(normal(), { ...summary, sampleCount: 3 }, 33)).toContain("frame-clock:sample-accounting");
  });

  it.each([
    { callbackCount: 4 },
    { firstCallbackMs: null },
    { firstCallbackMs: 1002 },
    { firstAcceptedMs: 999 },
    { lastAcceptedMs: 1001 },
    { skippedBeforeStartCount: 2 },
    { source: "performance-now" },
    { rejectedCount: 1, rejections: [] },
  ])("refuses inconsistent exported diagnostics %j", (change) => {
    expect(validateMainlineAFrameClockV638({ ...normal(), ...change }, summary, 33).length).toBeGreaterThan(0);
  });

  it("retains rejection evidence independently of the caller's session issues", () => {
    const clock = createMainlineAFrameClockV638(1000);
    expect(clock.accept(999.7, 1000)).toBe("before-window");
    expect(clock.accept(1001, 1002)).toBe("accepted");
    expect(clock.accept(1001, 1003)).toBe("rejected");
    expect(clock.accept(1017, 1018)).toBe("accepted");
    const exported = clock.snapshot();
    expect(exported.rejections[0]).toEqual({ timestampMs: 1001, receivedMs: 1003, previousAcceptedMs: 1001, reason: "non-increasing" });
    expect(validateMainlineAFrameClockV638(exported, { sampleCount: 1, totalMs: 16 }, 18)).toContain("frame-clock:rejected-callbacks");
    exported.rejections.splice(0);
    expect(clock.snapshot().rejections).toHaveLength(1);
  });

  it("does not promote empty or malformed callback streams", () => {
    const clock = createMainlineAFrameClockV638(1000);
    expect(validateMainlineAFrameClockV638(clock.snapshot(), { sampleCount: 0, totalMs: 10 }, 10)).toContain("frame-clock:empty-interval");
    for (const start of [-1, NaN, Infinity]) expect(() => createMainlineAFrameClockV638(start)).toThrow("invalid-session-start");
  });

  it.each([undefined, null, -1, NaN, Infinity, "33"])("requires a finite session window, not %s", (duration) => {
    expect(validateMainlineAFrameClockV638(normal(), summary, duration)).toContain("frame-clock:session-window");
  });

  it("rejects a translated stream even when all counts and intervals still agree", () => {
    const shifted = normal();
    shifted.firstCallbackMs! += 60_000;
    shifted.firstAcceptedMs! += 60_000;
    shifted.lastAcceptedMs! += 60_000;
    expect(validateMainlineAFrameClockV638(shifted, summary, 33)).toEqual(["frame-clock:outside-session"]);
  });

  it("keeps the existing 250ms export-window tolerance without permitting larger shifts", () => {
    const shifted = normal();
    shifted.firstCallbackMs! += 250;
    shifted.firstAcceptedMs! += 250;
    shifted.lastAcceptedMs! += 250;
    expect(validateMainlineAFrameClockV638(shifted, summary, 33)).toEqual([]);
    expect(validateMainlineAFrameClockV638(shifted, summary, 32.99)).toContain("frame-clock:outside-session");
  });

  it.each([NaN, Infinity, -1, 999])("does not use an invalid receipt clock %s to skip or accept callbacks", (receivedMs) => {
    const clock = createMainlineAFrameClockV638(1000);
    expect(clock.accept(999.7, receivedMs)).toBe("rejected");
    expect(clock.snapshot()).toMatchObject({ acceptedCount: 0, skippedBeforeStartCount: 0, rejectedCount: 1 });
    expect(clock.snapshot().rejections[0].reason).toBe("receipt-clock-invalid");
  });

  it("rejects future timestamps strictly at receipt, even inside the export tolerance", () => {
    const clock = createMainlineAFrameClockV638(1000);
    expect(clock.accept(1001, 1000)).toBe("rejected");
    expect(clock.accept(1000, 1000)).toBe("accepted");
    expect(clock.accept(1016, 1017)).toBe("accepted");
    expect(clock.snapshot()).toMatchObject({ acceptedCount: 2, firstAcceptedMs: 1000, lastAcceptedMs: 1016 });
    expect(clock.snapshot().rejections[0]).toEqual({ timestampMs: 1001, receivedMs: 1000, previousAcceptedMs: null, reason: "future" });
  });

  it("requires one accepted callback to have identical endpoints", () => {
    const clock = createMainlineAFrameClockV638(1000);
    clock.accept(1001, 1002);
    expect(validateMainlineAFrameClockV638({ ...clock.snapshot(), lastAcceptedMs: 1002 }, { sampleCount: 0, totalMs: 1 }, 2))
      .toContain("frame-clock:anchors");
  });
});
