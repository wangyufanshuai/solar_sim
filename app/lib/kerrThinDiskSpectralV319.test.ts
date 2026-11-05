import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import {
  KERR_THIN_DISK_DEFAULT_SCENARIO_V319,
  createKerrThinDiskSpectralViewV319,
  parseKerrThinDiskSpectralViewV319,
  resolveKerrThinDiskPhysicalScaleV319,
} from "./kerrThinDiskSpectralV319";
import { cloneKerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8"));
const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));

function payload() {
  const geometryView = createKerrScienceGeometrySourceViewV315(geometry);
  const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
  const rayView = createKerrCanonicalRayViewV315(plan);
  return createSparseKerrSciencePayloadV315(geometryView, polarizationView, rayView);
}

describe("v319 Page-Thorne sparse spectrum", () => {
  it("derives physical spectral intensity for only four authority disk rays", () => {
    const view = createKerrThinDiskSpectralViewV319(payload());
    expect(parseKerrThinDiskSpectralViewV319(structuredClone(view))).toEqual(view);
    expect(view).toMatchObject({
      status: "qualified-sparse-derived-spectrum",
      authority: {
        fullShortAuthoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
        denseAggregateSha256: null,
      },
      scenario: KERR_THIN_DISK_DEFAULT_SCENARIO_V319,
      counts: { sampleCount: 16, applicableDiskRayCount: 4, unavailableRayCount: 12 },
      uncertaintyCombination: "componentwise-no-rss-no-scalar-total",
      displayBoundary: "science-linear-physical-values-cinematic-must-not-mutate",
      boundary: "four-authority-disk-rays-derived-spectrum-not-dense-image",
    });
    expect(view.samples.filter((sample) => sample.applicable)).toHaveLength(4);
    expect(view.samples.filter((sample) => !sample.applicable).every((sample) => sample.observedSpectralRadiance === null)).toBe(true);
    for (const sample of view.samples.filter((entry) => entry.applicable)) {
      expect(sample.localFluxWM2).toBeGreaterThan(0);
      expect(sample.effectiveTemperatureK).toBeGreaterThan(1);
      expect(sample.emittedFrequencyHz).toBeGreaterThan(0);
      expect(sample.emittedSpectralRadiance).toBeGreaterThan(0);
      expect(sample.observedSpectralRadiance).toBeGreaterThan(0);
      expect(sample.observedBolometricIntensity).toBeGreaterThan(0);
      expect(sample.liouvilleInvariantRelativeResidual).toBeLessThan(1e-12);
      expect(sample.errorBudget.diskQuadratureRelative).toBeLessThan(5e-4);
      expect(sample.errorBudget.formulaSpectralRelative).toBeLessThan(0.02);
    }
  });

  it("uses signed-spin ISCO efficiency and bounded Eddington accretion scaling", () => {
    const retrograde = resolveKerrThinDiskPhysicalScaleV319(-0.9, KERR_THIN_DISK_DEFAULT_SCENARIO_V319);
    const prograde = resolveKerrThinDiskPhysicalScaleV319(0.9, KERR_THIN_DISK_DEFAULT_SCENARIO_V319);
    expect(retrograde.blackHoleMassKg).toBe(prograde.blackHoleMassKg);
    expect(retrograde.gravitationalRadiusM).toBe(prograde.gravitationalRadiusM);
    expect(prograde.radiativeEfficiency).toBeGreaterThan(retrograde.radiativeEfficiency);
    expect(retrograde.accretionRateKgS).toBeGreaterThan(prograde.accretionRateKgS);
  });

  it("fails closed on stale authority, hidden dense state and invalid scenarios", () => {
    const source = payload();
    expect(() => createKerrThinDiskSpectralViewV319({ ...source, geometryEvidenceSha256: "a".repeat(64) }))
      .toThrow("v319-current-sparse-authority-boundary");
    expect(() => createKerrThinDiskSpectralViewV319({ ...source, denseCampaignComplete: true, denseAggregateSha256: "a".repeat(64) }))
      .toThrow();
    expect(() => createKerrThinDiskSpectralViewV319(source, { ...KERR_THIN_DISK_DEFAULT_SCENARIO_V319, colorCorrection: 1.7 as 1 }))
      .toThrow("v319-scenario-boundary");
  });

  it("detects redshift or formula drift through the componentwise spectrum budget", () => {
    const source = cloneKerrScienceTransferPayloadV299(payload());
    const diskIndex = [...source.classification].findIndex((value) => value === 3);
    source.kerrSchildRedshiftFactor[diskIndex] *= 1.05;
    source.geometryRedshiftDifference[diskIndex] = Math.abs(source.redshiftFactor[diskIndex] - source.kerrSchildRedshiftFactor[diskIndex]);
    expect(() => createKerrThinDiskSpectralViewV319(source)).toThrow();
  });

  it("keeps the scientific scope explicit and excludes stochastic/cinematic transforms", () => {
    const source = readFileSync(resolve(process.cwd(), "app/lib/kerrThinDiskSpectralV319.ts"), "utf8");
    expect(source).toContain("page-thorne-zero-torque-at-isco");
    expect(source).toContain("no-grmhd-or-plasma-transfer");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("bloom");
    expect(source).not.toContain("sampleAtlasCinematicDetailV299");
  });
});
