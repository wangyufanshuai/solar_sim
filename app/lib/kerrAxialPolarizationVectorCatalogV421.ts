import { createHash } from "node:crypto";

import { parseKerrObserverPlaneWcsArtifactV420, type KerrObserverPlaneWcsArtifactV420 } from "./kerrObserverPlaneWcsV420";
import { parseKerrSparsePolarimetricArtifactV418, type KerrSparsePolarimetricArtifactV418 } from "./kerrSparsePolarimetricProductV418";

export const KERR_AXIAL_VECTOR_VERSION_V421 = "v421-kerr-WCS-aware-axial-polarization-vector-catalog-v1" as const;
export const KERR_AXIAL_VECTOR_ARTIFACT_VERSION_V421 = "v421-kerr-axial-polarization-vector-artifact-v1" as const;
export const KERR_AXIAL_VECTOR_SUMMARY_VERSION_V421 = "v421-kerr-axial-polarization-vector-summary-v1" as const;
export const KERR_AXIAL_VECTOR_RESPONSE_VERSION_V421 = "v421-kerr-axial-polarization-vector-response-v1" as const;
export const KERR_V420_ARTIFACT_SHA256_V421 = "db07f09edfdf76cadaf8a3d709fb4c4781e5b71750b2e6c0d2fbe55a17e19152" as const;
export const KERR_V420_FILE_SHA256_V421 = "e6c8ca822d81575d640b90ad87eeb49658d5c88afc44f473b0620fcefadac337" as const;
export const KERR_V418_ARTIFACT_SHA256_V421 = "89bcfa79f4fcbcbddffcff8779d6b92eba1f7eff0e961834e44e063aae586e81" as const;
export const KERR_V418_FILE_SHA256_V421 = "209601e9da0c8a1dd7bd097889fb4c6b1309ae3ff5e08052d928b08e45d83c77" as const;
export const KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421 = "9af38d3306febbb6d2becd1a7a65d8c8fa970262bf7a3d2dd6aae441beda8326" as const;

type RayIndex = 12 | 13 | 14 | 15;
type RayId = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type Point = Readonly<{ alphaM: number; betaM: number; pixelX: number; pixelY: number }>;
export type KerrAxialPolarizationVectorRowV421 = Readonly<{
  rayIndex: RayIndex;
  rayId: RayId;
  spinA: number;
  authorityEvpaDeg: number;
  axialPeriodDeg: 180;
  screenAngleConvention: "atan2-alpha-component-beta-component-from-plus-beta-toward-plus-alpha";
  axialOrientationTensor: Readonly<{ cosTwoChi: number; sinTwoChi: number; normResidual: number }>;
  worldDirectionUnit: Readonly<{ alpha: number; beta: number; normResidual: number }>;
  presentationGlyph: Readonly<{
    halfLengthM: 2;
    lengthSemantic: "fixed-display-scale-not-polarization-magnitude";
    negative: Point;
    positive: Point;
    midpointResidualM: number;
    recoveredAxialEvpaResidualDeg: number;
    plus180EndpointSetResidualM: number;
  }>;
  instrumentPrecisionFixture: Readonly<{
    countingSigmaEvpaDeg: number;
    calibrationSigmaEvpaDeg: number;
    applicability: "adjacent-fixture-not-applied-to-authority-vector";
    confidenceWedgeGenerated: false;
  }>;
  intensity: null;
  stokesAmplitude: null;
  interpolationAllowed: false;
}>;

