import { afterEach, describe, expect, it, vi } from "vitest";
import { C_LIGHT } from "./physicalConstants";
import { normalizePhysicsExecutionPolicy, scientificFrameStep } from "./physicsExecutionPolicy";
import { SolarSystemPhysics } from "./solarSystemPhysics";

const policy = { mode: "scientific-shadow", model: "eih-1pn", stepSeconds: 4800 } as const;
afterEach(() => vi.unstubAllEnvs());

describe("locked legacy scientific execution (not NR admission)", () => {
  it("freezes a detached, explicit model and physical step", () => {
    const input = { ...policy, stepSeconds: Number(policy.stepSeconds) };
    const locked = normalizePhysicsExecutionPolicy(input);
    expect(Object.isFrozen(locked)).toBe(true);
    input.stepSeconds = 60;
    expect(locked).not.toBe(input);
    expect(scientificFrameStep(locked)).toMatchObject({
      dtSimS: 4800, invC2: 1 / C_LIGHT ** 2, tier: "full", galacticMode: false,
    });
    expect(scientificFrameStep(normalizePhysicsExecutionPolicy())).toBeNull();
  });

  it.each([
    { ...policy, model: "ccz4" }, { ...policy, stepSeconds: 0 },
    { ...policy, stepSeconds: NaN }, { ...policy, stepSeconds: Infinity },
    { ...policy, maxDpAttempts: 0 }, { ...policy, maxAccelEvals: 6 },
    { ...policy, maxDpAttempts: 1.5 }, { ...policy, maxAccelEvals: 45001 },
    { ...policy, maxDpAttempts: null }, { ...policy, maxAccelEvals: null },
    { ...policy, typo: true }, { mode: "typo" },
  ])("rejects unsupported or unbounded policy %j", (input) => {
    expect(() => normalizePhysicsExecutionPolicy(input)).toThrow();
  });

  it("does not accept fixed RK4 as a scientific adaptive-DP run", () => {
    expect(() => new SolarSystemPhysics({ executionPolicy: policy, forceFixedRk4: true })).toThrow(/RK4/);
  });

  it("rejects an environment-driven RK4 override unless explicitly disabled", () => {
    vi.stubEnv("NEXT_PUBLIC_SOLAR_FIXED_RK4", "1");
    expect(() => new SolarSystemPhysics({ executionPolicy: policy })).toThrow(/RK4/);
    expect(() => new SolarSystemPhysics({ executionPolicy: policy, forceFixedRk4: false })).not.toThrow();
  });

  it.each([0, -1, 1.5, 10000])("rejects invalid scientific active body count %s", (activeN) => {
    expect(() => new SolarSystemPhysics({ activeN, executionPolicy: policy, forceFixedRk4: false })).toThrow(/body count/);
  });

  it("rejects model, precision and step changes before mutation", () => {
    const p = new SolarSystemPhysics({ executionPolicy: policy, forceFixedRk4: false });
    const before = p.posM.slice();
    expect(() => p.setGalacticMode(true)).toThrow(/locked/);
    expect(() => p.setPrecisionTier("economy")).toThrow(/locked/);
    expect(() => p.stepSimulatedSeconds(4800, 0)).toThrow(/locked/);
    expect(() => p.stepSimulatedSeconds(12, 1 / C_LIGHT ** 2)).toThrow(/locked/);
    expect(p.posM).toEqual(before);
  });

  it.each(["max-accel-evals", "max-attempts"] as const)(
    "rolls back real accepted DP work and latches failure on %s", (reason) => {
      // One freely moving body makes the first real DP trial an exact accepted step.
      const p = new SolarSystemPhysics({ activeN: 1, forceFixedRk4: false, executionPolicy: {
        ...policy, ...(reason === "max-attempts" ? { maxDpAttempts: 1 } : { maxAccelEvals: 7 }),
      } });
      const before = [p.posM.slice(), p.velM.slice(), p.posAu.slice()];
      expect(() => p.stepSimulatedSeconds(4800, 1 / C_LIGHT ** 2)).toThrow(reason);
      expect(p.getScientificFailure()).toMatchObject({ reason, attemptedSubsteps: 1, attemptedSeconds: 2400 });
      expect([p.posM, p.velM, p.posAu]).toEqual(before);
      expect(() => p.stepSimulatedSeconds(4800, 1 / C_LIGHT ** 2)).toThrow(/terminated/);
      expect([p.posM, p.velM, p.posAu]).toEqual(before);
    },
  );

  it("a valid locked EIH step is byte-equivalent to the unchanged interactive DP step", () => {
    const scientific = new SolarSystemPhysics({ executionPolicy: policy, forceFixedRk4: false });
    const interactive = new SolarSystemPhysics({ forceFixedRk4: false });
    for (let i = 0; i < 3; i++) {
      const a = scientific.stepSimulatedSeconds(4800, 1 / C_LIGHT ** 2);
      const b = interactive.stepSimulatedSeconds(4800, 1 / C_LIGHT ** 2);
      expect(a).toEqual(b);
      expect(scientific.posM).toEqual(interactive.posM);
      expect(scientific.velM).toEqual(interactive.velM);
    }
    expect(scientific.getScientificFailure()).toBeNull();
  });

  it("locks Newton as a distinct explicit model", () => {
    const p = new SolarSystemPhysics({ forceFixedRk4: false, executionPolicy: { ...policy, model: "newton-nbody" } });
    expect(p.getPrecisionTier()).toBe("newton");
    expect(p.stepSimulatedSeconds(4800, 0).mode).toBe("dp");
    expect(() => p.setPrecisionTier("full")).toThrow(/locked/);
    expect(() => p.integrateOneFrame(4800, 1 / C_LIGHT ** 2, "newton")).toThrow(/locked/);
  });

  it("rejects reset and snapshot writes into a locked run", () => {
    const p = new SolarSystemPhysics({ forceFixedRk4: false, executionPolicy: policy });
    const before = p.posM.slice();
    expect(() => p.resetFromEphemeris()).toThrow(/locked/);
    expect(() => p.applySnapshotFromAu([], [], [], 0)).toThrow(/locked/);
    expect(p.posM).toEqual(before);
  });

  it("rejects non-finite state without manufacturing a successful DP step", () => {
    const p = new SolarSystemPhysics({ forceFixedRk4: false, executionPolicy: policy });
    p.velM[0] = Number.NaN;
    const before = new Uint8Array(p.posM.buffer).slice();
    expect(() => p.stepSimulatedSeconds(4800, 1 / C_LIGHT ** 2)).toThrow(/invalid-initial-state/);
    expect(new Uint8Array(p.posM.buffer)).toEqual(before);
    expect(p.getScientificFailure()).not.toBeNull();
  });
});
