import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV395 } from "./atlasShadowCapabilityPointerV395";

const SHA = "a".repeat(64);

describe("v395 shadow pointer", () => {
  it("keeps structural observability separate from physical attribution", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v395",
      status:
        "global-observability-v395-qualified-physical-mode-attribution-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v394GlobalCovariance:
          "qualified-infrastructure-physical-model-unavailable",
        v395JacobianRank: "qualified-rank-24",
        v395Nullspace: "qualified-nullity-12",
        v395Pseudoinverse: "qualified-analytic-36x24",
        v395Projectors: "qualified-observable-plus-null-equals-identity",
        v395Validator: "qualified-8-of-8-adversarial-rejections",
        v395PhysicalModeAttribution: "unavailable",
        v395NullspacePrior: "not-assigned",
        v395RuntimeConsumer: "v11-nullspace-observatory-wired",
        v395PromotionBoundary:
          "structural-observability-only-zero-physical-modes-zero-prior-zero-probability",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v395-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV395(pointer)).toBe(pointer);
  });
});
