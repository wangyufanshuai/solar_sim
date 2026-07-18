import { describe, expect, it } from "vitest";
import {
  heliocentricOsculatingElements,
  keplerPeriodSeconds,
} from "./osculatingElements";

const MU = 3.986004418e14;

function stateAtPeriapsis(a: number, e: number, inclinationDeg = 0) {
  const perihelion = a * (1 - e);
  const speed = Math.sqrt(MU * (1 + e) / perihelion);
  const inclination = (inclinationDeg * Math.PI) / 180;
  return {
    pos: new Float64Array([0, 0, 0, perihelion, 0, 0]),
    vel: new Float64Array([0, 0, 0, 0, speed * Math.cos(inclination), speed * Math.sin(inclination)]),
  };
}

describe("heliocentricOsculatingElements", () => {
  it("recovers a bound elliptic orbit from a periapsis state", () => {
    const a = 12_000_000;
    const e = 1 / 3;
    const state = stateAtPeriapsis(a, e);
    const elements = heliocentricOsculatingElements(state.pos, state.vel, 0, 1, MU);
    expect(elements).not.toBeNull();
    expect(elements!.a).toBeCloseTo(a, 5);
    expect(elements!.e).toBeCloseTo(e, 10);
    expect(elements!.perihelionM).toBeCloseTo(a * (1 - e), 5);
    expect(elements!.aphelionM).toBeCloseTo(a * (1 + e), 5);
    expect(elements!.periodSeconds).toBeCloseTo(keplerPeriodSeconds(a, MU), 5);
    expect(elements!.trueAnomalyDeg).toBeCloseTo(0, 8);
  });

  it("derives inclination without mutating the live state arrays", () => {
    const state = stateAtPeriapsis(9_000_000, 0.1, 51.6);
    const beforePos = Array.from(state.pos);
    const beforeVel = Array.from(state.vel);
    const elements = heliocentricOsculatingElements(state.pos, state.vel, 0, 1, MU);
    expect(elements?.inclinationDeg).toBeCloseTo(51.6, 8);
    expect(Array.from(state.pos)).toEqual(beforePos);
    expect(Array.from(state.vel)).toEqual(beforeVel);
  });
});
