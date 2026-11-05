import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/components/CelestialBodiesV590.tsx"), "utf8");
const materials = readFileSync(resolve(process.cwd(), "app/lib/celestialMaterialsV590.ts"), "utf8");

describe("v590 planetary rendering contract", () => {
  it("keeps every physical terminator tied to the Sun world origin", () => {
    expect(source).toContain("const SUN_WORLD_V590 = new THREE.Vector3(0, 0, 0)");
    expect(source).toContain('atlasDeterministicLighting: "sun-world-origin"');
    expect(materials).toContain("normalize(uSunWorld - vWorldPosition)");
    expect(source).not.toContain("camera.position).multiplyScalar(-1)");
  });

  it("ships the required layered hero materials", () => {
    expect(source).toContain("EARTH_SURFACE_FRAGMENT_V590");
    expect(source).toContain("EARTH_CLOUD_FRAGMENT_V590");
    expect(source).toContain("SOLAR_CHROMOSPHERE_FRAGMENT_V590");
    expect(source).toContain("GAS_GIANT_FRAGMENT_V590");
    expect(source).toContain("SATURN_RING_FRAGMENT_V590");
    expect(source).toContain("ICE_GIANT_FRAGMENT_V590");
    expect(materials).toContain("oceanGlint");
    expect(materials).toContain("nightGate");
    expect(materials).toContain("cassiniTransmission");
    expect(materials).toContain("enckeTransmission");
  });

  it("does not replace blocked assets with random or procedural spheres", () => {
    expect(source).toContain("BlockedBodyProxyV590");
    expect(source).toContain("atlasProceduralFallback: false");
    expect(source).toContain('atlasBlockedMarker: "hud-only"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<icosahedronGeometry");
  });

  it("uses verified overview derivatives and a byte-locked Bennu dependency", () => {
    expect(source).toContain('return focused ? profile.deliveryTier : "vercel-lite"');
    expect(source).toContain('useV589Model("bennu-model"');
    expect(source).toContain('inheritedDependency: "v589:bennu-model:readonly"');
    expect(source).toContain('useV590Texture("regolith-cc0"');
    expect(source).toContain('useV590Texture("regolith-normal-cc0"');
    expect(source).toContain('useV590Texture("regolith-roughness-cc0"');
    expect(source).toContain('useV590Texture("sun-photosphere"');
    expect(source).toContain('useV590Texture("sun-chromosphere"');
    expect(source).not.toContain('useV590Texture("sun-albedo"');
  });

  it("audits observed texture dimensions and model LOD without inventing focus-based quality", () => {
    expect(source).toContain("textureDimensionsV590");
    expect(source).toContain("dimensions=${textureDimensionsV590(state.texture)}");
    expect(source).toContain("quality=${state.fullQualityGate}");
    expect(source).toContain("sha256=${state.sha256}");
    expect(source).toContain("root.dataset.atlasV590HeroAssetQuality = textureReceipt");
    expect(source).toContain("modelLod: model.lod");
    expect(source).toContain('return `model-lod-${modelLod}`');
    expect(source).not.toContain('focused ? (profile.deviceTier === "mobile" ? "1" : "0") : "2"');
  });

  it("uses a fragment-safe world-space tangent basis and the Three output pipeline", () => {
    expect(materials).toContain("varying vec3 vWorldTangent");
    expect(materials).toContain("varying vec3 vWorldBitangent");
    expect(materials).toContain("#include <tonemapping_fragment>");
    expect(materials).toContain("#include <colorspace_fragment>");
    expect(materials).toContain("#include <logdepthbuf_fragment>");
  });

  it("is a scene child and never creates an additional Canvas", () => {
    expect(source).not.toContain("<Canvas");
    expect(source).not.toMatch(/from "@react-three\/fiber".*Canvas/);
    expect(source).toContain("atlasSingleCanvas: true");
    expect(source).toContain("atlasScientificPayloadMutation: false");
  });
});
