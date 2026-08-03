import { createHash } from "node:crypto";
import {
  parsePolarimeterCalibrationInspectV411,
  type PolarimeterCalibrationInspectV411,
} from "./kerrPolarimeterCalibrationV411";
import {
  parseKerrPolarimeterSpectralArtifactV413,
  type KerrPolarimeterSpectralArtifactV413,
} from "./kerrPolarimeterSpectralResponseV413";
import {
  parseKerrPredictedPolarimeterArtifactV424,
  type KerrPredictedPolarimeterArtifactV424,
} from "./kerrPredictedPolarimeterV424";

export const KERR_INSTRUMENT_SPECTRAL_ADMISSION_VERSION_V425 =
  "v425-kerr-instrument-spectral-applicability-firewall-v1" as const;
export const KERR_INSTRUMENT_SPECTRAL_ADMISSION_ARTIFACT_VERSION_V425 =
  "v425-kerr-instrument-spectral-applicability-firewall-artifact-v1" as const;
export const KERR_INSTRUMENT_SPECTRAL_ADMISSION_SUMMARY_VERSION_V425 =
  "v425-kerr-instrument-spectral-applicability-firewall-summary-v1" as const;
export const KERR_INSTRUMENT_SPECTRAL_ADMISSION_RESPONSE_VERSION_V425 =
  "v425-kerr-instrument-spectral-applicability-firewall-response-v1" as const;

export const KERR_V424_ARTIFACT_SHA256_V425 =
  "934f3038aa2ca30fa804346008528c33479f5af5b09a173fca55cf0f76d4139d" as const;
export const KERR_V424_FILE_SHA256_V425 =
  "ee46fa0819b9f41e30b4dd053d069c99783a50cb0afcdb2b34e095daa1b5e024" as const;
export const KERR_V411_ARTIFACT_SHA256_V425 =
  "9382399d3184a5480f085ecc4e3679ba593f814db8a73c8abba15eb3eec58ced" as const;
export const KERR_V411_FILE_SHA256_V425 =
  "5bd1831f70860125fb1e841f801566e0c92517cf7d9d6ad7748ad5812f4e2a31" as const;
export const KERR_V413_ARTIFACT_SHA256_V425 =
  "f4a10d65ca5e0c49495cf5be6b3a27298a4048da7acbdaba264905d3cf4ccd6f" as const;
export const KERR_V413_FILE_SHA256_V425 =
  "d8972aa256d4ee1818ad3e4075e27c09e20a37c738e0853fa4a44068146e1413" as const;

export const SPEED_OF_LIGHT_M_PER_S_V425 = 299_792_458 as const;
export const PLANCK_CONSTANT_J_S_V425 = 6.626_070_15e-34 as const;
export const ELEMENTARY_CHARGE_C_V425 = 1.602_176_634e-19 as const;

type RayIdV425 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type TransportV425 = "walker-penrose" | "independent-ks-parallel-transport";

export type KerrInstrumentSpectralAdmissionRowV425 = Readonly<{
  rayId: RayIdV425;
  rayIndex: 12 | 13 | 14 | 15;
  transportMethod: TransportV425;
  observedFrequencyHz: number;
  vacuumWavelengthM: number;
  vacuumWavelengthNm: number;
  photonEnergyJ: number;
  photonEnergyEv: number;
  continuousCoordinate: Readonly<{
    pixelX: number;
    pixelY: number;
    semantics: "FITS-1-based-continuous-source-coordinate-not-pixel-sample";
  }>;
  calibrationDomainM: readonly [4e-7, 8e-7];
  lowerBoundaryGapFactor: number;
  domainRelation: "below-v413-calibration-wavelength-domain";
  affectedV424ModulationRowCount: 4;
  responseEligible: false;
  extrapolationAllowed: false;
  v413ResponseMatrixApplied: false;
  opticalHwpWollastonPhysicalApplicabilityGranted: false;
  measuredCalibrationAvailable: false;
  detectorProjectionApplied: false;
  provenance: Readonly<{
    source: "v424-ideal-model-predicted-polarimeter";
    conversion: "lambda=c/f-and-E=h*f-with-SI-defining-constants";
    predictionNotMeasurement: true;
    spectralAdmissionNotInstrumentResponse: true;
  }>;
}>;

