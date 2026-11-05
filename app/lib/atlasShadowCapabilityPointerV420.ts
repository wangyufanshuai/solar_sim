export type AtlasShadowCapabilityPointerV420 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v420";
  status: "observer-plane-WCS-and-sparse-source-catalog-qualified-no-raster-values-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v419ScreenCoordinates: "qualified-four-canonical-rays";
    v420WorldSupport: "qualified-uniform-field-41x41-alpha44M-beta32M";
    v420LinearWcs: "qualified-384x384-FITS-continuous";
    v420AstropyOracle: "qualified-world-pixel-world-roundtrip";
    v420SparseSourceCatalog: "qualified-four-coordinate-records-no-values";
    v420FitsWcsTable: "available-primary-WCS-plus-table-no-image-data";
    v420GridPng: "available-not-raster-science-image";
    v420Interpolation: "prohibited";
    v420RasterValues: "unavailable";
    v420FitsImage: "unavailable-no-raster-science-values";
    v420PolarimetricRaster: "unavailable-dense-campaign-incomplete-0-of-49";
    v420BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV420(value: unknown): value is AtlasShadowCapabilityPointerV420 {
  const source = value as Partial<AtlasShadowCapabilityPointerV420> | null;
  return !!source && source.version === "orbit-atlas-current-local-shadow-candidate-v420" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && source.capabilities?.v420LinearWcs === "qualified-384x384-FITS-continuous" && source.capabilities.v420AstropyOracle === "qualified-world-pixel-world-roundtrip" && source.capabilities.v420SparseSourceCatalog === "qualified-four-coordinate-records-no-values" && source.capabilities.v420Interpolation === "prohibited" && source.capabilities.v420RasterValues === "unavailable" && source.capabilities.v420FitsImage === "unavailable-no-raster-science-values" && source.capabilities.v420PolarimetricRaster === "unavailable-dense-campaign-incomplete-0-of-49" && source.capabilities.v420BrowserQualification === "not-run" && source.capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? "");
}
