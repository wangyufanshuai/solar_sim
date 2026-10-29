export type AtlasShadowCapabilityPointerV433 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v433";
  status: "joint-nuisance-covariance-qualified-synthetic-only-science-boundary-implemented-not-admitted-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v432AlternativeLikelihoodAuthority: "qualified-preserved";
    v433JointNuisanceAnalyticMath: "qualified-synthetic-only";
    v433NegativeBinomialJointCovariance: "qualified-synthetic-only";
    v433PoissonLognormalJointCovariance: "qualified-synthetic-only";
    v433MonteCarloCrossValidation: "qualified-synthetic-only";
    v433SyntheticFactorization: "qualified-synthetic-only";
    v433MeasuredCrossBlockIndependence: "unavailable";
    v433MeasuredResponseAuthority: "unavailable";
    v433MeasuredLikelihoodAuthority: "unavailable";
    v433ScienceBoundary: "implemented-not-admitted";
    v433ScienceResponseApplications: "zero";
    v433BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;

export function isAtlasShadowCapabilityPointerV433(value: unknown): value is AtlasShadowCapabilityPointerV433 {
  const source = value as Partial<AtlasShadowCapabilityPointerV433> | null;
  const capabilities = source?.capabilities;
  return Boolean(source && source.version === "orbit-atlas-current-local-shadow-candidate-v433" && source.status === "joint-nuisance-covariance-qualified-synthetic-only-science-boundary-implemented-not-admitted-browser-pending-dense-incomplete-0-of-49" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && source.publicDeploymentBlocked === true && capabilities?.v432AlternativeLikelihoodAuthority === "qualified-preserved" && capabilities.v433JointNuisanceAnalyticMath === "qualified-synthetic-only" && capabilities.v433NegativeBinomialJointCovariance === "qualified-synthetic-only" && capabilities.v433PoissonLognormalJointCovariance === "qualified-synthetic-only" && capabilities.v433MonteCarloCrossValidation === "qualified-synthetic-only" && capabilities.v433SyntheticFactorization === "qualified-synthetic-only" && capabilities.v433MeasuredCrossBlockIndependence === "unavailable" && capabilities.v433MeasuredResponseAuthority === "unavailable" && capabilities.v433MeasuredLikelihoodAuthority === "unavailable" && capabilities.v433ScienceBoundary === "implemented-not-admitted" && capabilities.v433ScienceResponseApplications === "zero" && capabilities.v433BrowserQualification === "not-run" && capabilities.v314CorrectedDense === "incomplete-0-of-49" && capabilities.denseAggregate === "unavailable" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? ""));
}