export type KerrInstrumentBandSummaryV425 = Readonly<{
  observedFrequencyHz: number;
  vacuumWavelengthNm: number;
  photonEnergyEv: number;
  sourcePredictionCount: 8;
  affectedV424ModulationRowCount: 32;
  responseEligibleCount: 0;
  domainRelation: "below-v413-calibration-wavelength-domain";
}>;

export type KerrInstrumentSpectralAdmissionViewV425 = Readonly<{
  version: typeof KERR_INSTRUMENT_SPECTRAL_ADMISSION_VERSION_V425;
  status: "qualified-spectral-applicability-firewall-all-24-source-predictions-outside-v413-domain-nonideal-projection-blocked";
  source: Readonly<{
    v424PredictedPolarimeterArtifactSha256: typeof KERR_V424_ARTIFACT_SHA256_V425;
    v411CalibrationContractArtifactSha256: typeof KERR_V411_ARTIFACT_SHA256_V425;
    v413SpectralFixtureArtifactSha256: typeof KERR_V413_ARTIFACT_SHA256_V425;
  }>;
  constants: Readonly<{
    speedOfLightMPerS: typeof SPEED_OF_LIGHT_M_PER_S_V425;
    planckConstantJS: typeof PLANCK_CONSTANT_J_S_V425;
    elementaryChargeC: typeof ELEMENTARY_CHARGE_C_V425;
    status: "exact-SI-defining-constants";
  }>;
  domains: Readonly<{
    v424PredictionWavelengthM: readonly [number, number];
    v413FixtureWavelengthM: readonly [4e-7, 8e-7];
    overlapM: null;
    overlapFraction: 0;
    extrapolation: "forbidden";
  }>;
  counts: Readonly<{
    sourcePredictionCount: 24;
    auditedFrequencyCount: 3;
    auditedTransportMethodCount: 2;
    affectedV424ModulationRowCount: 96;
    responseEligibleSourceCount: 0;
    blockedOutOfDomainSourceCount: 24;
    v413ResponseMatrixApplicationCount: 0;
    measuredCalibrationRowCount: 0;
    detectorProjectionCount: 0;
    photonOrElectronCountProductCount: 0;
  }>;
  rows: readonly KerrInstrumentSpectralAdmissionRowV425[];
  bandSummaries: readonly KerrInstrumentBandSummaryV425[];
  metrics: Readonly<{
    minimumPredictionWavelengthM: number;
    maximumPredictionWavelengthM: number;
    minimumPhotonEnergyEv: number;
    maximumPhotonEnergyEv: number;
    nearestLowerBoundaryGapFactor: number;
    farthestLowerBoundaryGapFactor: number;
    maximumPythonOracleRelativeDifference: number;
    deterministicReplayDifference: 0;
  }>;
  thresholds: Readonly<{
    conversionOracleRelativeDifference: 1e-15;
    responseEligibleSourceCount: 0;
    responseMatrixApplicationCount: 0;
    overlapFraction: 0;
  }>;
  futureMeasuredResponseRequirements: readonly [
    "band-appropriate-polarimeter-architecture-not-assumed-HWP-Wollaston",
    "measured-energy-or-wavelength-resolved-modulation-response",
    "measured-response-covariance-and-cross-bin-covariance",
    "effective-area-throughput-and-exposure-provenance",
    "detector-quantum-efficiency-gain-read-noise-and-background",
    "independent-validation-and-conditioning",
    "raw-artifact-SHA-license-and-processing-provenance"
  ];
  qualification: Readonly<{
    exactFrequencyWavelengthEnergyConversionQualified: true;
    allSourcePredictionsAudited: true;
    v411CalibrationContractPreserved: true;
    v413FixtureDomainPreserved: true;
    outOfDomainFirewallQualified: true;
    independentPythonOracleQualified: true;
    nonidealMuellerProjectionQualified: false;
    measuredInstrumentResponseQualified: false;
    detectorProjectionQualified: false;
    photonOrElectronCountsQualified: false;
    pixelRasterQualified: false;
    denseAuthorityQualified: false;
  }>;
  authorityBoundary: Readonly<{
    spectralApplicabilityAuditQualified: true;
    nonidealInstrumentResponseAuthorityGranted: false;
    measurementAuthorityGranted: false;
    detectorAuthorityGranted: false;
    pixelRasterAuthorityGranted: false;
    denseAuthorityGranted: false;
    unavailableIsNotZero: true;
  }>;
  products: Readonly<{
    json: "available-24-row-spectral-admission-catalog";
    csv: "available-24-row-spectral-admission-catalog";
    fitsBinaryTable: "available-frequency-wavelength-energy-admission-table-no-image-data";
    png: "available-log-wavelength-domain-diagnostic-not-detector-image";
    responseMatrixProduct: "unavailable-zero-in-domain-sources";
    measuredCounts: "unavailable-no-band-appropriate-measured-response";
  }>;
  scienceCinematicBoundary: Readonly<{
    science: "immutable-spectral-domain-admission-and-provenance";
    cinematic: "may-style-domain-rail-and-quarantine-markers-only";
    responseValueFabricationAllowed: false;
    measurementClaimAllowed: false;
    detectorImageClaimAllowed: false;
  }>;
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "spectral-applicability-audit-only-all-v424-sources-outside-v413-domain-no-extrapolated-Mueller-response-measurement-detector-counts-pixel-raster-or-dense-authority";
}>;

