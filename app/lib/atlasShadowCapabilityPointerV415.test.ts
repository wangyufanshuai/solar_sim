import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseAtlasShadowCapabilityPointerV415 } from "./atlasShadowCapabilityPointerV415";

describe("v415 local-shadow pointer", () => {
  it("qualifies only the deterministic fixture while measured counts remain unavailable", () => {
    const pointer = JSON.parse(
      readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v415.json", "utf8"),
    );
    expect(parseAtlasShadowCapabilityPointerV415(pointer)).toBe(pointer);
    expect(pointer.capabilities).toMatchObject({
      v414DetectorForwardModel: "qualified-sixteen-expectation-rows-fixture-only",
      v415DeterministicReplay: "qualified-sha-derived-fifty-three-bit-streams",
      v415SourceCountingModel: "qualified-explicit-high-count-normal-approximation-not-exact-integer-poisson",
      v415DarkBackgroundModel: "qualified-small-lambda-poisson-inverse-cdf",
      v415CalibrationLikelihood: "qualified-separate-cholesky-gaussian-fixture",
      v415ObservedCounts: "unavailable",
      v415ExactSourcePoissonInteger: "unavailable-count-exceeds-safe-integer",
      v415MeasuredDetectorAuthority: "unavailable-v368-authority-artifacts-missing",
      v415BrowserQualification: "not-run",
      v314CorrectedDense: "incomplete-0-of-49",
    });
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false });
  });
});
