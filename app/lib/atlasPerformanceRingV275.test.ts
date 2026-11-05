import { describe, expect, it } from "vitest";
import {
  createAtlasPerformanceRingV275,
  pushAtlasPerformanceSampleV275,
  readAtlasPerformanceRingV275,
} from "./atlasPerformanceRingV275";

describe("v275 fixed performance ring", () => {
  it("retains only the newest bounded samples without shifting arrays", () => {
    const ring = createAtlasPerformanceRingV275(3);
    [1, 2, 3, 4].forEach((value) => pushAtlasPerformanceSampleV275(ring, value));
    expect(readAtlasPerformanceRingV275(ring)).toEqual([2, 3, 4]);
    expect(ring.values.byteLength).toBe(12);
  });

  it("ignores invalid samples", () => {
    const ring = createAtlasPerformanceRingV275(2);
    pushAtlasPerformanceSampleV275(ring, Number.NaN);
    pushAtlasPerformanceSampleV275(ring, -1);
    expect(ring.count).toBe(0);
  });
});
