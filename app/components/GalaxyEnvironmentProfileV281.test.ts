import { describe, expect, it } from "vitest";
import { classifyGalaxyEnvironmentBackdropV281 } from "./GalaxyEnvironmentProfileV281";

const manifest = {
  desktopBase: "/data/orbit-atlas-v68-reference-backdrop.jpg",
  mobileBase: "/data/orbit-atlas-v68-reference-backdrop-2k.jpg",
  desktopStars: "/data/stars.jpg",
  mobileStars: "/data/stars-2k.jpg",
  desktopDistantStars: "/data/distant.jpg",
  mobileDistantStars: "/data/distant-2k.jpg",
  dustMask: "/data/dust.png",
  negativeSpaceMask: "/data/negative.png",
  nebulaHazeMask: "/data/v56-nebula.png",
  rotation: [0, 0, 0] as const,
};

describe("v281 galaxy environment profile extraction", () => {
  it("preserves baseline depth and reference backdrop classification", () => {
    const profile = classifyGalaxyEnvironmentBackdropV281({
      layerManifest: manifest,
      orbitAtlas: true,
      backgroundDepthProfile: "showcase-reference-depth",
    });
    expect(profile.referenceDepth).toBe(0.64);
    expect(profile.negativeSpace).toBe(0.42);
    expect(profile.finalBackdrop).toBe(true);
    expect(profile.referenceBackdropMode).toBe(true);
    expect(profile.layeredBackdrop).toBe(true);
  });
});
