import { describe, expect, it } from "vitest";
import {
  FRW_REDSHIFT_ANCHORS,
  PLANCK_2018_FLAT_LCDM_PARAMS,
  ageAtRedshiftGyr,
  angularDiameterDistanceMpc,
  comovingDistanceMpc,
  createFrwCosmologyValidationSummary,
  distanceModulusMag,
  hubbleParameterKmSmpc,
  lookbackTimeGyr,
  luminosityDistanceMpc,
  scaleFactorForRedshift,
  validateFrwCosmologyParams,
} from "./frwCosmologyValidation";

describe("FRW LCDM cosmology validation", () => {
  it("pins the Planck 2018 flat LCDM preset", () => {
    expect(PLANCK_2018_FLAT_LCDM_PARAMS).toMatchObject({
      presetId: "planck2018-flat-lcdm",
      source: "planck-2018",
      h0KmSmpc: 67.4,
      omegaMatter: 0.315,
      omegaLambda: 0.685,
      omegaCurvature: 0,
    });
    expect(validateFrwCosmologyParams(PLANCK_2018_FLAT_LCDM_PARAMS).valid).toBe(true);
  });

  it("computes H(z=0)=H0 and a(z)=1/(1+z)", () => {
    expect(hubbleParameterKmSmpc(0)).toBeCloseTo(PLANCK_2018_FLAT_LCDM_PARAMS.h0KmSmpc, 12);
    expect(scaleFactorForRedshift(0)).toBe(1);
    expect(scaleFactorForRedshift(1)).toBe(0.5);
    expect(scaleFactorForRedshift(10)).toBeCloseTo(1 / 11, 12);
  });

  it("keeps FRW distances and lookback time monotonic with redshift", () => {
    let prevLookback = -Infinity;
    let prevComoving = -Infinity;
    let prevLuminosity = -Infinity;
    for (const z of FRW_REDSHIFT_ANCHORS) {
      const lookback = lookbackTimeGyr(z);
      const comoving = comovingDistanceMpc(z);
      const luminosity = luminosityDistanceMpc(z);
      expect(lookback).toBeGreaterThan(prevLookback);
      expect(comoving).toBeGreaterThan(prevComoving);
      expect(luminosity).toBeGreaterThan(prevLuminosity);
      prevLookback = lookback;
      prevComoving = comoving;
      prevLuminosity = luminosity;
    }
  });

  it("satisfies Etherington reciprocity", () => {
    for (const z of FRW_REDSHIFT_ANCHORS) {
      const dl = luminosityDistanceMpc(z);
      const da = angularDiameterDistanceMpc(z);
      expect(dl).toBeCloseTo((1 + z) * (1 + z) * da, 8);
    }
  });

  it("matches the expected Planck-age scale and distance modulus behavior", () => {
    expect(ageAtRedshiftGyr(0)).toBeGreaterThan(13.6);
    expect(ageAtRedshiftGyr(0)).toBeLessThan(14.0);
    expect(ageAtRedshiftGyr(10)).toBeLessThan(1);
    expect(distanceModulusMag(1)).toBeGreaterThan(43);
    expect(distanceModulusMag(1)).toBeLessThan(45);
  });

  it("rejects invalid redshifts and invalid flat LCDM params clearly", () => {
    expect(() => lookbackTimeGyr(-0.1)).toThrow(/Redshift/);
    expect(
      validateFrwCosmologyParams({
        ...PLANCK_2018_FLAT_LCDM_PARAMS,
        h0KmSmpc: 0,
      }),
    ).toEqual({ valid: false, error: "H0 must be finite and positive" });
    expect(createFrwCosmologyValidationSummary({
      ...PLANCK_2018_FLAT_LCDM_PARAMS,
      omegaLambda: 0.5,
    }).status).toBe("failed");
  });

  it("creates a formula-checked validation summary with FRW teaching semantics", () => {
    const summary = createFrwCosmologyValidationSummary();
    expect(summary.status).toBe("ready");
    expect(summary.source).toBe("planck-2018");
    expect(summary.confidence).toBe("formula-checked");
    expect(summary.anchors.map((anchor) => anchor.redshift)).toEqual([0.5, 1, 2, 10]);
    expect(summary.ageNowGyr).toBeGreaterThan(13.6);
    expect(summary.semantics).toEqual({
      cosmology: "analytic-frw-validation-layer",
      structureFormation: "not-nbody-cosmological-structure-formation",
      cmb: "not-boltzmann-solver",
      orbitAtlas: "presentation-layer",
    });
  });
});
