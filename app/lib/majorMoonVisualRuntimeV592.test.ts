import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAJOR_MOON_RUNTIME_HERO_IDS_V592,
  MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592,
  isMajorMoonRuntimeHeroIdV592,
  parseMajorMoonVisualManifestV592,
  selectMajorMoonVisualFilesV592,
} from "./majorMoonVisualAssetsV592";
import {
  estimateMajorMoonScreenDiameterPxV592,
  resolveMajorMoonInspectionCameraV592,
} from "./majorMoonInspectionCameraV592";

const readManifest = () => JSON.parse(readFileSync(resolve(process.cwd(), "public/data/living-universe-v592/major-moon-visual-assets.json"), "utf8"));

describe("major moon visual runtime v592", () => {
  it("keeps the admitted moon and Titan haze shell inside the portrait viewport", () => {
    const mobile = resolveMajorMoonInspectionCameraV592("mobile");
    const distance = Math.hypot(...mobile.position);
    const surfaceDiameter = estimateMajorMoonScreenDiameterPxV592(1, distance, mobile.fovDeg, 844);
    const hazeDiameter = estimateMajorMoonScreenDiameterPxV592(1.035, distance, mobile.fovDeg, 844);

    expect(surfaceDiameter).toBeLessThanOrEqual(390 * mobile.maximumViewportWidthFraction);
    expect(hazeDiameter).toBeLessThanOrEqual(390 * mobile.maximumViewportWidthFraction);
    expect(surfaceDiameter).toBeGreaterThanOrEqual(300);
  });

  it("derives the runtime candidate lane exactly from the sealed visual manifest", () => {
    const manifest = parseMajorMoonVisualManifestV592(readManifest());
    expect(MAJOR_MOON_RUNTIME_HERO_IDS_V592).toEqual(manifest.admission.admittedBodies);
    expect(manifest.manifestSha256).toBe(MAJOR_MOON_VISUAL_MANIFEST_SHA256_V592);
    expect(manifest.assets.map((asset) => asset.target)).toEqual(MAJOR_MOON_RUNTIME_HERO_IDS_V592);
    for (const id of manifest.admission.admittedBodies) expect(isMajorMoonRuntimeHeroIdV592(id)).toBe(true);
    for (const id of manifest.admission.blockedBodies) expect(isMajorMoonRuntimeHeroIdV592(id)).toBe(false);
  });

  it("selects KTX2-first Full assets and bounded Lite fallbacks", () => {
    const manifest = parseMajorMoonVisualManifestV592(readManifest());
    for (const asset of manifest.assets) {
      const desktop = selectMajorMoonVisualFilesV592(asset, "standalone-full", "desktop");
      const mobile = selectMajorMoonVisualFilesV592(asset, "standalone-full", "mobile");
      const lite = selectMajorMoonVisualFilesV592(asset, "vercel-lite", "mobile");
      expect(desktop.primary?.format).toBe("ktx2");
      expect(desktop.fallback.format).toBe("webp");
      expect(mobile.primary?.role).toBe("full-mobile");
      expect(lite.primary).toBeNull();
      expect(lite.fallback.role).toBe("lite-mobile");
    }
  });

  it("rejects manifest identity and path mutation without widening admission", () => {
    const mutatedIdentity = readManifest();
    mutatedIdentity.status = "qualified";
    expect(() => parseMajorMoonVisualManifestV592(mutatedIdentity)).toThrow("v592-major-moon-manifest-identity");
    const mutatedPath = readManifest();
    mutatedPath.assets[0].variants.desktopKtx2.url = "/textures/candidate-v592/major-moons/../forbidden.ktx2";
    expect(() => parseMajorMoonVisualManifestV592(mutatedPath)).toThrow();
  });
});
