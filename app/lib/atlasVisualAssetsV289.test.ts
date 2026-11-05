import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ATLAS_VISUAL_ASSET_LICENSE_V289,
  ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289,
  ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289,
  ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V340,
  ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V349,
  ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362,
  resolveAtlasVisualAssetSelectionV289,
  validateAtlasVisualAssetManifestV289,
} from "./atlasVisualAssetsV289";

const manifest = JSON.parse(readFileSync("dist/science-cinematic-v4-v289-assets/manifest.json", "utf8"));
const fileSha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

describe("v289 content-addressed V4 visual assets", () => {
  it("allows existing licensed 2K NASA SVS derivatives only for local-shadow V4–V9 intent", () => {
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v4-v285", deepSpaceIntent: true })).toMatchObject({ available: true, tier: "2k" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v5-v299", deepSpaceIntent: true })).toMatchObject({ available: true, tier: "2k" });
    const v6 = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v6-v300", deepSpaceIntent: true });
    expect(v6).toMatchObject({ available: true, tier: "2k" });
    expect(v6.provenance).toMatchObject({
      base: { atlasVisualAssetManifestSha256: ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289, atlasVisualAssetLicense: ATLAS_VISUAL_ASSET_LICENSE_V289, atlasVisualAssetRuntimeSelector: ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289 },
      stars: { atlasVisualAssetManifestSha256: ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289, atlasVisualAssetLicense: ATLAS_VISUAL_ASSET_LICENSE_V289, atlasVisualAssetRuntimeSelector: ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V289 },
    });
    const v7 = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v7-v340", deepSpaceIntent: true });
    expect(v7).toMatchObject({ available: true, tier: "2k" });
    expect(v7.provenance?.base.atlasVisualAssetRuntimeSelector).toBe(ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V340);
    const v8 = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v8-v349", deepSpaceIntent: true });
    expect(v8).toMatchObject({ available: true, tier: "2k" });
    expect(v8.provenance?.base.atlasVisualAssetRuntimeSelector).toBe(ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V349);
    const v9 = resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v9-v362", deepSpaceIntent: true });
    expect(v9).toMatchObject({ available: true, tier: "2k" });
    expect(v9.provenance?.base.atlasVisualAssetRuntimeSelector).toBe(ATLAS_VISUAL_ASSET_RUNTIME_SELECTOR_V362);
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v9-v362", deepSpaceIntent: false })).toMatchObject({ available: false, reason: "no-deep-space-intent" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "vercel-lite", visualProfile: "science-cinematic-v9-v362", deepSpaceIntent: true })).toMatchObject({ available: false, reason: "lite-boundary" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "science-cinematic-v6-v300", deepSpaceIntent: false })).toMatchObject({ available: false, reason: "no-deep-space-intent" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "standalone-full", visualProfile: "science-cinematic-v6-v300", deepSpaceIntent: true })).toMatchObject({ available: false, reason: "ordinary-standalone-boundary" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "vercel-lite", visualProfile: "science-cinematic-v6-v300", deepSpaceIntent: true })).toMatchObject({ available: false, reason: "lite-boundary" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "vercel-lite", visualProfile: "science-cinematic-v4-v285", deepSpaceIntent: true })).toMatchObject({ available: false, reason: "lite-boundary" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "standalone-full", visualProfile: "science-cinematic-v4-v285", deepSpaceIntent: true })).toMatchObject({ available: false, reason: "ordinary-standalone-boundary" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "local-shadow", visualProfile: "legacy-v9", deepSpaceIntent: true })).toMatchObject({ available: false, reason: "legacy-profile" });
    expect(resolveAtlasVisualAssetSelectionV289({ deliveryProfile: "vercel-lite", visualProfile: "science-cinematic-v6-v300", deepSpaceIntent: true }).provenance).toBeNull();
  });

  it("validates the immutable manifest, license and published file SHAs", () => {
    expect(validateAtlasVisualAssetManifestV289(manifest)).toEqual({ passed: true, failures: [] });
    expect(manifest.canonicalSha256).toBe(ATLAS_VISUAL_ASSET_MANIFEST_CANONICAL_SHA256_V289);
    for (const entry of manifest.entries) {
      expect(fileSha(`public/${entry.outputPath}`)).toBe(entry.outputSha256);
      expect(entry.license).toMatchObject({ id: "NASA-public-domain", status: "approved-runtime", attributionRequired: false });
      expect(entry.networkDownloadApplied).toBe(false);
    }
  });

  it("fails closed on manifest, SHA, license or path traversal drift", () => {
    const tampered = structuredClone(manifest);
    tampered.canonicalSha256 = "a".repeat(64);
    tampered.entries[0].outputSha256 = "b".repeat(64);
    tampered.entries[0].license.status = "unknown";
    tampered.entries[1].outputPath = "../outside.jpg";
    expect(validateAtlasVisualAssetManifestV289(tampered).failures).toEqual(expect.arrayContaining([
      "manifest-identity",
      "entry-sha-identity",
      "entry-license",
      "entry-path-boundary",
    ]));
  });

  it("has an actual sky runtime consumer and a no-download staging policy", () => {
    const runtime = readFileSync("app/components/GalaxyEnvironmentSphere.tsx", "utf8");
    const staging = readFileSync("scripts/stage-cinematic-assets-v289.mjs", "utf8");
    expect(runtime).toContain("resolveAtlasRuntimeVisualAssetSelectionV289");
    expect(runtime).toContain("visualAssetSelection.baseUrl");
    expect(runtime).toContain("visualAssetSelection.provenance?.base");
    expect(runtime).toContain("visualAssetSelection.provenance?.stars");
    expect(staging).toContain("existing-cache-only-no-new-visual-network-download");
    expect(staging).not.toContain("fetch(");
  });
});
