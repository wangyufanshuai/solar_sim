import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v590 deep-space single-canvas module", () => {
  it("is an existing-Canvas consumer with fixed inward V9 sky", () => {
    const source = read("app/components/CelestialDeepSpaceV590.tsx");
    expect(source).toContain('from "../lib/celestialRenderingV590"');
    expect(source).toContain("FixedMilkyWaySphereV590");
    expect(source).toContain("THREE.BackSide");
    expect(source).toContain("MILKY_WAY_ROTATION_V590");
    expect(source).toContain('atlasCameraFollowing: "translation-only"');
    expect(source).toContain("shellRef.current?.position.copy(camera.position)");
    expect(source).toContain("useV590Texture(");
    expect(source).toContain('"milky-way-v588-readonly"');
    expect(source).not.toContain("<Canvas");
    expect(source).not.toContain("OrbitControls");
  });

  it("uses Gaia flux classes, common directions and source-id PSF rotation", () => {
    const component = read("app/components/CelestialDeepSpaceV590.tsx");
    const worker = read("app/workers/celestialStarfieldV590.worker.ts");
    expect(component).toContain("moffat");
    expect(component).toContain("starPsfRotationV590");
    expect(component).toContain("CELESTIAL_SPHERE_RADIUS_V590");
    expect(worker).toContain("classifyStarPsfV590(record.magG)");
    expect(worker).toContain("raDecToCelestialPositionV590(record.raDeg, record.decDeg, 1)");
    expect(worker).not.toContain("Math.random");
  });

  it("lifts the real Milky Way texture and emphasizes the requested constellation without synthetic sky", () => {
    const source = read("app/components/CelestialDeepSpaceV590.tsx");
    expect(source).toContain("photographicBase");
    expect(source).toContain("base * 0.83");
    expect(source).toContain("localContrast * 0.86");
    expect(source).toContain("catalogStars * (0.38");
    expect(source).toContain("j2000-equatorial-direction");
    expect(source).toContain("rightAscension / TAU");
    expect(source).toContain("bodyCloseup");
    expect(source).toContain('orion: "Ori"');
    expect(source).toContain('"ursa-major": "UMa"');
    expect(source).toContain("focused ? 1.2");
    expect(source).not.toContain("Math.random");
  });

  it("normalizes Gaia constellation lines and keeps six nebula impostors blocked", () => {
    const source = read("app/components/CelestialDeepSpaceV590.tsx");
    expect(source).toContain("normalizeCelestialPositionV590");
    expect(source).toContain("atlasFrustumAware: true");
    expect(source).toContain("atlasDepthOcclusion: true");
    expect(source).toContain("484-of-484-within-1.5deg");
    expect(source).toContain('atlasNebulaAssetState: "asset-blocked"');
    expect(source).toContain("atlasSyntheticImpostor: false");
    expect(source).toContain("atlasImpostorCount: 0");
  });

  it("scopes workers, textures, arrays and audit telemetry to v590", () => {
    const source = read("app/components/CelestialDeepSpaceV590.tsx");
    expect(source).toContain('owner: "v590-celestial-deep-space"');
    expect(source).toContain("acquireAtlasTextureResourceV289");
    expect(source).toContain("worker.terminate()");
    expect(source).toContain('worker.postMessage({ type: "release"');
    expect(source).toContain("disposeAfterDetachV590");
    expect(source).toContain("generationRef.current === generation");
    expect(source).toContain("v590-sky-generation-disposed");
    expect(source).toContain("cleanupLoaded");
    expect(source).toContain("atlasV590DeepSpaceStatus");
  });

  it("separates angular-change tracking from request throttling", () => {
    const source = read("app/components/CelestialDeepSpaceV590.tsx");
    const worker = read("app/workers/celestialStarfieldV590.worker.ts");
    expect(source).toContain("lastObservedViewRef");
    expect(source).toContain("lastAngleChangeAtRef");
    expect(source).toContain("shouldRequestStarfieldViewV590");
    expect(source).not.toContain("cameraStableSinceRef");
    expect(worker).toContain("unchanged-view-no-reload");
    expect(worker).toContain("lastCompleted = null");
  });
});
