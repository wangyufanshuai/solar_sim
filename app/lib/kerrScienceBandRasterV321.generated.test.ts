import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320 } from "./kerrThinDiskBandImagingV320";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generatedAt" && key !== "artifactSha256")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

describe("v321 generated runtime band raster", () => {
  it("locks the exact RGBA bytes and immutable source digests without claiming dense authority", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-band-raster-v321/manifest.json"), "utf8"));
    const raster = readFileSync(resolve(process.cwd(), "dist/science/kerr-science-band-raster-v321/sparse-fixed-band.rgba"));
    expect(manifest.version).toBe("v321-kerr-science-band-raster-artifact-v1");
    expect(manifest.artifactSha256).toBe(createHash("sha256").update(JSON.stringify(canonicalize(manifest))).digest("hex"));
    expect(manifest.sources.bandArtifactCanonicalSha256).toBe(KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320);
    expect(manifest.raster.fileSha256).toBe(createHash("sha256").update(raster).digest("hex"));
    expect(raster.byteLength).toBe(256 * 256 * 4);
    expect(manifest.raster).toMatchObject({
      version: "v321-kerr-fixed-band-sparse-science-raster-v1",
      summary: { sampleCount: 16, fixedBandColoredDiskRayCount: 4, fixedBandCount: 3 },
      boundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
    });
    expect(manifest.integrity).toMatchObject({ payloadUnchanged: true, bandViewUnchanged: true, rasterBufferDisjoint: true, cinematicBufferShared: false, denseBoundary: "sparse-authority-dense-incomplete" });
    expect(manifest.boundary).toBe("reproducible-sparse-fixed-band-runtime-raster-not-dense-science-image");
  });
});
