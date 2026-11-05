export type AtlasShadowCapabilityPointerV399 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v399";
  status: "template-diagnostic-topology-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v398IntakeManifestContract: "qualified-13-file-graph";
    v399ValueFreeTemplate: "qualified-13-slots-no-values-not-compile-eligible";
    v399Diagnostic: "staging-unavailable-13-missing-0-invalid";
    v399ProvenanceTopology: "qualified-required-16-nodes-15-edges-0-actual-sources";
    v399Validator: "qualified-8-of-8-adversarial-rejections";
    v399TemplateDownload: "local-shadow-only-wired";
    v399Compile: "not-run";
    v399MeasuredAuthority: "not-granted";
    v399RuntimeConsumer: "v11-provenance-rail-wired";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV399(value: unknown): AtlasShadowCapabilityPointerV399 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV399> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v399" || source.status !== "template-diagnostic-topology-qualified-physical-input-unavailable-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v398IntakeManifestContract !== "qualified-13-file-graph" || source.capabilities.v399ValueFreeTemplate !== "qualified-13-slots-no-values-not-compile-eligible" || source.capabilities.v399Diagnostic !== "staging-unavailable-13-missing-0-invalid" || source.capabilities.v399ProvenanceTopology !== "qualified-required-16-nodes-15-edges-0-actual-sources" || source.capabilities.v399Validator !== "qualified-8-of-8-adversarial-rejections" || source.capabilities.v399TemplateDownload !== "local-shadow-only-wired" || source.capabilities.v399Compile !== "not-run" || source.capabilities.v399MeasuredAuthority !== "not-granted" || source.capabilities.v399RuntimeConsumer !== "v11-provenance-rail-wired" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v399-pointer-identity");
  return value as AtlasShadowCapabilityPointerV399;
}
