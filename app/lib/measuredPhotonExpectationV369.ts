import type { DetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import { validateMeasuredDetectorAuthorityChainV368, type DetectorCalibrationAuthorityEnvelopeV367, type DetectorCalibrationAuthorityPointerV367 } from "./detectorResponseAuthorityGateV368";
import { KERR_PLANCK_CONSTANT_J_S_V328, parseKerrSciencePhotonBandViewV328, type KerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import { planckRadianceV278 } from "./strongGravityRenderingV278";

export const MEASURED_PHOTON_EXPECTATION_VERSION_V369 = "v369-authority-gated-measured-photon-expectation-v1" as const;
export const MEASURED_PHOTON_EXPECTATION_QUADRATURE_LIMIT_V369 = 5e-6;
const SPEED_OF_LIGHT_M_S = 299_792_458;
const SHA256 = /^[a-f0-9]{64}$/;

export type MeasuredObservationGeometryV369 = Readonly<{
  version: "v369-measured-observation-geometry-v1";
  sourceKind: "measured-instrument-geometry";
  instrumentSerialOrCampaignId: string;
  collectingAreaM2: number;
  pixelSolidAngleSr: number;
  provenance: Readonly<{ sourceUrl: string; licenseOrTerms: string; artifactSha256: string }>;
}>;

export type MeasuredPhotonExpectationRowV369 = Readonly<{
  rayIndex: number;
  bandId: "visible" | "euv" | "soft-x-ray";
  throughputWeightedPhotonRadiancePerSM2Sr: number;
  effectiveBandThroughput: number;
  sourceElectronExpectation: number;
  darkElectronExpectation: number;
  backgroundElectronExpectation: number;
  readNoiseVarianceElectronSquared: number;
  totalElectronExpectation: number;
  expectedAdu: number;
  varianceElectronSquared: number;
  standardDeviationElectron: number;
  quadratureRelativeDifference: number;
  componentSumRelativeDifference: number;
}>;

export type MeasuredPhotonExpectationV369 = Readonly<{
  version: typeof MEASURED_PHOTON_EXPECTATION_VERSION_V369;
  status: "unavailable-authority-or-observation-geometry" | "qualified-measured-expectation-operator";
  authorityGranted: boolean;
  observationGeometryQualified: boolean;
  measuredExpectationAvailable: boolean;
  unavailableReasons: readonly ("v367-v368-authority-chain-unavailable" | "measured-observation-geometry-unavailable")[];
  rows: readonly MeasuredPhotonExpectationRowV369[];
  counts: Readonly<{ rayCount: number; bandCount: number; expectationRowCount: number }>;
  maxima: Readonly<{ quadratureRelativeDifference: number; totalElectronExpectation: number; standardDeviationElectron: number }> | null;
  provenance: Readonly<{
    fullShortAuthoritySha256: string;
    authorityPointerSha256: string;
    admissionArtifactSha256: string;
    manifestFileSha256: string;
    manifestCanonicalSha256: string;
    observationGeometryArtifactSha256: string;
  }> | null;
  operator: "expected-electrons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time";
  varianceModel: "independent-poisson-source-dark-background-plus-read-noise-variance-explicit-assumption";
  summation: "neumaier-float64-componentwise-budget-preserved";
  observedCounts: "unavailable-expectation-is-not-observed-detector-counts";
  interbandCovariance: "unavailable-no-measured-cross-band-count-covariance";
  syntheticFallbackUsed: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "measured-expectation-only-no-random-sampling-no-observed-count-or-cinematic-claim";
}>;

export function parseMeasuredObservationGeometryV369(value: unknown): MeasuredObservationGeometryV369 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<MeasuredObservationGeometryV369> : null;
  if (!source
    || source.version !== "v369-measured-observation-geometry-v1"
    || source.sourceKind !== "measured-instrument-geometry"
    || typeof source.instrumentSerialOrCampaignId !== "string"
    || source.instrumentSerialOrCampaignId.trim().length < 3
    || !Number.isFinite(source.collectingAreaM2) || !(Number(source.collectingAreaM2) > 0)
    || !Number.isFinite(source.pixelSolidAngleSr) || !(Number(source.pixelSolidAngleSr) > 0)
    || !source.provenance
    || !/^https:\/\//.test(source.provenance.sourceUrl ?? "")
    || typeof source.provenance.licenseOrTerms !== "string" || source.provenance.licenseOrTerms.trim().length < 3
    || !SHA256.test(source.provenance.artifactSha256 ?? "")) throw new Error("v369-observation-geometry-identity");
  return value as MeasuredObservationGeometryV369;
}

function throughputAt(points: readonly Readonly<{ wavelengthM: number; throughput: number }>[], wavelengthM: number): number {
  if (wavelengthM < points[0].wavelengthM || wavelengthM > points.at(-1)!.wavelengthM) throw new Error("v369-throughput-coverage");
  if (wavelengthM === points[0].wavelengthM) return points[0].throughput;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1]; const right = points[index];
    if (wavelengthM > right.wavelengthM) continue;
    const fraction = (wavelengthM - left.wavelengthM) / (right.wavelengthM - left.wavelengthM);
    return left.throughput + fraction * (right.throughput - left.throughput);
  }
  throw new Error("v369-throughput-interpolation");
}

