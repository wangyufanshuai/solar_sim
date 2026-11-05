import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV388 } from "./atlasShadowCapabilityPointerV388";

const SHA = "a".repeat(64);

describe("v388 shadow pointer", () => {
  it("parses only the conditional replay and absolute-authority-withheld boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v388",
      status:
        "geometry-conditioned-temperature-v388-qualified-absolute-authority-withheld-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v387SpectralIdentifiability: "qualified-rank-1",
        v388GeometryPrior: "qualified-v296-dual-formulation-redshift",
        v388ConditionalTemperature:
          "qualified-12-inversions-augmented-rank-2",
        v388KnownNumericalBudget: "qualified-linear-upper-bound-no-rss",
        v388PhysicalSystematics: "unavailable-geometry-disk-detector",
        v388AbsoluteTemperatureAuthority: "not-qualified",
        v388MeasuredAuthority: "unavailable",
        v388RuntimeConsumer: "v11-geodesic-prior-key-wired",
        v388PromotionBoundary:
          "conditional-replay-only-zero-absolute-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV388(pointer)).toBe(pointer);
  });
});
