import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV381 } from "./atlasShadowCapabilityPointerV381";

const SHA = "a".repeat(64);

describe("v381 shadow pointer", () => {
  it("parses only the corrected zero-authority local-shadow boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v381",
      status:
        "measured-authority-identity-v381-corrected-per-band-inputs-0-of-3-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v379HistoricalStructuralContracts: "qualified-7-of-7",
        v379HistoricalMeasuredInputs: "missing-0-of-7-present",
        v380AdversarialCampaign: "qualified-12-of-12-fail-closed",
        v381LegacyScientificFusion:
          "withdrawn-single-instrument-three-band-identity-not-demonstrated",
        v381PerBandIdentityModel:
          "qualified-three-lanes-independent-instrument-identities",
        v381MeasuredBandAuthorities: "missing-0-of-3-present",
        v381NextRequiredInput:
          "one-traceable-measured-detector-and-geometry-pair-for-one-band",
        v381RuntimeConsumer: "v11-spectral-authority-patch-bay-wired",
        v381PromotionBoundary: "zero-authority-zero-image-zero-observed-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV381(pointer)).toBe(pointer);
  });
});
