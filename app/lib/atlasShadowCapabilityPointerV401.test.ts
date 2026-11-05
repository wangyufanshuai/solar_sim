import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV401 } from "./atlasShadowCapabilityPointerV401";

const SHA = "a".repeat(64);
describe("v401 shadow pointer", () => {
  it("keeps the cache bounded and every heavy qualification pending", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v401",
      status: "observation-evidence-single-flight-static-qualified-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
      capabilities: {
        v400ObservationHub: "static-qualified-4-stages-maximum-1-mounted",
        v401EvidenceCache: "static-qualified-4-stage-single-flight-maximum-1-request-each",
        v401FailurePolicy: "failed-promise-retained-no-automatic-retry",
        v401DynamicNavigation: "implemented-awaiting-browser-qualification",
        v401SnapshotBoundary: "sanitized-status-only-no-artifacts",
        v401CacheTelemetry: "entries-requests-response-bytes-128-kib-per-stage",
        v401BrowserQualification: "not-run", v401VisualMatrix: "not-run", v401Soak: "not-run", v401RtxWebGpu: "not-run",
        v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable",
      },
      evidence: { path: "dist/science/orbit-atlas-shadow-v401-evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV401(pointer)).toBe(pointer);
  });
});
