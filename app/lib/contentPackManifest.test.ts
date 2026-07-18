import { describe, expect, it } from "vitest";
import { validateContentPackManifest } from "./contentPackManifest";
import type { ContentPackManifest } from "./atlasReleaseProgram";

const manifest: ContentPackManifest = {
  schemaVersion: 1,
  id: "core",
  version: "1.0.0",
  appCompatibility: { minimum: "1.0.0", maximumExclusive: "2.0.0" },
  qualityTier: "required",
  compressedBytes: 1,
  installedBytes: 10,
  files: [{ path: "catalog.sqlite", bytes: 10, sha256: "a".repeat(64), source: "Gaia DR3", license: "source-manifest" }],
};

describe("v132 content pack manifest", () => {
  it("accepts versioned safe checksum content", () => {
    expect(validateContentPackManifest(manifest)).toEqual([]);
  });
  it("rejects traversal and invalid checksums", () => {
    expect(validateContentPackManifest({ ...manifest, files: [{ ...manifest.files[0], path: "../outside", sha256: "bad" }] })).toEqual(expect.arrayContaining(["invalid-checksum", "unsafe-path"]));
  });
  it("accepts the frozen descriptive runtime-codecs version token", () => {
    expect(validateContentPackManifest({
      ...manifest,
      id: "runtime-codecs",
      version: "v160-three-r170-basis",
    })).toEqual([]);
  });
});
