import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrThinDiskBandImagingViewV320 } from "./kerrThinDiskBandImagingV320";
import {
  KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325,
  createKerrScienceBandUncertaintyViewV325,
  parseKerrScienceBandUncertaintyViewV325,
} from "./kerrScienceBandUncertaintyV325";

const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8"));
const source = parseKerrThinDiskBandImagingViewV320(artifact.view);

describe("v325 componentwise Science band uncertainty", () => {
  it("builds deterministic linear audit envelopes without an RSS or confidence claim", () => {
    const first = createKerrScienceBandUncertaintyViewV325(source);
    const second = createKerrScienceBandUncertaintyViewV325(source);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(parseKerrScienceBandUncertaintyViewV325(first)).toBe(first);
    expect(first).toMatchObject({
      status: "qualified-componentwise-audit-envelope",
      counts: { applicableDiskRayCount: 4, bandMeasurementCount: 12, unavailableRayCount: 12 },
      combinationPolicy: "linear-sum-without-independence-claim-no-rss",
      interpretation: "deterministic-reproducibility-audit-envelope-not-statistical-confidence-interval",
      source: { denseAggregateSha256: null },
    });
    expect(first.maxima.conservativeLinearRelativeEnvelope).toBeGreaterThan(0);
    expect(first.maxima.conservativeLinearRelativeEnvelope).toBeLessThan(KERR_SCIENCE_BAND_UNCERTAINTY_LIMIT_V325);
    expect(first.maxima.geometryRadiusDifferenceM).toBeLessThan(2e-12);
    for (const ray of first.rays) for (const measurement of ray.measurements) {
      expect(measurement.lowerAuditEnvelopeWM2Sr).toBeLessThanOrEqual(measurement.observedBandRadianceWM2Sr);
      expect(measurement.upperAuditEnvelopeWM2Sr).toBeGreaterThanOrEqual(measurement.observedBandRadianceWM2Sr);
      expect(measurement.components.geometryRadiusDifferenceM).toBeGreaterThan(0);
    }
  });

  it("fails closed when an applicable component is unavailable", () => {
    const changed = structuredClone(source);
    const disk = changed.samples.find((sample) => sample.applicable);
    if (!disk) throw new Error("fixture-disk-ray-missing");
    (disk.sourceErrorBudget as { pageThorneQuadratureRelative: number | null }).pageThorneQuadratureRelative = null;
    expect(() => createKerrScienceBandUncertaintyViewV325(changed)).toThrow("v325-disk-quadrature-unavailable");
  });
});
