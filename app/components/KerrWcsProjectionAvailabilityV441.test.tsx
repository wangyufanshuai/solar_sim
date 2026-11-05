import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrWcsProjectionOracleV441 } from "../lib/kerrWcsProjectionAvailabilityV441";

describe("v441 WCS projection panel", () => {
  it("keeps coordinate visualization separate from detector image authority", () => {
    const oracle = parseKerrWcsProjectionOracleV441(
      JSON.parse(
        readFileSync(
          "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-oracle.json",
          "utf8",
        ),
      ),
    );
    expect(oracle.contract.wcsAuthority.coordinateTransformAvailable).toBe(true);
    expect(oracle.contract.detectorProjection.measuredGeometryAvailable).toBe(false);
    expect(oracle.contract.detectorProjection.psfAvailable).toBe(false);
    expect(oracle.contract.scienceRenderer.rasterizationForbidden).toBe(true);
    expect(oracle.contract.cinematicRenderer.mayClaimDetectorImage).toBe(false);
  });
});