export type KerrInstrumentSpectralAdmissionArtifactV425 = Readonly<{
  version: typeof KERR_INSTRUMENT_SPECTRAL_ADMISSION_ARTIFACT_VERSION_V425;
  generatedAt: string;
  status: KerrInstrumentSpectralAdmissionViewV425["status"];
  sourceFiles: Readonly<{
    v424FileSha256: typeof KERR_V424_FILE_SHA256_V425;
    v411FileSha256: typeof KERR_V411_FILE_SHA256_V425;
    v413FileSha256: typeof KERR_V413_FILE_SHA256_V425;
    pythonOracleFileSha256: string;
  }>;
  pythonOracleArtifactSha256: string;
  view: KerrInstrumentSpectralAdmissionViewV425;
  deterministicReplay: true;
  networkAttempted: false;
  denseShardExecuted: false;
  responseMatrixApplicationAttempted: false;
  measurementAuthorityGranted: false;
  detectorAuthorityGranted: false;
  artifactSha256: string;
}>;

export type KerrInstrumentSpectralAdmissionSummaryV425 = Readonly<{
  version: typeof KERR_INSTRUMENT_SPECTRAL_ADMISSION_SUMMARY_VERSION_V425;
  status: KerrInstrumentSpectralAdmissionViewV425["status"];
  artifactSha256: string;
  constants: KerrInstrumentSpectralAdmissionViewV425["constants"];
  domains: KerrInstrumentSpectralAdmissionViewV425["domains"];
  counts: KerrInstrumentSpectralAdmissionViewV425["counts"];
  bandSummaries: readonly KerrInstrumentBandSummaryV425[];
  metrics: KerrInstrumentSpectralAdmissionViewV425["metrics"];
  futureMeasuredResponseRequirements: KerrInstrumentSpectralAdmissionViewV425["futureMeasuredResponseRequirements"];
  qualification: KerrInstrumentSpectralAdmissionViewV425["qualification"];
  authorityBoundary: KerrInstrumentSpectralAdmissionViewV425["authorityBoundary"];
  products: KerrInstrumentSpectralAdmissionViewV425["products"];
  denseCampaignStatus: "incomplete-0-of-49";
  fullArtifactAvailable: true;
  boundary: "bounded-three-band-summary-no-24-row-admission-array-or-response-matrix-in-react-state";
}>;

