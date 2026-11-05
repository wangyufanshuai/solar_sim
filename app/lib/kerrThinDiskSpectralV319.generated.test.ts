import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrThinDiskSpectralViewV319 } from "./kerrThinDiskSpectralV319";

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => key !== "generatedAt" && key !== "artifactSha256")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

describe("v319 generated sparse spectrum artifact", () => {
  it("is canonical, source-locked and remains a four-ray sparse product", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v319/sparse-spectrum.json"), "utf8"));
    expect(artifact.version).toBe("v319-kerr-thin-disk-spectral-artifact-v1");
    expect(artifact.artifactSha256).toBe(createHash("sha256").update(JSON.stringify(canonicalize(artifact))).digest("hex"));
    expect(artifact.sourceFiles).toEqual({
      geometry: "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91",
      polarization: "b102cff3adcd9f5c0f4b6e51c9a05e6baaa2516b21d7fa816ed86dbe6f0ec12b",
      rayPlan: "a19598c89d98172850fb6faf0b5b00fbe3e369bda409abea7d7b76b431b0906c",
    });
    expect(parseKerrThinDiskSpectralViewV319(artifact.view).counts).toEqual({ sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12 });
    expect(artifact.boundary).toBe("immutable-derived-sparse-spectrum-no-dense-or-product-promotion");
  });
});
