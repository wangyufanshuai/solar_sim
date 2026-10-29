export type AtlasShadowCapabilityPointerV424 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v424";
  status: "ideal-model-predicted-dual-beam-modulation-qualified-measurement-detector-counts-pixel-raster-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v423PredictedStokes: "qualified-preserved-24-rows";
    v410IdealOperatorReference: "qualified-preserved-reference-only";
    v424IdealHwpWollastonModulation: "qualified-96-rows";
    v424PredictedBeamSpectralRadiances: "qualified-192-values";
    v424FourAngleReconstruction: "qualified-24-reconstructions";
    v424BeamConservation: "qualified";
    v424WpKsPaths: "preserved-independent";
    v424PythonOracle: "qualified-independent";
    v424MeasurementAuthority: "unavailable";
    v424MeasuredMuellerCalibration: "unavailable";
    v424ThroughputGainNoiseCovariance: "unavailable";
    v424PhotonElectronCounts: "unavailable";
    v424DetectorAuthority: "unavailable";
    v424PixelRasterAuthority: "unavailable";
    v424FitsPredictionTable: "available-no-image-data";
    v424DiagnosticPng: "available-not-detector-image";
    v424BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV424(value: unknown): value is AtlasShadowCapabilityPointerV424 {
  const source = value as Partial<AtlasShadowCapabilityPointerV424> | null;
  const capabilities = source?.capabilities;
  return !!source &&
    source.version === "orbit-atlas-current-local-shadow-candidate-v424" &&
    source.formalProductPointer === "v263" &&
    source.formalProductPointerAdvanced === false &&
    source.localShadowDefaultApplied === false &&
    capabilities?.v423PredictedStokes === "qualified-preserved-24-rows" &&
    capabilities.v410IdealOperatorReference === "qualified-preserved-reference-only" &&
    capabilities.v424IdealHwpWollastonModulation === "qualified-96-rows" &&
    capabilities.v424PredictedBeamSpectralRadiances === "qualified-192-values" &&
    capabilities.v424FourAngleReconstruction === "qualified-24-reconstructions" &&
    capabilities.v424BeamConservation === "qualified" &&
    capabilities.v424WpKsPaths === "preserved-independent" &&
    capabilities.v424PythonOracle === "qualified-independent" &&
    capabilities.v424MeasurementAuthority === "unavailable" &&
    capabilities.v424MeasuredMuellerCalibration === "unavailable" &&
    capabilities.v424ThroughputGainNoiseCovariance === "unavailable" &&
    capabilities.v424PhotonElectronCounts === "unavailable" &&
    capabilities.v424DetectorAuthority === "unavailable" &&
    capabilities.v424PixelRasterAuthority === "unavailable" &&
    capabilities.v424BrowserQualification === "not-run" &&
    capabilities.v314CorrectedDense === "incomplete-0-of-49" &&
    SHA.test(source.evidence?.fileSha256 ?? "") &&
    SHA.test(source.evidence?.canonicalSha256 ?? "") &&
    SHA.test(source.pointerSha256 ?? "");
}
