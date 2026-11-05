export type AtlasShadowCapabilityPointerV380 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v380";
  status: "measured-authority-adversarial-v380-qualified-12-of-12-fail-closed-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v379SchemaContracts: "qualified-7-of-7";
    v379BoundedAuthorityReads: "qualified-8-of-8-v375-inputs";
    v379MeasuredInputs: "missing-0-of-7-present";
    v380AdversarialCampaign: "qualified-12-of-12-fail-closed";
    v380DeterministicReplay: "qualified-identical-a-b";
    v380PromotionBoundary: "fixture-only-zero-authority-zero-observed-counts";
    v380RuntimeConsumer: "v11-fault-injection-oscilloscope-wired";
    v380DefaultBoundary: "manual-local-shadow-only-default-legacy-v9";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA256 = /^[a-f0-9]{64}$/;
export function parseAtlasShadowCapabilityPointerV380(value: unknown): AtlasShadowCapabilityPointerV380 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<AtlasShadowCapabilityPointerV380> : null;
  if (!source || source.version !== "orbit-atlas-current-local-shadow-candidate-v380" || source.status !== "measured-authority-adversarial-v380-qualified-12-of-12-fail-closed-browser-pending-dense-incomplete-0-of-49" || source.formalProductPointer !== "v263" || source.formalProductPointerAdvanced !== false || source.localShadowDefaultApplied !== false || source.publicDeploymentBlocked !== true || source.capabilities?.v379SchemaContracts !== "qualified-7-of-7" || source.capabilities.v379BoundedAuthorityReads !== "qualified-8-of-8-v375-inputs" || source.capabilities.v379MeasuredInputs !== "missing-0-of-7-present" || source.capabilities.v380AdversarialCampaign !== "qualified-12-of-12-fail-closed" || source.capabilities.v380DeterministicReplay !== "qualified-identical-a-b" || source.capabilities.v380PromotionBoundary !== "fixture-only-zero-authority-zero-observed-counts" || source.capabilities.v380RuntimeConsumer !== "v11-fault-injection-oscilloscope-wired" || source.capabilities.v380DefaultBoundary !== "manual-local-shadow-only-default-legacy-v9" || source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" || source.capabilities.denseAggregate !== "unavailable" || source.capabilities.browserQualification !== "not-run" || !SHA256.test(source.evidence?.fileSha256 ?? "") || !SHA256.test(source.evidence?.canonicalSha256 ?? "") || !SHA256.test(source.pointerSha256 ?? "")) throw new Error("v380-pointer-identity");
  return value as AtlasShadowCapabilityPointerV380;
}
