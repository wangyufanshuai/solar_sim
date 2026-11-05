import { describe, expect, it } from "vitest";
import {
  SCHWARZSCHILD_STRONG_FIELD_ANCHORS,
  createKerrProbeGeodesicSummary,
  createKerrGeodesicValidationSummary,
  createSchwarzschildValidationSummary,
  integrateGeodesic,
  kerrEquatorialIscoRadiusM,
  kerrMetricAt,
  kerrOuterHorizonRadiusM,
  schwarzschildCircularTimelikeConstants,
  schwarzschildPhotonSphereConstants,
  weakFieldLightDeflectionRad,
} from "./kerrGeodesicKernel";

describe("Kerr geodesic relativity kernel", () => {
  it("pins the Schwarzschild strong-field anchors", () => {
    expect(SCHWARZSCHILD_STRONG_FIELD_ANCHORS).toEqual({
      horizonRadiusM: 2,
      photonSphereRadiusM: 3,
      iscoRadiusM: 6,
    });
  });

  it("computes finite Kerr horizons and ISCO radii", () => {
    for (const spin of [0, 0.5, 0.9]) {
      expect(Number.isFinite(kerrOuterHorizonRadiusM(spin))).toBe(true);
      expect(Number.isFinite(kerrEquatorialIscoRadiusM(spin, "prograde"))).toBe(true);
      expect(Number.isFinite(kerrEquatorialIscoRadiusM(spin, "retrograde"))).toBe(true);
    }
    expect(kerrOuterHorizonRadiusM(0)).toBeCloseTo(2, 12);
    expect(kerrEquatorialIscoRadiusM(0, "prograde")).toBeCloseTo(6, 12);
    expect(kerrEquatorialIscoRadiusM(0, "retrograde")).toBeCloseTo(6, 12);
    expect(kerrEquatorialIscoRadiusM(0.9, "prograde")).toBeLessThan(6);
    expect(kerrEquatorialIscoRadiusM(0.9, "retrograde")).toBeGreaterThan(6);
  });

  it("returns finite Boyer-Lindquist metric components outside the horizon", () => {
    const metric = kerrMetricAt({ family: "kerr", spinA: 0.9 }, 8, Math.PI / 2);
    expect(metric.params.family).toBe("kerr");
    for (const value of [
      metric.sigma,
      metric.delta,
      metric.covariant.tt,
      metric.covariant.tPhi,
      metric.covariant.rr,
      metric.covariant.phiPhi,
      metric.contravariant.tt,
      metric.contravariant.tPhi,
      metric.contravariant.rr,
      metric.contravariant.phiPhi,
    ]) {
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("keeps null photon-sphere Hamiltonian near zero", () => {
    const photon = schwarzschildPhotonSphereConstants();
    const result = integrateGeodesic(
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 3,
        radialDirection: 0,
        energy: photon.energy,
        angularMomentum: photon.angularMomentum,
      },
      { maxLambda: 32, maxStep: 0.2, tolerance: 1e-10 },
    );
    expect(result.status).toBe("bounded");
    expect(result.maxHamiltonianConstraintAbs).toBeLessThan(1e-10);
    expect(result.radialRange.max - result.radialRange.min).toBeLessThan(1e-10);
  });

  it("keeps the circular Schwarzschild ISCO orbit bounded", () => {
    const isco = schwarzschildCircularTimelikeConstants(6);
    const result = integrateGeodesic(
      {
        metric: "schwarzschild",
        kind: "timelike",
        r0: 6,
        radialDirection: 0,
        energy: isco.energy,
        angularMomentum: isco.angularMomentum,
      },
      { maxLambda: 48, maxStep: 0.2, tolerance: 1e-10 },
    );
    expect(result.status).toBe("bounded");
    expect(result.maxHamiltonianConstraintAbs).toBeLessThan(1e-10);
    expect(result.radialRange.max - result.radialRange.min).toBeLessThan(1e-10);
  });

  it("classifies capture and escape deterministically", () => {
    const capture = integrateGeodesic(
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 2.8,
        radialDirection: -1,
        energy: 1,
        angularMomentum: 1.5,
      },
      { maxLambda: 20, escapeRadius: 80, maxStep: 0.05 },
    );
    const escape = integrateGeodesic(
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 30,
        radialDirection: 1,
        energy: 1,
        angularMomentum: 4,
      },
      { maxLambda: 80, escapeRadius: 60, maxStep: 0.2 },
    );
    expect(capture.status).toBe("captured");
    expect(escape.status).toBe("escaped");
  });

  it("matches the weak-field light deflection anchor 4M/b", () => {
    expect(weakFieldLightDeflectionRad(1_000)).toBeCloseTo(0.004, 12);
    expect(weakFieldLightDeflectionRad(10_000)).toBeCloseTo(0.0004, 12);
  });

  it("creates a geodesic-backed strong-field summary without replacing solar dynamics", () => {
    const schwarzschild = createSchwarzschildValidationSummary();
    expect(schwarzschild.anchors.iscoRadiusM).toBe(6);
    expect(schwarzschild.iscoOrbit.status).toBe("bounded");

    const summary = createKerrGeodesicValidationSummary(0.9);
    expect(summary.status).toBe("ready");
    expect(summary.kernel).toBe("kerr-geodesic-v17");
    expect(summary.relativityKernel).toBe("eih-1pn+kerr-geodesic-v17");
    expect(summary.labVersion).toBe("v19-interactive-kerr-lab");
    expect(summary.orbitPresetId).toBe("photon-ring-demo");
    expect(summary.metricFamilies).toEqual(["schwarzschild", "kerr"]);
    expect(summary.geodesicKinds).toEqual(["timelike", "null"]);
    expect(summary.integration.nullHamiltonianDrift).toBeLessThan(1e-10);
    expect(summary.integration.timelikeHamiltonianDrift).toBeLessThan(1e-10);
    expect(summary.integration.probeHamiltonianDrift).toBeLessThan(1e-6);
    expect(summary.integration.captureStatus).toBe("captured");
    expect(summary.integration.escapeStatus).toBe("escaped");
    expect(summary.probe.impactParameterM).toBeCloseTo(5.35, 8);
    expect(summary.probe.probeStatus).not.toBe("failed");
    expect(summary.semantics).toEqual({
      strongField: "geodesic-backed-validation-lab",
      solarDynamics: "not-replaced-eih-1pn",
      numericalRelativity: "not-einstein-field-equation-solver",
      orbitAtlas: "presentation-layer",
    });
  });

  it("summarizes the v19 interactive null probe from impact parameter", () => {
    const capture = createKerrProbeGeodesicSummary({
      impactParameterM: 4.2,
      presetId: "capture-cone",
    });
    const escape = createKerrProbeGeodesicSummary({
      impactParameterM: 14,
      presetId: "wide-deflection",
    });
    expect(capture.probeStatus).toBe("capture");
    expect(escape.probeStatus).toBe("escape");
    expect(capture.weakFieldDeflectionRad).toBeCloseTo(4 / 4.2, 12);
    expect(escape.weakFieldDeflectionRad).toBeCloseTo(4 / 14, 12);
  });

  it("creates a strong-field summary from current Kerr lab parameters", () => {
    const lowSpin = createKerrGeodesicValidationSummary({
      spinA: 0.2,
      impactParameterM: 4.2,
      presetId: "capture-cone",
    });
    const highSpin = createKerrGeodesicValidationSummary({
      spinA: 0.95,
      impactParameterM: 14,
      presetId: "frame-drag-split",
    });
    expect(lowSpin.orbitPresetId).toBe("capture-cone");
    expect(highSpin.orbitPresetId).toBe("frame-drag-split");
    expect(lowSpin.probe.probeStatus).toBe("capture");
    expect(highSpin.probe.probeStatus).toBe("escape");
    expect(highSpin.kerr.progradeIscoRadiusM).toBeLessThan(lowSpin.kerr.progradeIscoRadiusM);
    expect(highSpin.kerr.retrogradeIscoRadiusM).toBeGreaterThan(lowSpin.kerr.retrogradeIscoRadiusM);
  });
});
