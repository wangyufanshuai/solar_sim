import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import {
  KERR_SCIENCE_INSTRUMENT_RESPONSE_QUADRATURE_LIMIT_V332,
  KERR_SYNTHETIC_REFERENCE_INSTRUMENT_V332,
  createKerrScienceInstrumentResponseV332,
  parseKerrScienceInstrumentResponseV332,
  SQUARE_ARCSECOND_STERADIANS_V332,
} from "./kerrScienceInstrumentResponseV332";

const photonArtifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"), "utf8"));

describe("v332 explicit synthetic instrument response", () => {
  it("keeps detector-independent radiance separate and proves bounded throughput convergence", () => {
    const view = parseKerrSciencePhotonBandViewV328(photonArtifact.view);
    const response = parseKerrScienceInstrumentResponseV332(createKerrScienceInstrumentResponseV332(view));
    expect(response.model).toMatchObject({ modelId: "synthetic-reference-photon-counter-v332", collectingAreaM2: 0.75, exposureTimeS: 120, stochasticNoise: "disabled" });
    expect(response.model.pixelSolidAngleSr).toBe(SQUARE_ARCSECOND_STERADIANS_V332);
    expect(response.counts).toEqual({ rayCount: 4, bandMeasurementCount: 12 });
    expect(response.rows).toHaveLength(12);
    expect(response.rows.every((row) => row.effectiveBandThroughput > 0 && row.effectiveBandThroughput < 1)).toBe(true);
    expect(response.maxima.quadratureRelativeDifference).toBeLessThan(KERR_SCIENCE_INSTRUMENT_RESPONSE_QUADRATURE_LIMIT_V332);
    expect(response.rows.every((row) => row.detectorIndependentPhotonRadiancePerSM2Sr > row.throughputWeightedPhotonRadiancePerSM2Sr)).toBe(true);
    expect(response.source.denseAggregateSha256).toBeNull();
    expect(response.interpretation).toContain("not-measured-counts");
    expect(KERR_SYNTHETIC_REFERENCE_INSTRUMENT_V332.detectorEffects).toContain("no-read-noise");
  });
});
