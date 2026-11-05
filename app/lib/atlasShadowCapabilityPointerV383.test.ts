import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV383 } from "./atlasShadowCapabilityPointerV383";

const SHA = "a".repeat(64);

describe("v383 shadow pointer", () => {
  it("parses only the qualified normalization and withheld authority boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v383",
      status:
        "visible-throughput-v383-dual-implementation-qualified-candidate-only-authority-withheld-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v382r1RecoveredSource: "qualified-svo-f350lp-offline-1-of-7",
        v382r1SourceDossier: "incomplete-1-of-7",
        v383NormalizedProfile:
          "qualified-3301-rows-400-to-700-nm-no-interpolation",
        v383DualImplementation:
          "qualified-typescript-float64-vs-python-decimal50",
        v383SourceRowIdentity: "qualified-canonical-sha-identical",
        v383VisibleMeasuredAuthority:
          "withheld-no-noise-or-geometry-authority",
        v383MeasuredBandAuthorities: "missing-0-of-3-present",
        v383RuntimeConsumer: "v11-dual-path-spectrophotometer-wired",
        v383PromotionBoundary: "candidate-only-zero-image-zero-observed-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV383(pointer)).toBe(pointer);
  });
});
