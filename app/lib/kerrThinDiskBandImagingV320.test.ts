import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_THIN_DISK_BAND_QUADRATURE_LIMIT_V320,
  KERR_THIN_DISK_FIXED_BANDS_V320,
  createKerrThinDiskBandImagingViewV320,
  createKerrThinDiskCinematicBandPreviewV320,
  parseKerrThinDiskBandImagingViewV320,
} from "./kerrThinDiskBandImagingV320";

const spectrumArtifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-thin-disk-v319/sparse-spectrum.json"), "utf8"));

describe("v320 fixed-band Kerr science imaging", () => {
  it("integrates three fixed disjoint bands for exactly four authority disk rays", () => {
    const view = createKerrThinDiskBandImagingViewV320(spectrumArtifact.view);
    expect(parseKerrThinDiskBandImagingViewV320(structuredClone(view))).toEqual(view);
    expect(view.counts).toMatchObject({ sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12, explicitSaturationFlagCount: 12 });
    expect(view.definitions).toEqual(KERR_THIN_DISK_FIXED_BANDS_V320);
    expect(view.definitions[0].upperFrequencyHz).toBeLessThan(view.definitions[1].lowerFrequencyHz);
    expect(view.definitions[1].upperFrequencyHz).toBe(view.definitions[2].lowerFrequencyHz);
    expect(view.samples.filter((sample) => sample.applicable)).toHaveLength(4);
    expect(view.samples.filter((sample) => !sample.applicable).every((sample) => sample.bands === null && sample.falseColor === null)).toBe(true);
    for (const sample of view.samples.filter((entry) => entry.applicable)) {
      expect(sample.bands).toHaveLength(3);
      expect(sample.coveredBolometricFraction).toBeGreaterThan(0.99);
      expect(sample.coveredBolometricFraction).toBeLessThanOrEqual(1);
      for (const band of sample.bands ?? []) {
        expect(band.observedBandRadianceWM2Sr).toBeGreaterThan(0);
        expect(band.quadratureRelativeDifference).toBeLessThan(KERR_THIN_DISK_BAND_QUADRATURE_LIMIT_V320);
        expect(band.saturated).toBe(band.normalizedLinearUnclipped > 1);
      }
    }
  });

  it("uses a fixed physical reference and never derives normalization from the sample set", () => {
    const view = createKerrThinDiskBandImagingViewV320(spectrumArtifact.view);
    expect(view.normalizationPolicy).toBe("fixed-physical-reference-no-data-adaptive-rescale");
    for (const sample of view.samples.filter((entry) => entry.applicable)) {
      sample.bands?.forEach((band, index) => {
        expect(band.fixedReferenceRadianceWM2Sr).toBe(KERR_THIN_DISK_FIXED_BANDS_V320[index].referenceRadianceWM2Sr);
        expect(band.normalizedLinearUnclipped).toBeCloseTo(band.observedBandRadianceWM2Sr / band.fixedReferenceRadianceWM2Sr, 14);
      });
    }
  });

  it("keeps cinematic decoration on a copied display encoding and preserves exact SI values", () => {
    const view = createKerrThinDiskBandImagingViewV320(spectrumArtifact.view);
    const sample = view.samples.find((entry) => entry.applicable);
    expect(sample).toBeDefined();
    const before = JSON.stringify(sample);
    const first = createKerrThinDiskCinematicBandPreviewV320(sample!, 0x51c1e);
    const second = createKerrThinDiskCinematicBandPreviewV320(sample!, 0x51c1e);
    expect(first).toEqual(second);
    expect(first.sourcePhysicalValuesIncluded).toBe(false);
    expect(JSON.stringify(sample)).toBe(before);
    expect(first.presentationLinearRgb).not.toBe(sample?.falseColor?.linearRgbClipped);
  });

  it("fails closed on adaptive normalization, hidden dense authority, or altered definitions", () => {
    const view = createKerrThinDiskBandImagingViewV320(spectrumArtifact.view);
    expect(() => parseKerrThinDiskBandImagingViewV320({ ...view, normalizationPolicy: "per-frame-max" }))
      .toThrow("v320-band-view-identity");
    expect(() => parseKerrThinDiskBandImagingViewV320({ ...view, source: { ...view.source, denseAggregateSha256: "a".repeat(64) } }))
      .toThrow("v320-band-view-identity");
    const definitions = view.definitions.map((definition, index) => index === 0 ? { ...definition, referenceRadianceWM2Sr: 1 } : definition);
    expect(() => parseKerrThinDiskBandImagingViewV320({ ...view, definitions })).toThrow("v320-band-view-conservation");
  });
});
