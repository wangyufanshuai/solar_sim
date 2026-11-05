import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV398 } from "./atlasShadowCapabilityPointerV398";

const SHA = "a".repeat(64);
describe("v398 shadow pointer", () => {
  it("keeps the compiler implemented while staging and authority remain absent", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v398",
      status: "local-intake-compiler-qualified-physical-staging-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v397ObservationAdmissionContract: "qualified-3-sources-3-cross-links-36-rows",
        v398IntakeManifestContract: "qualified-13-file-graph",
        v398BoundedVerifier: "qualified-path-sha-size-license-cross-evidence",
        v398Validator: "qualified-10-of-10-adversarial-rejections",
        v398StagingManifest: "unavailable",
        v398Compile: "not-run",
        v398Candidate: "unavailable",
        v398MeasuredAuthority: "not-granted",
        v398RuntimeConsumer: "v11-observation-dock-wired",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "dist/science/orbit-atlas-shadow-v398-evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV398(pointer)).toBe(pointer);
  });
});
