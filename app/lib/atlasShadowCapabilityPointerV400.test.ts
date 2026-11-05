import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV400 } from "./atlasShadowCapabilityPointerV400";

const SHA = "a".repeat(64);
describe("v400 shadow pointer", () => {
  it("keeps V12 manual and all heavy qualifications pending", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v400",
      status: "observation-hub-v12-static-qualified-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
      capabilities: {
        v399ValueFreeTemplate: "qualified-13-slots-no-values-not-compile-eligible",
        v400VisualProfile: "science-cinematic-v12-stable-v11-frozen",
        v400ScienceBoundary: "qualified-linear-exposure-1-bloom-0-noise-0",
        v400ObservationHub: "static-qualified-4-stages-maximum-1-mounted",
        v400ResourceTelemetry: "direct-dom-registry-workers-textures-gpu-object-urls-camera-leases",
        v400ManualAb: "local-shadow-only-default-legacy-v9",
        v400BrowserQualification: "not-run", v400VisualMatrix: "not-run", v400Soak: "not-run", v400RtxWebGpu: "not-run",
        v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable",
      },
      evidence: { path: "dist/science/orbit-atlas-shadow-v400-evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV400(pointer)).toBe(pointer);
  });
});
