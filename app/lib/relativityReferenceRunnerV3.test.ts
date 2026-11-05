import { describe, expect, it } from "vitest";
import {
  canonicalRelativityReferenceRunV3,
  runRelativityReferenceRunnerV3,
  sha256RelativityReferenceRunV3,
} from "./relativityReferenceRunnerV3";

const bodyIds = ["sun", "earth", "jupiter"] as const;
const sample = {
  sampleId: "j2000-baseline",
  positionM: new Float64Array([
    0, 0, 0,
    1.495978707e11, 0, 0,
    0, 7.7857e11, 0,
  ]),
  velocityMS: new Float64Array([
    0, 0, 0,
    0, 29_784.6918, 0,
    -13_070, 0, 0,
  ]),
  massKg: new Float64Array([1.98847e30, 5.9722e24, 1.89813e27]),
} as const;

describe("post-v593 independent relativity reference runner", () => {
  it("emits deterministic per-body, aggregate, isolation, convergence and reverse-time evidence", () => {
    const run = runRelativityReferenceRunnerV3({
      bodyIds,
      samples: [sample],
      convergence: {
        coarse: sample,
        fine: { ...sample, sampleId: "j2000-baseline", positionM: sample.positionM.slice() },
        coarseStepLabel: "coarse",
        fineStepLabel: "fine",
      },
      reverseTime: true,
    });
    expect(run.bodyCount).toBe(3);
    expect(run.sampleCount).toBe(1);
    expect(run.perBody).toHaveLength(3);
    expect(run.aggregate).toHaveLength(1);
    expect(run.effectIsolation.status).toBe("complete");
    expect(run.effectIsolation.liveStateMutated).toBe(false);
    expect(run.convergence.status).toBe("evaluated");
    expect(run.convergence.pairCount).toBe(1);
    expect(run.reverseTime.status).toBe("evaluated");
    expect(run.reverseTime.fullTimeIntegration).toBe(false);
    expect(run.mode).toBe("shadow-read-only");
    expect(run.promotion).toBe("not-a-promotion-decision");
    expect(run.resultSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(run.liveStateMutated).toBe(false);
  });

  it("reproduces the exact result and seals the unsigned payload", () => {
    const input = { bodyIds, samples: [sample], reverseTime: false } as const;
    const first = runRelativityReferenceRunnerV3(input);
    const second = runRelativityReferenceRunnerV3(input);
    expect(second).toEqual(first);
    expect(sha256RelativityReferenceRunV3(first)).toBe(first.resultSha256);
    expect(canonicalRelativityReferenceRunV3(first)).toContain("shadow-read-only");
  });

  it("does not mutate caller-owned typed arrays", () => {
    const positions = sample.positionM.slice();
    const velocities = sample.velocityMS.slice();
    const masses = sample.massKg.slice();
    runRelativityReferenceRunnerV3({ bodyIds, samples: [{ ...sample, positionM: positions, velocityMS: velocities, massKg: masses }] });
    expect(Array.from(positions)).toEqual(Array.from(sample.positionM));
    expect(Array.from(velocities)).toEqual(Array.from(sample.velocityMS));
    expect(Array.from(masses)).toEqual(Array.from(sample.massKg));
  });
});

