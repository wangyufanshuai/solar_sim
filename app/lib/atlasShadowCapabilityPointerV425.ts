export type AtlasShadowCapabilityPointerV425 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v425";
  status: "spectral-applicability-firewall-qualified-all-v424-predictions-out-of-v413-domain-response-extrapolation-blocked-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v424IdealModelModulation: "qualified-preserved-96-rows";
    v425ExactFrequencyWavelengthEnergyConversion: "qualified-24-sources";
    v425SpectralApplicabilityAudit: "qualified";
    v425V413DomainOverlap: "none";
    v425ResponseEligibleSources: "zero-of-24";
    v425BlockedOutOfDomainSources: "24-of-24";
    v425ResponseMatrixApplications: "zero";
    v425Extrapolation: "forbidden";
    v425OpticalHwpWollastonPhysicalApplicability: "not-granted";
    v425PythonOracle: "qualified-independent";
    v425NonidealInstrumentResponseAuthority: "unavailable";
    v425MeasurementAuthority: "unavailable";
    v425DetectorAuthority: "unavailable";
    v425PhotonElectronCounts: "unavailable";
    v425PixelRasterAuthority: "unavailable";
    v425FitsAdmissionTable: "available-no-image-data";
    v425DiagnosticPng: "available-not-detector-image";
    v425BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV425(value: unknown): value is AtlasShadowCapabilityPointerV425 {
  const source = value as Partial<AtlasShadowCapabilityPointerV425> | null, capabilities = source?.capabilities;
  return !!source && source.version === "orbit-atlas-current-local-shadow-candidate-v425" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && capabilities?.v424IdealModelModulation === "qualified-preserved-96-rows" && capabilities.v425ExactFrequencyWavelengthEnergyConversion === "qualified-24-sources" && capabilities.v425SpectralApplicabilityAudit === "qualified" && capabilities.v425V413DomainOverlap === "none" && capabilities.v425ResponseEligibleSources === "zero-of-24" && capabilities.v425BlockedOutOfDomainSources === "24-of-24" && capabilities.v425ResponseMatrixApplications === "zero" && capabilities.v425Extrapolation === "forbidden" && capabilities.v425OpticalHwpWollastonPhysicalApplicability === "not-granted" && capabilities.v425PythonOracle === "qualified-independent" && capabilities.v425NonidealInstrumentResponseAuthority === "unavailable" && capabilities.v425MeasurementAuthority === "unavailable" && capabilities.v425DetectorAuthority === "unavailable" && capabilities.v425PhotonElectronCounts === "unavailable" && capabilities.v425PixelRasterAuthority === "unavailable" && capabilities.v425BrowserQualification === "not-run" && capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? "");
}