function integrateMeasuredPhotonRadiance(ray: KerrSciencePhotonBandViewV328["rays"][number], measurement: KerrSciencePhotonBandViewV328["rays"][number]["measurements"][number], manifest: DetectorCalibrationManifestV361, steps: number): number {
  const band = manifest.response.bands.find((entry) => entry.bandId === measurement.bandId);
  if (!band || steps < 2 || steps % 2 !== 0) throw new Error("v369-band-integration-boundary");
  const width = (measurement.bandUpperFrequencyHz - measurement.bandLowerFrequencyHz) / steps;
  let sum = 0;
  for (let index = 0; index <= steps; index += 1) {
    const observedFrequencyHz = measurement.bandLowerFrequencyHz + index * width;
    const observedWavelengthM = SPEED_OF_LIGHT_M_S / observedFrequencyHz;
    const emittedFrequencyHz = observedFrequencyHz / ray.redshiftFactor;
    const observedSpectralRadiance = ray.redshiftFactor ** 3 * planckRadianceV278(ray.effectiveTemperatureK, emittedFrequencyHz);
    const photonSpectralRadiance = observedSpectralRadiance / (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz);
    const weight = index === 0 || index === steps ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * photonSpectralRadiance * throughputAt(band.points, observedWavelengthM);
  }
  const integrated = sum * width / 3;
  if (!Number.isFinite(integrated) || integrated <= 0) throw new Error("v369-measured-photon-radiance-nonphysical");
  return integrated;
}

const relativeDifference = (left: number, right: number) => Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));
function neumaier(values: readonly number[]): number {
  let sum = 0; let correction = 0;
  for (const value of values) {
    const next = sum + value;
    correction += Math.abs(sum) >= Math.abs(value) ? (sum - next) + value : (value - next) + sum;
    sum = next;
  }
  return sum + correction;
}

