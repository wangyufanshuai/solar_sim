export type AtlasShadowCapabilityPointerV421 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v421";
  status: "axial-polarization-vector-orientation-corrected-prior-quiver-display-withdrawn-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v419NumericalCoordinates: "qualified-preserved";
    v419NumericalEvpa: "qualified-preserved";
    v419PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch";
    v420NumericalWcs: "qualified-preserved";
    v420PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch";
    v421EvpaConvention: "qualified-zero-plus-beta-positive-toward-plus-alpha";
    v421AxialTensor: "qualified-cos2chi-sin2chi";
    v421WcsEndpoints: "qualified-eight-endpoints-independent-astropy-oracle";
    v421VectorCatalog: "qualified-four-authority-rays";
    v421FitsVectorTable: "available-primary-WCS-plus-binary-table-no-image-data";
    v421CorrectedPng: "available-sparse-axial-quiver-not-science-raster";
    v421HistoricalFilesOverwritten: false;
    v421Intensity: "unavailable";
    v421StokesAmplitude: "unavailable";
    v421Interpolation: "prohibited";
    v421FitsImage: "unavailable-no-raster-science-values";
    v421BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV421(value: unknown): value is AtlasShadowCapabilityPointerV421 {
  const source = value as Partial<AtlasShadowCapabilityPointerV421> | null;
  return !!source
    && source.version === "orbit-atlas-current-local-shadow-candidate-v421"
    && source.formalProductPointer === "v263"
    && source.formalProductPointerAdvanced === false
    && source.localShadowDefaultApplied === false
    && source.capabilities?.v419NumericalCoordinates === "qualified-preserved"
    && source.capabilities.v419PngQuiverOrientation === "withdrawn-display-only-90-degree-convention-mismatch"
    && source.capabilities.v420NumericalWcs === "qualified-preserved"
    && source.capabilities.v420PngQuiverOrientation === "withdrawn-display-only-90-degree-convention-mismatch"
    && source.capabilities.v421EvpaConvention === "qualified-zero-plus-beta-positive-toward-plus-alpha"
    && source.capabilities.v421AxialTensor === "qualified-cos2chi-sin2chi"
    && source.capabilities.v421WcsEndpoints === "qualified-eight-endpoints-independent-astropy-oracle"
    && source.capabilities.v421HistoricalFilesOverwritten === false
    && source.capabilities.v421Intensity === "unavailable"
    && source.capabilities.v421StokesAmplitude === "unavailable"
    && source.capabilities.v421Interpolation === "prohibited"
    && source.capabilities.v421FitsImage === "unavailable-no-raster-science-values"
    && source.capabilities.v421BrowserQualification === "not-run"
    && source.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && SHA.test(source.evidence?.fileSha256 ?? "")
    && SHA.test(source.evidence?.canonicalSha256 ?? "")
    && SHA.test(source.pointerSha256 ?? "");
}