export type KerrInstrumentSpectralAdmissionResponseV425 = Readonly<{
  version: typeof KERR_INSTRUMENT_SPECTRAL_ADMISSION_RESPONSE_VERSION_V425;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrInstrumentSpectralAdmissionSummaryV425 | null;
}>;

type OracleV425 = Readonly<{
  version: "v425-kerr-instrument-spectral-applicability-python-oracle-v1";
  status: "qualified-all-v424-predictions-outside-v413-domain-response-application-blocked";
  rows: readonly Readonly<{
    rayId: string;
    observedFrequencyHz: number;
    transportMethod: string;
    vacuumWavelengthM: number;
    photonEnergyJ: number;
    photonEnergyEv: number;
    lowerBoundaryGapFactor: number;
    responseEligible: false;
  }>[];
  counts: Readonly<{ sourcePredictionCount: 24; responseEligibleSourceCount: 0; blockedOutOfDomainSourceCount: 24 }>;
  artifactSha256: string;
}>;

const SHA = /^[a-f0-9]{64}$/;
const TRANSIENT = new Set(["generatedAt", "artifactSha256"]);
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !TRANSIENT.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
export const canonicalShaV425 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const relative = (left: number, right: number) => Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), 1e-300);
const key = (value: { rayId: string; observedFrequencyHz: number; transportMethod: string }) =>
  `${value.rayId}:${value.observedFrequencyHz}:${value.transportMethod}`;

