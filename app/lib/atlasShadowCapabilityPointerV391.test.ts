import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV391 } from "./atlasShadowCapabilityPointerV391";

const SHA = "a".repeat(64);

describe("v391 shadow pointer", () => {
  it("parses trust qualification without physical promotion", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v391",
      status:
        "temperature-curvature-trust-region-v391-qualified-stress-grid-nonphysical-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v390TransferOperator: "qualified-12-rank-2-72-coefficients",
        v391AnalyticCurvature: "qualified-12-hessians",
        v391LinearTrustRegion: "qualified-minimum-radius-0.003",
        v391QuadraticTrustRegion: "qualified-minimum-radius-0.01",
        v391CrossTermSeparation: "qualified-864-mixed-corners",
        v391StressGridSemantics:
          "validation-only-nonphysical-no-probability",
        v391PhysicalCovariance: "unavailable",
        v391AbsoluteScientificInterval: "not-qualified",
        v391RuntimeConsumer: "v11-curvature-relay-wired",
        v391PromotionBoundary:
          "trust-region-only-zero-physical-vector-zero-absolute-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v391-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV391(pointer)).toBe(pointer);
  });
});