export function createMeasuredPhotonExpectationV369(args: Readonly<{
  photonView: KerrSciencePhotonBandViewV328;
  admission: DetectorCalibrationAuthorityEnvelopeV367 | null;
  authorityPointer: DetectorCalibrationAuthorityPointerV367 | null;
  manifest: DetectorCalibrationManifestV361 | null;
  verifiedManifestFileSha256: string | null;
  verifiedManifestCanonicalSha256: string | null;
  observationGeometry: MeasuredObservationGeometryV369 | null;
}>): MeasuredPhotonExpectationV369 {
  const photonView = parseKerrSciencePhotonBandViewV328(args.photonView);
  const authority = validateMeasuredDetectorAuthorityChainV368(args);
  const geometry = args.observationGeometry ? parseMeasuredObservationGeometryV369(args.observationGeometry) : null;
  const unavailableReasons: MeasuredPhotonExpectationV369["unavailableReasons"][number][] = [];
  if (!authority) unavailableReasons.push("v367-v368-authority-chain-unavailable");
  if (!geometry) unavailableReasons.push("measured-observation-geometry-unavailable");
  const common = {
    version: MEASURED_PHOTON_EXPECTATION_VERSION_V369,
    operator: "expected-electrons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time" as const,
    varianceModel: "independent-poisson-source-dark-background-plus-read-noise-variance-explicit-assumption" as const,
    summation: "neumaier-float64-componentwise-budget-preserved" as const,
    observedCounts: "unavailable-expectation-is-not-observed-detector-counts" as const,
    interbandCovariance: "unavailable-no-measured-cross-band-count-covariance" as const,
    syntheticFallbackUsed: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicConsumerAllowed: false as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    boundary: "measured-expectation-only-no-random-sampling-no-observed-count-or-cinematic-claim" as const,
  };
  if (!authority || !geometry) return Object.freeze({ ...common, status: "unavailable-authority-or-observation-geometry", authorityGranted: Boolean(authority), observationGeometryQualified: Boolean(geometry), measuredExpectationAvailable: false, unavailableReasons: Object.freeze(unavailableReasons), rows: Object.freeze([]), counts: Object.freeze({ rayCount: 0, bandCount: 0, expectationRowCount: 0 }), maxima: null, provenance: null });
  if (geometry.instrumentSerialOrCampaignId !== authority.manifest.instrument.serialOrCampaignId) throw new Error("v369-geometry-instrument-identity");
  let maximumQuadrature = 0; let maximumExpectation = 0; let maximumSigma = 0;
  const rows = photonView.rays.flatMap((ray) => ray.measurements.map((measurement): MeasuredPhotonExpectationRowV369 => {
    const weighted = integrateMeasuredPhotonRadiance(ray, measurement, authority.manifest, 4096);
    const coarse = integrateMeasuredPhotonRadiance(ray, measurement, authority.manifest, 2048);
    const quadratureRelativeDifference = relativeDifference(weighted, coarse);
    const effectiveBandThroughput = weighted / measurement.observedPhotonRadiancePerSM2Sr;
    const sourceElectronExpectation = weighted * geometry.collectingAreaM2 * geometry.pixelSolidAngleSr * authority.manifest.calibration.exposureTimeS;
    const darkElectronExpectation = authority.manifest.noise.darkCurrent * authority.manifest.calibration.exposureTimeS;
    const backgroundElectronExpectation = authority.manifest.noise.background;
    const readNoiseVarianceElectronSquared = authority.manifest.noise.readNoiseRms ** 2;
    const totalElectronExpectation = neumaier([sourceElectronExpectation, darkElectronExpectation, backgroundElectronExpectation]);
    const expectedAdu = totalElectronExpectation / authority.manifest.noise.gain;
    const varianceElectronSquared = neumaier([sourceElectronExpectation, darkElectronExpectation, backgroundElectronExpectation, readNoiseVarianceElectronSquared]);
    const standardDeviationElectron = Math.sqrt(varianceElectronSquared);
    const componentSumRelativeDifference = Math.max(relativeDifference(expectedAdu * authority.manifest.noise.gain, totalElectronExpectation), relativeDifference(standardDeviationElectron ** 2, varianceElectronSquared));
    if (quadratureRelativeDifference >= MEASURED_PHOTON_EXPECTATION_QUADRATURE_LIMIT_V369 || componentSumRelativeDifference > 1e-15 || !(effectiveBandThroughput > 0 && effectiveBandThroughput <= 1) || ![sourceElectronExpectation, darkElectronExpectation, backgroundElectronExpectation, readNoiseVarianceElectronSquared, totalElectronExpectation, expectedAdu, varianceElectronSquared, standardDeviationElectron].every((entry) => Number.isFinite(entry) && entry > 0)) throw new Error(`v369-expectation-gate:${ray.rayIndex}:${measurement.bandId}:${quadratureRelativeDifference}:${effectiveBandThroughput}`);
    maximumQuadrature = Math.max(maximumQuadrature, quadratureRelativeDifference); maximumExpectation = Math.max(maximumExpectation, totalElectronExpectation); maximumSigma = Math.max(maximumSigma, standardDeviationElectron);
    return Object.freeze({ rayIndex: ray.rayIndex, bandId: measurement.bandId, throughputWeightedPhotonRadiancePerSM2Sr: weighted, effectiveBandThroughput, sourceElectronExpectation, darkElectronExpectation, backgroundElectronExpectation, readNoiseVarianceElectronSquared, totalElectronExpectation, expectedAdu, varianceElectronSquared, standardDeviationElectron, quadratureRelativeDifference, componentSumRelativeDifference });
  }));
  if (rows.length !== 12) throw new Error("v369-expectation-count");
  return Object.freeze({ ...common, status: "qualified-measured-expectation-operator", authorityGranted: true, observationGeometryQualified: true, measuredExpectationAvailable: true, unavailableReasons: Object.freeze([]), rows: Object.freeze(rows), counts: Object.freeze({ rayCount: 4, bandCount: 3, expectationRowCount: 12 }), maxima: Object.freeze({ quadratureRelativeDifference: maximumQuadrature, totalElectronExpectation: maximumExpectation, standardDeviationElectron: maximumSigma }), provenance: Object.freeze({ fullShortAuthoritySha256: photonView.source.fullShortAuthoritySha256, authorityPointerSha256: authority.authorityPointer.pointerSha256, admissionArtifactSha256: authority.admission.artifactSha256, manifestFileSha256: authority.verifiedManifestFileSha256, manifestCanonicalSha256: authority.verifiedManifestCanonicalSha256, observationGeometryArtifactSha256: geometry.provenance.artifactSha256 }) });
}