export function createKerrInstrumentSpectralAdmissionViewV425(
  v424Value: unknown,
  v411Value: unknown,
  v413Value: unknown,
  oracleValue: unknown,
): KerrInstrumentSpectralAdmissionViewV425 {
  const v424: KerrPredictedPolarimeterArtifactV424 = parseKerrPredictedPolarimeterArtifactV424(v424Value);
  const v411: PolarimeterCalibrationInspectV411 = parsePolarimeterCalibrationInspectV411(v411Value);
  const v413: KerrPolarimeterSpectralArtifactV413 = parseKerrPolarimeterSpectralArtifactV413(v413Value);
  const oracle = oracleValue as OracleV425;
  if (
    v424.artifactSha256 !== KERR_V424_ARTIFACT_SHA256_V425 ||
    v411.artifactSha256 !== KERR_V411_ARTIFACT_SHA256_V425 ||
    v413.artifactSha256 !== KERR_V413_ARTIFACT_SHA256_V425 ||
    oracle.version !== "v425-kerr-instrument-spectral-applicability-python-oracle-v1" ||
    oracle.status !== "qualified-all-v424-predictions-outside-v413-domain-response-application-blocked" ||
    oracle.rows?.length !== 24 ||
    oracle.counts?.sourcePredictionCount !== 24 ||
    oracle.counts.responseEligibleSourceCount !== 0 ||
    oracle.counts.blockedOutOfDomainSourceCount !== 24 ||
    !SHA.test(oracle.artifactSha256)
  ) throw new Error("v425-source-lock");
  if (
    v411.current.measuredManifestPresent !== false ||
    v411.current.measuredCalibrationRowCount !== 0 ||
    v411.wavelengthBoundary !== "each-science-frequency-requires-in-domain-calibration-no-cross-band-hwp-assumption" ||
    v413.pack.sourceKind !== "test-fixture" ||
    v413.view.wavelengthDomainM.join(",") !== "4e-7,8e-7" ||
    v413.pack.extrapolation !== "forbidden" ||
    v413.measuredPackPresent !== false ||
    v413.measuredAuthorityGranted !== false
  ) throw new Error("v425-calibration-domain-contract");

  let maximumPythonOracleRelativeDifference = 0;
  const rows = v424.view.reconstructions.map((source): KerrInstrumentSpectralAdmissionRowV425 => {
    const modulation = v424.view.modulationRows.find((entry) => key(entry) === key(source));
    const oracleRow = oracle.rows.find((entry) => key(entry) === key(source));
    if (!modulation || !oracleRow) throw new Error(`v425-row-identity:${key(source)}`);
    const vacuumWavelengthM = SPEED_OF_LIGHT_M_PER_S_V425 / source.observedFrequencyHz;
    const photonEnergyJ = PLANCK_CONSTANT_J_S_V425 * source.observedFrequencyHz;
    const photonEnergyEv = photonEnergyJ / ELEMENTARY_CHARGE_C_V425;
    const lowerBoundaryGapFactor = v413.view.wavelengthDomainM[0] / vacuumWavelengthM;
    maximumPythonOracleRelativeDifference = Math.max(
      maximumPythonOracleRelativeDifference,
      relative(vacuumWavelengthM, oracleRow.vacuumWavelengthM),
      relative(photonEnergyJ, oracleRow.photonEnergyJ),
      relative(photonEnergyEv, oracleRow.photonEnergyEv),
      relative(lowerBoundaryGapFactor, oracleRow.lowerBoundaryGapFactor),
    );
    if (vacuumWavelengthM >= 4e-7 || oracleRow.responseEligible !== false) {
      throw new Error(`v425-unexpected-domain-overlap:${key(source)}`);
    }
    return Object.freeze({
      rayId: source.rayId,
      rayIndex: source.rayIndex,
      transportMethod: source.transportMethod,
      observedFrequencyHz: source.observedFrequencyHz,
      vacuumWavelengthM,
      vacuumWavelengthNm: vacuumWavelengthM * 1e9,
      photonEnergyJ,
      photonEnergyEv,
      continuousCoordinate: modulation.continuousCoordinate,
      calibrationDomainM: Object.freeze([4e-7, 8e-7] as const),
      lowerBoundaryGapFactor,
      domainRelation: "below-v413-calibration-wavelength-domain",
      affectedV424ModulationRowCount: 4,
      responseEligible: false,
      extrapolationAllowed: false,
      v413ResponseMatrixApplied: false,
      opticalHwpWollastonPhysicalApplicabilityGranted: false,
      measuredCalibrationAvailable: false,
      detectorProjectionApplied: false,
      provenance: Object.freeze({
        source: "v424-ideal-model-predicted-polarimeter",
        conversion: "lambda=c/f-and-E=h*f-with-SI-defining-constants",
        predictionNotMeasurement: true,
        spectralAdmissionNotInstrumentResponse: true,
      }),
    });
  });
  const frequencies = [...new Set(rows.map((row) => row.observedFrequencyHz))].sort((left, right) => left - right);
  const bandSummaries = frequencies.map((observedFrequencyHz): KerrInstrumentBandSummaryV425 => {
    const band = rows.filter((row) => row.observedFrequencyHz === observedFrequencyHz);
    if (band.length !== 8) throw new Error(`v425-band-count:${observedFrequencyHz}`);
    return Object.freeze({
      observedFrequencyHz,
      vacuumWavelengthNm: band[0].vacuumWavelengthNm,
      photonEnergyEv: band[0].photonEnergyEv,
      sourcePredictionCount: 8,
      affectedV424ModulationRowCount: 32,
      responseEligibleCount: 0,
      domainRelation: "below-v413-calibration-wavelength-domain",
    });
  });
  const wavelengths = rows.map((row) => row.vacuumWavelengthM);
  const energies = rows.map((row) => row.photonEnergyEv);
  const gaps = rows.map((row) => row.lowerBoundaryGapFactor);
  const metrics = Object.freeze({
    minimumPredictionWavelengthM: Math.min(...wavelengths),
    maximumPredictionWavelengthM: Math.max(...wavelengths),
    minimumPhotonEnergyEv: Math.min(...energies),
    maximumPhotonEnergyEv: Math.max(...energies),
    nearestLowerBoundaryGapFactor: Math.min(...gaps),
    farthestLowerBoundaryGapFactor: Math.max(...gaps),
    maximumPythonOracleRelativeDifference,
    deterministicReplayDifference: 0 as const,
  });
  if (
    rows.length !== 24 ||
    bandSummaries.length !== 3 ||
    rows.some((row) => row.responseEligible !== false || row.extrapolationAllowed !== false || row.v413ResponseMatrixApplied !== false) ||
    metrics.maximumPredictionWavelengthM >= 4e-7 ||
    metrics.maximumPythonOracleRelativeDifference >= 1e-15
  ) throw new Error(`v425-spectral-admission-gate:${JSON.stringify(metrics)}`);

  return Object.freeze({
    version: KERR_INSTRUMENT_SPECTRAL_ADMISSION_VERSION_V425,
    status: "qualified-spectral-applicability-firewall-all-24-source-predictions-outside-v413-domain-nonideal-projection-blocked",
    source: Object.freeze({
      v424PredictedPolarimeterArtifactSha256: KERR_V424_ARTIFACT_SHA256_V425,
      v411CalibrationContractArtifactSha256: KERR_V411_ARTIFACT_SHA256_V425,
      v413SpectralFixtureArtifactSha256: KERR_V413_ARTIFACT_SHA256_V425,
    }),
    constants: Object.freeze({
      speedOfLightMPerS: SPEED_OF_LIGHT_M_PER_S_V425,
      planckConstantJS: PLANCK_CONSTANT_J_S_V425,
      elementaryChargeC: ELEMENTARY_CHARGE_C_V425,
      status: "exact-SI-defining-constants",
    }),
    domains: Object.freeze({
      v424PredictionWavelengthM: Object.freeze([metrics.minimumPredictionWavelengthM, metrics.maximumPredictionWavelengthM] as const),
      v413FixtureWavelengthM: Object.freeze([4e-7, 8e-7] as const),
      overlapM: null,
      overlapFraction: 0,
      extrapolation: "forbidden",
    }),
    counts: Object.freeze({
      sourcePredictionCount: 24,
      auditedFrequencyCount: 3,
      auditedTransportMethodCount: 2,
      affectedV424ModulationRowCount: 96,
      responseEligibleSourceCount: 0,
      blockedOutOfDomainSourceCount: 24,
      v413ResponseMatrixApplicationCount: 0,
      measuredCalibrationRowCount: 0,
      detectorProjectionCount: 0,
      photonOrElectronCountProductCount: 0,
    }),
    rows: Object.freeze(rows),
    bandSummaries: Object.freeze(bandSummaries),
    metrics,
    thresholds: Object.freeze({
      conversionOracleRelativeDifference: 1e-15,
      responseEligibleSourceCount: 0,
      responseMatrixApplicationCount: 0,
      overlapFraction: 0,
    }),
    futureMeasuredResponseRequirements: Object.freeze([
      "band-appropriate-polarimeter-architecture-not-assumed-HWP-Wollaston",
      "measured-energy-or-wavelength-resolved-modulation-response",
      "measured-response-covariance-and-cross-bin-covariance",
      "effective-area-throughput-and-exposure-provenance",
      "detector-quantum-efficiency-gain-read-noise-and-background",
      "independent-validation-and-conditioning",
      "raw-artifact-SHA-license-and-processing-provenance",
    ] as const),
    qualification: Object.freeze({
      exactFrequencyWavelengthEnergyConversionQualified: true,
      allSourcePredictionsAudited: true,
      v411CalibrationContractPreserved: true,
      v413FixtureDomainPreserved: true,
      outOfDomainFirewallQualified: true,
      independentPythonOracleQualified: true,
      nonidealMuellerProjectionQualified: false,
      measuredInstrumentResponseQualified: false,
      detectorProjectionQualified: false,
      photonOrElectronCountsQualified: false,
      pixelRasterQualified: false,
      denseAuthorityQualified: false,
    }),
    authorityBoundary: Object.freeze({
      spectralApplicabilityAuditQualified: true,
      nonidealInstrumentResponseAuthorityGranted: false,
      measurementAuthorityGranted: false,
      detectorAuthorityGranted: false,
      pixelRasterAuthorityGranted: false,
      denseAuthorityGranted: false,
      unavailableIsNotZero: true,
    }),
    products: Object.freeze({
      json: "available-24-row-spectral-admission-catalog",
      csv: "available-24-row-spectral-admission-catalog",
      fitsBinaryTable: "available-frequency-wavelength-energy-admission-table-no-image-data",
      png: "available-log-wavelength-domain-diagnostic-not-detector-image",
      responseMatrixProduct: "unavailable-zero-in-domain-sources",
      measuredCounts: "unavailable-no-band-appropriate-measured-response",
    }),
    scienceCinematicBoundary: Object.freeze({
      science: "immutable-spectral-domain-admission-and-provenance",
      cinematic: "may-style-domain-rail-and-quarantine-markers-only",
      responseValueFabricationAllowed: false,
      measurementClaimAllowed: false,
      detectorImageClaimAllowed: false,
    }),
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    boundary: "spectral-applicability-audit-only-all-v424-sources-outside-v413-domain-no-extrapolated-Mueller-response-measurement-detector-counts-pixel-raster-or-dense-authority",
  });
}

