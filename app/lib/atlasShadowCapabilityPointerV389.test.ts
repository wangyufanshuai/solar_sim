import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV389 } from "./atlasShadowCapabilityPointerV389";

const SHA = "a".repeat(64);

describe("v389 shadow pointer", () => {
  it("parses exact conditional intervals without absolute authority", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v389",
      status:
        "exact-conditional-temperature-interval-v389-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v388ConditionalTemperature:
          "qualified-12-inversions-augmented-rank-2",
        v389ExactNonlinearInterval: "qualified-12-exact-endpoint-intervals",
        v389KnownNumericalInterval: "qualified-max-radius-below-3e-6",
        v389SourceModelInterval: "qualified-page-thorne-fourth-root",
        v389IntervalSemantics:
          "deterministic-bounds-no-confidence-no-probability-no-rss",
        v389PhysicalSystematics:
          "unavailable-detector-geometry-non-planck",
        v389AbsoluteTemperatureInterval: "not-qualified",
        v389MeasuredAuthority: "unavailable",
        v389RuntimeConsumer: "v11-interval-loom-wired",
        v389PromotionBoundary:
          "conditional-interval-only-zero-absolute-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: {
        path: "dist/science/orbit-atlas-shadow-v389-evidence.json",
        fileSha256: SHA,
        canonicalSha256: SHA,
      },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV389(pointer)).toBe(pointer);
  });
});
