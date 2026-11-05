import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrScienceImagePixelProbeArtifactV346, probeKerrScienceImagePixelV346, projectClientPointToKerrSciencePlateV346 } from "./kerrScienceImagePixelProbeV346";

const artifact = parseKerrScienceImagePixelProbeArtifactV346(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-image-probe-v346/probe.json"), "utf8")));

describe("v346 indexed scientific image probe", () => {
  it("maps all twelve plate cards to exact array and FITS indices", () => {
    const hits = artifact.indexCoordinates.bandOrder.flatMap((band, row) => artifact.indexCoordinates.rayOrder.map((ray, column) => {
      const hit = probeKerrScienceImagePixelV346(artifact, 142 + column * 266 + 125, 108 + row * 174 + 79);
      expect(hit).toMatchObject({ key: `${band}:${ray}`, arrayIndex: [row, column], fitsPixel: [column + 1, row + 1], celestialWcs: "unavailable" });
      return hit?.key;
    }));
    expect(new Set(hits).size).toBe(12);
    expect(probeKerrScienceImagePixelV346(artifact, 399, 120)).toBeNull();
    expect(probeKerrScienceImagePixelV346(artifact, 20, 20)).toBeNull();
  });

  it("projects portrait and landscape client coordinates to the same natural plate pixel", () => {
    const natural = [267, 187] as const;
    const portrait = projectClientPointToKerrSciencePlateV346({ clientX: natural[0] / 4, clientY: natural[1] / 4 }, { left: 0, top: 0, width: 300, height: 180 });
    const landscape = projectClientPointToKerrSciencePlateV346({ clientX: natural[0], clientY: natural[1] }, { left: 0, top: 0, width: 1200, height: 720 });
    expect(portrait?.[0]).toBeCloseTo(landscape?.[0] ?? 0, 12);
    expect(portrait?.[1]).toBeCloseTo(landscape?.[1] ?? 0, 12);
    expect(probeKerrScienceImagePixelV346(artifact, ...(portrait ?? [0, 0]))?.key).toBe("visible:12");
  });
});
