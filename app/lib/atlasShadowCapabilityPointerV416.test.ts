import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseAtlasShadowCapabilityPointerV416 } from "./atlasShadowCapabilityPointerV416";

describe("v416 local-shadow pointer", () => {
  it("qualifies fixture coverage while measured recovery remains unavailable", () => {
    const pointer = JSON.parse(
      readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v416.json", "utf8"),
    );
    expect(parseAtlasShadowCapabilityPointerV416(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({
      v415DetectorLikelihood: "qualified-deterministic-fixture-only",
      v416EffectiveMuellerResponse: "qualified-four-rays-spectrum-weighted-four-by-four",
      v416NoiselessStokesRecovery: "qualified",
      v416StreamingEnsemble: "qualified-four-thousand-ninety-six-trials-per-ray",
      v416CountingPullCoverage: "qualified-separate-high-count-small-poisson-read-noise",
      v416CalibrationPullCoverage: "qualified-separate-multivariate-gaussian",
      v416ObservedCounts: "unavailable",
      v416MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      v416BrowserQualification: "not-run",
      v314CorrectedDense: "incomplete-0-of-49",
    });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false });
  });
});
