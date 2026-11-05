import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319,
  parseKerrThinDiskBandImagingViewV320,
} from "./kerrThinDiskBandImagingV320";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generatedAt" && key !== "artifactSha256")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

describe("v320 generated fixed-band imaging artifact", () => {
  it("is canonical, source locked and remains a four-ray sparse product", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8"));
    expect(artifact.version).toBe("v320-kerr-thin-disk-fixed-band-artifact-v1");
    expect(artifact.artifactSha256).toBe(createHash("sha256").update(JSON.stringify(canonicalize(artifact))).digest("hex"));
    expect(artifact.source.canonicalSha256).toBe(KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319);
    const view = parseKerrThinDiskBandImagingViewV320(artifact.view);
    expect(view.counts).toMatchObject({ sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12, explicitSaturationFlagCount: 12 });
    expect(artifact.boundary).toBe("immutable-fixed-band-sparse-science-product-no-dense-or-product-promotion");
  });
});
