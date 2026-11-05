import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV396 } from "./atlasShadowCapabilityPointerV396";

const SHA = "a".repeat(64);

describe("v396 shadow pointer", () => {
  it("keeps structural constraint design separate from physical admission", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v396",
      status:
        "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v395GlobalObservability: "qualified-rank-24-nullity-12",
        v396StructuralConstraintDesign:
          "qualified-60-evaluations-36-lifting-24-controls",
        v396MinimumConstraintsForFullRank: "12",
        v396Conditioning: "qualified-maximum-7.382690818495658",
        v396InstrumentFeasibility: "unavailable",
        v396PhysicalRecommendation: "forbidden",
        v396RuntimeConsumer: "v11-constraint-forge-wired",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v396-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV396(pointer)).toBe(pointer);
  });
});
