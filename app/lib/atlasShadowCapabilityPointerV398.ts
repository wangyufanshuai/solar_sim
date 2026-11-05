export type AtlasShadowCapabilityPointerV398 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v398";
  status: "local-intake-compiler-qualified-physical-staging-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v397ObservationAdmissionContract: "qualified-3-sources-3-cross-links-36-rows";
    v398IntakeManifestContract: "qualified-13-file-graph";
    v398BoundedVerifier: "qualified-path-sha-size-license-cross-evidence";
    v398Validator: "qualified-10-of-10-adversarial-rejections";
    v398StagingManifest: "unavailable";
    v398Compile: "not-run";
    v398Candidate: "unavailable";
    v398MeasuredAuthority: "not-granted";
    v398RuntimeConsumer: "v11-observation-dock-wired";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV398(value: unknown): AtlasShadowCapabilityPointerV398 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV398> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v398" || source.status !== "local-intake-compiler-qualified-physical-staging-unavailable-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v397ObservationAdmissionContract !== "qualified-3-sources-3-cross-links-36-rows" || source.capabilities.v398IntakeManifestContract !== "qualified-13-file-graph" || source.capabilities.v398BoundedVerifier !== "qualified-path-sha-size-license-cross-evidence" || source.capabilities.v398Validator !== "qualified-10-of-10-adversarial-rejections" || source.capabilities.v398StagingManifest !== "unavailable" || source.capabilities.v398Compile !== "not-run" || source.capabilities.v398Candidate !== "unavailable" || source.capabilities.v398MeasuredAuthority !== "not-granted" || source.capabilities.v398RuntimeConsumer !== "v11-observation-dock-wired" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v398-pointer-identity");
  return value as AtlasShadowCapabilityPointerV398;
}
