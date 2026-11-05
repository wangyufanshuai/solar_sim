import { describe, expect, it } from "vitest";
import { validateKerrGeometryQualificationV292, type KerrGeometryQualificationV292 } from "./kerrAuthorityV291";

describe("v291-v293 corrected Kerr contracts", () => {
  it("accepts a fail-closed geometry qualification", () => {
    const value: KerrGeometryQualificationV292 = {
      version: "v292-kerr-geometry-redshift-short-gate-v1",
      status: "geometry-redshift-failed",
      geometryRedshiftQualified: false,
      polarizationStatus: "blocked-by-geometry",
      fullKerrAuthorityQualified: false,
      executionCount: 128,
      criticalBracketCount: 40,
      evidenceSha256: "a".repeat(64),
    };
    expect(validateKerrGeometryQualificationV292(value)).toBe(true);
  });

  it("rejects a full qualification before polarization", () => {
    const invalid = {
      version: "v292-kerr-geometry-redshift-short-gate-v1",
      status: "geometry-redshift-qualified",
      geometryRedshiftQualified: true,
      polarizationStatus: "polarization-pending",
      fullKerrAuthorityQualified: true,
      executionCount: 128,
      criticalBracketCount: 40,
      evidenceSha256: "b".repeat(64),
    } as unknown as KerrGeometryQualificationV292;
    expect(validateKerrGeometryQualificationV292(invalid)).toBe(false);
  });
});
