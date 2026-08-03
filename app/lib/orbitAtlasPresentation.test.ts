import { describe, expect, it } from "vitest";
import { resolveAtlasAsset } from "./atlasAssetResolver";
import * as THREE from "three";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  ORBIT_ATLAS_LABELS,
  ORBIT_ATLAS_BALANCED_VISIBLE_ORBIT_COUNT,
  ORBIT_ATLAS_CAMERA_FOV,
  ORBIT_ATLAS_CAMERA_POSITION,
  ORBIT_ATLAS_CAMERA_TARGET,
  ORBIT_ATLAS_DENSE_VISIBLE_ORBIT_COUNT,
  ORBIT_ATLAS_ORBIT_RENDERER,
  ORBIT_ATLAS_SKY,
  ORBIT_ATLAS_V56_SKY,
  ORBIT_ATLAS_V57_SKY,
  ORBIT_ATLAS_V59_SKY,
  ORBIT_ATLAS_V60_SKY,
  ORBIT_ATLAS_V61_SKY,
  ORBIT_ATLAS_V62_SKY,
  ORBIT_ATLAS_V63_SKY,
  ORBIT_ATLAS_V64_SKY,
  ORBIT_ATLAS_V65_SKY,
  ORBIT_ATLAS_V66_SKY,
  ORBIT_ATLAS_V67_SKY,
  ORBIT_ATLAS_V68_SKY,
  ORBIT_ATLAS_V11_BODY_STYLES,
  ORBIT_ATLAS_V12_ORBIT_STYLES,
  ORBIT_ATLAS_V48_SKY,
  ORBIT_ATLAS_V9_SKY,
  ORBIT_ATLAS_VISUAL_PROFILE,
  classifyOrbitAtlasLayerStyle,
  mapOrbitAtlasPositionAu,
  mapOrbitAtlasVector,
  orbitAtlasV12OrbitColorForBody,
  orbitAtlasBodyVisualProfile,
  orbitAtlasDisplayRadius,
} from "./orbitAtlasPresentation";
import {
  normalizeOrbitVelocityKmS,
  ORBIT_VELOCITY_MAX_KM_S,
  ORBIT_VELOCITY_MIN_KM_S,
  orbitVelocityColor,
} from "./orbitCinematicTokens";
import {
  createGradientOrbitLineBundle,
  setGradientLinePositions,
} from "./orbitTrailGradientMaterial";
import { hdTextureManifestEntryForBodyId } from "../data/planetTextureManifest";

