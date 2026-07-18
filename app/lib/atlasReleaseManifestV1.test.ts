import { describe, expect, it } from "vitest";
import { createAtlasReleaseManifestV1 } from "./atlasReleaseManifestV1";

describe("Atlas public release manifest V1", () => {
  it("keeps downloads immutable and science shadow-retained", () => {
    const manifest = createAtlasReleaseManifestV1();
    expect(manifest.defaultScientificKernel).toBe("legacy-eih-1pn");
    expect(manifest.shadowScientificModels).toBe(true);
    expect(manifest.artifacts).toHaveLength(9);
    expect(manifest.artifacts.every((artifact) => artifact.immutable && artifact.rangeRequests)).toBe(true);
    expect(manifest.artifacts.every((artifact) => artifact.url.includes("/orbit-atlas/1.0.0/"))).toBe(true);
  });

  it("rejects a non-HTTPS public download origin", () => {
    expect(() => createAtlasReleaseManifestV1({ downloadOrigin: "http://example.test" })).toThrow("HTTPS");
  });
});
