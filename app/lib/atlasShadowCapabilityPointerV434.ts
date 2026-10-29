export type AtlasShadowCapabilityPointerV434 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v434";
  status: "qualified-measured-authority-admission-firewall-fixture-only-no-measured-pack-science-admission-blocked-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v433JointNuisanceBoundary: "implemented-not-admitted-preserved";
    v434AdmissionValidator: "qualified-fixture-only";
    v434MutationFirewall: "12-of-12-rejected";
    v434MeasuredPack: "absent";
    v434MeasuredResponseAuthority: "unavailable";
    v434MeasuredLikelihoodAuthority: "unavailable";
    v434IndependentMeasuredHoldout: "unavailable";
    v434CrossBlockIndependence: "unavailable";
    v434IndependentReview: "not-run";
    v434ScienceBoundary: "blocked-no-measured-authority-pack";
    v434ScienceResponseApplications: "zero";
    v434BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV434(value: unknown): value is AtlasShadowCapabilityPointerV434 { const source = value as Partial<AtlasShadowCapabilityPointerV434> | null, capabilities = source?.capabilities; return Boolean(source && source.version === "orbit-atlas-current-local-shadow-candidate-v434" && source.status === "qualified-measured-authority-admission-firewall-fixture-only-no-measured-pack-science-admission-blocked-browser-pending-dense-incomplete-0-of-49" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && source.publicDeploymentBlocked === true && capabilities?.v433JointNuisanceBoundary === "implemented-not-admitted-preserved" && capabilities.v434AdmissionValidator === "qualified-fixture-only" && capabilities.v434MutationFirewall === "12-of-12-rejected" && capabilities.v434MeasuredPack === "absent" && capabilities.v434MeasuredResponseAuthority === "unavailable" && capabilities.v434MeasuredLikelihoodAuthority === "unavailable" && capabilities.v434IndependentMeasuredHoldout === "unavailable" && capabilities.v434CrossBlockIndependence === "unavailable" && capabilities.v434IndependentReview === "not-run" && capabilities.v434ScienceBoundary === "blocked-no-measured-authority-pack" && capabilities.v434ScienceResponseApplications === "zero" && capabilities.v434BrowserQualification === "not-run" && capabilities.v314CorrectedDense === "incomplete-0-of-49" && capabilities.denseAggregate === "unavailable" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? "")); }
