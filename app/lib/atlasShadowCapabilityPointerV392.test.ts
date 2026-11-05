import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV392 } from "./atlasShadowCapabilityPointerV392";

const SHA = "a".repeat(64);

describe("v392 shadow pointer", () => {
  it("keeps covariance infrastructure separate from physical admission", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v392",
      status:
        "covariance-admission-v392-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v390TransferOperator: "qualified-12-rank-2-72-coefficients",
        v391TrustRegion: "qualified-linear-0.003-quadratic-0.01",
        v392CovarianceSchema: "qualified-3-input-2-output-12-row",
        v392AdmissionValidator: "qualified-6-of-6-adversarial-rejections",
        v392ProjectionPrimitive: "qualified-synthetic-control-only",
        v392PhysicalCovariance: "unavailable",
        v392ProductionProjection: "not-run",
        v392AbsoluteScientificInterval: "not-qualified",
        v392RuntimeConsumer: "v11-covariance-interlock-wired",
        v392PromotionBoundary:
          "validator-only-zero-physical-pack-zero-production-projection-zero-probability-zero-absolute-authority",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v392-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV392(pointer)).toBe(pointer);
  });
});
