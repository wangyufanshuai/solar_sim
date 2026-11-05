import { describe, expect, it } from "vitest";
import { parseAtlasVisualAssetManifestV274 } from "./atlasVisualAssetManifestV274";

const sha = "a".repeat(64);
const manifest = () => ({
  version: "science-cinematic-v3-v274-assets-v1",
  id: "science-cinematic-v3-v274-assets",
  generatedAt: "2026-07-20T00:00:00Z",
  canonicalSha256: sha,
  installedBytes: 10,
  installedLimitBytes: 2 * 1024 ** 3,
  temporaryWorkingSetLimitBytes: 8 * 1024 ** 3,
  minimumFreeDiskBytes: 30 * 1024 ** 3,
  runtimePolicy: "local-shadow-intent-only-no-formal-or-lite-default",
  entries: [{
    id: "milky-way-mobile",
    group: "sky/backdrop",
    sourceUrl: "https://svs.gsfc.nasa.gov/4851/",
    downloadedAt: "2026-07-20T00:00:00Z",
    originalPath: ".cache/source.exr",
    originalBytes: 20,
    originalSha256: sha,
    outputPath: "textures/sky/output.jpg",
    outputBytes: 10,
    outputSha256: sha,
    tier: "mobile-2k",
    format: "jpg",
    derivedParameters: { width: 2048 },
    license: { id: "NASA-public-domain", status: "approved-runtime", termsUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/", attributionRequired: false },
  }],
  stagedExcluded: [],
});

describe("v274 visual asset manifest", () => {
  it("accepts bounded licensed local-shadow assets", () => {
    expect(parseAtlasVisualAssetManifestV274(manifest()).entries).toHaveLength(1);
  });

  it("rejects an unclear license and a budget overflow", () => {
    const unclear = manifest();
    unclear.entries[0]!.license.status = "unconfirmed" as "approved-runtime";
    expect(() => parseAtlasVisualAssetManifestV274(unclear)).toThrow(/approved license/);
    const overflow = manifest();
    overflow.installedBytes = overflow.installedLimitBytes + 1;
    expect(() => parseAtlasVisualAssetManifestV274(overflow)).toThrow(/budget/);
  });
});
