import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CELESTIAL_ORBITS_V590,
  CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590,
  CELESTIAL_RENDERING_ROUTE_V590,
  DEEP_SPACE_LAYERS_V590,
  HERO_BODY_SPECS_V590,
  HERO_RENDERER_CAPABILITIES_V590,
  computeHeroAdmissionsV590,
  createScientificProjectionStateV590,
  celestialOrbitPathV590,
  heroLodV590,
  resolveExposureV590,
  validateHeroBodySpecsV590,
  serializeScientificProjectionStateV590,
  type VisualAssetManifestV590,
  type CelestialRenderProfileV590,
} from "./celestialRenderingV590";

const profile = (overrides: Partial<CelestialRenderProfileV590> = {}): CelestialRenderProfileV590 => ({
  mode: "cinematic",
  deliveryTier: "standalone-full",
  deviceTier: "desktop",
  selectedBody: "earth",
  focusTarget: "earth",
  exposurePreset: "nominal",
  qualityTier: "closeup",
  cleanView: false,
  presentationEpoch: 590,
  ...overrides,
});

describe("v590 celestial rendering governance contract", () => {
  it("isolates the additive route from formal product v263", () => {
    expect(CELESTIAL_RENDERING_ROUTE_V590).toBe("/local-shadow-v590");
    expect(CELESTIAL_RENDERING_FORMAL_PRODUCT_POINTER_V590).toBe("v263");
  });

  it("locks sixteen immutable Hero specifications and only permits explicit ice-giant primaries", () => {
    expect(() => validateHeroBodySpecsV590()).not.toThrow();
    expect(HERO_BODY_SPECS_V590).toHaveLength(16);
    expect(new Set(HERO_BODY_SPECS_V590.map((body) => body.id)).size).toBe(16);
    expect(HERO_BODY_SPECS_V590.filter((body) => body.proceduralPrimaryAllowed).map((body) => body.id)).toEqual(["uranus", "neptune"]);
    expect(HERO_BODY_SPECS_V590.every((body) => body.presentationOnly)).toBe(true);
    expect(Object.isFrozen(HERO_BODY_SPECS_V590)).toBe(true);
  });

  it("preserves deterministic v588-style orbit geometry", () => {
    expect(CELESTIAL_ORBITS_V590).toHaveLength(16);
    const earth = CELESTIAL_ORBITS_V590.find((orbit) => orbit.bodyId === "earth")!;
    const path = celestialOrbitPathV590(earth, 64);
    expect(path).toHaveLength(65 * 3);
    expect(path.slice(0, 3)).toEqual(path.slice(-3));
  });

  it("forces Science to linear exposure while keeping cinematic presets presentation-only", () => {
    expect(resolveExposureV590(profile({ mode: "science", exposurePreset: "extreme-bright" }))).toBe(1);
    expect(resolveExposureV590(profile({ exposurePreset: "extreme-dark" }))).toBe(0.36);
    expect(resolveExposureV590(profile({ exposurePreset: "extreme-bright" }))).toBe(1.55);
    expect(heroLodV590(500, "desktop")).toBe(0);
    expect(heroLodV590(80, "desktop")).toBe(1);
    expect(heroLodV590(20, "mobile")).toBe(2);
  });

  it("registers a fixed celestial sphere and six catalog nebula gates", () => {
    expect(DEEP_SPACE_LAYERS_V590.filter((layer) => layer.kind === "catalog-nebula")).toHaveLength(6);
    expect(DEEP_SPACE_LAYERS_V590.find((layer) => layer.id === "milky-way")?.kind).toBe("fixed-celestial-sphere");
    expect(DEEP_SPACE_LAYERS_V590.filter((layer) => layer.kind === "catalog-nebula").every((layer) => layer.sciencePolicy === "catalog-outline-only")).toBe(true);
  });

  it("derives Hero admission from exact required channels and declared Full dimensions", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/celestial-rendering-v590/manifest.json"), "utf8")) as VisualAssetManifestV590;
    const computed = computeHeroAdmissionsV590(manifest.assets);
    expect(computed).toEqual(manifest.heroBodies);
    expect(computed.sun).toBe("asset-blocked");
    expect(computed.earth).toBe("admitted");
    expect(computed.uranus).toBe("admitted");
    expect(computed.neptune).toBe("admitted");
    expect(HERO_BODY_SPECS_V590.find((body) => body.id === "bennu")?.requiredAssets).toEqual([
      "bennu-model",
      "regolith-cc0",
      "regolith-normal-cc0",
      "regolith-roughness-cc0",
    ]);
    expect(HERO_RENDERER_CAPABILITIES_V590.ceres).toBe(false);
    expect(HERO_RENDERER_CAPABILITIES_V590.bennu).toBe(true);
  });

  it("derives its immutable projection from the real v587 observation artifact", () => {
    const source = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/kerr-observation-v587/observation-summary.json"), "utf8"));
    const state = createScientificProjectionStateV590(source);
    const before = serializeScientificProjectionStateV590(state);
    expect(Object.isFrozen(state)).toBe(true);
    expect(state.connection).toBe("connected-v587-observation-summary");
    expect(state.sourceSummarySha256).toBe(source.summarySha256);
    expect(state.scientificPayloadSha256).toBe(source.authorityReference);
    expect(state.scientificPayloadWriteback).toBe(false);
    expect(state.scientificAuthorityChanged).toBe(false);
    expect(serializeScientificProjectionStateV590(state)).toBe(before);
  });

  it("blocks a scientific projection whose real authority identity differs", () => {
    const source = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/kerr-observation-v587/observation-summary.json"), "utf8"));
    expect(() => createScientificProjectionStateV590({ ...source, authorityReference: "0".repeat(64) })).toThrow();
  });
});