describe("Orbit Atlas presentation transform", () => {
  it("is monotonic for radial distances", () => {
    expect(orbitAtlasDisplayRadius(0.1)).toBeGreaterThan(0);
    expect(orbitAtlasDisplayRadius(1)).toBeGreaterThan(orbitAtlasDisplayRadius(0.1));
    expect(orbitAtlasDisplayRadius(30)).toBeGreaterThan(orbitAtlasDisplayRadius(1));
  });

  it("keeps direction while compressing radius", () => {
    const mapped = mapOrbitAtlasPositionAu(3, -4, 12, "compressed");
    const originalDirection = new THREE.Vector3(3, -4, 12).normalize();
    expect(mapped.clone().normalize().distanceTo(originalDirection)).toBeLessThan(1e-10);
    expect(mapped.length()).toBeLessThan(new THREE.Vector3(3, -4, 12).length() * 52);
  });

  it("returns physical scene coordinates exactly in physical mode", () => {
    expect(mapOrbitAtlasPositionAu(1.25, -2, 0.5, "physical").toArray()).toEqual([
      65,
      -104,
      26,
    ]);
  });

  it("does not mutate source vectors shared by bodies, routes, or orbit points", () => {
    const point = new THREE.Vector3(1.2, -0.4, 3.1);
    const before = point.clone();
    const mapped = mapOrbitAtlasVector(point, "compressed");
    expect(point.toArray()).toEqual(before.toArray());
    expect(mapped).not.toBe(point);
  });

  it("keeps the v12 visual profile, v9 layered sky, camera, and Chinese label contract stable", () => {
    expect(ORBIT_ATLAS_VISUAL_PROFILE).toBe("orbit-atlas-v12");
    expect(ORBIT_ATLAS_ORBIT_RENDERER).toBe("cold-body-web-v12");
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
    expect(ORBIT_ATLAS_CAMERA_POSITION.toArray()).toEqual([-190, 330, 780]);
    expect(ORBIT_ATLAS_CAMERA_TARGET.toArray()).toEqual([28, -34, 0]);
    expect(ORBIT_ATLAS_CAMERA_FOV).toBe(52);
    expect(ORBIT_ATLAS_LABELS.earth).toBe("\u5730\u7403");
    expect(ORBIT_ATLAS_LABELS.saturn).toBe("\u571f\u661f");
  });

  it("ships the fallback sky layers, v61 default sky layers, and selected-body HD texture manifest", () => {
    const archivedHistoricalSkyLayers = new Set([
      ORBIT_ATLAS_V9_SKY.desktopBase,
      ORBIT_ATLAS_V9_SKY.mobileBase,
      ORBIT_ATLAS_V48_SKY.desktopBase,
      ORBIT_ATLAS_V48_SKY.mobileBase,
      ORBIT_ATLAS_V56_SKY.desktopBase,
      ORBIT_ATLAS_V57_SKY.desktopBase,
      ORBIT_ATLAS_V57_SKY.dustMask,
      ORBIT_ATLAS_V57_SKY.negativeSpaceMask,
      ORBIT_ATLAS_V57_SKY.nebulaHazeMask,
      ORBIT_ATLAS_V59_SKY.desktopBase,
      ORBIT_ATLAS_V59_SKY.dustMask,
      ORBIT_ATLAS_V59_SKY.negativeSpaceMask,
      ORBIT_ATLAS_V66_SKY.desktopBase,
      ORBIT_ATLAS_V67_SKY.desktopStars,
      ORBIT_ATLAS_V68_SKY.desktopBase,
      ORBIT_ATLAS_V68_SKY.desktopStars,
    ]);
    for (const asset of [
      ORBIT_ATLAS_V9_SKY.desktopBase,
      ORBIT_ATLAS_V9_SKY.mobileBase,
      ORBIT_ATLAS_V9_SKY.desktopStars,
      ORBIT_ATLAS_V9_SKY.mobileStars,
      ORBIT_ATLAS_V9_SKY.dustMask,
      ORBIT_ATLAS_V48_SKY.desktopBase,
      ORBIT_ATLAS_V48_SKY.mobileBase,
      ORBIT_ATLAS_V48_SKY.desktopStars,
      ORBIT_ATLAS_V48_SKY.mobileStars,
      ORBIT_ATLAS_V48_SKY.dustMask,
      ORBIT_ATLAS_V48_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V56_SKY.desktopBase,
      ORBIT_ATLAS_V56_SKY.mobileBase,
      ORBIT_ATLAS_V56_SKY.desktopStars,
      ORBIT_ATLAS_V56_SKY.mobileStars,
      ORBIT_ATLAS_V56_SKY.dustMask,
      ORBIT_ATLAS_V56_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V56_SKY.nebulaHazeMask ?? "",
      ORBIT_ATLAS_V57_SKY.desktopBase,
      ORBIT_ATLAS_V57_SKY.mobileBase,
      ORBIT_ATLAS_V57_SKY.desktopStars,
      ORBIT_ATLAS_V57_SKY.mobileStars,
      ORBIT_ATLAS_V57_SKY.desktopDistantStars ?? "",
      ORBIT_ATLAS_V57_SKY.mobileDistantStars ?? "",
      ORBIT_ATLAS_V57_SKY.dustMask,
      ORBIT_ATLAS_V57_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V57_SKY.nebulaHazeMask ?? "",
      "/textures/sky/orbit-atlas-v57-dust-2k.jpg",
      "/textures/sky/orbit-atlas-v57-nebula-haze-2k.jpg",
      "/textures/sky/orbit-atlas-v57-negative-space-2k.jpg",
      ORBIT_ATLAS_V59_SKY.desktopBase,
      ORBIT_ATLAS_V59_SKY.mobileBase,
      ORBIT_ATLAS_V59_SKY.desktopStars,
      ORBIT_ATLAS_V59_SKY.mobileStars,
      ORBIT_ATLAS_V59_SKY.desktopDistantStars ?? "",
      ORBIT_ATLAS_V59_SKY.mobileDistantStars ?? "",
      ORBIT_ATLAS_V59_SKY.dustMask,
      ORBIT_ATLAS_V59_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V59_SKY.nebulaHazeMask ?? "",
      "/textures/sky/orbit-atlas-v59-dust-2k.jpg",
      "/textures/sky/orbit-atlas-v59-nebula-haze-2k.jpg",
      "/textures/sky/orbit-atlas-v59-negative-space-2k.jpg",
      ORBIT_ATLAS_V60_SKY.desktopBase,
      ORBIT_ATLAS_V60_SKY.mobileBase,
      ORBIT_ATLAS_V60_SKY.desktopStars,
      ORBIT_ATLAS_V60_SKY.mobileStars,
      ORBIT_ATLAS_V60_SKY.dustMask,
      ORBIT_ATLAS_V60_SKY.negativeSpaceMask ?? "",
      "/textures/sky/orbit-atlas-v60-dust-2k.jpg",
      "/textures/sky/orbit-atlas-v60-negative-space-2k.jpg",
      ORBIT_ATLAS_V61_SKY.desktopBase,
      ORBIT_ATLAS_V61_SKY.mobileBase,
      ORBIT_ATLAS_V61_SKY.desktopStars,
      ORBIT_ATLAS_V61_SKY.mobileStars,
      ORBIT_ATLAS_V61_SKY.dustMask,
      ORBIT_ATLAS_V61_SKY.negativeSpaceMask ?? "",
      "/textures/sky/orbit-atlas-v61-dust-2k.jpg",
      "/textures/sky/orbit-atlas-v61-negative-space-2k.jpg",
      ORBIT_ATLAS_V62_SKY.desktopBase,
      ORBIT_ATLAS_V62_SKY.mobileBase,
      ORBIT_ATLAS_V62_SKY.desktopStars,
      ORBIT_ATLAS_V62_SKY.mobileStars,
      ORBIT_ATLAS_V62_SKY.dustMask,
      ORBIT_ATLAS_V62_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V63_SKY.desktopBase,
      ORBIT_ATLAS_V63_SKY.mobileBase,
      ORBIT_ATLAS_V63_SKY.desktopStars,
      ORBIT_ATLAS_V63_SKY.mobileStars,
      ORBIT_ATLAS_V63_SKY.dustMask,
      ORBIT_ATLAS_V63_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V64_SKY.desktopBase,
      ORBIT_ATLAS_V64_SKY.mobileBase,
      ORBIT_ATLAS_V64_SKY.desktopStars,
      ORBIT_ATLAS_V64_SKY.mobileStars,
      ORBIT_ATLAS_V64_SKY.dustMask,
      ORBIT_ATLAS_V64_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V65_SKY.desktopBase,
      ORBIT_ATLAS_V65_SKY.mobileBase,
      ORBIT_ATLAS_V65_SKY.desktopStars,
      ORBIT_ATLAS_V65_SKY.mobileStars,
      ORBIT_ATLAS_V65_SKY.dustMask,
      ORBIT_ATLAS_V65_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V66_SKY.desktopBase,
      ORBIT_ATLAS_V66_SKY.mobileBase,
      ORBIT_ATLAS_V66_SKY.desktopStars,
      ORBIT_ATLAS_V66_SKY.mobileStars,
      ORBIT_ATLAS_V66_SKY.dustMask,
      ORBIT_ATLAS_V66_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V67_SKY.desktopBase,
      ORBIT_ATLAS_V67_SKY.mobileBase,
      ORBIT_ATLAS_V67_SKY.desktopStars,
      ORBIT_ATLAS_V67_SKY.mobileStars,
      ORBIT_ATLAS_V67_SKY.dustMask,
      ORBIT_ATLAS_V67_SKY.negativeSpaceMask ?? "",
      ORBIT_ATLAS_V68_SKY.desktopBase,
      ORBIT_ATLAS_V68_SKY.mobileBase,
      ORBIT_ATLAS_V68_SKY.desktopStars,
      ORBIT_ATLAS_V68_SKY.mobileStars,
      ORBIT_ATLAS_V68_SKY.dustMask,
      ORBIT_ATLAS_V68_SKY.negativeSpaceMask ?? "",
    ]) {
      const resolution = resolveAtlasAsset(asset);
      const path = resolve(
        process.cwd(),
        "dist",
        "content-packs",
        "files",
        resolution.packId,
        resolution.path,
      );
      if (archivedHistoricalSkyLayers.has(asset)) {
        expect(existsSync(path), `historical sky layer unexpectedly restored: ${asset}`).toBe(false);
        continue;
      }
      const minimumSize =
        asset.includes("v65-lock") || asset.includes("v64-cinematic")
          ? 16 * 1024
          : asset.includes("v60-base-2k")
          ? 24 * 1024
          : asset.includes("distant-stars") || asset.includes("v59-nebula-haze")
          ? 8 * 1024
          : 32 * 1024;
      expect(existsSync(path), `content-pack sky asset missing: ${asset} -> ${path}`).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(minimumSize);
    }
    expect(ORBIT_ATLAS_SKY).toBe(ORBIT_ATLAS_V9_SKY);
    expect(ORBIT_ATLAS_V9_SKY.desktopBase).toBe("/textures/sky/orbit-atlas-v9-base-8k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileBase).toBe("/textures/sky/orbit-atlas-v9-base-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.desktopStars).toBe("/textures/sky/orbit-atlas-v9-stars-4k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.mobileStars).toBe("/textures/sky/orbit-atlas-v9-stars-2k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.dustMask).toBe("/textures/sky/orbit-atlas-v9-dust-2k.jpg");
    expect(ORBIT_ATLAS_V9_SKY.negativeSpaceMask).toBeUndefined();
    expect(ORBIT_ATLAS_V9_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V9_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V9_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V9_SKY.rotation).toEqual([-0.34, 4.24, -0.86]);
    expect(ORBIT_ATLAS_V68_SKY.desktopBase).toContain("v68-reference-backdrop-base-4k");
    expect(ORBIT_ATLAS_V68_SKY.mobileBase).toContain("v68-reference-backdrop-base-2k");
    expect(ORBIT_ATLAS_V68_SKY.desktopStars).toContain("v68-reference-primary-stars-4k");
    expect(ORBIT_ATLAS_V68_SKY.mobileStars).toContain("v68-reference-primary-stars-2k");
    expect(ORBIT_ATLAS_V68_SKY.dustMask).toContain("v68-reference-dust-2k");
    expect(ORBIT_ATLAS_V68_SKY.negativeSpaceMask).toContain("v68-reference-negative-space-2k");
    expect(ORBIT_ATLAS_V68_SKY.desktopBase).not.toContain("v67");
    expect(ORBIT_ATLAS_V68_SKY.desktopStars).not.toContain("v67");
    expect(ORBIT_ATLAS_V68_SKY.dustMask).not.toContain("v67");
    expect(ORBIT_ATLAS_V68_SKY.negativeSpaceMask).not.toContain("v67");
    expect(ORBIT_ATLAS_V68_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V68_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V68_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V68_SKY.rotation).toEqual([1.57, -0.65, -0.55]);
    expect(ORBIT_ATLAS_V67_SKY.desktopBase).toContain("v67-galactic-depth-base-4k");
    expect(ORBIT_ATLAS_V67_SKY.mobileBase).toContain("v67-galactic-depth-base-2k");
    expect(ORBIT_ATLAS_V67_SKY.desktopStars).toContain("v67-primary-stars-4k");
    expect(ORBIT_ATLAS_V67_SKY.mobileStars).toContain("v67-primary-stars-2k");
    expect(ORBIT_ATLAS_V67_SKY.dustMask).toContain("v67-dust-2k");
    expect(ORBIT_ATLAS_V67_SKY.negativeSpaceMask).toContain("v67-negative-space-2k");
    expect(ORBIT_ATLAS_V67_SKY.desktopStars).not.toContain("v65");
    expect(ORBIT_ATLAS_V67_SKY.dustMask).not.toContain("v65");
    expect(ORBIT_ATLAS_V67_SKY.negativeSpaceMask).not.toContain("v65");
    expect(ORBIT_ATLAS_V67_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V67_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V67_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V67_SKY.rotation).toEqual([-0.36, 0, -0.55]);
    expect(ORBIT_ATLAS_V66_SKY.desktopBase).toContain("v66-milky-way-depth-base-4k");
    expect(ORBIT_ATLAS_V66_SKY.mobileBase).toContain("v66-milky-way-depth-base-2k");
    expect(ORBIT_ATLAS_V66_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V66_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V66_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V66_SKY.rotation).toEqual([0.12, 5.9, -0.52]);
    expect(ORBIT_ATLAS_V65_SKY.desktopBase).toContain("v65-lock-cinematic-base-4k");
    expect(ORBIT_ATLAS_V65_SKY.mobileBase).toContain("v65-lock-cinematic-base-2k");
    expect(ORBIT_ATLAS_V65_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V65_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V65_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V65_SKY.rotation).toEqual(ORBIT_ATLAS_V61_SKY.rotation);
    expect(ORBIT_ATLAS_V64_SKY.desktopBase).toContain("v64-cinematic-base-4k");
    expect(ORBIT_ATLAS_V64_SKY.mobileBase).toContain("v64-cinematic-base-2k");
    expect(ORBIT_ATLAS_V64_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V64_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V64_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V64_SKY.rotation).toEqual(ORBIT_ATLAS_V61_SKY.rotation);
    expect(ORBIT_ATLAS_V63_SKY.desktopBase).toContain("v63-final-base-4k");
    expect(ORBIT_ATLAS_V63_SKY.mobileBase).toContain("v63-final-base-2k");
    expect(ORBIT_ATLAS_V63_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V63_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V63_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V63_SKY.rotation).toEqual(ORBIT_ATLAS_V61_SKY.rotation);
    expect(ORBIT_ATLAS_V62_SKY.desktopBase).toContain("v61-reset-base-4k");
    expect(ORBIT_ATLAS_V62_SKY.desktopBase).toContain("v=62a");
    expect(ORBIT_ATLAS_V62_SKY.mobileBase).toContain("v61-reset-base-2k");
    expect(ORBIT_ATLAS_V62_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V62_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V62_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V62_SKY.rotation).toEqual(ORBIT_ATLAS_V61_SKY.rotation);
    expect(ORBIT_ATLAS_V61_SKY.desktopBase).toContain("v61-reset-base-4k");
    expect(ORBIT_ATLAS_V61_SKY.mobileBase).toContain("v61-reset-base-2k");
    expect(ORBIT_ATLAS_V61_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V61_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V61_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V61_SKY.rotation).toEqual([-0.28, 5.18, -0.7]);
    expect(ORBIT_ATLAS_V60_SKY.desktopBase).toContain("v60-base-4k");
    expect(ORBIT_ATLAS_V60_SKY.mobileBase).toContain("v60-base-2k");
    expect(ORBIT_ATLAS_V60_SKY.desktopDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V60_SKY.mobileDistantStars).toBeUndefined();
    expect(ORBIT_ATLAS_V60_SKY.nebulaHazeMask).toBeUndefined();
    expect(ORBIT_ATLAS_V60_SKY.rotation).toEqual(ORBIT_ATLAS_V59_SKY.rotation);
    expect(ORBIT_ATLAS_V59_SKY.rotation).toEqual(ORBIT_ATLAS_V57_SKY.rotation);
    expect(ORBIT_ATLAS_V57_SKY.rotation).toEqual(ORBIT_ATLAS_V56_SKY.rotation);
    expect(ORBIT_ATLAS_V56_SKY.rotation).toEqual(ORBIT_ATLAS_V48_SKY.rotation);
    expect(ORBIT_ATLAS_V48_SKY.rotation).toEqual(ORBIT_ATLAS_V9_SKY.rotation);
    expect(hdTextureManifestEntryForBodyId("earth")).toEqual({
      albedo: "/textures/planets/hd/earth.jpg",
      clouds: "/textures/planets/hd/earth-clouds.jpg",
      night: "/textures/planets/hd/earth-night.jpg",
    });
    expect(hdTextureManifestEntryForBodyId("ceres")).toEqual({});
  });

  it("classifies orbit layers for foreground and background styling", () => {
    expect(classifyOrbitAtlasLayerStyle("earth", 1, 0.01, 0)).toBe("major");
    expect(classifyOrbitAtlasLayerStyle("ceres", 2.8, 0.08, 10)).toBe("inner-minor");
    expect(classifyOrbitAtlasLayerStyle("sedna", 500, 0.84, 11)).toBe("background-crossing");
    expect(classifyOrbitAtlasLayerStyle("pallas", 2.7, 0.2, 34)).toBe("high-inclination");
  });

  it("keeps v12 orbit style tokens layered for cold body-color atlas rendering", () => {
    expect(Object.keys(ORBIT_ATLAS_V12_ORBIT_STYLES).sort()).toEqual([
      "background-crossing",
      "high-inclination",
      "inner-minor",
      "major",
      "outer-minor",
    ]);
    const major = ORBIT_ATLAS_V12_ORBIT_STYLES.major;
    const innerMinor = ORBIT_ATLAS_V12_ORBIT_STYLES["inner-minor"];
    const crossing = ORBIT_ATLAS_V12_ORBIT_STYLES["background-crossing"];
    expect(major.linewidthPx).toBeGreaterThan(innerMinor.linewidthPx);
    expect(major.glowWidthPx).toBeGreaterThan(0);
    expect(major.coreAlpha[0]).toBeGreaterThan(innerMinor.coreAlpha[1]);
    expect(major.coreAlpha[0] - innerMinor.coreAlpha[1]).toBeGreaterThan(0.08);
    expect(major.coreAlpha[0] - innerMinor.coreAlpha[1]).toBeLessThan(0.14);
    expect(major.haloAlpha[1]).toBeGreaterThan(innerMinor.haloAlpha[1]);
    expect(innerMinor.edgeSoftness).toBeLessThan(major.edgeSoftness);
    expect(innerMinor.centerFade).toBeGreaterThan(crossing.centerFade);
    expect(crossing.depthFade).toBeLessThan(innerMinor.depthFade);
    expect(crossing.alphaJitter).toBeGreaterThan(innerMinor.alphaJitter);
    expect(major.depthTest).toBe(true);
  });

  it("maps read-only velocity samples into a stable three-stop trail palette", () => {
    expect(normalizeOrbitVelocityKmS(ORBIT_VELOCITY_MIN_KM_S)).toBe(0);
    expect(normalizeOrbitVelocityKmS(ORBIT_VELOCITY_MAX_KM_S)).toBe(1);
    expect(normalizeOrbitVelocityKmS(Number.NaN)).toBe(0);
    const medium = normalizeOrbitVelocityKmS(12);
    expect(medium).toBeGreaterThan(0);
    expect(medium).toBeLessThan(1);

    const cold = orbitVelocityColor(0);
    const mid = orbitVelocityColor(0.5);
    const hot = orbitVelocityColor(1);
    expect(cold.getHexString()).toBe("65c7d4");
    expect(mid.getHexString()).toBe("d9b45f");
    expect(hot.getHexString()).toBe("ef765f");

    const bundle = createGradientOrbitLineBundle(new THREE.Color("#ffffff"), {
      closed: false,
      maxVertices: 4,
    });
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(2, 0, 0),
    ];
    const speeds = new Float32Array([0, 0.5, 1]);
    setGradientLinePositions(bundle.geometry, points, points.length, "openHeadAtEnd", speeds);
    const speedAttribute = bundle.geometry.getAttribute("speedNormalized");
    expect(Array.from((speedAttribute.array as Float32Array).slice(0, 3))).toEqual([0, 0.5, 1]);
    bundle.geometry.dispose();
    bundle.material.dispose();
  });

  it("maps body orbit colors into distinct low-saturation cold tones", () => {
    const earth = orbitAtlasV12OrbitColorForBody("earth", "#4488cc", "major");
    const neptune = orbitAtlasV12OrbitColorForBody("neptune", "#3366cc", "major");
    const mars = orbitAtlasV12OrbitColorForBody("mars", "#cc6633", "major");
    const ceres = orbitAtlasV12OrbitColorForBody("ceres", "#b89870", "inner-minor");
    const sedna = orbitAtlasV12OrbitColorForBody("sedna", "#8866aa", "background-crossing");

    expect(new Set([earth.core, neptune.core, mars.core, ceres.core, sedna.core]).size).toBe(5);

    const hslFor = (hex: string) => {
      const hsl = { h: 0, s: 0, l: 0 };
      new THREE.Color(hex).getHSL(hsl);
      return hsl;
    };
    expect(hslFor(earth.core).h).toBeGreaterThan(0.52);
    expect(hslFor(neptune.core).h).toBeGreaterThan(0.52);
    expect(hslFor(mars.core).h).toBeLessThan(0.12);
    expect(hslFor(ceres.core).s).toBeLessThanOrEqual(0.28);
    expect(hslFor(sedna.core).s).toBeLessThanOrEqual(0.28);
    for (const token of [earth, neptune, mars, ceres, sedna]) {
      expect(hslFor(token.core).s).toBeLessThanOrEqual(0.34);
      expect(hslFor(token.halo).s).toBeLessThanOrEqual(0.24);
    }
  });

  it("keeps v11 render budget orbit counts stable", () => {
    expect(ORBIT_ATLAS_BALANCED_VISIBLE_ORBIT_COUNT).toBe(32);
    expect(ORBIT_ATLAS_DENSE_VISIBLE_ORBIT_COUNT).toBe(50);
  });

  it("classifies high-value Atlas bodies into material profiles", () => {
    expect(orbitAtlasBodyVisualProfile("sun")).toBe("sun");
    expect(orbitAtlasBodyVisualProfile("earth")).toBe("terrestrial");
    expect(orbitAtlasBodyVisualProfile("jupiter")).toBe("gas-giant");
    expect(orbitAtlasBodyVisualProfile("saturn")).toBe("ringed");
  });

  it("ships v11 body presentation tokens for overview dots and selected inspect bodies", () => {
    expect(Object.keys(ORBIT_ATLAS_V11_BODY_STYLES).sort()).toEqual([
      "fallback",
      "gas-giant",
      "ringed",
      "sun",
      "terrestrial",
    ]);
    const terrestrial = ORBIT_ATLAS_V11_BODY_STYLES.terrestrial;
    const minor = ORBIT_ATLAS_V11_BODY_STYLES.fallback;
    expect(terrestrial.selectedRadiusScale).toBeGreaterThan(terrestrial.overviewRadiusScale);
    expect(minor.selectedRadiusScale).toBeGreaterThan(terrestrial.selectedRadiusScale);
    expect(minor.selectedEmissiveIntensity).toBeGreaterThan(minor.emissiveIntensity);
    expect(minor.spriteMinPx).toBeGreaterThanOrEqual(6);
  });
});
