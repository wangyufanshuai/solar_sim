import { describe, expect, it } from "vitest";
import {
  circularOrbit,
  iscoRadius,
  ksGeometry,
  ksRadius,
  photonHamiltonian,
  photonOrbitLambda,
  photonOrbitRadii,
} from "./kerrMetricKS";
import { buildCameraFrame, initialMomentum, orbitCamera } from "./kerrCameraV4";
import { defaultTraceOptions, traceRay, traceScreenPoint } from "./kerrReferenceTracer";
import { blackbodyLinearSRGB, pageThorneFluxTable, sampleFlux } from "./kerrDiskModel";

describe("Kerr–Schild geometry", () => {
  it("analytic derivatives of r, f and l match central differences", () => {
    const pts: Array<[number, number, number, number]> = [
      [0.9, 3.1, -1.7, 0.8],
      [0.5, -5.2, 2.4, -3.3],
      [-0.7, 1.9, 2.2, 0.05],
      [0.99 * 0.999, 12, 7, 9],
    ];
    const h = 1e-6;
    for (const [a, x, y, z] of pts) {
      const G = ksGeometry(a, x, y, z);
      for (let i = 0; i < 3; i++) {
        const p = [x, y, z];
        const m = [x, y, z];
        p[i] += h;
        m[i] -= h;
        const Gp = ksGeometry(a, p[0], p[1], p[2]);
        const Gm = ksGeometry(a, m[0], m[1], m[2]);
        expect(Math.abs((Gp.r - Gm.r) / (2 * h) - G.dr[i])).toBeLessThan(1e-7);
        expect(Math.abs((Gp.f - Gm.f) / (2 * h) - G.df[i])).toBeLessThan(1e-7);
        for (let j = 0; j < 3; j++) expect(Math.abs((Gp.l[j] - Gm.l[j]) / (2 * h) - G.dl[i][j])).toBeLessThan(1e-7);
      }
    }
  });

  it("r satisfies the Kerr–Schild quartic", () => {
    const a = 0.8;
    const [x, y, z] = [2.3, -0.4, 1.1];
    const r = ksRadius(a, x, y, z);
    const R2 = x * x + y * y + z * z;
    expect(Math.abs(r ** 4 - (R2 - a * a) * r * r - a * a * z * z)).toBeLessThan(1e-12);
  });

  it("ISCO and photon orbits match closed forms", () => {
    expect(iscoRadius(0)).toBeCloseTo(6, 12);
    expect(iscoRadius(0.9)).toBeCloseTo(2.3208830, 6);
    expect(iscoRadius(-0.9)).toBeCloseTo(8.71735, 4);
    expect(photonOrbitRadii(0).prograde).toBeCloseTo(3, 12);
    expect(photonOrbitRadii(0.9).prograde).toBeCloseTo(1.5578546, 6);
  });
});

describe("float64 reference tracer", () => {
  it("initial rays are null and the Hamiltonian stays below 1e-9 along a strongly bent ray", () => {
    const cam = orbitCamera(0.9, 30, (75 * Math.PI) / 180, 0, (35 * Math.PI) / 180, 1);
    const frame = buildCameraFrame(cam);
    const k = initialMomentum(frame, 0.3, 0.05);
    expect(Math.abs(photonHamiltonian(0.9, k[0], { x: cam.position, k: [k[1], k[2], k[3]] }))).toBeLessThan(1e-14);
    const res = traceRay(0.9, cam.position, k, { ...defaultTraceOptions(30), rOut: 0 });
    expect(res.status).toBe("escaped");
    expect(res.maxHamiltonian).toBeLessThan(1e-9);
  });

  it("Schwarzschild shadow angular radius matches sin α = 3√3 √(1−2/D) / D", () => {
    const D = 1000;
    const cam = orbitCamera(0, D, Math.PI / 3, 0, 0.1, 1);
    const opts = { ...defaultTraceOptions(D), rOut: 0 };
    let lo = 0.004; // captured
    let hi = 0.007; // escapes
    for (let it = 0; it < 40; it++) {
      const mid = 0.5 * (lo + hi);
      if (traceScreenPoint(cam, mid, 0, opts).status === "captured") lo = mid;
      else hi = mid;
    }
    const sinAlpha = Math.sin(Math.atan(0.5 * (lo + hi)));
    const expected = (3 * Math.sqrt(3) * Math.sqrt(1 - 2 / D)) / D;
    expect(Math.abs(sinAlpha / expected - 1)).toBeLessThan(1e-6);
  });

  it("Kerr a=0.9 edge-on shadow edges sit at α = −λ(r_ph) with the prograde side on the left", () => {
    const D = 2000;
    const a = 0.9;
    const cam = orbitCamera(a, D, Math.PI / 2, 0, 0.1, 1);
    const opts = { ...defaultTraceOptions(D), rOut: 0 };
    const edge = (sign: number) => {
      let lo = 0; // captured at centre
      let hi = 0.006 * sign;
      for (let it = 0; it < 40; it++) {
        const mid = 0.5 * (lo + hi);
        if (traceScreenPoint(cam, mid, 0, opts).status === "captured") lo = mid;
        else hi = mid;
      }
      const t = 0.5 * (lo + hi);
      return (D * Math.sin(Math.atan(t))) / Math.sqrt(1 - 2 / D);
    };
    const { prograde, retrograde } = photonOrbitRadii(a);
    const right = edge(1);
    const left = edge(-1);
    expect(Math.abs(right - -photonOrbitLambda(a, retrograde))).toBeLessThan(0.01);
    expect(Math.abs(left - -photonOrbitLambda(a, prograde))).toBeLessThan(0.01);
  });

  it("face-on redshift equals 1 / (√(1−f_obs) u^t) for zero-angular-momentum photons", () => {
    const D = 500;
    const a = 0.7;
    const cam = orbitCamera(a, D, 0, 0, 0.1, 1);
    const fObs = (2 * D) / (D * D + a * a);
    const opts = defaultTraceOptions(D, 30);
    let hits = 0;
    for (const sx of [0.012, 0.02, 0.03, 0.045]) {
      const res = traceScreenPoint(cam, sx, 0, opts);
      if (res.status !== "disk" || res.r === null || res.g === null) continue;
      hits++;
      const expected = 1 / (Math.sqrt(1 - fObs) * circularOrbit(a, res.r).ut);
      expect(Math.abs(res.g - expected)).toBeLessThan(1e-8);
    }
    expect(hits).toBeGreaterThanOrEqual(3);
  });
});

describe("disk model", () => {
  it("Page–Thorne flux vanishes at the ISCO, peaks outside it and is normalised", () => {
    for (const a of [0, 0.9]) {
      const t = pageThorneFluxTable(a, 30);
      expect(t.values[0]).toBeLessThan(1e-6);
      expect(Math.max(...t.values)).toBeCloseTo(1, 2);
      expect(t.rPeak).toBeGreaterThan(t.rIn);
      expect(sampleFlux(t, t.rIn * 0.99)).toBe(0);
    }
    const s = pageThorneFluxTable(0, 30);
    expect(s.rPeak).toBeGreaterThan(8);
    expect(s.rPeak).toBeLessThan(11);
  });

  it("blackbody colours run red → white → blue", () => {
    const c3 = blackbodyLinearSRGB(3000);
    const c65 = blackbodyLinearSRGB(6500);
    const c20 = blackbodyLinearSRGB(20000);
    expect(c3[0]).toBeGreaterThan(c3[2] * 3);
    expect(Math.abs(c65[0] / c65[2] - 1)).toBeLessThan(0.15);
    expect(c20[2]).toBeGreaterThan(c20[0]);
  });
});
