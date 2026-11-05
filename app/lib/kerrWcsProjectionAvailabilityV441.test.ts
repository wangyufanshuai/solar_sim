import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrWcsProjectionSummaryV441,
  parseKerrWcsProjectionOracleV441,
} from "./kerrWcsProjectionAvailabilityV441";

const oracle = JSON.parse(
  readFileSync(
    "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-oracle.json",
    "utf8",
  ),
);

describe("v441 WCS projection availability", () => {
  it("qualifies the linear WCS while keeping detector projection blocked", () => {
    const parsed = parseKerrWcsProjectionOracleV441(oracle);
    const summary = createKerrWcsProjectionSummaryV441(parsed);
    expect(summary.rows).toHaveLength(4);
    expect(summary.counts).toMatchObject({
      joinedSourceCoordinateRowCount: 24,
      detectorGeometryCount: 0,
      psfModelCount: 0,
      detectorProjectionCount: 0,
      rasterProductCount: 0,
    });
    expect(summary.maxima.pythonAstropyPixelDifference).toBe(0);
    expect(summary.maxima.sourceCoordinateJoinResidualPixel).toBeLessThan(1e-12);
    expect(summary.boundary).toMatchObject({
      wcsCoordinateAuthority: true,
      detectorProjectionBlocked: true,
      rasterizationBlocked: true,
      denseAuthority: false,
    });
  });

  it("rejects a synthesized detector projection", () => {
    expect(() =>
      parseKerrWcsProjectionOracleV441({
        ...oracle,
        counts: { ...oracle.counts, detectorProjectionCount: 1 },
      }),
    ).toThrow("v441-oracle-identity");
  });
});
