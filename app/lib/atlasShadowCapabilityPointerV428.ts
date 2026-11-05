export type AtlasShadowCapabilityPointerV428 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v428";
  status: "response-intake-firewall-qualified-fixture-rejected-measured-submission-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v427AcquisitionPack: "qualified-preserved";
    v428SubmissionSchema: "qualified-seven-files-six-csv";
    v428ArchiveFirewall: "qualified";
    v428CsvUnitShaBridge: "qualified";
    v428PythonTypeScriptCrossValidation: "qualified";
    v428AdversarialMutations: "rejected-12-of-12";
    v428FixtureIntake: "validated-nonpublishable";
    v428MeasuredSubmissionCount: "zero";
    v428MeasuredImportAttempts: "zero";
    v428MeasuredResponseAuthority: "unavailable";
    v428IndependentScientificValidation: "not-run";
    v428ScienceResponseApplications: "zero";
    v428DetectorCounts: "unavailable";
    v428PixelRasterAuthority: "unavailable";
    v428BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV428(value: unknown): value is AtlasShadowCapabilityPointerV428 {
  const source = value as Partial<AtlasShadowCapabilityPointerV428> | null;
  const capabilities = source?.capabilities;
  return Boolean(source && source.version === "orbit-atlas-current-local-shadow-candidate-v428" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && capabilities?.v427AcquisitionPack === "qualified-preserved" && capabilities.v428SubmissionSchema === "qualified-seven-files-six-csv" && capabilities.v428ArchiveFirewall === "qualified" && capabilities.v428CsvUnitShaBridge === "qualified" && capabilities.v428PythonTypeScriptCrossValidation === "qualified" && capabilities.v428AdversarialMutations === "rejected-12-of-12" && capabilities.v428FixtureIntake === "validated-nonpublishable" && capabilities.v428MeasuredSubmissionCount === "zero" && capabilities.v428MeasuredImportAttempts === "zero" && capabilities.v428MeasuredResponseAuthority === "unavailable" && capabilities.v428IndependentScientificValidation === "not-run" && capabilities.v428ScienceResponseApplications === "zero" && capabilities.v428BrowserQualification === "not-run" && capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? ""));
}
