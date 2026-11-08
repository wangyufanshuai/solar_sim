import { describe, expect, it } from "vitest";
import { buildNebulaParallaxStars, NEBULA_PARALLAX_SHELLS } from "./nebulaParallaxLayers";

describe("nebula parallax layers (A3)", () => {
  it("is deterministic per object and differs between objects", () => {
    const a = buildNebulaParallaxStars("m42");
    expect(buildNebulaParallaxStars("m42").positions).toEqual(a.positions);
    expect(buildNebulaParallaxStars("m20").positions).not.toEqual(a.positions);
  });

  it("puts each layer inside its shell with finite colours and sizes", () => {
    const stars = buildNebulaParallaxStars("ngc2237");
    const { foreground, background } = NEBULA_PARALLAX_SHELLS;
    expect(stars.count).toBe(foreground.count + background.count);
    for (let i = 0; i < stars.count; i++) {
      const shell = stars.layers[i] === 0 ? foreground : background;
      const r = Math.hypot(stars.positions[3 * i], stars.positions[3 * i + 1], stars.positions[3 * i + 2]);
      expect(r).toBeGreaterThanOrEqual(shell.inner - 1e-6);
      expect(r).toBeLessThanOrEqual(shell.outer + 1e-6);
      expect(stars.sizes[i]).toBeGreaterThanOrEqual(shell.size[0]);
      expect(stars.sizes[i]).toBeLessThanOrEqual(shell.size[1]);
      const rgb = Array.from(stars.colors.subarray(3 * i, 3 * i + 3));
      expect(rgb.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)).toBe(true);
      expect(Math.max(...rgb)).toBeGreaterThan(0.17);
    }
    expect(stars.layers.filter((v) => v === 0).length).toBe(foreground.count);
  });
});
