import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_SCIENCE_CINEMATIC_AB_ARTIFACT_SHA256_V327, parseKerrScienceCinematicABViewV327 } from "./kerrScienceCinematicABV327";

describe("v327 generated Science/Cinematic A/B swatches", () => {
  it("locks the deterministic four-ray presentation artifact", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-cinematic-ab-v327/swatches.json"), "utf8"));
    expect(artifact.artifactSha256).toBe(KERR_SCIENCE_CINEMATIC_AB_ARTIFACT_SHA256_V327);
    const view = parseKerrScienceCinematicABViewV327(artifact.view);
    expect(view.swatches).toHaveLength(4);
    expect(view.scienceValuesUnchanged).toBe(true);
    expect(view.profileOutputsDistinct).toBe(true);
  });
});
