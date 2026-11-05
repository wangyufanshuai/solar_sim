import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV387 } from "./atlasShadowCapabilityPointerV387";

const SHA = "a".repeat(64);

describe("v387 shadow pointer", () => {
  it("parses only the rank-1 and covariance-unavailable boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v387",
      status:
        "photon-identifiability-v387-qualified-degeneracy-persists-covariance-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v386SensitivityKernel: "qualified-4-rays-12-bins-56-coefficients",
        v387ThreeBandIdentifiability:
          "qualified-12-measurements-global-rank-1",
        v387ContinuumDegeneracy: "persists-only-ln-g-plus-ln-T",
        v387CovarianceValidator:
          "implemented-14x14-identity-symmetry-psd",
        v387CovariancePack: "unavailable",
        v387UncertaintyProjection: "unavailable-no-covariance",
        v387AbsoluteScientificUncertainty: "not-qualified",
        v387RuntimeConsumer: "v11-rank-collapse-spectrometer-wired",
        v387PromotionBoundary:
          "identifiability-only-zero-projection-zero-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV387(pointer)).toBe(pointer);
  });
});
