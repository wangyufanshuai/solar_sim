import { describe, expect, it } from "vitest";
import { AU_METERS } from "./physicalConstants";
import {
  DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
  RELATIVITY_V2_EPHEMERIS_GATES,
  calculateRelativityForceModelV2Delta,
  compareRelativityForceModelsShadow,
} from "./relativityForceModelV2";

const SOLAR_MASS_KG =
  DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG.solarGmM3S2 / 6.6743e-11;
const MERCURY_MASS_KG = 3.3011e23;

function mercuryState() {
  return {
    pos: new Float64Array([0, 0, 0, 0.387 * AU_METERS, 0, 0]),
    vel: new Float64Array([0, 0, 0, 0, 47_360, 0]),
    mass: new Float64Array([SOLAR_MASS_KG, MERCURY_MASS_KG]),
  };
}

describe("v128 relativity force model V2 shadow", () => {
  it("produces finite deterministic 2PN and LT corrections without mutating state", () => {
    const state = mercuryState();
    const posBefore = state.pos.slice();
    const velBefore = state.vel.slice();
    const first = new Float64Array(6);
    const second = new Float64Array(6);
    calculateRelativityForceModelV2Delta(
      state.pos,
      state.vel,
      state.mass,
      2,
      first,
    );
    calculateRelativityForceModelV2Delta(
      state.pos,
      state.vel,
      state.mass,
      2,
      second,
    );
    expect(Array.from(first)).toEqual(Array.from(second));
    expect(Array.from(first).every(Number.isFinite)).toBe(true);
    expect(Math.hypot(first[3], first[4], first[5])).toBeGreaterThan(0);
    expect(state.pos).toEqual(posBefore);
    expect(state.vel).toEqual(velBefore);
  });

  it("preserves total linear momentum in the shadow acceleration distribution", () => {
    const state = mercuryState();
    const delta = new Float64Array(6);
    calculateRelativityForceModelV2Delta(
      state.pos,
      state.vel,
      state.mass,
      2,
      delta,
    );
    for (let axis = 0; axis < 3; axis += 1) {
      const force =
        state.mass[0] * delta[axis] + state.mass[1] * delta[axis + 3];
      expect(Math.abs(force)).toBeLessThan(1e6);
    }
  });

  it("reverses the LT contribution when the solar spin axis reverses", () => {
    const state = mercuryState();
    const positive = new Float64Array(6);
    const negative = new Float64Array(6);
    const base = {
      ...DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
      includeSolar2PnMonopole: false,
    };
    calculateRelativityForceModelV2Delta(
      state.pos,
      state.vel,
      state.mass,
      2,
      positive,
      base,
    );
    calculateRelativityForceModelV2Delta(
      state.pos,
      state.vel,
      state.mass,
      2,
      negative,
      {
        ...base,
        solarSpinAxisJ2000: base.solarSpinAxisJ2000.map((v) => -v) as [
          number,
          number,
          number,
        ],
      },
    );
    for (let index = 0; index < positive.length; index += 1) {
      expect(negative[index]).toBeCloseTo(-positive[index], 12);
    }
  });

  it("reports an explicitly blocked read-only comparison and progressive gates", () => {
    const state = mercuryState();
    const comparison = compareRelativityForceModelsShadow(
      state.pos,
      state.vel,
      state.mass,
      2,
    );
    expect(comparison.mode).toBe("shadow-read-only");
    expect(comparison.liveStateMutated).toBe(false);
    expect(comparison.promotion).toBe("blocked-pending-ephemeris-gates");
    expect(comparison.eih1PnDeltaRmsMS2).toBeGreaterThan(
      comparison.solar2PnAndLtDeltaRmsMS2,
    );
    expect(RELATIVITY_V2_EPHEMERIS_GATES.firstStage.positionRmsKmExclusive).toBe(
      100_000,
    );
    expect(RELATIVITY_V2_EPHEMERIS_GATES.promotion.velocityRmsMSExclusive).toBe(1);
  });
});
