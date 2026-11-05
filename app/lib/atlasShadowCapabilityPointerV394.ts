export type AtlasShadowCapabilityPointerV394 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v394";
  status: "global-covariance-v394-qualified-physical-cross-row-model-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v393SourceDossier: "qualified-infrastructure-physical-sources-unavailable";
    v394InputCovariance: "qualified-36x36-1296-coefficients";
    v394OutputCovariance: "qualified-24x24-576-coefficients";
    v394BlockJacobian: "qualified-24x36";
    v394CrossRowModes: "qualified-3-synthetic-control-modes-only";
    v394Validator: "qualified-9-of-9-adversarial-rejections";
    v394PhysicalGlobalCovariance: "unavailable";
    v394ProductionPropagation: "not-run";
    v394RuntimeConsumer: "v11-covariance-lattice-wired";
    v394PromotionBoundary: "global-propagation-infrastructure-only-zero-physical-modes-zero-production-output-zero-probability";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
    browserQualification: "not-run";
  }>;
  evidence: Readonly<{
    path: string;
    fileSha256: string;
    canonicalSha256: string;
  }>;
  pointerSha256: string;
}>;

const SHA256 = /^[a-f0-9]{64}$/;

export function parseAtlasShadowCapabilityPointerV394(
  value: unknown,
): AtlasShadowCapabilityPointerV394 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV394>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v394" ||
    source.status !==
      "global-covariance-v394-qualified-physical-cross-row-model-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v393SourceDossier !==
      "qualified-infrastructure-physical-sources-unavailable" ||
    source.capabilities.v394InputCovariance !==
      "qualified-36x36-1296-coefficients" ||
    source.capabilities.v394OutputCovariance !==
      "qualified-24x24-576-coefficients" ||
    source.capabilities.v394BlockJacobian !== "qualified-24x36" ||
    source.capabilities.v394CrossRowModes !==
      "qualified-3-synthetic-control-modes-only" ||
    source.capabilities.v394Validator !==
      "qualified-9-of-9-adversarial-rejections" ||
    source.capabilities.v394PhysicalGlobalCovariance !== "unavailable" ||
    source.capabilities.v394ProductionPropagation !== "not-run" ||
    source.capabilities.v394RuntimeConsumer !==
      "v11-covariance-lattice-wired" ||
    source.capabilities.v394PromotionBoundary !==
      "global-propagation-infrastructure-only-zero-physical-modes-zero-production-output-zero-probability" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v394-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV394;
}
