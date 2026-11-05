export type AtlasShadowCapabilityPointerV418 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v418";
  status: "sparse-polarimetric-diagnostic-product-qualified-not-a-science-image-measured-authority-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v297PolarizationAuthority: "full-kerr-short-authority-qualified";
    v328PhotonRadiance: "qualified-four-ray-fixed-band-input";
    v417InstrumentPrecisionFixture: "qualified-nonlinear-coverage-fixture-only";
    v418SparseDiagnosticProduct: "qualified-four-ray-authority-table";
    v418JsonCsv: "available-science-diagnostic-table";
    v418FitsBinaryTable: "available-not-image-HDU";
    v418PngDiagnostic: "available-not-science-image";
    v418FitsImage: "unavailable-dense-and-screen-coordinate-boundary";
    v418ScienceImageMap: "unavailable-dense-and-screen-coordinate-boundary";
    v418ImagePlaneCoordinates: "unavailable";
    v418MeasuredPolarization: "unavailable";
    v418BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV418(value: unknown): value is AtlasShadowCapabilityPointerV418 {
  const pointer = value as Partial<AtlasShadowCapabilityPointerV418> | null;
  return !!pointer
    && pointer.version === "orbit-atlas-current-local-shadow-candidate-v418"
    && pointer.formalProductPointer === "v263"
    && pointer.formalProductPointerAdvanced === false
    && pointer.localShadowDefaultApplied === false
    && pointer.capabilities?.v418SparseDiagnosticProduct === "qualified-four-ray-authority-table"
    && pointer.capabilities.v418FitsBinaryTable === "available-not-image-HDU"
    && pointer.capabilities.v418FitsImage === "unavailable-dense-and-screen-coordinate-boundary"
    && pointer.capabilities.v418ScienceImageMap === "unavailable-dense-and-screen-coordinate-boundary"
    && pointer.capabilities.v418MeasuredPolarization === "unavailable"
    && pointer.capabilities.v418BrowserQualification === "not-run"
    && pointer.capabilities.v314CorrectedDense === "incomplete-0-of-49"
    && SHA.test(pointer.evidence?.fileSha256 ?? "")
    && SHA.test(pointer.evidence?.canonicalSha256 ?? "")
    && SHA.test(pointer.pointerSha256 ?? "");
}
