import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV399 } from "./atlasShadowCapabilityPointerV399";

const SHA = "a".repeat(64);
describe("v399 shadow pointer", () => {
  it("keeps the template topology separate from physical sources", () => {
    const pointer = {
      version: "orbit-atlas-current-local-shadow-candidate-v399",
      status: "template-diagnostic-topology-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49",
      formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
      capabilities: {
        v398IntakeManifestContract: "qualified-13-file-graph",
        v399ValueFreeTemplate: "qualified-13-slots-no-values-not-compile-eligible",
        v399Diagnostic: "staging-unavailable-13-missing-0-invalid",
        v399ProvenanceTopology: "qualified-required-16-nodes-15-edges-0-actual-sources",
        v399Validator: "qualified-8-of-8-adversarial-rejections",
        v399TemplateDownload: "local-shadow-only-wired",
        v399Compile: "not-run",
        v399MeasuredAuthority: "not-granted",
        v399RuntimeConsumer: "v11-provenance-rail-wired",
        v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run",
      },
      evidence: { path: "dist/science/orbit-atlas-shadow-v399-evidence.json", fileSha256: SHA, canonicalSha256: SHA },
      pointerSha256: SHA,
    } as const;
    expect(parseAtlasShadowCapabilityPointerV399(pointer)).toBe(pointer);
  });
});
