import { describe, expect, it } from "vitest";
import {
  ATLAS_SCALE_BANDS_V260,
  ATLAS_SCALE_BAND_ORDER_V260,
  atlasScaleLogProgressV260,
  createAtlasScaleHandoffV260,
} from "./atlasScaleBandsV260";
import { atlasRuntimeStore } from "./atlasRuntimeStore";

describe("v260 independent cosmic scale bands", () => {
  it("keeps five ordered bands with explicit units/trust/deployment policy", () => {
    expect(ATLAS_SCALE_BAND_ORDER_V260).toEqual(["solar", "stellar", "galactic", "local-group", "near-universe"]);
    expect(atlasScaleLogProgressV260("solar")).toBe(0);
    expect(atlasScaleLogProgressV260("near-universe")).toBe(1);
    expect(ATLAS_SCALE_BANDS_V260["near-universe"].publicDeploymentBlocked).toBe(true);
    expect(ATLAS_SCALE_BANDS_V260.galactic.trust).toBe("measured-plus-model");
  });

  it("preserves selected object/return path in a logarithmic handoff", () => {
    expect(createAtlasScaleHandoffV260("stellar", "galactic", "gaia:42", ["solar"])).toEqual({
      version: "v260-scale-handoff-v1",
      from: "stellar",
      to: "galactic",
      selectedObjectId: "gaia:42",
      returnPath: ["solar", "stellar"],
      transition: "continuous-logarithmic",
      localOriginPolicy: "independent-per-band",
    });
  });

  it("changes scale without changing sceneRevision or panel sessions", () => {
    const before = atlasRuntimeStore.getSnapshot();
    atlasRuntimeStore.setScaleBand("local-group");
    const after = atlasRuntimeStore.getSnapshot();
    expect(after.scaleBand).toBe("local-group");
    expect(after.sceneRevision).toBe(before.sceneRevision);
    expect(after.panels).toBe(before.panels);
    atlasRuntimeStore.setScaleBand("solar");
  });
});