export type KerrAxialPolarizationVectorViewV421 = Readonly<{
  version: typeof KERR_AXIAL_VECTOR_VERSION_V421;
  status: "qualified-four-ray-WCS-aware-axial-vector-catalog-prior-quiver-display-withdrawn";
  source: Readonly<{ v420ObserverWcsArtifactSha256: typeof KERR_V420_ARTIFACT_SHA256_V421; v418InstrumentFixtureArtifactSha256: typeof KERR_V418_ARTIFACT_SHA256_V421; screenEvpaImplementationSha256: typeof KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421 }>;
  convention: Readonly<{
    evpaDefinition: "atan2-horizontal-alpha-vertical-beta-modulo-180-degrees";
    zeroDirection: "plus-beta";
    positiveDirection: "toward-plus-alpha";
    worldDirection: "dAlpha=sin-chi-dBeta=cos-chi";
    cssRotation: "chi-minus-90-degrees-from-positive-screen-x";
    imageDirection: "dx=sin-chi-dy=minus-cos-chi";
  }>;
  priorDisplayAudit: Readonly<{
    v419NumericalCoordinates: "qualified-preserved";
    v419NumericalEvpa: "qualified-preserved";
    v419PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch";
    v420NumericalWcs: "qualified-preserved";
    v420PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch";
    historicalFilesOverwritten: false;
  }>;
  rows: readonly KerrAxialPolarizationVectorRowV421[];
  counts: Readonly<{ vectorRowCount: 4; axialTensorCount: 4; WcsEndpointCount: 8; intensityValueCount: 0; stokesAmplitudeCount: 0 }>;
  maxima: Readonly<{ directionNormResidual: number; axialTensorNormResidual: number; midpointResidualM: number; recoveredAxialEvpaResidualDeg: number; plus180EndpointSetResidualM: number; pythonOracleEndpointDifference: number }>;
  thresholds: Readonly<{ directionNormResidual: 1e-12; axialTensorNormResidual: 1e-12; midpointResidualM: 1e-12; recoveredAxialEvpaResidualDeg: 1e-12; plus180EndpointSetResidualM: 1e-12; pythonOracleEndpointDifference: 1e-10 }>;
  products: Readonly<{ json: "available-axial-vector-catalog"; csv: "available-axial-vector-catalog"; fitsBinaryTable: "available-WCS-aware-vector-endpoint-table-no-image-data"; png: "available-corrected-sparse-axial-quiver-not-raster-image"; fitsImage: "unavailable-no-raster-science-values"; densePolarimetricImage: "unavailable-campaign-incomplete-0-of-49" }>;
  scienceCinematicBoundary: Readonly<{ science: "authority-EVPA-axial-tensor-and-WCS-endpoints"; cinematic: "may-style-glyph-background-and-fixed-length-only"; coordinateMutationAllowed: false; evpaMutationAllowed: false; intensitySynthesisAllowed: false; fixtureUncertaintyAppliedToAuthority: false }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "corrected-four-ray-axial-vector-catalog-no-raster-intensity-stokes-amplitude-or-dense-image";
}>;

export type KerrAxialPolarizationVectorArtifactV421 = Readonly<{ version: typeof KERR_AXIAL_VECTOR_ARTIFACT_VERSION_V421; generatedAt: string; status: KerrAxialPolarizationVectorViewV421["status"]; sourceFiles: Readonly<{ v420FileSha256: typeof KERR_V420_FILE_SHA256_V421; v418FileSha256: typeof KERR_V418_FILE_SHA256_V421; screenEvpaImplementationFileSha256: typeof KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421; pythonOracleFileSha256: string }>; pythonOracleArtifactSha256: string; view: KerrAxialPolarizationVectorViewV421; deterministicReplay: true; networkAttempted: false; denseShardExecuted: false; rasterScienceImageGenerated: false; artifactSha256: string }>;
export type KerrAxialPolarizationVectorSummaryV421 = Readonly<{ version: typeof KERR_AXIAL_VECTOR_SUMMARY_VERSION_V421; status: KerrAxialPolarizationVectorViewV421["status"]; artifactSha256: string; convention: KerrAxialPolarizationVectorViewV421["convention"]; priorDisplayAudit: KerrAxialPolarizationVectorViewV421["priorDisplayAudit"]; rows: readonly KerrAxialPolarizationVectorRowV421[]; maxima: KerrAxialPolarizationVectorViewV421["maxima"]; products: KerrAxialPolarizationVectorViewV421["products"]; denseCampaignStatus: "incomplete-0-of-49"; fullArtifactAvailable: true; boundary: "bounded-four-vector-summary-no-raster-array-in-react-state" }>;
export type KerrAxialPolarizationVectorResponseV421 = Readonly<{ version: typeof KERR_AXIAL_VECTOR_RESPONSE_VERSION_V421; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrAxialPolarizationVectorSummaryV421 | null }>;

