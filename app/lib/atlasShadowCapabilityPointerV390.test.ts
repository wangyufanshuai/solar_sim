import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV390 } from "./atlasShadowCapabilityPointerV390";

const SHA = "a".repeat(64);

describe("v390 shadow pointer", () => {
  it("parses transfer qualification while withholding covariance projection", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v390",
      status:
        "temperature-systematics-transfer-v390-qualified-physical-covariance-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v389ExactNonlinearInterval: "qualified-12-exact-endpoint-intervals",
        v390TransferOperator: "qualified-12-rank-2-72-coefficients",
        v390FiniteDifference: "qualified-below-2e-7",
        v390PhysicalCovariance: "unavailable-five-input-classes",
        v390CovarianceProjection: "not-run-input-unavailable",
        v390AbsoluteScientificInterval: "not-qualified",
        v390MeasuredAuthority: "unavailable",
        v390RuntimeConsumer: "v11-systematics-switchyard-wired",
        v390PromotionBoundary:
          "transfer-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v390-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV390(pointer)).toBe(pointer);
  });
});
