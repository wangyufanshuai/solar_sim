import { describe, expect, it } from "vitest";
import { fitMainlineANebulaViewerM3, isMainlineANebulaViewerImageM3 } from "./mainlineANebulaViewerM3";

describe("M3 observation viewer fit and zoom", () => {
  it.each([[1280, 1378], [1280, 831], [1280, 393], [1280, 1280]])("fits the complete %i × %i composition without cropping", (imageWidth, imageHeight) => {
    for (const [viewportWidth, viewportHeight] of [[1170, 640], [390, 590], [720, 180]]) {
      const fit = fitMainlineANebulaViewerM3({ imageWidth, imageHeight, viewportWidth, viewportHeight, zoom: 1 })!;
      expect(fit.imageWidth / fit.imageHeight).toBeCloseTo(imageWidth / imageHeight, 10);
      expect(fit.imageWidth).toBeLessThanOrEqual(viewportWidth + 0.00001);
      expect(fit.imageHeight).toBeLessThanOrEqual(viewportHeight + 0.00001);
      expect(fit.contentWidth).toBe(viewportWidth);
      expect(fit.contentHeight).toBe(viewportHeight);
      expect(fit.offsetLeft).toBeGreaterThanOrEqual(0);
      expect(fit.offsetTop).toBeGreaterThanOrEqual(0);
    }
  });

  it.each([2, 4] as const)("makes %i× an explicit larger, scrollable image rather than cropping the source", (zoom) => {
    const input = { imageWidth: 1280, imageHeight: 831, viewportWidth: 390, viewportHeight: 590 };
    const full = fitMainlineANebulaViewerM3({ ...input, zoom: 1 })!;
    const enlarged = fitMainlineANebulaViewerM3({ ...input, zoom })!;
    expect(enlarged.imageWidth).toBe(full.imageWidth * zoom);
    expect(enlarged.imageHeight).toBe(full.imageHeight * zoom);
    expect(enlarged.contentWidth).toBeGreaterThan(input.viewportWidth);
    expect(enlarged.imageWidth / enlarged.imageHeight).toBeCloseTo(input.imageWidth / input.imageHeight, 10);
  });

  it("fails closed for missing decode size, empty viewport and unsupported zoom", () => {
    const valid = { imageWidth: 1280, imageHeight: 831, viewportWidth: 390, viewportHeight: 590, zoom: 1 as const };
    for (const key of ["imageWidth", "imageHeight", "viewportWidth", "viewportHeight"] as const) {
      for (const value of [0, -1, NaN, Infinity]) expect(fitMainlineANebulaViewerM3({ ...valid, [key]: value })).toBeNull();
    }
    expect(fitMainlineANebulaViewerM3({ ...valid, zoom: 3 as 1 })).toBeNull();
  });

  it("accepts a decoded image by natural size even when CSS exposes zero display width", () => {
    const image = { tagName: "IMG", complete: true, naturalWidth: 1280, naturalHeight: 831, width: 0, height: 0 };
    expect(isMainlineANebulaViewerImageM3(image)).toBe(true);
    for (const changed of [{ ...image, complete: false }, { ...image, naturalWidth: 0 }, { ...image, naturalHeight: NaN }, { ...image, tagName: "CANVAS" }, null]) {
      expect(isMainlineANebulaViewerImageM3(changed)).toBe(false);
    }
  });
});
