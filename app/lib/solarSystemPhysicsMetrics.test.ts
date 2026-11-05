import { describe, expect, it } from "vitest";
import { SolarSystemPhysics } from "./solarSystemPhysics";

describe("SolarSystemPhysics diagnostics", () => {
  it("reports the actual galactic velocity-Verlet regime", () => {
    const physics = new SolarSystemPhysics({ activeN: 1 });
    physics.setGalacticMode(true);

    const metrics = physics.stepSimulatedSeconds(10, 0);

    expect(metrics.mode).toBe("galactic-verlet");
    expect(metrics.fallbackReason).toBeUndefined();
    expect(metrics.rejectedSubsteps).toBe(0);
  });

  it("exposes an adaptive-DP safety fallback instead of misreporting dp", () => {
    const physics = new SolarSystemPhysics({ activeN: 2 });
    // Force the documented guard branch without relying on machine speed or
    // a fragile long-running step.  This changes only the test instance.
    (physics as unknown as { maxAccelEvalsPerStep: number }).maxAccelEvalsPerStep = 0;

    const metrics = physics.stepSimulatedSeconds(10, 0);

    expect(metrics.mode).toBe("rk4-fallback");
    expect(metrics.fallbackReason).toBe("max-accel-evals");
    expect(metrics.simSecondsAdvanced).toBe(10);
    expect(metrics.rejectedSubsteps).toBe(0);
  });
});

