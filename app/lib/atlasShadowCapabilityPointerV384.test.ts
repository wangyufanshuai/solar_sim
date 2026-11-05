import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV384 } from "./atlasShadowCapabilityPointerV384";

const SHA = "a".repeat(64);

describe("v384 shadow pointer", () => {
  it("parses only the photon-qualified electron-withheld boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v384",
      status:
        "visible-photon-v384-dual-domain-qualified-electron-authority-withheld-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v383NormalizedProfile:
          "qualified-3301-rows-400-to-700-nm-no-interpolation",
        v384PhotonObservable: "qualified-four-authority-disk-rays",
        v384DualDomainIntegration:
          "qualified-wavelength-trapezoid-vs-frequency-simpson",
        v384ElectronExpectation:
          "unavailable-no-detector-or-geometry-authority",
        v384ObservedCounts: "unavailable-expectation-boundary",
        v384SourceDossier: "incomplete-1-of-7",
        v384MeasuredBandAuthorities: "missing-0-of-3-present",
        v384RuntimeConsumer: "v11-photon-integrating-sphere-wired",
        v384PromotionBoundary:
          "photon-only-zero-electrons-zero-image-zero-observed-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV384(pointer)).toBe(pointer);
  });
});
