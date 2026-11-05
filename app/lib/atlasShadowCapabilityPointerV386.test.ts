import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV386 } from "./atlasShadowCapabilityPointerV386";

const SHA = "a".repeat(64);

describe("v386 shadow pointer", () => {
  it("parses only the qualified sensitivity and unavailable covariance boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v386",
      status:
        "photon-sensitivity-v386-qualified-covariance-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v385ComputationalBudget:
          "qualified-four-components-linear-upper-bound",
        v386SensitivityKernel: "qualified-4-rays-12-bins-56-coefficients",
        v386SourceIdentifiability: "rank-1-only-ln-g-plus-ln-T",
        v386CalibrationCovariance:
          "unavailable-12x12-2x2-12x2-required",
        v386UncertaintyProjection: "unavailable-no-covariance",
        v386AbsoluteScientificUncertainty: "not-qualified",
        v386MeasuredAuthority: "unavailable",
        v386RuntimeConsumer: "v11-spectral-breaker-bus-wired",
        v386PromotionBoundary:
          "sensitivity-only-zero-projection-zero-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV386(pointer)).toBe(pointer);
  });
});
