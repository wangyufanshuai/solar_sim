import { describe, expect, it } from "vitest";
import { canonicalOrbitRelativityEngineImportV561, parseOrbitRelativityEngineApiV561, parseOrbitRelativityEngineImportV561 } from "./orbitRelativityEngineV561";

const artifact = {
  version: "v1-orbit-atlas-engine-import-v561",
  status: "qualified-cpu-reference-engine-measured-unavailable-grmhd-unavailable",
  sourceProject: "../../orbit-relativity-engine",
  sourceEngineVersion: "v1-kerr-reference",
  canonicalSerialization: "orbit-canonical-json-v1-number-e16",
  sourceManifestSha256: "a".repeat(64),
  sourceManifestFileSha256: "b".repeat(64),
  sourceConfigCanonicalSha256: "c".repeat(64),
  sourceEngineSourceSha256: "c".repeat(64),
  sourceEngineSourceManifest: [],
  importedFiles: ["engine-manifest.json", "summary.json", "observables.fits", "image.png"].map((path) => ({ path, bytes: 10, sha256: "d".repeat(64) })),
  summary: { metric: "kerr", spin: "0.9", observer: { radiusM: "50" }, counts: { rayCount: 5, frequencyCount: 3 }, benchmarks: { schwarzschildPhotonSphereRadiusM: 3 }, rayCount: 5 },
  qualification: { cpuAuthority: true, gpuShadow: false, measuredAuthority: false, denseImage: false, grmhd: false, webConsumerAllowed: true },
  boundary: { formalProductPointer: "v263", defaultKernel: "legacy-eih-1pn", sciencePayloadImmutable: true, cinematicWritebackForbidden: true, transportStatus: "blocked-not-yet-promoted", radiativeTransferStatus: "blocked-no-plasma-model" },
  sourceManifest: ["engine-manifest.json", "summary.json", "observables.fits", "image.png"].map((path) => ({ path, bytes: 10, sha256: "d".repeat(64) })),
  sourceSha256: "e".repeat(64),
};

describe("Orbit Relativity Engine V561 contract", () => {
  it("parses CPU-only, measured-unavailable artifact", () => {
    const parsed = parseOrbitRelativityEngineImportV561({ ...artifact, artifactSha256: "f".repeat(64) });
    expect(parsed.qualification.measuredAuthority).toBe(false);
    expect(parsed.boundary.formalProductPointer).toBe("v263");
  });

  it("rejects a GRMHD promotion mutation", () => {
    expect(() => parseOrbitRelativityEngineImportV561({ ...artifact, artifactSha256: "f".repeat(64), qualification: { ...artifact.qualification, grmhd: true } })).toThrow();
  });

  it("parses unavailable API boundary", () => {
    expect(parseOrbitRelativityEngineApiV561({ version: "v1-orbit-atlas-engine-api-v561", available: false, reason: "local-shadow-only", summary: null }).available).toBe(false);
  });

  it("uses deterministic canonical text", () => {
    expect(canonicalOrbitRelativityEngineImportV561(artifact)).toBe(canonicalOrbitRelativityEngineImportV561(artifact));
  });
});
