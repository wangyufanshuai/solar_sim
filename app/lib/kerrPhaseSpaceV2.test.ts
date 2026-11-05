import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  integrateKerrPhaseSpace,
  kerrPolarPotential,
  kerrRadialPotential,
  type KerrConstantsOfMotion,
  type KerrPhaseSpaceState,
} from "./kerrPhaseSpaceV2";

const NON_EQUATORIAL_NULL: KerrConstantsOfMotion = {
  kind: "null",
  spinA: 0.72,
  energy: 1,
  axialAngularMomentum: 2.1,
  carterQ: 5.5,
};

const INITIAL: KerrPhaseSpaceState = {
  lambda: 0,
  t: 0,
  r: 14,
  theta: 1.15,
  phi: 0,
  radialDirection: -1,
  polarDirection: 1,
};

describe("v129 non-equatorial Kerr phase space", () => {
  it("integrates an inclined null geodesic with finite E, Lz, and Carter Q", () => {
    expect(kerrRadialPotential(INITIAL.r, NON_EQUATORIAL_NULL)).toBeGreaterThan(0);
    expect(kerrPolarPotential(INITIAL.theta, NON_EQUATORIAL_NULL)).toBeGreaterThan(0);
    const result = integrateKerrPhaseSpace(INITIAL, NON_EQUATORIAL_NULL, {
      step: 0.001,
      maxSteps: 1_000,
    });
    expect(result.samples.length).toBeGreaterThan(10);
    expect(result.samples.some((sample) => Math.abs(sample.theta - INITIAL.theta) > 1e-4)).toBe(
      true,
    );
    expect(result.report.maxHamiltonianDrift).toBeLessThan(1e-8);
    expect(result.report.maxCarterDrift).toBeLessThan(1e-10);
    expect(result.report.boundary).toBe("test-particle-only-isolated-from-solar-nbody");
  });

  it("recovers the Schwarzschild limit when spin is zero", () => {
    const constants = { ...NON_EQUATORIAL_NULL, spinA: 0 };
    const result = integrateKerrPhaseSpace(INITIAL, constants, {
      step: 0.001,
      maxSteps: 200,
    });
    expect(result.samples.every((sample) => Number.isFinite(sample.hamiltonian))).toBe(true);
    expect(result.report.maxHamiltonianDrift).toBeLessThan(1e-8);
  });

  it("classifies an inward low-angular-momentum null ray as captured or horizon-bound", () => {
    const result = integrateKerrPhaseSpace(
      { ...INITIAL, r: 3.2, theta: Math.PI / 2, polarDirection: 0 },
      {
        kind: "null",
        spinA: 0.5,
        energy: 1,
        axialAngularMomentum: 0.4,
        carterQ: 0,
      },
      { step: 0.0005, maxSteps: 20_000 },
    );
    expect(["captured", "turning-point"]).toContain(result.report.status);
    expect(result.samples.at(-1)!.r).toBeLessThan(3.2);
  });

  it("matches the independently generated build-time Kerr reference anchors", () => {
    const fixture = JSON.parse(
      readFileSync(
        join(process.cwd(), "dist/content-packs/files/science-fixtures/data/kerr-v2-reference-fixtures.json"),
        "utf8",
      ),
    ) as {
      schwarzschild: {
        horizonRadiusM: number;
        photonSphereRadiusM: number;
        iscoRadiusM: number;
        weakField: { impactParameterM: number; deflectionRad: number };
      };
      nonEquatorialNull: {
        r: number;
        theta: number;
        radialPotential: number;
        polarPotential: number;
      };
    };
    expect(fixture.schwarzschild).toMatchObject({
      horizonRadiusM: 2,
      photonSphereRadiusM: 3,
      iscoRadiusM: 6,
    });
    expect(fixture.schwarzschild.weakField.deflectionRad).toBeCloseTo(
      4 / fixture.schwarzschild.weakField.impactParameterM,
      14,
    );
    expect(kerrRadialPotential(fixture.nonEquatorialNull.r, NON_EQUATORIAL_NULL)).toBeCloseTo(
      fixture.nonEquatorialNull.radialPotential,
      10,
    );
    expect(kerrPolarPotential(fixture.nonEquatorialNull.theta, NON_EQUATORIAL_NULL)).toBeCloseTo(
      fixture.nonEquatorialNull.polarPotential,
      10,
    );
  });
});