export function parseKerrInstrumentSpectralAdmissionArtifactV425(value: unknown): KerrInstrumentSpectralAdmissionArtifactV425 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrInstrumentSpectralAdmissionArtifactV425>
    : null;
  if (
    !source ||
    source.version !== KERR_INSTRUMENT_SPECTRAL_ADMISSION_ARTIFACT_VERSION_V425 ||
    source.status !== "qualified-spectral-applicability-firewall-all-24-source-predictions-outside-v413-domain-nonideal-projection-blocked" ||
    source.sourceFiles?.v424FileSha256 !== KERR_V424_FILE_SHA256_V425 ||
    source.sourceFiles.v411FileSha256 !== KERR_V411_FILE_SHA256_V425 ||
    source.sourceFiles.v413FileSha256 !== KERR_V413_FILE_SHA256_V425 ||
    !SHA.test(source.sourceFiles.pythonOracleFileSha256 ?? "") ||
    !SHA.test(source.pythonOracleArtifactSha256 ?? "") ||
    source.view?.rows?.length !== 24 ||
    source.view.bandSummaries.length !== 3 ||
    source.view.counts.responseEligibleSourceCount !== 0 ||
    source.view.counts.v413ResponseMatrixApplicationCount !== 0 ||
    source.view.domains.overlapM !== null ||
    source.view.domains.overlapFraction !== 0 ||
    source.view.authorityBoundary.nonidealInstrumentResponseAuthorityGranted !== false ||
    source.view.rows.some((row) => row.responseEligible !== false || row.extrapolationAllowed !== false || row.v413ResponseMatrixApplied !== false) ||
    source.deterministicReplay !== true ||
    source.networkAttempted !== false ||
    source.denseShardExecuted !== false ||
    source.responseMatrixApplicationAttempted !== false ||
    source.measurementAuthorityGranted !== false ||
    source.detectorAuthorityGranted !== false ||
    !SHA.test(source.artifactSha256 ?? "")
  ) throw new Error("v425-artifact-identity");
  return value as KerrInstrumentSpectralAdmissionArtifactV425;
}

