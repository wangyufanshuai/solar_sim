import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { kerrPolarPotential, kerrRadialPotential, type KerrConstantsOfMotion } from "./kerrPhaseSpaceV2";

type Fixture = {
  kind: "null" | "timelike";
  spinA: number;
  energy: number;
  axialAngularMomentum: number;
  carterQ: number;
  state: { r: number; theta: number };
  radialPotential: number;
  polarPotential: number;
  radialTurningPointsM: number[];
  polarTurningPointsRad: number[];
};

describe("v150 independent Kerr fixtures", () => {
  it("matches independent radial, polar and turning-point roots", () => {
    const document = JSON.parse(readFileSync("public/data/kerr-independent-fixtures-v5.json", "utf8")) as { fixtures: Fixture[] };
    expect(document.fixtures.length).toBeGreaterThanOrEqual(4);
    for (const fixture of document.fixtures) {
      const constants: KerrConstantsOfMotion = {
        kind: fixture.kind,
        spinA: fixture.spinA,
        energy: fixture.energy,
        axialAngularMomentum: fixture.axialAngularMomentum,
        carterQ: fixture.carterQ,
      };
      expect(kerrRadialPotential(fixture.state.r, constants)).toBeCloseTo(fixture.radialPotential, 8);
      expect(kerrPolarPotential(fixture.state.theta, constants)).toBeCloseTo(fixture.polarPotential, 10);
      for (const root of fixture.radialTurningPointsM) expect(Math.abs(kerrRadialPotential(root, constants))).toBeLessThan(1e-5);
      for (const root of fixture.polarTurningPointsRad) expect(Math.abs(kerrPolarPotential(root, constants))).toBeLessThan(1e-7);
    }
  });
});
