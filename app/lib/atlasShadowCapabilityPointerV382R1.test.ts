import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV382R1 } from "./atlasShadowCapabilityPointerV382R1";

const SHA = "a".repeat(64);

describe("v382r1 shadow pointer", () => {
  it("parses only the incomplete source dossier and zero-authority boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v382r1",
      status:
        "visible-source-v382r1-parser-corrected-offline-1-of-7-attempt1-failed-no-retry-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v381PerBandIdentityModel:
          "qualified-three-lanes-independent-instrument-identities",
        v382Attempt1: "failed-parser-provenance-no-automatic-retry",
        v382r1ParserCorrection: "qualified-apostrophe-regression-covered",
        v382r1RecoveredSource: "qualified-svo-f350lp-offline-1-of-7",
        v382r1SourceDossier: "incomplete-1-of-7",
        v382r1VisibleMeasuredAuthority: "unavailable-0-of-1-visible-lane",
        v382r1MeasuredBandAuthorities: "missing-0-of-3-present",
        v382r1RuntimeConsumer: "v11-source-tape-forensic-wired",
        v382r1PromotionBoundary: "zero-authority-zero-image-zero-observed-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV382R1(pointer)).toBe(pointer);
  });
});