export function createKerrInstrumentSpectralAdmissionSummaryV425(value: unknown): KerrInstrumentSpectralAdmissionSummaryV425 {
  const artifact = parseKerrInstrumentSpectralAdmissionArtifactV425(value);
  return Object.freeze({
    version: KERR_INSTRUMENT_SPECTRAL_ADMISSION_SUMMARY_VERSION_V425,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    constants: artifact.view.constants,
    domains: artifact.view.domains,
    counts: artifact.view.counts,
    bandSummaries: artifact.view.bandSummaries,
    metrics: artifact.view.metrics,
    futureMeasuredResponseRequirements: artifact.view.futureMeasuredResponseRequirements,
    qualification: artifact.view.qualification,
    authorityBoundary: artifact.view.authorityBoundary,
    products: artifact.view.products,
    denseCampaignStatus: "incomplete-0-of-49",
    fullArtifactAvailable: true,
    boundary: "bounded-three-band-summary-no-24-row-admission-array-or-response-matrix-in-react-state",
  });
}

export function parseKerrInstrumentSpectralAdmissionSummaryV425(value: unknown): KerrInstrumentSpectralAdmissionSummaryV425 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrInstrumentSpectralAdmissionSummaryV425>
    : null;
  if (
    !source ||
    source.version !== KERR_INSTRUMENT_SPECTRAL_ADMISSION_SUMMARY_VERSION_V425 ||
    !SHA.test(source.artifactSha256 ?? "") ||
    source.counts?.sourcePredictionCount !== 24 ||
    source.counts.responseEligibleSourceCount !== 0 ||
    source.bandSummaries?.length !== 3 ||
    source.domains?.overlapM !== null ||
    source.domains.overlapFraction !== 0 ||
    source.authorityBoundary?.nonidealInstrumentResponseAuthorityGranted !== false ||
    source.fullArtifactAvailable !== true ||
    source.boundary !== "bounded-three-band-summary-no-24-row-admission-array-or-response-matrix-in-react-state" ||
    Object.hasOwn(source, "rows") ||
    Object.hasOwn(source, "responseMatrix")
  ) throw new Error("v425-summary-identity");
  return value as KerrInstrumentSpectralAdmissionSummaryV425;
}

