import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV397 } from "./atlasShadowCapabilityPointerV397";

const SHA = "a".repeat(64);
describe("v397 shadow pointer", () => {
  it("keeps the observation contract separate from physical authority", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v397",
      status: "observation-admission-contract-qualified-physical-pack-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v396StructuralConstraintDesign: "qualified-60-evaluations-36-lifting-24-controls",
        v397ObservationAdmissionContract: "qualified-3-sources-3-cross-links-36-rows",
        v397Validator: "qualified-9-of-9-adversarial-rejections",
        v397PhysicalObservationPack: "unavailable",
        v397SourceLicenses: "unverified-0-of-3",
        v397PhysicalConstraintSelection: "not-executed",
        v397MeasuredAuthority: "not-granted",
        v397RuntimeConsumer: "v11-observation-airlock-wired",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
      evidence: { path: "dist/science/orbit-atlas-shadow-v397-evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV397(pointer)).toBe(pointer);
  });
});