export function parseMeasuredPhotonExpectationV369(value: unknown): MeasuredPhotonExpectationV369 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<MeasuredPhotonExpectationV369> : null;
  if (!source
    || source.version !== MEASURED_PHOTON_EXPECTATION_VERSION_V369
    || !["unavailable-authority-or-observation-geometry", "qualified-measured-expectation-operator"].includes(source.status ?? "")
    || source.measuredExpectationAvailable !== (source.status === "qualified-measured-expectation-operator")
    || source.operator !== "expected-electrons = throughput-weighted-photon-radiance × collecting-area × pixel-solid-angle × exposure-time"
    || source.varianceModel !== "independent-poisson-source-dark-background-plus-read-noise-variance-explicit-assumption"
    || source.summation !== "neumaier-float64-componentwise-budget-preserved"
    || source.observedCounts !== "unavailable-expectation-is-not-observed-detector-counts"
    || source.interbandCovariance !== "unavailable-no-measured-cross-band-count-covariance"
    || source.syntheticFallbackUsed !== false
    || source.sciencePayloadMutationAllowed !== false
    || source.cinematicConsumerAllowed !== false
    || source.denseCampaignStatus !== "incomplete-0-of-49"
    || source.browserQualification !== "not-run"
    || source.boundary !== "measured-expectation-only-no-random-sampling-no-observed-count-or-cinematic-claim") throw new Error("v369-expectation-identity");
  if (source.status === "qualified-measured-expectation-operator" && (source.authorityGranted !== true || source.observationGeometryQualified !== true || source.counts?.rayCount !== 4 || source.counts.bandCount !== 3 || source.counts.expectationRowCount !== 12 || source.rows?.length !== 12 || !source.maxima || source.maxima.quadratureRelativeDifference >= MEASURED_PHOTON_EXPECTATION_QUADRATURE_LIMIT_V369 || !source.provenance || !Object.values(source.provenance).every((entry) => SHA256.test(entry)))) throw new Error("v369-expectation-qualified");
  if (source.status === "unavailable-authority-or-observation-geometry" && (source.measuredExpectationAvailable !== false || source.rows?.length !== 0 || source.counts?.expectationRowCount !== 0 || source.maxima !== null || source.provenance !== null || (source.unavailableReasons?.length ?? 0) < 1)) throw new Error("v369-expectation-unavailable");
  return value as MeasuredPhotonExpectationV369;
}
