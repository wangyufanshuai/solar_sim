import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV394 } from "./atlasShadowCapabilityPointerV394";

const SHA = "a".repeat(64);

describe("v394 shadow pointer", () => {
  it("keeps global propagation separate from physical covariance", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v394",
      status:
        "global-covariance-v394-qualified-physical-cross-row-model-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v393SourceDossier:
          "qualified-infrastructure-physical-sources-unavailable",
        v394InputCovariance: "qualified-36x36-1296-coefficients",
        v394OutputCovariance: "qualified-24x24-576-coefficients",
        v394BlockJacobian: "qualified-24x36",
        v394CrossRowModes: "qualified-3-synthetic-control-modes-only",
        v394Validator: "qualified-9-of-9-adversarial-rejections",
        v394PhysicalGlobalCovariance: "unavailable",
        v394ProductionPropagation: "not-run",
        v394RuntimeConsumer: "v11-covariance-lattice-wired",
        v394PromotionBoundary:
          "global-propagation-infrastructure-only-zero-physical-modes-zero-production-output-zero-probability",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v394-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV394(pointer)).toBe(pointer);
  });
});
