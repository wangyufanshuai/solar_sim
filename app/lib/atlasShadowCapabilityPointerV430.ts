export type AtlasShadowCapabilityPointerV430 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v430";
  status: "count-likelihood-residual-whitening-and-closure-math-qualified-simulated-fixture-only-measured-validation-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v429ResponseUncertainty: "qualified-preserved";
    v430PoissonLikelihoodMath: "qualified-fixture-only";
    v430DevianceResidualMath: "qualified-fixture-only";
    v430PearsonResidualMath: "qualified-fixture-only";
    v430PredictiveCovarianceWhitening: "qualified-fixture-only";
    v430AngleChannelClosure: "qualified-fixture-only";
    v430FixtureGoodnessOfFitAuthority: "not-granted";
    v430MeasuredObservedCounts: "zero";
    v430MeasuredHoldoutDatasets: "zero";
    v430MeasuredResidualMetrics: "zero";
    v430MeasuredValidationRuns: "zero";
    v430MeasuredResponseAuthority: "unavailable";
    v430ScienceResponseApplications: "zero";
    v430BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV430(value: unknown): value is AtlasShadowCapabilityPointerV430 {
  const source = value as Partial<AtlasShadowCapabilityPointerV430> | null;
  const capabilities = source?.capabilities;
  return Boolean(source && source.version === "orbit-atlas-current-local-shadow-candidate-v430" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && capabilities?.v429ResponseUncertainty === "qualified-preserved" && capabilities.v430PoissonLikelihoodMath === "qualified-fixture-only" && capabilities.v430DevianceResidualMath === "qualified-fixture-only" && capabilities.v430PearsonResidualMath === "qualified-fixture-only" && capabilities.v430PredictiveCovarianceWhitening === "qualified-fixture-only" && capabilities.v430AngleChannelClosure === "qualified-fixture-only" && capabilities.v430FixtureGoodnessOfFitAuthority === "not-granted" && capabilities.v430MeasuredObservedCounts === "zero" && capabilities.v430MeasuredHoldoutDatasets === "zero" && capabilities.v430MeasuredResidualMetrics === "zero" && capabilities.v430MeasuredValidationRuns === "zero" && capabilities.v430MeasuredResponseAuthority === "unavailable" && capabilities.v430ScienceResponseApplications === "zero" && capabilities.v430BrowserQualification === "not-run" && capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? ""));
}
