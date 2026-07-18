import { describe, expect, it } from "vitest";
import { createAtlasRenderDirectorV2 } from "./atlasRenderDirectorV2";

describe("AtlasRenderDirectorV2", () => {
  it("restrains closeup and launch exposure", () => {
    const overview = createAtlasRenderDirectorV2("atlas", "balanced");
    const inspect = createAtlasRenderDirectorV2("inspect", "closeup-inspect");
    const launch = createAtlasRenderDirectorV2("launch", "launch-cinematic");
    expect(inspect.exposure).toBeLessThan(overview.exposure);
    expect(launch.bloomThreshold).toBeGreaterThan(overview.bloomThreshold);
    expect(inspect.subjectCoverage).toEqual([0.35, 0.55]);
  });

  it("keeps exoplanet orbits in an isolated display profile", () => {
    expect(createAtlasRenderDirectorV2("exoplanet-system", "mobile-safe")).toMatchObject({
      orbitDensity: "full-reference",
      hudHz: 4,
    });
  });
});
