import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrSparseSciencePayloadV474,
  createKerrSparseSciencePayloadSummaryV474,
  parseKerrSparseSciencePayloadArtifactV474,
} from "./kerrSparseSciencePayloadV474";

const input = JSON.parse(
  readFileSync("dist/science/kerr-sparse-science-payload-v474/sparse-payload.json", "utf8"),
);
const sha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrSparseSciencePayloadV474(value)).digest("hex");

describe("v474 sparse Science payload", () => {
  it("parses the canonical artifact, payload and four row SHAs", () => {
    const artifact = parseKerrSparseSciencePayloadArtifactV474(input);

    expect(sha(artifact)).toBe(artifact.artifactSha256);
    expect(sha(artifact.rows)).toBe(artifact.payloadSha256);
    expect(artifact.rows.map((row) => sha(row))).toEqual(
      artifact.rows.map((row) => row.rowSha256),
    );
    expect(Object.isFrozen(artifact)).toBe(true);
  });

  it("atomically joins four exact disk-ray keys and 28 uncertainty references", () => {
    const artifact = parseKerrSparseSciencePayloadArtifactV474(input);

    expect(artifact.rows.map((row) => row.rayId)).toEqual([
      "disk-00",
      "disk-01",
      "disk-02",
      "disk-03",
    ]);
    expect(artifact.rows.flatMap((row) => row.uncertainty)).toHaveLength(28);
    expect(artifact.join).toMatchObject({
      joinedRowCount: 4,
      exactJoinKeyCount: 4,
      duplicateJoinKeyCount: 0,
      missingJoinKeyCount: 0,
      classificationMismatchCount: 0,
      spinMismatchCount: 0,
      redshiftMismatchCount: 0,
      evpaMismatchCount: 0,
      coordinateMismatchCount: 0,
      atomicJoinCommitted: true,
      partialJoinPublished: false,
    });
  });

  it("keeps continuous coordinates, orientation basis and unavailable measurements distinct", () => {
    const artifact = parseKerrSparseSciencePayloadArtifactV474(input);

    for (const row of artifact.rows) {
      expect(row.geometry.classification).toBe("disk-hit");
      expect(row.polarization.orientationQHat ** 2 + row.polarization.orientationUHat ** 2).toBeCloseTo(
        1,
        12,
      );
      expect(row.coordinate.pixelSample).toBeNull();
      expect(row.coordinate.interpolationAllowed).toBe(false);
      expect(row.polarization.polarizationAmplitude).toBeNull();
      expect(row.polarization.stokesI).toBeNull();
      expect(row.radiometry.intensity).toBeNull();
    }
    expect(artifact.qualification).toMatchObject({
      sparseAuthorityQualified: true,
      denseAuthorityQualified: false,
      productionPayloadQualified: false,
      scienceRasterQualified: false,
    });
  });

  it("keeps the API summary bounded", () => {
    const summary = createKerrSparseSciencePayloadSummaryV474(input);
    expect(new TextEncoder().encode(JSON.stringify(summary)).byteLength).toBeLessThanOrEqual(
      128 * 1024,
    );
  });
});
