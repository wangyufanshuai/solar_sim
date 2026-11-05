import { describe, expect, it } from "vitest";
import { resolveMainlineAConstellationSafeViewportV638 } from "./mainlineAConstellationCameraV638";
import type { ConstellationDomBlockerV638, ConstellationDomMeasurementV638 } from "./mainlineAConstellationLabelOcclusionV638";

const runtime = { left: 0, top: 0, right: 864, bottom: 642, viewportWidth: 1280, viewportHeight: 720 };
const measurement = (blockers: readonly ConstellationDomBlockerV638[]): ConstellationDomMeasurementV638 => ({
  canvas: { x: 0, y: 0, width: 1280, height: 720 }, viewport: { x: 0, y: 0, width: 1280, height: 720 }, blockers,
});
const nav: ConstellationDomBlockerV638 = { id: "nav", kind: "navigation", rect: { x: 103, y: 12, width: 720, height: 93 } };
const hud: ConstellationDomBlockerV638 = { id: "hud", kind: "topline", rect: { x: 551, y: 113, width: 178, height: 46 } };

describe("V638 measured constellation viewport", () => {
  it("excludes actual navigation and the entire two-line HUD from the same rectangle", () => {
    const result = resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, measurement([nav, hud]));
    expect(result).not.toBeNull();
    expect(result!.left).toBeGreaterThanOrEqual(runtime.left);
    expect(result!.right).toBeLessThanOrEqual(runtime.right);
    expect(result!.top).toBeGreaterThanOrEqual(runtime.top);
    expect(result!.bottom).toBeLessThanOrEqual(runtime.bottom);
    for (const blocker of [nav, hud]) {
      expect(result!.right <= blocker.rect.x || result!.left >= blocker.rect.x + blocker.rect.width
        || result!.bottom <= blocker.rect.y || result!.top >= blocker.rect.y + blocker.rect.height).toBe(true);
    }
    expect(runtime.top).toBe(0);
  });

  it("keeps the previous runtime boundary when DOM measurement is not available", () => {
    expect(resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, null)).toEqual(runtime);
  });

  it("has no visible candidate if all the allowed area is covered", () => {
    expect(resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, measurement([
      { id: "cover", kind: "other", rect: { x: 0, y: 0, width: 900, height: 700 } },
    ]))).toBeNull();
  });

  it("treats the two-pixel mobile full-sheet side slivers as unavailable", () => {
    const mobile = { left: 0, top: 0, right: 390, bottom: 66.8125, viewportWidth: 390, viewportHeight: 844 };
    expect(resolveMainlineAConstellationSafeViewportV638(390, 844, mobile, {
      canvas: { x: 0, y: 0, width: 390, height: 844 },
      viewport: { x: 0, y: 0, width: 390, height: 844 },
      blockers: [
        { id: "navigation", kind: "navigation", rect: { x: 10, y: 8, width: 370, height: 61.8125 } },
        { id: "passport", kind: "passport", rect: { x: 8, y: 78.8125, width: 374, height: 675.1875 } },
      ],
    })).toBeNull();
  });

  it.each([1, 2])("applies the 64 CSS pixel layout floor at canvas scale %s without rejecting an 86px frame", (scale) => {
    const width = 390 * scale; const height = 844 * scale;
    const value: ConstellationDomMeasurementV638 = {
      canvas: { x: 20, y: 30, width: 390, height: 844 },
      viewport: { x: 20, y: 30, width: 390, height: 844 }, blockers: [],
    };
    const rect = (edge: number) => ({ left: 0, top: 0, right: width, bottom: edge * scale, viewportWidth: width, viewportHeight: height });
    expect(resolveMainlineAConstellationSafeViewportV638(width, height, rect(63.9), value)).toBeNull();
    expect(resolveMainlineAConstellationSafeViewportV638(width, height, rect(64), value)).toEqual(rect(64));
    expect(resolveMainlineAConstellationSafeViewportV638(width, height, rect(86), value)).toEqual(rect(86));
    expect(resolveMainlineAConstellationSafeViewportV638(width, height, rect(2), null)).toEqual(rect(2));
  });

  it("uses the canvas client origin and CSS scale instead of treating client coordinates as scene pixels", () => {
    const shifted: ConstellationDomMeasurementV638 = {
      canvas: { x: 50, y: 30, width: 640, height: 360 },
      viewport: { x: 50, y: 30, width: 640, height: 360 },
      blockers: [{ id: "shifted", kind: "navigation", rect: { x: 50, y: 30, width: 640, height: 60 } }],
    };
    expect(resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, shifted)).toEqual({ ...runtime, top: 136 });
  });

  it("clips to the actual visual viewport while retaining the canvas projection dimensions", () => {
    const value = { ...measurement([]), viewport: { x: 60, y: 70, width: 700, height: 500 } };
    expect(resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, value)).toEqual({
      ...runtime, left: 60, top: 70, right: 760, bottom: 570,
    });
  });

  it("chooses a usable square over a larger but unreadable thin strip", () => {
    const wide = { ...runtime, right: 1280, bottom: 720 };
    const value = measurement([{ id: "panel", kind: "passport", rect: { x: 492, y: 0, width: 788, height: 420 } }]);
    const result = resolveMainlineAConstellationSafeViewportV638(1280, 720, wide, value)!;
    expect(result.right).toBe(484);
    expect(result.bottom).toBe(720);
  });

  it("fits the chart between the open object browser and passport", () => {
    const value = measurement([
      { id: "object-browser", kind: "other", rect: { x: 0, y: 130, width: 286, height: 590 } },
      { id: "passport", kind: "passport", rect: { x: 880, y: 64, width: 384, height: 610 } },
      nav,
      hud,
    ]);
    const result = resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, value);
    expect(result).not.toBeNull();
    expect(result!.left).toBeGreaterThanOrEqual(294);
    expect(result!.right).toBeLessThanOrEqual(864);
    expect(result!.top).toBeGreaterThanOrEqual(167);
    expect(result!.bottom).toBeLessThanOrEqual(642);
  });

  it("unions overlapping blockers independently of DOM order", () => {
    const overlapping: ConstellationDomBlockerV638 = { id: "overlap", kind: "topline", rect: { x: 300, y: 90, width: 300, height: 130 } };
    const a = resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, measurement([nav, hud, overlapping]));
    const b = resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, measurement([overlapping, hud, nav]));
    expect(a).toEqual(b);
    expect(a?.top).toBe(228);
  });

  it("ignores off-canvas and malformed blocker rectangles without expanding the runtime boundary", () => {
    const value = measurement([
      { id: "outside", kind: "other", rect: { x: 1800, y: 0, width: 200, height: 800 } },
      { id: "bad", kind: "other", rect: { x: NaN, y: 0, width: 200, height: 800 } },
    ]);
    expect(resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, value)).toEqual(runtime);
  });

  it.each([0, NaN, -1])("rejects an unprojectable canvas width %s", (width) => {
    const value = measurement([]);
    expect(resolveMainlineAConstellationSafeViewportV638(1280, 720, runtime, { ...value, canvas: { ...value.canvas, width } })).toBeNull();
  });
});
