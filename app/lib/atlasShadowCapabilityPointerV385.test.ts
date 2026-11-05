import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV385 } from "./atlasShadowCapabilityPointerV385";

const SHA = "a".repeat(64);

describe("v385 shadow pointer", () => {
  it("parses only the computationally qualified scientifically incomplete boundary", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v385",
      status:
        "photon-error-budget-v385-computational-qualified-scientific-systematics-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v384PhotonObservable: "qualified-four-authority-disk-rays",
        v385ComputationalBudget:
          "qualified-four-components-linear-upper-bound",
        v385ScientificSystematics: "unavailable-two-of-two",
        v385CombinationRule:
          "linear-sum-rss-prohibited-unknown-not-zero",
        v385AbsoluteScientificBudget: "not-qualified",
        v385ElectronExpectation: "unavailable",
        v385ObservedCounts: "unavailable",
        v385RuntimeConsumer: "v11-uncertainty-breaker-ladder-wired",
        v385PromotionBoundary:
          "computational-only-zero-authority-zero-image-zero-counts",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV385(pointer)).toBe(pointer);
  });
});
