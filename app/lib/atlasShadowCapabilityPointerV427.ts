export type AtlasShadowCapabilityPointerV427 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v427";
  status: "high-energy-response-empty-acquisition-pack-and-validator-qualified-measured-authority-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v426ResponseContract: "qualified-preserved";
    v427AcquisitionPack: "qualified-nine-files";
    v427MeasurementTemplates: "qualified-seven-empty-zero-rows";
    v427ValidatorFixture: "qualified-nonpublishable";
    v427InvalidFixtureMutations: "rejected-12-of-12";
    v427DeterministicZip: "available-empty-templates-only";
    v427AcquisitionPlanFits: "available-no-measured-response";
    v427ArchitecturePng: "available-not-detector-image";
    v427MeasuredResponseAuthority: "unavailable";
    v427ScienceResponseApplications: "zero";
    v427DetectorCounts: "unavailable";
    v427PixelRasterAuthority: "unavailable";
    v427BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV427(value: unknown): value is AtlasShadowCapabilityPointerV427 {
  const source = value as Partial<AtlasShadowCapabilityPointerV427> | null;
  const capabilities = source?.capabilities;
  return Boolean(
    source &&
    source.version === "orbit-atlas-current-local-shadow-candidate-v427" &&
    source.formalProductPointer === "v263" &&
    source.formalProductPointerAdvanced === false &&
    source.localShadowDefaultApplied === false &&
    capabilities?.v426ResponseContract === "qualified-preserved" &&
    capabilities.v427AcquisitionPack === "qualified-nine-files" &&
    capabilities.v427MeasurementTemplates === "qualified-seven-empty-zero-rows" &&
    capabilities.v427ValidatorFixture === "qualified-nonpublishable" &&
    capabilities.v427InvalidFixtureMutations === "rejected-12-of-12" &&
    capabilities.v427MeasuredResponseAuthority === "unavailable" &&
    capabilities.v427ScienceResponseApplications === "zero" &&
    capabilities.v427DetectorCounts === "unavailable" &&
    capabilities.v427PixelRasterAuthority === "unavailable" &&
    capabilities.v427BrowserQualification === "not-run" &&
    capabilities.v314CorrectedDense === "incomplete-0-of-49" &&
    SHA.test(source.evidence?.fileSha256 ?? "") &&
    SHA.test(source.evidence?.canonicalSha256 ?? "") &&
    SHA.test(source.pointerSha256 ?? ""),
  );
}
