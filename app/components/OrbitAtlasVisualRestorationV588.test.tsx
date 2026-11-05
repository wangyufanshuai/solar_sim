import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("app/local-shadow-v588/page.tsx", "utf8");
const lazy = readFileSync("app/components/OrbitAtlasVisualRestorationV588Lazy.tsx", "utf8");
const shell = readFileSync("app/components/OrbitAtlasVisualRestorationV588.tsx", "utf8");
const stage = readFileSync("app/components/VisualRestorationStageV588.tsx", "utf8");
const texture = readFileSync("app/lib/useV588Texture.ts", "utf8");

describe("v588 visual restoration surface", () => {
  it("stays local-shadow-only, additive, lazy and single Canvas", () => {
    expect(route).toContain('NEXT_PUBLIC_ATLAS_DELIVERY_PROFILE === "local-shadow"');
    expect(route).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain("ssr: false");
    expect(shell).toContain("<UniverseCanvas");
    expect(shell).not.toContain("<Canvas");
    expect(stage).not.toContain("<Canvas");
    expect(shell).toContain('data-atlas-v588-canvas-count="1"');
  });

  it("keeps Science/Cinematic presentation outside the read-only payload", () => {
    expect(shell).toContain('data-atlas-v588-cinematic-writeback="false"');
    expect(shell).toContain("data-atlas-v588-payload-stable");
    expect(stage).toContain("atlasScientificPayloadMutation: false");
    expect(stage).toContain("atlasSharedScientificGeometry: true");
    expect(stage).not.toContain("Math.random");
    expect(stage).not.toMatch(/synthetic\s+(I|Q|U|V)/i);
  });

  it("implements the Universe Sandbox-inspired orbit instrument", () => {
    for (const token of [
      "periapsis",
      "apoapsis",
      "ascending-node",
      "descending-node",
      "atlasOrbitDirectionArrow",
      "atlasOrbitPlane",
      "atlasVelocityDragHandle",
      "velocity-verlet-presentation-only",
    ]) expect(`${shell}\n${stage}`).toContain(token);
    expect(stage).toContain("setPointerCapture");
    expect(shell).toContain('type="range"');
    expect(shell.match(/onInput=/g)).toHaveLength(2);
    expect(shell).toContain("88 IAU constellations");
  });

  it("forbids procedural hero fallback and verifies KTX2/fallback bytes", () => {
    expect(shell).toContain('data-atlas-v588-hero-procedural-fallback="false"');
    expect(stage).toContain("atlasProceduralFallback: false");
    expect(texture).toContain("fetchVerified");
    expect(texture).toContain("v588-asset-sha");
    expect(texture).toContain("verified-fallback-only");
    expect(texture).toContain("release?.()");
    expect(texture).toContain("loaded?.dispose()");
    expect(texture).toContain("disposeV588TextureLoader");
  });

  it("contains four real hero material stacks and the restored v9 sky layer", () => {
    for (const body of ["earth", "jupiter", "saturn", "mars"]) {
      expect(stage).toContain(`atlasHeroPlanet: "${body}"`);
    }
    expect(stage).toContain("earth-cloud-alpha");
    expect(stage).toContain("earth-night-mask");
    expect(stage).toContain("saturn-ring-alpha");
    expect(stage).toContain("frozen-v9-milky-way-restoration");
    expect(stage).toContain("RING_SHADOW_FRAGMENT_V588");
  });

  it("keeps the Canvas alive while proving scene resources return to zero", () => {
    expect(shell).toContain("atlas:v588-release-scene");
    expect(shell).toContain("atlas:v588-restore-scene");
    expect(shell).toContain("VisualRestorationReleaseProbeV588");
    expect(stage).toContain("diffAtlasResourceSnapshotsV300");
    expect(stage).toContain('"released-zero"');
    for (const resource of ["Geometries", "Textures", "Programs", "RenderTargets"]) {
      expect(stage).toContain(`atlasV588Release${resource}`);
    }
    expect(shell).toContain("data-atlas-v588-release-scene");
    expect(shell).toContain("data-atlas-v588-restore-scene");
    expect(shell).toContain('get("visualAudit") === "1"');
  });

  it("provides a presentation-only extreme-exposure regression state", () => {
    expect(shell).toContain("data-atlas-v588-extreme-exposure");
    expect(shell).toContain('data-atlas-v588-exposure-writeback="false"');
    expect(stage).toContain("exposureStress");
    expect(stage).toContain("? mode === \"science\" ? 1.75 : 2.4");
  });
});
