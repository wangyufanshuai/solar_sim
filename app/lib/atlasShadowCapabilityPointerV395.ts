export type AtlasShadowCapabilityPointerV395 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v395";
  status: "global-observability-v395-qualified-physical-mode-attribution-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v394GlobalCovariance: "qualified-infrastructure-physical-model-unavailable";
    v395JacobianRank: "qualified-rank-24";
    v395Nullspace: "qualified-nullity-12";
    v395Pseudoinverse: "qualified-analytic-36x24";
    v395Projectors: "qualified-observable-plus-null-equals-identity";
    v395Validator: "qualified-8-of-8-adversarial-rejections";
    v395PhysicalModeAttribution: "unavailable";
    v395NullspacePrior: "not-assigned";
    v395RuntimeConsumer: "v11-nullspace-observatory-wired";
    v395PromotionBoundary: "structural-observability-only-zero-physical-modes-zero-prior-zero-probability";
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

export function parseAtlasShadowCapabilityPointerV395(
  value: unknown,
): AtlasShadowCapabilityPointerV395 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV395>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v395" ||
    source.status !==
      "global-observability-v395-qualified-physical-mode-attribution-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v394GlobalCovariance !==
      "qualified-infrastructure-physical-model-unavailable" ||
    source.capabilities.v395JacobianRank !== "qualified-rank-24" ||
    source.capabilities.v395Nullspace !== "qualified-nullity-12" ||
    source.capabilities.v395Pseudoinverse !== "qualified-analytic-36x24" ||
    source.capabilities.v395Projectors !==
      "qualified-observable-plus-null-equals-identity" ||
    source.capabilities.v395Validator !==
      "qualified-8-of-8-adversarial-rejections" ||
    source.capabilities.v395PhysicalModeAttribution !== "unavailable" ||
    source.capabilities.v395NullspacePrior !== "not-assigned" ||
    source.capabilities.v395RuntimeConsumer !==
      "v11-nullspace-observatory-wired" ||
    source.capabilities.v395PromotionBoundary !==
      "structural-observability-only-zero-physical-modes-zero-prior-zero-probability" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v395-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV395;
}
