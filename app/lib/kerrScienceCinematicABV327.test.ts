import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrThinDiskBandImagingViewV320 } from "./kerrThinDiskBandImagingV320";
import { createKerrScienceCinematicABViewV327, parseKerrScienceCinematicABViewV327 } from "./kerrScienceCinematicABV327";

const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8"));
const source = parseKerrThinDiskBandImagingViewV320(artifact.view);

describe("v327 deterministic Science/Cinematic A/B swatches", () => {
  it("reuses the production v305 cinematic mapping without mutating Science values", () => {
    const first = createKerrScienceCinematicABViewV327(source);
    const second = createKerrScienceCinematicABViewV327(source);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(parseKerrScienceCinematicABViewV327(first)).toBe(first);
    expect(first).toMatchObject({
      status: "qualified-deterministic-science-cinematic-ab",
      scienceValuesUnchanged: true,
      scienceBuffersDisjoint: true,
      cinematicBuffersDisjoint: true,
      profileOutputsDistinct: true,
      source: { denseAggregateSha256: null },
      tokens: { v5: { exposure: 0.82, bloom: 0.54, detailSeed: 299 }, v6: { exposure: 0.78, bloom: 0.46, detailSeed: 300 } },
    });
    expect(first.swatches).toHaveLength(4);
    expect(first.swatches.every((swatch) => swatch.scienceDisplayRgb8.length === 3 && swatch.v5CinematicRgba8.length === 4 && swatch.v6CinematicRgba8.length === 4)).toBe(true);
  });

  it("fails closed when the four-ray Science source boundary is broken", () => {
    const changed = structuredClone(source);
    (changed.samples[12] as { applicable: boolean }).applicable = false;
    expect(() => createKerrScienceCinematicABViewV327(changed)).toThrow("v320-band-unavailable-boundary");
  });
});
