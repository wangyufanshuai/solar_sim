import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrThinDiskBandImagingViewV320 } from "./kerrThinDiskBandImagingV320";
import { KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328, createKerrSciencePhotonBandViewV328, parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";

const artifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json"), "utf8"));
const source = parseKerrThinDiskBandImagingViewV320(artifact.view);

describe("v328 fixed-band photon radiance", () => {
  it("derives detector-independent photon observables with a fixed two-grid audit", () => {
    const first = createKerrSciencePhotonBandViewV328(source);
    const second = createKerrSciencePhotonBandViewV328(source);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(parseKerrSciencePhotonBandViewV328(first)).toBe(first);
    expect(first).toMatchObject({
      status: "qualified-fixed-band-photon-radiance",
      counts: { applicableDiskRayCount: 4, bandMeasurementCount: 12, unavailableRayCount: 12 },
      detectorAssumption: "per-unit-area-per-unit-solid-angle-no-throughput-no-collecting-area-no-exposure-time",
      scienceCinematicBoundary: "photon-observables-read-only-not-cinematic-color-input",
      source: { denseAggregateSha256: null },
    });
    expect(first.maxima.photonQuadratureRelativeDifference).toBeLessThan(KERR_SCIENCE_PHOTON_QUADRATURE_LIMIT_V328);
    expect(first.minima.photonRadiancePerSM2Sr).toBeGreaterThan(0);
    for (const ray of first.rays) for (const measurement of ray.measurements) {
      expect(measurement.meanObservedFrequencyHz).toBeGreaterThanOrEqual(measurement.bandLowerFrequencyHz);
      expect(measurement.meanObservedFrequencyHz).toBeLessThanOrEqual(measurement.bandUpperFrequencyHz);
      expect(measurement.observedEnergyRadianceWM2Sr / measurement.observedPhotonRadiancePerSM2Sr).toBeCloseTo(measurement.meanObservedPhotonEnergyJ, 14);
    }
  });

  it("fails closed on a nonphysical fixed-band source", () => {
    const changed = structuredClone(source);
    const disk = changed.samples.find((sample) => sample.applicable);
    if (!disk?.bands) throw new Error("fixture-disk-ray-missing");
    (disk.bands[0] as { observedBandRadianceWM2Sr: number }).observedBandRadianceWM2Sr = 0;
    expect(() => createKerrSciencePhotonBandViewV328(changed)).toThrow();
  });
});
