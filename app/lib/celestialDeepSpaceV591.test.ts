import { describe, expect, it } from "vitest";
import {
  STAR_RENDER_DRAW_POLICY_V591,
  STAR_SOURCE_POLICY_V591,
  apparentMagnitudeFromFluxV591,
  faintStarKeepProbabilityV591,
  selectStarRenderIndicesV591,
  starDisplayResponseV591,
} from "./celestialDeepSpaceV591";

describe("v591 Gaia star optics", () => {
  it("keeps the renderer to one point draw and one bright instanced draw", () => {
    expect(STAR_RENDER_DRAW_POLICY_V591).toBe("one-point-draw-plus-one-instanced-bright-psf-draw");
    expect(STAR_SOURCE_POLICY_V591).toBe("gaia-position-color-magnitude-only");
  });

  it("uses a monotonic photometric response without changing source flux", () => {
    expect(apparentMagnitudeFromFluxV591(1)).toBeCloseTo(0, 12);
    expect(apparentMagnitudeFromFluxV591(0.01)).toBeCloseTo(5, 12);
    expect(starDisplayResponseV591(0.1, 1)).toBeGreaterThan(starDisplayResponseV591(0.01, 1));
    expect(starDisplayResponseV591(0.01, 2)).toBeGreaterThan(starDisplayResponseV591(0.01, 0));
    expect(faintStarKeepProbabilityV591(1e-4, "desktop")).toBeGreaterThan(faintStarKeepProbabilityV591(1e-6, "desktop"));
  });

  it("deterministically thins only faint stars and always retains Gaia anchors", () => {
    const input = {
      apparentFlux: new Float32Array([1e-7, 1e-7, 1e-3, 1]),
      psfClass: new Uint8Array([0, 0, 1, 2]),
      sourceIds: new BigUint64Array([BigInt(1), BigInt(2), BigInt(3), BigInt(4)]),
      constellationAnchorIndex: new Int32Array([12, -1, 13, 14]),
      deviceTier: "desktop" as const,
    };
    const first = selectStarRenderIndicesV591(input);
    const second = selectStarRenderIndicesV591(input);
    expect(first).toEqual(second);
    expect(first.pointIndices).toContain(0);
    expect(first.pointIndices).toContain(2);
    expect(first.brightIndices).toEqual([3]);
    expect(first.retainedAnchorCount).toBe(3);
    expect(first.inputCounts).toEqual({ faint: 2, catalog: 1, brightPsf: 1 });
  });

  it("fails closed when transferable arrays disagree", () => {
    expect(() => selectStarRenderIndicesV591({
      apparentFlux: new Float32Array(1),
      psfClass: new Uint8Array(2),
      sourceIds: new BigUint64Array(2),
      constellationAnchorIndex: new Int32Array(2),
      deviceTier: "mobile",
    })).toThrow("v591-star-selection-array-length");
  });
});
