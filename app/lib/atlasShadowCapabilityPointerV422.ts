export type AtlasShadowCapabilityPointerV422 = Readonly<{
  version: "orbit-atlas-current-local-shadow-candidate-v422";
  status: "mask-aware-polarization-orientation-basis-qualified-stokes-and-raster-unavailable-browser-pending-dense-incomplete-0-of-49";
  formalProductPointer: "v263";
  formalProductPointerAdvanced: false;
  localShadowDefaultApplied: false;
  publicDeploymentBlocked: true;
  capabilities: Readonly<{
    v421AxialVectors: "qualified-preserved";
    v421PriorPngWithdrawal: "preserved";
    v422OrientationBasis: "qualified-four-source-cos2chi-sin2chi";
    v422OrientationMask: "qualified-4-available";
    v422StokesMeasurementMask: "qualified-0-available";
    v422UnavailableSemantics: "qualified-unavailable-is-not-zero";
    v422ContinuousCoordinates: "qualified-not-pixel-samples";
    v422NearestPixelAssignment: "prohibited";
    v422Interpolation: "prohibited";
    v422RasterMask: "not-generated";
    v422SciencePixelValues: "unavailable";
    v422FitsOrientationTable: "available-primary-WCS-plus-table-no-image-data";
    v422CompassPng: "available-diagnostic-not-science-raster";
    v422FitsImage: "unavailable-no-raster-science-values";
    v422StokesCube: "unavailable-no-I-Q-U-V-measurements";
    v422BrowserQualification: "not-run";
    v314CorrectedDense: "incomplete-0-of-49";
    denseAggregate: "unavailable";
  }>;
  evidence: Readonly<{ path: string; fileSha256: string; canonicalSha256: string }>;
  pointerSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function isAtlasShadowCapabilityPointerV422(value: unknown): value is AtlasShadowCapabilityPointerV422 { const source = value as Partial<AtlasShadowCapabilityPointerV422> | null; return !!source && source.version === "orbit-atlas-current-local-shadow-candidate-v422" && source.formalProductPointer === "v263" && source.formalProductPointerAdvanced === false && source.localShadowDefaultApplied === false && source.capabilities?.v421AxialVectors === "qualified-preserved" && source.capabilities.v422OrientationBasis === "qualified-four-source-cos2chi-sin2chi" && source.capabilities.v422OrientationMask === "qualified-4-available" && source.capabilities.v422StokesMeasurementMask === "qualified-0-available" && source.capabilities.v422UnavailableSemantics === "qualified-unavailable-is-not-zero" && source.capabilities.v422NearestPixelAssignment === "prohibited" && source.capabilities.v422Interpolation === "prohibited" && source.capabilities.v422RasterMask === "not-generated" && source.capabilities.v422SciencePixelValues === "unavailable" && source.capabilities.v422FitsImage === "unavailable-no-raster-science-values" && source.capabilities.v422StokesCube === "unavailable-no-I-Q-U-V-measurements" && source.capabilities.v422BrowserQualification === "not-run" && source.capabilities.v314CorrectedDense === "incomplete-0-of-49" && SHA.test(source.evidence?.fileSha256 ?? "") && SHA.test(source.evidence?.canonicalSha256 ?? "") && SHA.test(source.pointerSha256 ?? ""); }