export function parseKerrInstrumentSpectralAdmissionResponseV425(value: unknown): KerrInstrumentSpectralAdmissionResponseV425 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrInstrumentSpectralAdmissionResponseV425>
    : null;
  if (!source || source.version !== KERR_INSTRUMENT_SPECTRAL_ADMISSION_RESPONSE_VERSION_V425) throw new Error("v425-response-version");
  if (source.available === true && source.reason === "ready" && source.summary) {
    return Object.freeze({ ...source, summary: parseKerrInstrumentSpectralAdmissionSummaryV425(source.summary) }) as KerrInstrumentSpectralAdmissionResponseV425;
  }
  if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(source.reason ?? "")) {
    return source as KerrInstrumentSpectralAdmissionResponseV425;
  }
  throw new Error("v425-response-identity");
}

export function serializeKerrInstrumentSpectralAdmissionCsvV425(view: KerrInstrumentSpectralAdmissionViewV425): string {
  const header = [
    "ray_id", "ray_index", "transport_method", "observed_frequency_Hz", "vacuum_wavelength_m",
    "vacuum_wavelength_nm", "photon_energy_J", "photon_energy_eV", "continuous_pixel_x_fits1",
    "continuous_pixel_y_fits1", "calibration_lower_m", "calibration_upper_m", "lower_boundary_gap_factor",
    "domain_relation", "affected_v424_modulation_rows", "response_eligible", "extrapolation_allowed",
    "v413_response_matrix_applied", "optical_HWP_Wollaston_applicability", "measured_calibration_available",
    "detector_projection_applied", "spectral_admission_not_instrument_response",
  ];
  const rows = view.rows.map((row) => [
    row.rayId, row.rayIndex, row.transportMethod, row.observedFrequencyHz, row.vacuumWavelengthM,
    row.vacuumWavelengthNm, row.photonEnergyJ, row.photonEnergyEv, row.continuousCoordinate.pixelX,
    row.continuousCoordinate.pixelY, row.calibrationDomainM[0], row.calibrationDomainM[1], row.lowerBoundaryGapFactor,
    row.domainRelation, row.affectedV424ModulationRowCount, row.responseEligible, row.extrapolationAllowed,
    row.v413ResponseMatrixApplied, row.opticalHwpWollastonPhysicalApplicabilityGranted, row.measuredCalibrationAvailable,
    row.detectorProjectionApplied, row.provenance.spectralAdmissionNotInstrumentResponse,
  ]);
  return `${[header, ...rows].map((row) => row.join(",")).join("\n")}\n`;
}
