export type AtlasShadowCapabilityPointerV431 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v431";
  status: "likelihood-stress-discriminator-and-preregistered-routing-firewall-qualified-simulated-fixture-only-alternative-likelihood-and-measured-authority-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v430CountLikelihoodMath: "qualified-preserved";
    v431SyntheticStressGeneration: "qualified";
    v431NominalPoissonRecovery: "qualified";
    v431OverdispersionDiscriminator: "qualified";
    v431CorrelationDiscriminator: "qualified";
    v431BackgroundMixtureDiscriminator: "qualified";
    v431DeadTimeDiscriminator: "qualified";
    v431PileupMigrationDiscriminator: "qualified";
    v431PreregisteredRoutingFirewall: "qualified";
    v431AlternativeLikelihoodImplementations: "zero-qualified";
    v431MeasuredObservedCounts: "zero";
    v431MeasuredHoldoutDatasets: "zero";
    v431MeasuredResidualMetrics: "zero";
    v431MeasuredValidationRuns: "zero";
    v431MeasuredInstrumentAuthority: "unavailable";
    v431ScienceResponseApplications: "zero";
    v431BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV431(value: unknown): value is AtlasShadowCapabilityPointerV431 {
  const source = value as Partial<AtlasShadowCapabilityPointerV431> | null, capabilities = source?.capabilities;
  return Boolean(source && source.version === "orbit-atlas-current-local-shadow-candidate-v431" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && capabilities?.v430CountLikelihoodMath === "qualified-preserved" && capabilities.v431SyntheticStressGeneration === "qualified" && capabilities.v431NominalPoissonRecovery === "qualified" && capabilities.v431OverdispersionDiscriminator === "qualified" && capabilities.v431CorrelationDiscriminator === "qualified" && capabilities.v431BackgroundMixtureDiscriminator === "qualified" && capabilities.v431DeadTimeDiscriminator === "qualified" && capabilities.v431PileupMigrationDiscriminator === "qualified" && capabilities.v431PreregisteredRoutingFirewall === "qualified" && capabilities.v431AlternativeLikelihoodImplementations === "zero-qualified" && capabilities.v431MeasuredObservedCounts === "zero" && capabilities.v431MeasuredHoldoutDatasets === "zero" && capabilities.v431MeasuredResidualMetrics === "zero" && capabilities.v431MeasuredValidationRuns === "zero" && capabilities.v431MeasuredInstrumentAuthority === "unavailable" && capabilities.v431ScienceResponseApplications === "zero" && capabilities.v431BrowserQualification === "not-run" && capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? ""));
}
