export type AtlasShadowCapabilityPointerV397 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v397";
  status: "observation-admission-contract-qualified-physical-pack-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v396StructuralConstraintDesign: "qualified-60-evaluations-36-lifting-24-controls";
    v397ObservationAdmissionContract: "qualified-3-sources-3-cross-links-36-rows";
    v397Validator: "qualified-9-of-9-adversarial-rejections";
    v397PhysicalObservationPack: "unavailable";
    v397SourceLicenses: "unverified-0-of-3";
    v397PhysicalConstraintSelection: "not-executed";
    v397MeasuredAuthority: "not-granted";
    v397RuntimeConsumer: "v11-observation-airlock-wired";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV397(value: unknown): AtlasShadowCapabilityPointerV397 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV397> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v397" || source.status !== "observation-admission-contract-qualified-physical-pack-unavailable-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v396StructuralConstraintDesign !== "qualified-60-evaluations-36-lifting-24-controls" || source.capabilities.v397ObservationAdmissionContract !== "qualified-3-sources-3-cross-links-36-rows" || source.capabilities.v397Validator !== "qualified-9-of-9-adversarial-rejections" || source.capabilities.v397PhysicalObservationPack !== "unavailable" || source.capabilities.v397SourceLicenses !== "unverified-0-of-3" || source.capabilities.v397PhysicalConstraintSelection !== "not-executed" || source.capabilities.v397MeasuredAuthority !== "not-granted" || source.capabilities.v397RuntimeConsumer !== "v11-observation-airlock-wired" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v397-pointer-identity");
  return value as AtlasShadowCapabilityPointerV397;
}
