import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HERO_OVERRIDE_ADMISSIONS_V591,
  V591_ADMITTED_OVERRIDE_COUNT,
  suppressBaselineOverrideAdmissionsV591,
} from "./CelestialHeroOverridesV591";
import {
  BENNU_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  CERES_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  EROS_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  JUPITER_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  KLEOPATRA_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  MARS_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  MERCURY_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  NEPTUNE_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  SATURN_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  TEMPEL1_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  URANUS_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  VESTA_MOBILE_CAMERA_DISTANCE_SCALE_V591,
  celestialCameraGoalV591,
} from "./CelestialConvergenceStageV591";
import { parseVestaAssetOverlayV591 } from "../lib/useV591VestaModel";
import { parseCeresAssetOverlayV591 } from "../lib/celestialCeresV591";
import { parseNasaSmallBodyAssetOverlayV591 } from "../lib/useV591NasaSmallBodyModel";
import { parseTempel1AssetOverlayV591 } from "../lib/celestialTempel1V591";
import { celestialCameraGoalV590 } from "./CelestialRenderingStageV590";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const sha256 = (path: string) => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");

describe("v591 additive P0 integration", () => {
  it("adds a dedicated route and client-only lazy boundary", () => {
    const page = read("app/local-shadow-v591/page.tsx");
    const lazy = read("app/components/OrbitAtlasCelestialConvergenceV591Lazy.tsx");
    expect(page).toContain("OrbitAtlasCelestialConvergenceV591Lazy");
    expect(page).toContain('data-atlas-formal-product-pointer="v263"');
    expect(lazy).toContain("next/dynamic");
    expect(lazy).toContain("ssr: false");
    expect(lazy).toContain("local-shadow-only");
  });

  it("owns a v591 single-Canvas composition while consuming v590 layers read-only", () => {
    const shell = read("app/components/OrbitAtlasCelestialConvergenceV591.tsx");
    const host = read("app/components/UniverseCanvasOverrideHostV591.tsx");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    expect(shell).toContain("UniverseCanvasOverrideHostV591");
    expect(shell).toContain("CelestialConvergenceStageV591");
    expect(shell).not.toContain('import("./OrbitAtlasCelestialRenderingV590")');
    expect(shell).not.toContain("<Canvas");
    expect(host).toContain("<UniverseCanvas");
    expect(host).not.toContain("<Canvas");
    expect(stage).toContain("<CelestialDeepSpaceV591");
    expect(stage).toContain("<CelestialBodiesV590");
    expect(stage).toContain("<CelestialHeroOverridesV591");
    expect(stage).toContain("suppressBaselineOverrideAdmissionsV591");
    expect(overrides).toContain("atlasProceduralFallback: false");
    expect(overrides).not.toMatch(/\.visible\s*=\s*false/);
    expect(shell).toContain('data-atlas-v591-runtime-baseline="v590-readonly"');
    expect(shell).toContain('data-atlas-v591-scene-owner="v591-owned-composition"');
    expect(shell).toContain('data-atlas-v591-canvas-count="1"');
    expect(shell).toContain('data-atlas-v591-scientific-writeback="false"');
    expect(shell).toContain("data-atlas-v591-page-source-manifest-sha={V591_PAGE_SOURCE_MANIFEST_SHA256}");
    expect(shell).toContain("data-atlas-v591-page-delivery-tier={deliveryTier}");
    expect(shell).toContain("data-atlas-v591-page-build-fingerprint={V591_PAGE_BUILD_FINGERPRINT}");
    expect(shell).toContain("data-atlas-v591-hero-overrides={String(V591_ADMITTED_OVERRIDE_COUNT)}");
    expect(shell).toContain("data-atlas-v591-core-hero-progress={`${V591_CORE_OVERRIDE_COUNT}/${V591_CORE_HERO_ORDER.length}`}");
    expect(shell).toContain("data-atlas-v591-p2-hero-progress={`${V591_P2_OVERRIDE_COUNT}/${V591_P2_HERO_COUNT}`}");
    expect(overrides).toContain("export const V591_ADMITTED_OVERRIDE_COUNT = 16 as const");
  });

  it("binds browser evidence to the source identity exported by the running page", () => {
    const build = read("scripts/build-atlas-v591-profile.mjs");
    const replay = read("scripts/refresh-v591-browser-qualification-from-replay.mjs");
    const sealer = read("scripts/seal-v591-celestial-convergence-candidate.mjs");
    const verifier = read("scripts/verify-v591-celestial-convergence-candidate.mjs");
    expect(build).toContain("NEXT_PUBLIC_ATLAS_V591_SOURCE_MANIFEST_SHA256");
    expect(build).toContain("NEXT_PUBLIC_ATLAS_V591_BUILD_FINGERPRINT");
    expect(replay).toContain("assertPageBuildIdentityV591(states[index]");
    expect(replay).toContain('assertPageBuildIdentityV591(release, expectedPageBuildIdentity, "release")');
    expect(replay).toContain("capturedPageSourceManifestSha256");
    expect(replay).toContain("v591-browser-screenshot-cardinality");
    expect(sealer).toContain("capturedPageBuildFingerprint");
    expect(verifier).toContain("capturedPageBuildFingerprint");
  });

  it("exposes all six admitted nebulae through the product Deep Field rail", () => {
    const shell = read("app/components/OrbitAtlasCelestialConvergenceV591.tsx");
    for (const id of ["orion-nebula", "lagoon-nebula", "eagle-nebula", "helix-nebula", "veil-nebula", "north-america-nebula"]) {
      expect(shell).toContain(`{ id: "${id}"`);
    }
    expect(shell).toContain('data-atlas-v591-deep-field-rail="six-nebulae"');
    expect(shell).toContain('data-atlas-v591-mobile-deep-field="six-nebulae"');
    expect(shell).toContain("data-atlas-v591-sky-target={target.id}");
  });

  it("admits all sixteen Hero visual primaries", () => {
    expect(Object.keys(HERO_OVERRIDE_ADMISSIONS_V591)).toHaveLength(16);
    expect(HERO_OVERRIDE_ADMISSIONS_V591.sun).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.mercury).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.venus).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.earth).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.moon).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.mars).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.jupiter).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.saturn).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.uranus).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.neptune).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.ceres).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.vesta).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.bennu).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.eros).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591.kleopatra).toBe("admitted");
    expect(HERO_OVERRIDE_ADMISSIONS_V591["tempel-1"]).toBe("admitted");
    expect(Object.entries(HERO_OVERRIDE_ADMISSIONS_V591).filter(([, status]) => status === "admitted").map(([id]) => id)).toEqual(["sun", "mercury", "venus", "earth", "moon", "mars", "jupiter", "saturn", "uranus", "neptune", "ceres", "vesta", "bennu", "eros", "kleopatra", "tempel-1"]);
    expect(Object.values(HERO_OVERRIDE_ADMISSIONS_V591).filter((status) => status === "not-authored")).toHaveLength(0);
    expect(V591_ADMITTED_OVERRIDE_COUNT).toBe(16);
  });

  it("suppresses only v591-admitted baseline geometry without mutating the input", () => {
    const baseline = Object.fromEntries(Object.keys(HERO_OVERRIDE_ADMISSIONS_V591).map((body) => [body, "admitted"])) as Parameters<typeof suppressBaselineOverrideAdmissionsV591>[0];
    const isolated = suppressBaselineOverrideAdmissionsV591(baseline);
    expect(isolated.sun).toBe("asset-blocked");
    expect(isolated.mercury).toBe("asset-blocked");
    expect(isolated.venus).toBe("asset-blocked");
    expect(isolated.earth).toBe("asset-blocked");
    expect(isolated.moon).toBe("asset-blocked");
    expect(isolated.mars).toBe("asset-blocked");
    expect(isolated.jupiter).toBe("asset-blocked");
    expect(isolated.saturn).toBe("asset-blocked");
    expect(isolated.uranus).toBe("asset-blocked");
    expect(isolated.neptune).toBe("asset-blocked");
    expect(isolated.ceres).toBe("asset-blocked");
    expect(isolated.vesta).toBe("asset-blocked");
    expect(isolated.bennu).toBe("asset-blocked");
    expect(isolated.eros).toBe("asset-blocked");
    expect(isolated.kleopatra).toBe("asset-blocked");
    expect(isolated["tempel-1"]).toBe("asset-blocked");
    expect(baseline.earth).toBe("admitted");
  });

  it("owns Mercury as exact-byte NASA PIA15063 albedo plus USGS MESSENGER relief", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    const overlay = JSON.parse(read("public/data/celestial-convergence-v591/mercury-asset-overlay.json"));
    expect(overrides).toContain("function MercuryOverrideV591");
    expect(overrides).toContain('useV591MercuryTexture("mercury-albedo"');
    expect(overrides).toContain('useV591MercuryTexture("mercury-normal"');
    expect(overrides).toContain('useV591MercuryTexture("mercury-roughness"');
    expect(overrides).toContain('useV591MercuryTexture("mercury-height"');
    expect(overrides).toContain('atlasProceduralFallback: false');
    expect(materials).toContain("MERCURY_SURFACE_VERTEX_V591");
    expect(materials).toContain("MERCURY_SURFACE_FRAGMENT_V591");
    expect(materials).not.toContain("MERCURY_GLOSSY_SPECULAR");
    expect(stage).toContain('focusTarget === "mercury"');
    expect(overlay.status).toBe("mercury-assets-derived-awaiting-runtime-admission");
    expect(overlay.exactByteV589AlbedoSourceReuse).toBe(true);
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.assets.map((asset: { id: string }) => asset.id)).toEqual(["mercury-albedo", "mercury-normal", "mercury-roughness", "mercury-height"]);
    for (const asset of overlay.assets as Array<{ variants: Record<string, { url: string; bytes: number; sha256: string }> }>) {
      for (const file of Object.values(asset.variants)) {
        const path = `public/${file.url.replace(/^\/+/, "")}`;
        expect(readFileSync(resolve(root, path)).byteLength).toBe(file.bytes);
        expect(sha256(path)).toBe(file.sha256);
      }
    }
  });

  it("owns Uranus and Neptune as registered fixed-epoch analytical primaries without observation-texture claims", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const overlay = JSON.parse(read("public/data/celestial-convergence-v591/ice-giant-primary-overlay.json"));
    expect(overrides).toContain("function IceGiantOverrideV591");
    expect(overrides).toContain('bodyId="uranus"');
    expect(overrides).toContain('bodyId="neptune"');
    expect(overrides).toContain('atlasProceduralPrimary: true');
    expect(overrides).toContain('atlasProceduralFallback: false');
    expect(overrides).toContain('atlasObservationTextureClaim: false');
    expect(overrides).toContain('atlasV591HeroKtx2First = "false"');
    expect(materials).toContain("ICE_GIANT_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("ICE_GIANT_ATMOSPHERE_FRAGMENT_V591");
    expect(materials).toContain("ICE_GIANT_RING_FRAGMENT_V591");
    expect(materials).not.toContain("ICE_GIANT_CAMERA_SPECULAR");
    expect(overlay.status).toBe("ice-giant-registered-primary-ready-for-runtime-admission");
    expect(overlay.noNetworkRequestsPerformed).toBe(true);
    expect(overlay.noTextureAssetsRequired).toBe(true);
    expect(overlay.bodies.map((body: { body: string }) => body.body)).toEqual(["uranus", "neptune"]);
    expect(overlay.bodies.every((body: { proceduralPrimary: boolean; proceduralFallback: boolean; observationTextureClaim: boolean }) => body.proceduralPrimary && !body.proceduralFallback && !body.observationTextureClaim)).toBe(true);
  });

  it("owns Bennu as a frozen NASA mesh with bounded CC0 triplanar microtexture", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    const modelHook = read("app/lib/useV591BennuModel.ts");
    expect(overrides).toContain("function BennuOverrideV591");
    expect(overrides).toContain('useV591BennuTexture("bennu-regolith-albedo"');
    expect(overrides).toContain('useV591BennuTexture("bennu-regolith-normal"');
    expect(overrides).toContain('useV591BennuTexture("bennu-regolith-roughness"');
    expect(overrides).toContain("useV591InheritedBennuModel");
    expect(overrides).toContain('atlasInheritedDependency: "v589-bennu-model-readonly"');
    expect(overrides).toContain('atlasProceduralFallback: false');
    expect(materials).toContain("BENNU_REGOLITH_FRAGMENT_V591");
    expect(materials).toContain("orenNayarV591");
    expect(materials).not.toContain("BENNU_GLOSSY_SPECULAR");
    expect(modelHook).toContain('estimatedBytes: 0');
    expect(modelHook).toContain('owner: "v591-celestial-convergence"');
    expect(stage).toContain('focusTarget === "bennu"');
  });

  it("owns Vesta as a NASA shape with deterministic LODs and exact-byte CC0 microtexture reuse", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    const modelHook = read("app/lib/useV591VestaModel.ts");
    const overlay = JSON.parse(read("public/data/celestial-convergence-v591/vesta-asset-overlay.json"));
    const bennuOverlay = JSON.parse(read("public/data/celestial-convergence-v591/bennu-asset-overlay.json"));
    expect(() => parseVestaAssetOverlayV591(overlay)).not.toThrow();
    expect(overrides).toContain("function VestaOverrideV591");
    expect(overrides).toContain("useV591VestaModel");
    expect(overrides).toContain('useV591BennuTexture("bennu-regolith-albedo"');
    expect(overrides).toContain('atlasMicrotexture: "poly-haven-cc0-exact-byte-reuse-presentation-only"');
    expect(overrides).toContain('atlasMeasuredPhotometryClaim: false');
    expect(materials).toContain("VESTA_REGOLITH_FRAGMENT_V591");
    expect(materials).toContain("vestaOrenNayarV591");
    expect(materials).not.toContain("VESTA_GLOSSY_SPECULAR");
    expect(modelHook).toContain('owner: "v591-celestial-convergence"');
    expect(modelHook).toContain("MeshoptDecoder");
    expect(stage).toContain('focusTarget === "vesta"');
    expect(overlay.status).toBe("vesta-assets-derived-awaiting-runtime-admission");
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.authorityState.measuredPhotometryClaim).toBe(false);
    expect(overlay.model.lods.map((lod: { triangleCount: number }) => lod.triangleCount)).toEqual([99992, 25000, 5000]);
    for (const lod of overlay.model.lods as Array<{ path: string; bytes: number; sha256: string }>) {
      expect(readFileSync(resolve(root, lod.path)).byteLength).toBe(lod.bytes);
      expect(sha256(lod.path)).toBe(lod.sha256);
    }
    expect(overlay.microtextureReuse.sourceOverlaySha256).toBe(bennuOverlay.receiptSha256);
    expect(overlay.microtextureReuse.assets).toHaveLength(3);
    for (const reused of overlay.microtextureReuse.assets as Array<{ inheritedAssetId: string; variants: unknown; exactByteReuse: boolean }>) {
      const inherited = bennuOverlay.assets.find((asset: { id: string }) => asset.id === reused.inheritedAssetId);
      expect(reused.exactByteReuse).toBe(true);
      expect(reused.variants).toEqual(inherited.variants);
    }
  });

  it("owns Ceres as a Dawn/PDS radius shape with co-registered macro maps and bounded CC0 microstructure", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    const modelHook = read("app/lib/useV591CeresModel.ts");
    const textureHook = read("app/lib/useV591Texture.ts");
    const overlay = JSON.parse(read("public/data/celestial-convergence-v591/ceres-asset-overlay.json"));
    const bennuOverlay = JSON.parse(read("public/data/celestial-convergence-v591/bennu-asset-overlay.json"));
    expect(() => parseCeresAssetOverlayV591(overlay)).not.toThrow();
    expect(overrides).toContain("function CeresOverrideV591");
    expect(overrides).toContain("useV591CeresModel");
    for (const id of ["ceres-albedo", "ceres-normal", "ceres-roughness", "ceres-height"]) {
      expect(overrides).toContain(`useV591CeresTexture("${id}"`);
    }
    expect(textureHook).toContain("export function useV591CeresTexture");
    expect(materials).toContain("CERES_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("ceresOrenNayarV591");
    expect(materials).not.toContain("CERES_GLOSSY_SPECULAR");
    expect(modelHook).toContain("MeshoptDecoder");
    expect(modelHook).toContain('owner: "v591-celestial-convergence"');
    expect(stage).toContain('focusTarget === "ceres"');
    expect(overlay.status).toBe("ceres-assets-derived-awaiting-runtime-admission");
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.blockers).toEqual([]);
    expect(overlay.model.sourceDetailCeiling).toBe("pds-dawn-spc-radius-2222x1111-261120-triangles");
    expect(overlay.model.lods.map((lod: { triangleCount: number }) => lod.triangleCount)).toEqual([104_448, 24_806, 4_960]);
    expect(overlay.assets.map((asset: { id: string }) => asset.id)).toEqual(["ceres-albedo", "ceres-normal", "ceres-roughness", "ceres-height"]);
    expect(overlay.assets.every((asset: { derivation: { syntheticDetailAdded: boolean; deliveryUpscaleAddsObservationDetail: boolean } }) => !asset.derivation.syntheticDetailAdded && !asset.derivation.deliveryUpscaleAddsObservationDetail)).toBe(true);
    expect(overlay.materialPolicy).toMatchObject({ opticalColorClaim: false, syntheticDetailAdded: false });
    expect(overlay.authorityState).toMatchObject({ scientificPayloadWriteback: false, measuredPhotometryClaim: false, measuredAuthorityGranted: false });
    for (const lod of overlay.model.lods as Array<{ path: string; bytes: number; sha256: string }>) {
      expect(readFileSync(resolve(root, lod.path)).byteLength).toBe(lod.bytes);
      expect(sha256(lod.path)).toBe(lod.sha256);
    }
    let variants = 0;
    for (const asset of overlay.assets as Array<{ variants: Record<string, { url: string; bytes: number; sha256: string }> }>) {
      for (const file of Object.values(asset.variants)) {
        const path = `public/${file.url.replace(/^\/+/, "")}`;
        expect(readFileSync(resolve(root, path)).byteLength).toBe(file.bytes);
        expect(sha256(path)).toBe(file.sha256);
        variants += 1;
      }
    }
    expect(variants).toBe(24);
    expect(overlay.microtextureReuse.sourceOverlaySha256).toBe(bennuOverlay.receiptSha256);
    expect(overlay.microtextureReuse.assets).toHaveLength(3);
    for (const reused of overlay.microtextureReuse.assets as Array<{ inheritedAssetId: string; variants: unknown; exactByteReuse: boolean }>) {
      const inherited = bennuOverlay.assets.find((asset: { id: string }) => asset.id === reused.inheritedAssetId);
      expect(reused.exactByteReuse).toBe(true);
      expect(reused.variants).toEqual(inherited.variants);
    }
    expect(() => parseCeresAssetOverlayV591({ ...overlay, proceduralFallback: true })).toThrow(/v591-ceres-overlay/);
    expect(() => parseCeresAssetOverlayV591({
      ...overlay,
      authorityState: { ...overlay.authorityState, scientificPayloadWriteback: true },
    })).toThrow(/v591-ceres-overlay/);
  });

  it("owns Eros and Kleopatra as sealed NASA shapes with honest topology and detail ceilings", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const modelHook = read("app/lib/useV591NasaSmallBodyModel.ts");
    const bennuOverlay = JSON.parse(read("public/data/celestial-convergence-v591/bennu-asset-overlay.json"));
    const cases = [
      {
        body: "eros" as const,
        lodTriangles: [99_364, 24_840, 4_966],
        detailCeiling: "nasa-shape-200856-triangles",
        receiptSha256: "133e2f6194401c7afab1873fe22c93e2bd3044cc551dcb3c55affeefba02ff66",
      },
      {
        body: "kleopatra" as const,
        lodTriangles: [4_092, 2_046, 1_022],
        detailCeiling: "nasa-low-resolution-radar-shape-4092-triangles",
        receiptSha256: "5689f7c26a5326dfba9e527626bce13037fc3e574a9b84cb3802b789c39df3f6",
      },
    ];
    expect(overrides).toContain("function NasaSmallBodyOverrideV591");
    expect(overrides).toContain('bodyId="eros"');
    expect(overrides).toContain('bodyId="kleopatra"');
    expect(overrides).toContain("useV591NasaSmallBodyModel");
    expect(overrides).toContain('atlasMicrotextureExactByteReuse: true');
    expect(overrides).toContain('atlasMeasuredPhotometryClaim: false');
    expect(materials).toContain("NASA_SMALL_BODY_REGOLITH_FRAGMENT_V591");
    expect(materials).toContain("nasaSmallBodyOrenNayarV591");
    expect(materials).not.toContain("NASA_SMALL_BODY_GLOSSY_SPECULAR");
    expect(modelHook).toContain('owner: "v591-celestial-convergence"');
    expect(modelHook).toContain("THREE.InterleavedBufferAttribute");
    for (const current of cases) {
      const overlay = JSON.parse(read(`public/data/celestial-convergence-v591/${current.body}-asset-overlay.json`));
      const lodReceipt = JSON.parse(read(`docs/release/v591/${current.body}-model-lod-receipt-v591.json`));
      expect(() => parseNasaSmallBodyAssetOverlayV591(current.body, overlay)).not.toThrow();
      expect(overlay.proceduralFallback).toBe(false);
      expect(overlay.authorityState.measuredPhotometryClaim).toBe(false);
      expect(overlay.authorityState.scientificPayloadWriteback).toBe(false);
      expect(overlay.model.sourceDetailCeiling).toBe(current.detailCeiling);
      expect(overlay.modelLodReceiptSha256).toBe(current.receiptSha256);
      expect(overlay.model.lods.map((lod: { triangleCount: number }) => lod.triangleCount)).toEqual(current.lodTriangles);
      expect(overlay.microtextureReuse.sourceOverlaySha256).toBe(bennuOverlay.receiptSha256);
      expect(overlay.microtextureReuse.assets).toHaveLength(3);
      expect(lodReceipt.receiptSha256).toBe(current.receiptSha256);
      for (const lod of overlay.model.lods as Array<{ path: string; bytes: number; sha256: string }>) {
        expect(readFileSync(resolve(root, lod.path)).byteLength).toBe(lod.bytes);
        expect(sha256(lod.path)).toBe(lod.sha256);
      }
      for (const reused of overlay.microtextureReuse.assets as Array<{ inheritedAssetId: string; variants: unknown; exactByteReuse: boolean; observationLimit: string }>) {
        const inherited = bennuOverlay.assets.find((asset: { id: string }) => asset.id === reused.inheritedAssetId);
        expect(reused.exactByteReuse).toBe(true);
        expect(reused.variants).toEqual(inherited.variants);
        expect(reused.observationLimit).toContain(`not ${current.body} observation data`);
      }
    }
    const eros = JSON.parse(read("public/data/celestial-convergence-v591/eros-asset-overlay.json"));
    expect(eros.model.printableSplitReconstruction).toMatchObject({
      sourceComponentCount: 2,
      outputComponentCount: 1,
      outputEulerNumber: 2,
      boundaryEdgeCount: 0,
      nonManifoldEdgeCount: 0,
      watertight: true,
    });
    const kleopatra = JSON.parse(read("public/data/celestial-convergence-v591/kleopatra-asset-overlay.json"));
    expect(kleopatra.model.printableSplitReconstruction).toBeNull();
  });

  it("rejects Eros/Kleopatra overlay, reconstruction, and detail-ceiling mutations", () => {
    const eros = JSON.parse(read("public/data/celestial-convergence-v591/eros-asset-overlay.json"));
    const kleopatra = JSON.parse(read("public/data/celestial-convergence-v591/kleopatra-asset-overlay.json"));
    const mutatedErosSeal = structuredClone(eros);
    mutatedErosSeal.model.printableSplitReconstruction.boundaryEdgeCount = 1;
    expect(() => parseNasaSmallBodyAssetOverlayV591("eros", mutatedErosSeal)).toThrow("v591-eros-overlay-seal");
    const mutatedErosLod = structuredClone(eros);
    mutatedErosLod.model.lods[0].path = "public/models/candidate-v591/eros/eros-lod1.glb";
    expect(() => parseNasaSmallBodyAssetOverlayV591("eros", mutatedErosLod)).toThrow("v591-eros-overlay-seal");
    const mutatedKleopatraCeiling = structuredClone(kleopatra);
    mutatedKleopatraCeiling.model.sourceDetailCeiling = "nasa-shape-100000-triangles";
    expect(() => parseNasaSmallBodyAssetOverlayV591("kleopatra", mutatedKleopatraCeiling)).toThrow("v591-kleopatra-overlay-seal");
    const wrongBody = structuredClone(eros);
    expect(() => parseNasaSmallBodyAssetOverlayV591("kleopatra", wrongBody)).toThrow("v591-kleopatra-overlay-seal");
  });

  it("owns Tempel 1 as a PDS shape and coverage-masked observed mosaic with fixed-seed presentation tails", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const modelHook = read("app/lib/useV591Tempel1Model.ts");
    const overlay = JSON.parse(read("public/data/celestial-convergence-v591/tempel-1-asset-overlay.json"));
    expect(() => parseTempel1AssetOverlayV591(overlay)).not.toThrow();
    expect(overrides).toContain("function Tempel1OverrideV591");
    expect(overrides).toContain('useV591Tempel1Texture("tempel-1-observation"');
    expect(overrides).toContain('useV591Tempel1Texture("tempel-1-observation-mask"');
    expect(overrides).toContain("fixed-seed-dust-anti-solar-ion-velocity-presentation-only");
    expect(overrides).toContain("createTempelTailPacketV591");
    expect(materials).toContain("TEMPEL1_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("uCoverageMask");
    expect(materials).toContain("unobservedSubstrate");
    expect(materials).not.toContain("TEMPEL1_GLOSSY_SPECULAR");
    expect(modelHook).toContain("MeshoptDecoder");
    expect(modelHook).toContain('owner: "v591-celestial-convergence"');
    expect(overlay.proceduralFallback).toBe(false);
    expect(overlay.observationMapping.observedPixelFraction).toBe(0.8043214699074074);
    expect(overlay.observationMapping.unobservedPixelsAreMeasuredDarkTerrain).toBe(false);
    expect(overlay.model.lods.map((lod: { triangleCount: number }) => lod.triangleCount)).toEqual([32_040, 8_010, 2_002]);
    for (const lod of overlay.model.lods as Array<{ path: string; bytes: number; sha256: string }>) {
      expect(readFileSync(resolve(root, lod.path)).byteLength).toBe(lod.bytes);
      expect(sha256(lod.path)).toBe(lod.sha256);
    }
    for (const asset of overlay.assets as Array<{ variants: Record<string, { url: string; bytes: number; sha256: string }> }>) {
      for (const file of Object.values(asset.variants)) {
        const path = `public/${file.url.replace(/^\/+/, "")}`;
        expect(readFileSync(resolve(root, path)).byteLength).toBe(file.bytes);
        expect(sha256(path)).toBe(file.sha256);
      }
    }
  });

  it("owns a LROC/LOLA Moon with finite relief and no procedural fallback", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    expect(overrides).toContain("function MoonOverrideV591");
    expect(overrides).toContain('useV591MoonTexture("moon-albedo"');
    expect(overrides).toContain('useV591MoonTexture("moon-normal"');
    expect(overrides).toContain('useV591MoonTexture("moon-roughness"');
    expect(overrides).toContain('useV591MoonTexture("moon-height"');
    expect(overrides).toContain('atlasFiniteVertexRelief: true');
    expect(overrides).toContain('atlasProceduralFallback: false');
    expect(materials).toContain("MOON_SURFACE_VERTEX_V591");
    expect(materials).toContain("MOON_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("uHeightMetersPerRawUnit");
    expect(materials).toContain("float orenNayar");
  });

  it("owns the Earth surface, dual clouds, night limb and atmosphere without a procedural fallback", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    expect(overrides).toContain("function EarthOverrideV591");
    expect(overrides).toContain('useV591InheritedEarthTexture("earth-albedo"');
    expect(overrides).toContain('useV591InheritedEarthTexture("earth-normal"');
    expect(overrides).toContain('useV591InheritedEarthTexture("earth-night"');
    expect(overrides).toContain("atlasCloudLayerCount: 2");
    expect(overrides).toContain('atlasAtmosphereModel: "bounded-rayleigh-mie"');
    expect(overrides).toContain("atlasProceduralFallback: false");
    expect(materials).toContain("EARTH_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("EARTH_CLOUD_FRAGMENT_V591");
    expect(materials).toContain("EARTH_ATMOSPHERE_FRAGMENT_V591");
    expect(materials).toContain("float oceanGlint");
    expect(materials).toContain("float waveFacet");
    expect(materials).toContain("mix(720.0, 1320.0");
    expect(materials).toContain("mix(0.016, 0.046");
    expect(materials).toContain("float cloudShadow");
  });

  it("owns public-domain USGS/MOLA Mars with finite relief, rough dust, and a thin atmosphere", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    expect(overrides).toContain("function MarsOverrideV591");
    expect(overrides).toContain('useV591MarsTexture("mars-albedo"');
    expect(overrides).toContain('useV591MarsTexture("mars-normal"');
    expect(overrides).toContain('useV591MarsTexture("mars-roughness"');
    expect(overrides).toContain('useV591MarsTexture("mars-height"');
    expect(overrides).toContain('atlasAlbedoDetailCeiling: "1024x512-observed"');
    expect(overrides).toContain('atlasAtmosphereModel: "thin-co2-dust-haze"');
    expect(overrides).toContain("atlasProceduralFallback: false");
    expect(materials).toContain("MARS_SURFACE_VERTEX_V591");
    expect(materials).toContain("MARS_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("MARS_ATMOSPHERE_FRAGMENT_V591");
    expect(materials).not.toContain("MARS_SPECULAR");
    expect(stage).toContain('focusTarget === "mars"');
  });

  it("owns Cassini Jupiter with source-derived masks, bounded zonal flow, and no specular lobe", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    expect(overrides).toContain("function JupiterOverrideV591");
    expect(overrides).toContain('useV591JupiterTexture("jupiter-albedo"');
    expect(overrides).toContain('useV591JupiterTexture("jupiter-band-mask"');
    expect(overrides).toContain('useV591JupiterTexture("jupiter-storm-mask"');
    expect(overrides).toContain('atlasReflectanceModel: "gas-giant-limb-darkening-no-specular"');
    expect(overrides).toContain("clearFocusedHeroTelemetryV591(root)");
    expect(materials).toContain("JUPITER_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("float zonalOffset");
    expect(materials).toContain("float limbDarkening");
    expect(materials).toContain("fixed-epoch, source-mask-bounded zonal offset");
    expect(materials).not.toContain("JUPITER_SPECULAR");
    expect(stage).toContain('focusTarget === "jupiter"');
  });

  it("owns Cassini Saturn with radial UV, registered gaps, mutual shadows, and premultiplied ordering", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const materials = read("app/lib/celestialMaterialsV591.ts");
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    expect(overrides).toContain("function SaturnOverrideV591");
    expect(overrides).toContain('useV591SaturnTexture("saturn-atmosphere-albedo"');
    expect(overrides).toContain('useV591SaturnTexture("saturn-polar-detail"');
    expect(overrides).toContain('useV591SaturnTexture("saturn-ring-color"');
    expect(overrides).toContain('useV591SaturnTexture("saturn-ring-optical-depth"');
    expect(overrides).toContain("createRadialRingGeometryV590");
    expect(overrides).toContain("premultipliedAlpha: true");
    expect(overrides).toContain("depthWrite: false");
    expect(overrides).toContain("atlasRingMutualShadows: true");
    expect(overrides).toContain("full-ring-bounding-circle-within-92pct-viewport-width");
    expect(materials).toContain("SATURN_SURFACE_FRAGMENT_V591");
    expect(materials).toContain("SATURN_RING_FRAGMENT_V591");
    expect(materials).toContain("uCassiniStart");
    expect(materials).toContain("uEnckeCenter");
    expect(materials).toContain("color * alpha");
    expect(stage).toContain('focusTarget === "saturn"');
  });

  it("fits the complete Saturn ring silhouette in the narrow mobile viewport without changing its target", () => {
    const inheritedDesktop = celestialCameraGoalV591("saturn", [0, 16.5, 31.5], "desktop");
    const mobile = celestialCameraGoalV591("saturn", [0, 16.5, 31.5], "mobile");
    const inheritedMobileSource = celestialCameraGoalV591("earth", [0, 16.5, 31.5], "mobile");
    const target = mobile.target;
    const mobileDistance = Math.hypot(
      mobile.position[0] - target[0],
      mobile.position[1] - target[1],
      mobile.position[2] - target[2],
    );
    const desktopDistance = Math.hypot(
      inheritedDesktop.position[0] - inheritedDesktop.target[0],
      inheritedDesktop.position[1] - inheritedDesktop.target[1],
      inheritedDesktop.position[2] - inheritedDesktop.target[2],
    );
    expect(SATURN_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.8);
    expect(mobile.target).toEqual(inheritedDesktop.target);
    expect(mobileDistance).toBeGreaterThan(desktopDistance * 2);
    expect(inheritedMobileSource.target).not.toEqual(mobile.target);
  });

  it("adds bounded mobile framing margins for Mercury, Mars, and Jupiter without moving their targets", () => {
    const current = [0, 16.5, 31.5] as const;
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    for (const [body, expectedScale] of [
      ["mercury", MERCURY_MOBILE_CAMERA_DISTANCE_SCALE_V591],
      ["mars", MARS_MOBILE_CAMERA_DISTANCE_SCALE_V591],
      ["jupiter", JUPITER_MOBILE_CAMERA_DISTANCE_SCALE_V591],
    ] as const) {
      const desktop = celestialCameraGoalV591(body, current, "desktop");
      const inheritedMobile = celestialCameraGoalV590(body, current, "mobile");
      const mobile = celestialCameraGoalV591(body, current, "mobile");
      expect(mobile.target).toEqual(inheritedMobile.target);
      expect(mobile.target).toEqual(desktop.target);
      expect(distance(mobile) / distance(inheritedMobile)).toBeCloseTo(expectedScale, 10);
    }
  });

  it("backs the mobile ice-giant camera away enough to preserve the registered faint-ring silhouettes", () => {
    const current = [0, 16.5, 31.5] as const;
    const uranusDesktop = celestialCameraGoalV591("uranus", current, "desktop");
    const uranusMobile = celestialCameraGoalV591("uranus", current, "mobile");
    const neptuneDesktop = celestialCameraGoalV591("neptune", current, "desktop");
    const neptuneMobile = celestialCameraGoalV591("neptune", current, "mobile");
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    expect(URANUS_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.8);
    expect(NEPTUNE_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.4);
    expect(uranusMobile.target).toEqual(uranusDesktop.target);
    expect(neptuneMobile.target).toEqual(neptuneDesktop.target);
    expect(distance(uranusMobile)).toBeGreaterThan(distance(uranusDesktop) * 2.1);
    expect(distance(neptuneMobile)).toBeGreaterThan(distance(neptuneDesktop) * 1.6);
  });

  it("preserves the complete Vesta silhouette in the narrow mobile viewport", () => {
    const current = [0, 16.5, 31.5] as const;
    const desktop = celestialCameraGoalV591("vesta", current, "desktop");
    const mobile = celestialCameraGoalV591("vesta", current, "mobile");
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    expect(VESTA_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.34);
    expect(mobile.target).toEqual(desktop.target);
    expect(distance(mobile)).toBeGreaterThan(distance(desktop) * 1.6);
  });

  it("preserves the complete Ceres radius-shape silhouette in the narrow mobile viewport", () => {
    const current = [0, 16.5, 31.5] as const;
    const desktop = celestialCameraGoalV591("ceres", current, "desktop");
    const mobile = celestialCameraGoalV591("ceres", current, "mobile");
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    expect(CERES_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.38);
    expect(mobile.target).toEqual(desktop.target);
    expect(distance(mobile)).toBeGreaterThan(distance(desktop) * 1.65);
  });

  it("preserves the complete Bennu silhouette in the narrow mobile viewport", () => {
    const current = [0, 16.5, 31.5] as const;
    const desktop = celestialCameraGoalV591("bennu", current, "desktop");
    const mobile = celestialCameraGoalV591("bennu", current, "mobile");
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    expect(BENNU_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.26);
    expect(mobile.target).toEqual(desktop.target);
    expect(distance(mobile)).toBeGreaterThan(distance(desktop) * 1.52);
  });

  it("preserves the elongated Eros and dog-bone Kleopatra silhouettes on mobile", () => {
    const current = [0, 16.5, 31.5] as const;
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    const erosDesktop = celestialCameraGoalV591("eros", current, "desktop");
    const erosMobile = celestialCameraGoalV591("eros", current, "mobile");
    const kleopatraDesktop = celestialCameraGoalV591("kleopatra", current, "desktop");
    const kleopatraMobile = celestialCameraGoalV591("kleopatra", current, "mobile");
    expect(EROS_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.46);
    expect(KLEOPATRA_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.52);
    expect(erosMobile.target).toEqual(erosDesktop.target);
    expect(kleopatraMobile.target).toEqual(kleopatraDesktop.target);
    expect(distance(erosMobile)).toBeGreaterThan(distance(erosDesktop) * 1.8);
    expect(distance(kleopatraMobile)).toBeGreaterThan(distance(kleopatraDesktop) * 1.88);
  });

  it("keeps the Tempel 1 nucleus inside the mobile frame", () => {
    const current = [0, 16.5, 31.5] as const;
    const distance = (goal: ReturnType<typeof celestialCameraGoalV591>) => Math.hypot(
      goal.position[0] - goal.target[0],
      goal.position[1] - goal.target[1],
      goal.position[2] - goal.target[2],
    );
    const inheritedMobile = celestialCameraGoalV590("tempel-1", current, "mobile");
    const mobile = celestialCameraGoalV591("tempel-1", current, "mobile");
    expect(TEMPEL1_MOBILE_CAMERA_DISTANCE_SCALE_V591).toBe(1.52);
    expect(mobile.target).toEqual(inheritedMobile.target);
    expect(distance(mobile)).toBeCloseTo(distance(inheritedMobile) * TEMPEL1_MOBILE_CAMERA_DISTANCE_SCALE_V591, 8);
  });

  it("keeps exposure presets presentation-only and locks Science to linear 1.0", () => {
    const shell = read("app/components/OrbitAtlasCelestialConvergenceV591.tsx");
    const renderingContract = read("app/lib/celestialRenderingV590.ts");
    expect(shell).toContain('useState<CelestialExposurePresetV590>("nominal")');
    expect(shell).toContain("mutatePresentation(() => setExposurePreset(next))");
    expect(shell).toContain('data-atlas-v591-exposure-policy={mode === "science" ? "linear-1.0-locked" : "presentation-only"}');
    expect(shell).toContain('disabled={mode === "science"}');
    expect(renderingContract).toContain('if (profile.mode === "science") return 1;');
  });

  it("reports the sealed Sun runtime truth and keeps desktop controls clear of the inspector", () => {
    const shell = read("app/components/OrbitAtlasCelestialConvergenceV591.tsx");
    expect(shell).toContain("setManifestStatus(candidate.status)");
    expect(shell).not.toContain("v591-architecture-ready-p1-assets-pending");
    expect(shell).toContain("SDO/HMI photosphere · SDO/AIA 304 Å chromosphere · deterministic corona");
    expect(shell).toContain("Blue Marble · GEBCO normal · ocean Fresnel · dual cloud · night limb · Rayleigh/Mie");
    expect(shell).toContain("USGS Viking color (1024px source ceiling) · MOLA normal/height/roughness · rough dust · thin CO₂ haze");
    expect(shell).toContain("Cassini PIA07782 · source-derived zonal mask · GRS mask · gas limb darkening · no specular lobe");
    expect(shell).toContain("V591_OVERRIDE_CHANNELS");
    expect(shell).toContain("data-atlas-v591-inspector-material");
    expect(shell).toContain('inspectorOpen ? "lg:right-[312px]" : ""');
    expect(shell).toContain("min-h-11");
    expect(shell).toContain("h-11 w-11 shrink-0");
    expect(shell).toContain("onSelect={(body) => { selectBody(body); setMobileSheetOpen(false); }}");
    expect(shell).toContain('onOverview={() => { focusSky("overview"); setMobileSheetOpen(false); }}');
  });

  it("qualifies scene release from attributable resources and zero renderer texture drift", () => {
    const stage = read("app/components/CelestialConvergenceStageV591.tsx");
    expect(stage).toContain('diff.status === "baseline"');
    expect(stage).toContain("candidateResources === 0");
    expect(stage).toContain("nodes === 0");
    expect(stage).toContain("programDelta <= 1");
    expect(stage).toContain("textureDelta === 0");
    expect(stage).toContain('atlasV591ReleaseRendererMemoryPolicy = "texture-zero;geometry-shared-global-observational-only"');
    expect(stage).not.toContain("gl.info.memory.geometries === memory.geometries");
  });

  it("binds all six P1 Hero slices to one current-build browser evidence chain", () => {
    const overrides = read("app/components/CelestialHeroOverridesV591.tsx");
    const sealer = read("scripts/seal-v591-celestial-convergence-candidate.mjs");
    const verifier = read("scripts/verify-v591-celestial-convergence-candidate.mjs");
    expect(overrides).toContain("atlasV591HeroSubjectVisible");
    expect(overrides).toContain("atlasV591HeroScreenDiameterPx");
    expect(sealer).toContain("const sunBrowserGate = browserEvidenceStatus");
    expect(sealer).toContain("const earthBrowserGate = browserEvidenceStatus");
    expect(sealer).toContain('mobileSource: "full-raster"');
    expect(sealer).toContain("const heroBrowserSlicesPassed = Object.values(browserEvidence).every");
    expect(sealer).toContain("const deepSpaceBrowserPassed = deepSpaceBrowserEvidence.status === \"passed\"");
    expect(sealer).toContain("const browserSlicesPassed = heroBrowserSlicesPassed && deepSpaceBrowserPassed");
    expect(verifier).toContain("verifyCoreBrowserSliceV591(sunBrowser");
    expect(verifier).toContain("verifyCoreBrowserSliceV591(earthBrowser");
  });

  it("does not require edits to frozen package or shared proxy/build entrypoints", () => {
    const v590Sources = JSON.parse(read("docs/release/v590/source-manifest-v590.json"));
    const frozen = new Map<string, string>(v590Sources.files.map((file: { path: string; sha256: string }) => [file.path, file.sha256]));
    for (const path of ["package.json", "proxy.ts", "app/lib/atlasProxyContractV562.ts", "scripts/build-atlas-profile.mjs"]) {
      expect(sha256(path), path).toBe(frozen.get(path));
    }
  });
});
