export type AtlasShadowCapabilityPointerV393 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v393";
  status: "covariance-source-dossier-v393-qualified-physical-sources-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v392CovarianceAdmission: "qualified-validator-projection-primitive-only";
    v393SourceDossierSchema: "qualified-3-components-3-cross-sources";
    v393DossierValidator: "qualified-9-of-9-adversarial-rejections";
    v393CorrelatedPackAssembly: "qualified-synthetic-control-only";
    v393PhysicalSourceDossier: "unavailable-0-of-3-components-0-of-3-cross-sources";
    v393ProductionPack: "not-built";
    v393ProductionProjection: "not-run";
    v393AbsoluteScientificInterval: "not-qualified";
    v393RuntimeConsumer: "v11-correlation-patchbay-wired";
    v393PromotionBoundary: "dossier-infrastructure-only-zero-physical-sources-zero-pack-zero-projection-zero-probability";
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

export function parseAtlasShadowCapabilityPointerV393(
  value: unknown,
): AtlasShadowCapabilityPointerV393 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<AtlasShadowCapabilityPointerV393>)
    : null;
  if (
    !source ||
    source.version !== "orbit-atlas-current-local-shadow-candidate-v393" ||
    source.status !==
      "covariance-source-dossier-v393-qualified-physical-sources-unavailable-browser-pending-dense-incomplete-0-of-49" ||
    source.formalProductPointer !== "v263" ||
    source.formalProductPointerAdvanced !== false ||
    source.localShadowDefaultApplied !== false ||
    source.publicDeploymentBlocked !== true ||
    source.capabilities?.v392CovarianceAdmission !==
      "qualified-validator-projection-primitive-only" ||
    source.capabilities.v393SourceDossierSchema !==
      "qualified-3-components-3-cross-sources" ||
    source.capabilities.v393DossierValidator !==
      "qualified-9-of-9-adversarial-rejections" ||
    source.capabilities.v393CorrelatedPackAssembly !==
      "qualified-synthetic-control-only" ||
    source.capabilities.v393PhysicalSourceDossier !==
      "unavailable-0-of-3-components-0-of-3-cross-sources" ||
    source.capabilities.v393ProductionPack !== "not-built" ||
    source.capabilities.v393ProductionProjection !== "not-run" ||
    source.capabilities.v393AbsoluteScientificInterval !== "not-qualified" ||
    source.capabilities.v393RuntimeConsumer !==
      "v11-correlation-patchbay-wired" ||
    source.capabilities.v393PromotionBoundary !==
      "dossier-infrastructure-only-zero-physical-sources-zero-pack-zero-projection-zero-probability" ||
    source.capabilities.v314CorrectedDense !== "incomplete-0-of-49" ||
    source.capabilities.denseAggregate !== "unavailable" ||
    source.capabilities.browserQualification !== "not-run" ||
    !SHA256.test(source.evidence?.fileSha256 ?? "") ||
    !SHA256.test(source.evidence?.canonicalSha256 ?? "") ||
    !SHA256.test(source.pointerSha256 ?? "")
  ) {
    throw new Error("v393-pointer-identity");
  }
  return value as AtlasShadowCapabilityPointerV393;
}
