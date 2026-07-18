import { describe, expect, it } from "vitest";
import { LAUNCH_CINEMATIC_PHASES_V3, LAUNCH_SCENE_ASSET_MANIFEST_V3, launchPhaseProgressV3 } from "./launchCinematicV3";

describe("v164 launch cinematic reconstruction v3", () => {
  it("defines all eight deterministic director phases", () => {
    expect(LAUNCH_CINEMATIC_PHASES_V3).toEqual(["prelaunch", "ignition", "tower-clear", "max-q", "meco-separation", "coast", "insertion", "payload-deploy"]);
    expect(launchPhaseProgressV3("payload-deploy")).toBe(7);
  });

  it("keeps initial assets below 25 MiB and marks fallbacks explicitly", () => {
    expect(LAUNCH_SCENE_ASSET_MANIFEST_V3.initialAssetLimitBytes).toBe(25 * 1024 * 1024);
    expect(LAUNCH_SCENE_ASSET_MANIFEST_V3.required).toEqual(["sls-block-1"]);
    expect(LAUNCH_SCENE_ASSET_MANIFEST_V3.fallbackPolicy).toContain("never-claims-hd");
  });
});
