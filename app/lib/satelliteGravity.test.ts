import { describe, expect, it } from "vitest";
import { addJ2Acceleration, calculateAcceleration, defaultEps2Meters, type GravityDynamics } from "./physicsEngine";
import { SolarSystemPhysics } from "./solarSystemPhysics";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { BODY_J2_AXIS } from "./planetJ2Data";

const axis = [0.3, -0.4, Math.sqrt(0.75)];
const model: GravityDynamics = {
  j2: new Float64Array([0.02, 0]), reqEquatorialM: new Float64Array([2, 0]),
  axes: new Float64Array([...axis, 0, 0, 0]),
};

describe("parent–moon gravity and Jupiter J2", () => {
  it.each([0, 0.25])("agrees with an independent potential gradient, eps²=%s", (eps2) => {
    const pos = new Float64Array([0, 0, 0, 8, 3, -4]);
    const out = new Float64Array(6);
    addJ2Acceleration(pos, new Float64Array([7, 0.2]), 2, 1, eps2, model, out);
    const potential = (r: number[]) => {
      const r2 = r.reduce((s, x) => s + x * x, eps2);
      const z = r.reduce((s, x, k) => s + x * axis[k], 0);
      return 7 * 0.02 * 4 / 2 * (r2 ** -1.5 - 3 * z * z * r2 ** -2.5);
    };
    for (let k = 0; k < 3; k++) {
      const plus = [8, 3, -4], minus = [...plus], h = 1e-4;
      plus[k] += h; minus[k] -= h;
      const gradient = (potential(plus) - potential(minus)) / (2 * h);
      expect(Math.abs(out[3 + k] - gradient)).toBeLessThan(2e-12);
      expect(Math.abs(7 * out[k] + 0.2 * out[3 + k])).toBeLessThan(1e-18);
    }
  });

  it("gives the analytic equatorial and polar J2 accelerations", () => {
    const m = { ...model, axes: new Float64Array([0, 0, 1, 0, 0, 0]) };
    for (const [r, factor] of [[[10, 0, 0], -1.5], [[0, 0, 10], 3]] as const) {
      const out = new Float64Array(6);
      addJ2Acceleration(new Float64Array([0, 0, 0, ...r]), new Float64Array([7, 0]), 2, 1, 0, m, out);
      const k = r[0] ? 3 : 5;
      expect(out[k]).toBeCloseTo(factor * 7 * 0.02 * 4 / 10 ** 4, 15);
    }
  });

  it("uses symmetric 10 km parent–moon softening while protecting spacecraft encounters", () => {
    const p = new SolarSystemPhysics();
    const ids = SOLAR_SYSTEM_BODIES.map((b) => b.id);
    const pair = (a: string, b: string) => p.gravityDynamics!.pairEps2![ids.indexOf(a) * p.n + ids.indexOf(b)];
    expect(pair("io", "jupiter")).toBe(1e8);
    expect(pair("jupiter", "io")).toBe(1e8);
    expect(pair("earth", "sun")).toBe(defaultEps2Meters());
    expect(pair("earth", "moon")).toBe(defaultEps2Meters());
    expect(pair("pluto", "charon")).toBe(defaultEps2Meters());
    expect(pair("artemis_sls", "earth")).toBe(defaultEps2Meters());
    expect(Math.hypot(...BODY_J2_AXIS.slice(18, 21))).toBeCloseTo(1, 14);
    expect(BODY_J2_AXIS[20]).toBeLessThan(1);
  });

  it("uses pair softening in the monopole and adds J2 outside the EIH correction", () => {
    const pos = new Float64Array([0, 0, 0, 8, 3, -4]);
    const mass = new Float64Array([7, 0.2]), vel = new Float64Array(6);
    const pairModel = { ...model, pairEps2: new Float64Array(4) };
    const noJ2 = { ...pairModel, j2: new Float64Array(2) };
    const monopole = new Float64Array(6);
    calculateAcceleration(pos, vel, mass, 2, 1, 0, 4, new Float64Array(6), new Float64Array(2), monopole, noJ2);
    expect(Math.hypot(...monopole.slice(3))).toBeCloseTo(7 / 89, 14);
    const quadrupole = new Float64Array(6);
    addJ2Acceleration(pos, mass, 2, 1, 4, pairModel, quadrupole);
    for (const inv of [0, 1e-4]) {
      const base = new Float64Array(6), total = new Float64Array(6);
      calculateAcceleration(pos, vel, mass, 2, 1, inv, 4, new Float64Array(6), new Float64Array(2), base, noJ2);
      calculateAcceleration(pos, vel, mass, 2, 1, inv, 4, new Float64Array(6), new Float64Array(2), total, pairModel);
      for (let k = 0; k < 6; k++) expect(total[k] - base[k]).toBeCloseTo(quadrupole[k], 15);
    }
  });

  it("point-mass Newton and EIH remain finite with the colocated launch body", () => {
    const p = new SolarSystemPhysics();
    for (const inv of [0, 1 / 299792458 ** 2]) {
      const a = new Float64Array(3 * p.n);
      calculateAcceleration(p.posM, p.velM, p.mass, p.n, p.G, inv, p.eps2,
        new Float64Array(a.length), new Float64Array(p.n), a, p.gravityDynamics);
      expect(a.every(Number.isFinite)).toBe(true);
    }
  });
});
