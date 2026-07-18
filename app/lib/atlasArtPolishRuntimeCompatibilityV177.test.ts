import { describe, expect, it } from "vitest";
import { ATLAS_ART_POLISH_OPACITY_CAPS } from "./atlasArtPolish";
import { ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177 } from "./atlasArtPolishRuntimeCompatibilityV177";

describe("v177 art-polish runtime compatibility", () => {
  it("keeps every frozen v99 opacity cap unchanged", () => {
    expect(ATLAS_ART_POLISH_RUNTIME_OPACITY_CAPS_V177).toEqual(ATLAS_ART_POLISH_OPACITY_CAPS);
  });
});
