import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSciencePhotonProvenanceV331, serializeKerrSciencePhotonProvenanceCsvV331 } from "./kerrSciencePhotonProvenanceV331";

describe("v331 generated photon provenance artifact", () => {
  it("contains exactly twelve sanitized detector-independent rows", () => {
    const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-photon-provenance-v331/provenance-reference.json"), "utf8"));
    const provenance = parseKerrSciencePhotonProvenanceV331(artifact.provenance);
    expect(artifact.version).toBe("v331-kerr-science-photon-provenance-artifact-v1");
    expect(artifact.artifactSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(provenance.rows).toHaveLength(12);
    expect(provenance.source.denseAggregateSha256).toBeNull();
    expect(serializeKerrSciencePhotonProvenanceCsvV331(provenance).trim().split("\n")).toHaveLength(13);
  });
});