type PythonOracle = Readonly<{ version: string; status: string; rows: readonly Readonly<{ rayIndex: number; negative: Point; positive: Point; axialTensorCos: number; axialTensorSin: number; recoveredAxialEvpaResidualDeg: number; plus180EndpointSetResidualM: number }>[]; maxima: Readonly<{ directionNormResidual: number; axialTensorNormResidual: number; worldPixelWorldResidualM: number; recoveredAxialEvpaResidualDeg: number; plus180EndpointSetResidualM: number }>; artifactSha256: string }>;
const SHA = /^[a-f0-9]{64}$/;
const transient = new Set(["generatedAt", "artifactSha256"]);
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
export const canonicalShaV421 = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const axialDifference = (left: number, right: number) => { const difference = Math.abs(left - right) % 180; return Math.min(difference, 180 - difference); };

export function createKerrAxialPolarizationVectorViewV421(v420Value: unknown, v418Value: unknown, oracleValue: unknown): KerrAxialPolarizationVectorViewV421 {
  const v420: KerrObserverPlaneWcsArtifactV420 = parseKerrObserverPlaneWcsArtifactV420(v420Value);
  const v418: KerrSparsePolarimetricArtifactV418 = parseKerrSparsePolarimetricArtifactV418(v418Value);
  const oracle = oracleValue as PythonOracle;
  if (v420.artifactSha256 !== KERR_V420_ARTIFACT_SHA256_V421 || v418.artifactSha256 !== KERR_V418_ARTIFACT_SHA256_V421 || oracle.version !== "v421-kerr-axial-vector-python-oracle-v1" || oracle.status !== "qualified-independent-axial-vector-WCS-endpoints" || !SHA.test(oracle.artifactSha256) || oracle.rows?.length !== 4 || !oracle.maxima || oracle.maxima.directionNormResidual >= 1e-12 || oracle.maxima.axialTensorNormResidual >= 1e-12 || oracle.maxima.worldPixelWorldResidualM >= 1e-12 || oracle.maxima.recoveredAxialEvpaResidualDeg >= 1e-12 || oracle.maxima.plus180EndpointSetResidualM >= 1e-12) throw new Error("v421-source-lock");
  const wcs = v420.view.wcs;
  const worldToPixel = (alphaM: number, betaM: number) => ({ pixelX: alphaM / wcs.cdelt1MPerPixel + wcs.crpix1, pixelY: betaM / wcs.cdelt2MPerPixel + wcs.crpix2 });
  let pythonOracleEndpointDifference = 0;
  const rows = v420.view.catalog.rows.map((source): KerrAxialPolarizationVectorRowV421 => {
    const fixture = v418.view.rows.find((row) => row.rayIndex === source.rayIndex && row.rayId === source.rayId);
    const oracleRow = oracle.rows.find((row) => row.rayIndex === source.rayIndex);
    if (!fixture || !oracleRow) throw new Error(`v421-row-source:${source.rayId}`);
    const chi = source.authorityEvpaDeg * Math.PI / 180;
    const directionAlpha = Math.sin(chi), directionBeta = Math.cos(chi);
    const halfLength = 2;
    const negativeWorld = { alphaM: source.alphaM - halfLength * directionAlpha, betaM: source.betaM - halfLength * directionBeta };
    const positiveWorld = { alphaM: source.alphaM + halfLength * directionAlpha, betaM: source.betaM + halfLength * directionBeta };
    const negative = Object.freeze({ ...negativeWorld, ...worldToPixel(negativeWorld.alphaM, negativeWorld.betaM) });
    const positive = Object.freeze({ ...positiveWorld, ...worldToPixel(positiveWorld.alphaM, positiveWorld.betaM) });
    const recovered = Math.atan2(positive.alphaM - negative.alphaM, positive.betaM - negative.betaM) * 180 / Math.PI;
    const plus180 = chi + Math.PI;
    const plus180Negative = { alphaM: source.alphaM - halfLength * Math.sin(plus180), betaM: source.betaM - halfLength * Math.cos(plus180) };
    const plus180Positive = { alphaM: source.alphaM + halfLength * Math.sin(plus180), betaM: source.betaM + halfLength * Math.cos(plus180) };
    const plus180EndpointSetResidualM = Math.max(Math.abs(negative.alphaM - plus180Positive.alphaM), Math.abs(negative.betaM - plus180Positive.betaM), Math.abs(positive.alphaM - plus180Negative.alphaM), Math.abs(positive.betaM - plus180Negative.betaM));
    const midpointResidualM = Math.max(Math.abs((negative.alphaM + positive.alphaM) / 2 - source.alphaM), Math.abs((negative.betaM + positive.betaM) / 2 - source.betaM));
    const orientationTensor = { cosTwoChi: Math.cos(2 * chi), sinTwoChi: Math.sin(2 * chi) };
    pythonOracleEndpointDifference = Math.max(pythonOracleEndpointDifference, ...(["alphaM", "betaM", "pixelX", "pixelY"] as const).flatMap((key) => [Math.abs(negative[key] - oracleRow.negative[key]), Math.abs(positive[key] - oracleRow.positive[key])]), Math.abs(orientationTensor.cosTwoChi - oracleRow.axialTensorCos), Math.abs(orientationTensor.sinTwoChi - oracleRow.axialTensorSin));
    return Object.freeze({ rayIndex: source.rayIndex, rayId: source.rayId, spinA: source.spinA, authorityEvpaDeg: source.authorityEvpaDeg, axialPeriodDeg: 180, screenAngleConvention: "atan2-alpha-component-beta-component-from-plus-beta-toward-plus-alpha", axialOrientationTensor: Object.freeze({ ...orientationTensor, normResidual: Math.abs(Math.hypot(orientationTensor.cosTwoChi, orientationTensor.sinTwoChi) - 1) }), worldDirectionUnit: Object.freeze({ alpha: directionAlpha, beta: directionBeta, normResidual: Math.abs(Math.hypot(directionAlpha, directionBeta) - 1) }), presentationGlyph: Object.freeze({ halfLengthM: 2, lengthSemantic: "fixed-display-scale-not-polarization-magnitude", negative, positive, midpointResidualM, recoveredAxialEvpaResidualDeg: axialDifference(recovered, source.authorityEvpaDeg), plus180EndpointSetResidualM }), instrumentPrecisionFixture: Object.freeze({ countingSigmaEvpaDeg: fixture.instrumentFixture.counting.marginalSigmaEvpaDeg, calibrationSigmaEvpaDeg: fixture.instrumentFixture.calibration.marginalSigmaEvpaDeg, applicability: "adjacent-fixture-not-applied-to-authority-vector", confidenceWedgeGenerated: false }), intensity: null, stokesAmplitude: null, interpolationAllowed: false });
  });
  const maxima = Object.freeze({ directionNormResidual: Math.max(...rows.map((row) => row.worldDirectionUnit.normResidual)), axialTensorNormResidual: Math.max(...rows.map((row) => row.axialOrientationTensor.normResidual)), midpointResidualM: Math.max(...rows.map((row) => row.presentationGlyph.midpointResidualM)), recoveredAxialEvpaResidualDeg: Math.max(...rows.map((row) => row.presentationGlyph.recoveredAxialEvpaResidualDeg)), plus180EndpointSetResidualM: Math.max(...rows.map((row) => row.presentationGlyph.plus180EndpointSetResidualM)), pythonOracleEndpointDifference });
  if (maxima.directionNormResidual >= 1e-12 || maxima.axialTensorNormResidual >= 1e-12 || maxima.midpointResidualM >= 1e-12 || maxima.recoveredAxialEvpaResidualDeg >= 1e-12 || maxima.plus180EndpointSetResidualM >= 1e-12 || maxima.pythonOracleEndpointDifference >= 1e-10) throw new Error(`v421-vector-gate:${JSON.stringify(maxima)}`);
  return Object.freeze({ version: KERR_AXIAL_VECTOR_VERSION_V421, status: "qualified-four-ray-WCS-aware-axial-vector-catalog-prior-quiver-display-withdrawn", source: Object.freeze({ v420ObserverWcsArtifactSha256: KERR_V420_ARTIFACT_SHA256_V421, v418InstrumentFixtureArtifactSha256: KERR_V418_ARTIFACT_SHA256_V421, screenEvpaImplementationSha256: KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421 }), convention: Object.freeze({ evpaDefinition: "atan2-horizontal-alpha-vertical-beta-modulo-180-degrees", zeroDirection: "plus-beta", positiveDirection: "toward-plus-alpha", worldDirection: "dAlpha=sin-chi-dBeta=cos-chi", cssRotation: "chi-minus-90-degrees-from-positive-screen-x", imageDirection: "dx=sin-chi-dy=minus-cos-chi" }), priorDisplayAudit: Object.freeze({ v419NumericalCoordinates: "qualified-preserved", v419NumericalEvpa: "qualified-preserved", v419PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch", v420NumericalWcs: "qualified-preserved", v420PngQuiverOrientation: "withdrawn-display-only-90-degree-convention-mismatch", historicalFilesOverwritten: false }), rows: Object.freeze(rows), counts: Object.freeze({ vectorRowCount: 4, axialTensorCount: 4, WcsEndpointCount: 8, intensityValueCount: 0, stokesAmplitudeCount: 0 }), maxima, thresholds: Object.freeze({ directionNormResidual: 1e-12, axialTensorNormResidual: 1e-12, midpointResidualM: 1e-12, recoveredAxialEvpaResidualDeg: 1e-12, plus180EndpointSetResidualM: 1e-12, pythonOracleEndpointDifference: 1e-10 }), products: Object.freeze({ json: "available-axial-vector-catalog", csv: "available-axial-vector-catalog", fitsBinaryTable: "available-WCS-aware-vector-endpoint-table-no-image-data", png: "available-corrected-sparse-axial-quiver-not-raster-image", fitsImage: "unavailable-no-raster-science-values", densePolarimetricImage: "unavailable-campaign-incomplete-0-of-49" }), scienceCinematicBoundary: Object.freeze({ science: "authority-EVPA-axial-tensor-and-WCS-endpoints", cinematic: "may-style-glyph-background-and-fixed-length-only", coordinateMutationAllowed: false, evpaMutationAllowed: false, intensitySynthesisAllowed: false, fixtureUncertaintyAppliedToAuthority: false }), denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", boundary: "corrected-four-ray-axial-vector-catalog-no-raster-intensity-stokes-amplitude-or-dense-image" });
}

export function parseKerrAxialPolarizationVectorArtifactV421(value: unknown): KerrAxialPolarizationVectorArtifactV421 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrAxialPolarizationVectorArtifactV421> : null;
  if (!source || source.version !== KERR_AXIAL_VECTOR_ARTIFACT_VERSION_V421 || source.status !== "qualified-four-ray-WCS-aware-axial-vector-catalog-prior-quiver-display-withdrawn" || source.sourceFiles?.v420FileSha256 !== KERR_V420_FILE_SHA256_V421 || source.sourceFiles.v418FileSha256 !== KERR_V418_FILE_SHA256_V421 || source.sourceFiles.screenEvpaImplementationFileSha256 !== KERR_SCREEN_EVPA_IMPLEMENTATION_SHA256_V421 || !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") || !SHA.test(source.pythonOracleArtifactSha256 ?? "") || source.view?.rows?.length !== 4 || source.view.counts.vectorRowCount !== 4 || source.view.counts.intensityValueCount !== 0 || source.view.rows.some((row) => row.intensity !== null || row.stokesAmplitude !== null || row.interpolationAllowed !== false || row.instrumentPrecisionFixture.confidenceWedgeGenerated !== false) || source.view.priorDisplayAudit.historicalFilesOverwritten !== false || source.view.priorDisplayAudit.v419PngQuiverOrientation !== "withdrawn-display-only-90-degree-convention-mismatch" || source.view.products.fitsImage !== "unavailable-no-raster-science-values" || source.view.denseCampaignStatus !== "incomplete-0-of-49" || source.deterministicReplay !== true || source.networkAttempted !== false || source.denseShardExecuted !== false || source.rasterScienceImageGenerated !== false || !SHA.test(source.artifactSha256 ?? "")) throw new Error("v421-artifact-identity");
  return value as KerrAxialPolarizationVectorArtifactV421;
}
export function createKerrAxialPolarizationVectorSummaryV421(value: unknown): KerrAxialPolarizationVectorSummaryV421 { const artifact = parseKerrAxialPolarizationVectorArtifactV421(value); return Object.freeze({ version: KERR_AXIAL_VECTOR_SUMMARY_VERSION_V421, status: artifact.status, artifactSha256: artifact.artifactSha256, convention: artifact.view.convention, priorDisplayAudit: artifact.view.priorDisplayAudit, rows: artifact.view.rows, maxima: artifact.view.maxima, products: artifact.view.products, denseCampaignStatus: "incomplete-0-of-49", fullArtifactAvailable: true, boundary: "bounded-four-vector-summary-no-raster-array-in-react-state" }); }
export function parseKerrAxialPolarizationVectorSummaryV421(value: unknown): KerrAxialPolarizationVectorSummaryV421 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrAxialPolarizationVectorSummaryV421> : null; if (!source || source.version !== KERR_AXIAL_VECTOR_SUMMARY_VERSION_V421 || !SHA.test(source.artifactSha256 ?? "") || source.rows?.length !== 4 || source.priorDisplayAudit?.v419PngQuiverOrientation !== "withdrawn-display-only-90-degree-convention-mismatch" || source.products?.fitsImage !== "unavailable-no-raster-science-values" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.boundary !== "bounded-four-vector-summary-no-raster-array-in-react-state") throw new Error("v421-summary-identity"); return value as KerrAxialPolarizationVectorSummaryV421; }
export function parseKerrAxialPolarizationVectorResponseV421(value: unknown): KerrAxialPolarizationVectorResponseV421 { const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrAxialPolarizationVectorResponseV421> : null; if (!source || source.version !== KERR_AXIAL_VECTOR_RESPONSE_VERSION_V421) throw new Error("v421-response-version"); if (source.available === true && source.reason === "ready" && source.summary) return Object.freeze({ ...source, summary: parseKerrAxialPolarizationVectorSummaryV421(source.summary) }) as KerrAxialPolarizationVectorResponseV421; if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) return source as KerrAxialPolarizationVectorResponseV421; throw new Error("v421-response-identity"); }
export function serializeKerrAxialPolarizationVectorCsvV421(view: KerrAxialPolarizationVectorViewV421): string { const header = ["ray_index", "ray_id", "spin_a", "authority_evpa_deg", "tensor_cos_2chi", "tensor_sin_2chi", "direction_alpha", "direction_beta", "negative_alpha_M", "negative_beta_M", "negative_pixel_x", "negative_pixel_y", "positive_alpha_M", "positive_beta_M", "positive_pixel_x", "positive_pixel_y", "counting_fixture_sigma_evpa_deg", "calibration_fixture_sigma_evpa_deg", "intensity", "stokes_amplitude", "interpolation_allowed"]; const rows = view.rows.map((row) => [row.rayIndex, row.rayId, row.spinA, row.authorityEvpaDeg, row.axialOrientationTensor.cosTwoChi, row.axialOrientationTensor.sinTwoChi, row.worldDirectionUnit.alpha, row.worldDirectionUnit.beta, row.presentationGlyph.negative.alphaM, row.presentationGlyph.negative.betaM, row.presentationGlyph.negative.pixelX, row.presentationGlyph.negative.pixelY, row.presentationGlyph.positive.alphaM, row.presentationGlyph.positive.betaM, row.presentationGlyph.positive.pixelX, row.presentationGlyph.positive.pixelY, row.instrumentPrecisionFixture.countingSigmaEvpaDeg, row.instrumentPrecisionFixture.calibrationSigmaEvpaDeg, "", "", row.interpolationAllowed]); return `${[header, ...rows].map((row) => row.join(",")).join("\n")}\n`; }
