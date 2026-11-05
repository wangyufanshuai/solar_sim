import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  normalizeMeasuredVisibleThroughputV383,
  parseMeasuredVisibleThroughputArtifactV383,
} from "./measuredVisibleThroughputV383";

describe("v383 measured visible throughput normalization", () => {
  it("extracts the exact 4000–7000 Angstrom profile without interpolation", () => {
    const xml = readFileSync(
      "dist/staging/measured-authority-v382-visible/raw/svo-hst-wfc3-uvis1-f350lp.xml",
      "utf8",
    );
    const result = normalizeMeasuredVisibleThroughputV383(xml);
    expect(result.rows).toHaveLength(3301);
    expect(result.rows[0]).toMatchObject({
      wavelengthAngstrom: 4000,
      throughput: 0.248104,
    });
    expect(result.rows.at(-1)).toMatchObject({
      wavelengthAngstrom: 7000,
      throughput: 0.256034,
    });
    expect(result.metrics.interpolationApplied).toBe(false);
    expect(result.metrics.duplicateWavelengthCount).toBe(0);
  });

  it("keeps the normalized candidate outside measured authority", () => {
    const artifact = parseMeasuredVisibleThroughputArtifactV383(
      JSON.parse(
        readFileSync(
          "dist/science/measured-visible-throughput-v383/manifest.json",
          "utf8",
        ),
      ),
    );
    expect(artifact.dualImplementation.qualified).toBe(true);
    expect(artifact.authorityBoundary.normalizedCandidateQualified).toBe(true);
    expect(artifact.authorityBoundary.visibleMeasuredAuthorityGranted).toBe(false);
    expect(artifact.authorityBoundary.observedCountsAvailable).toBe(false);
  });
});
