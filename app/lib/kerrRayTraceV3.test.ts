import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  KERR_RAY_TRACE_V3_VERSION,
  createKerrObserverTetradV3,
  createKerrRayTraceReportV3,
  kerrCriticalCurveV3,
  kerrOuterHorizonRadiusV3,
  kerrThinDiskRedshiftFactorV3,
  normalizeKerrRayConfigV3,
  traceKerrNullRayV3,
  validateKerrOfflineReferenceV3,
  type KerrOfflineReferenceReportV3,
} from "./kerrRayTraceV3";

describe("Kerr ray trace reference v3", () => {
  it("keeps the observer tetrad outside the outer horizon", () => {
    const tetrad = createKerrObserverTetradV3({ spinA: 0.9, radiusM: 50, thetaRad: Math.PI / 2 });
    expect(tetrad.boundary).toBe("zamo-outside-outer-horizon");
    expect(tetrad.lapse).toBeGreaterThan(0);
    expect(tetrad.radiusM).toBeGreaterThan(kerrOuterHorizonRadiusV3(tetrad.spinA));
  });

  it("reproduces the Schwarzschild critical-curve radius", () => {
    const curve = kerrCriticalCurveV3(0, Math.PI / 2, 64);
    const radius = Math.hypot(...curve[0]!);
    expect(radius).toBeCloseTo(3 * Math.sqrt(3), 10);
  });

  it("normalizes the four quality budgets without allocating a render target", () => {
    const mobile = normalizeKerrRayConfigV3({ quality: "mobile-safe", maxSteps: 100 });
    const interactive = normalizeKerrRayConfigV3({ quality: "interactive", maxSteps: 500 });
    expect(mobile.maxSteps).toBe(0);
    expect(interactive.maxSteps).toBe(192);
    expect(createKerrRayTraceReportV3({ quality: "mobile-safe" }).version).toBe(KERR_RAY_TRACE_V3_VERSION);
  });

  it("traces a bounded null probe and reports explicit numerical health", () => {
    const tetrad = createKerrObserverTetradV3({ spinA: 0.8, radiusM: 30, thetaRad: Math.PI / 2 });
    const sample = traceKerrNullRayV3({
      tetrad,
      direction: [-1, 0, 0],
      maxSteps: 64,
      stepMino: 0.02,
      diskInnerRadiusM: 2,
      diskOuterRadiusM: 30,
    });
    expect(["captured", "escaped", "max-steps", "invalid"]).toContain(sample.status);
    expect(Number.isFinite(sample.coordinateTime)).toBe(true);
    expect(sample.carterDrift).toBeGreaterThanOrEqual(0);
  });

  it("keeps thin-disc redshift finite and bounded", () => {
    const factor = kerrThinDiskRedshiftFactorV3(0.9, 6, 2);
    expect(Number.isFinite(factor)).toBe(true);
    expect(factor).toBeGreaterThanOrEqual(0);
    expect(factor).toBeLessThanOrEqual(20);
  });

  it("accepts the independent float64 DOP853 evidence", () => {
    const report = JSON.parse(
      readFileSync("dist/science/kerr-ray-reference-v3.json", "utf8"),
    ) as KerrOfflineReferenceReportV3;
    const rerun = JSON.parse(
      readFileSync("dist/science/kerr-ray-reference-v3-rerun.json", "utf8"),
    ) as KerrOfflineReferenceReportV3;
    expect(validateKerrOfflineReferenceV3(report)).toMatchObject({
      deterministicSolver: true,
      criticalCurvePassed: true,
      invariantGatePassed: true,
      passed: true,
      runtimePromotionApplied: false,
    });
    expect(report.canonicalEvidenceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(rerun.canonicalEvidenceSha256).toBe(report.canonicalEvidenceSha256);
  });
});
