import { describe, expect, it } from "vitest";
import {
  SCIENTIFIC_DATA_SNAPSHOT_VERSION,
  validateScientificDataSnapshotManifest,
  type ScientificDataSnapshotManifest,
} from "./scientificDataSnapshot";

describe("v147 reproducible scientific data snapshots", () => {
  it("requires checksums and provenance for every build-time source", () => {
    const manifest: ScientificDataSnapshotManifest = {
      version: SCIENTIFIC_DATA_SNAPSHOT_VERSION,
      generatedAt: "2026-07-13T00:00:00.000Z",
      temporaryDataLimitBytes: 2_147_483_648,
      runtimePolicy: "build-time-network-runtime-offline",
      entries: [{
        id: "gaia-ap-v2",
        source: "Gaia DR3",
        sourceUrl: "https://gea.esac.esa.int/tap-server/tap",
        query: "select source_id from gaiadr3.astrophysical_parameters",
        retrievedAt: "2026-07-13T00:00:00.000Z",
        schemaVersion: 2,
        rowCount: 200_000,
        fields: ["source_id"],
        rawSha256: "a".repeat(64),
        outputSha256: "b".repeat(64),
        license: "ESA Gaia archive terms",
        citation: "Gaia Collaboration DR3",
        transform: "deterministic source_id join",
      }],
    };
    expect(validateScientificDataSnapshotManifest(manifest)).toEqual([]);
    expect(validateScientificDataSnapshotManifest({ ...manifest, entries: [{ ...manifest.entries[0], rawSha256: "" }] })).toContain("invalid-raw-checksum:gaia-ap-v2");
  });
});

