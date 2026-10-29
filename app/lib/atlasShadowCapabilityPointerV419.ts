export type AtlasShadowCapabilityPointerV419 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v419";
  status: "screen-coordinate-provenance-qualified-sparse-quiver-not-dense-image-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v418SparseDiagnosticProduct: "qualified-four-ray-authority-table";
    v419FiniteZamoObserver: "qualified-r30M-inclination70deg";
    v419ScreenCoordinates: "qualified-four-canonical-rays";
    v419ProjectionReplay: "qualified-local-tetrad-BL-KS";
    v419Constants: "qualified-E-Lz-Q-linked-to-v312";
    v419Polarization: "qualified-v313-EVPA-linked-to-screen-coordinates";
    v419FitsBinaryTable: "available-not-image-HDU";
    v419SparseQuiverPng: "available-not-science-image-map";
    v419PixelWcs: "unavailable";
    v419FitsImage: "unavailable-sparse-four-ray-and-no-approved-pixel-WCS";
    v419DensePolarimetricImage: "unavailable-campaign-incomplete-0-of-49";
    v419BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV419(value: unknown): value is AtlasShadowCapabilityPointerV419 {
  const source = value as Partial<AtlasShadowCapabilityPointerV419> | null;
  return !!source && source.version === "orbit-atlas-current-local-shadow-candidate-v419" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && source.capabilities?.v419ScreenCoordinates === "qualified-four-canonical-rays" && source.capabilities.v419ProjectionReplay === "qualified-local-tetrad-BL-KS" && source.capabilities.v419FitsBinaryTable === "available-not-image-HDU" && source.capabilities.v419PixelWcs === "unavailable" && source.capabilities.v419DensePolarimetricImage === "unavailable-campaign-incomplete-0-of-49" && source.capabilities.v419BrowserQualification === "not-run" && source.capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? "");
}
