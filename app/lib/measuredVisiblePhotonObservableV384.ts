import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";

export const MEASURED_VISIBLE_PHOTON_OBSERVABLE_VERSION_V384 =
  "v384-visible-throughput-weighted-photon-observable-v1" as const;
export const V384_SPEED_OF_LIGHT_M_S = 299_792_458 as const;
export const V384_BOLTZMANN_CONSTANT_J_K = 1.380649e-23 as const;
export const V384_UNWEIGHTED_RECONSTRUCTION_LIMIT = 1e-7;
export const V384_CROSS_IMPLEMENTATION_LIMIT = 1e-7;

const SHA256 = /^[a-f0-9]{64}$/;

type ThroughputPointV384 = Readonly<{
  wavelengthM: number;
  throughput: number;
}>;

export type MeasuredVisiblePhotonObservableRowV384 = Readonly<{
  rayIndex: number;
  spinA: number;
  redshiftFactor: number;
  effectiveTemperatureK: number;
  sourcePhotonRadiancePerSM2Sr: number;
  reconstructedUnweightedPhotonRadiancePerSM2Sr: number;
  throughputWeightedPhotonRadiancePerSM2Sr: number;
  effectiveBandThroughput: number;
  unweightedReconstructionRelativeDifference: number;
  pythonOracleRelativeDifference: number;
  sourcePhotonQuadratureRelativeDifference: number;
  electronExpectationApplicable: false;
}>;

export type MeasuredVisiblePhotonObservableComputationV384 = Readonly<{
  rows: readonly Omit<
    MeasuredVisiblePhotonObservableRowV384,
    "pythonOracleRelativeDifference"
  >[];
  maxima: Readonly<{
    unweightedReconstructionRelativeDifference: number;
    sourcePhotonQuadratureRelativeDifference: number;
  }>;
}>;

export type MeasuredVisiblePhotonObservableArtifactV384 = Readonly<{
  version: typeof MEASURED_VISIBLE_PHOTON_OBSERVABLE_VERSION_V384;
  generatedAt: string;
  status:
    "throughput-weighted-visible-photon-observable-qualified-dual-domain-electron-authority-withheld";
  source: Readonly<{
    v328PhotonArtifactSha256: string;
    v328FullShortAuthoritySha256: string;
    v383ThroughputArtifactSha256: string;
    v383ProfileFileSha256: string;
    v383SourceRowCanonicalSha256: string;
    denseAggregateSha256: null;
  }>;
  rows: readonly MeasuredVisiblePhotonObservableRowV384[];
  counts: Readonly<{
    authorityDiskRayCount: 4;
    observableRowCount: 4;
    unavailableNonDiskRayCount: 12;
  }>;
  maxima: Readonly<{
    sourcePhotonQuadratureRelativeDifference: number;
    unweightedReconstructionRelativeDifference: number;
    pythonOracleRelativeDifference: number;
  }>;
  algorithms: Readonly<{
    typescript:
      "wavelength-domain-irregular-trapezoid-with-neumaier-compensation";
    python:
      "frequency-domain-fixed-simpson-65536-with-linear-throughput-interpolation";
    integrationDomainIndependent: true;
    parserIndependent: true;
    sourceRowsShaMatched: true;
    deterministicReplay: true;
  }>;
  units: Readonly<{
    photonObservable: "photons s^-1 m^-2 sr^-1";
    throughput: "dimensionless";
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/measured-visible-photon-observable-v384/observable.csv";
    csvFileSha256: string;
    rowCount: 4;
  }>;
  operator:
    "integral-observed-photon-spectral-radiance-times-dimensionless-throughput";
  assumptions: readonly [
    "v328-planck-thin-disk-effective-temperature-and-redshift-reused-read-only",
    "v383-total-system-throughput-treated-as-dimensionless-spectral-weight",
    "no-collecting-area-pixel-solid-angle-exposure-noise-gain-or-background-applied",
  ];
  authorityBoundary: Readonly<{
    photonObservableQualified: true;
    detectorElectronExpectationAvailable: false;
    sourceDossierAvailable: false;
    detectorNoiseAuthorityAvailable: false;
    observationGeometryAuthorityAvailable: false;
    visibleMeasuredAuthorityGranted: false;
    measuredBandAuthorityCount: 0;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
    runtimePackagingAllowed: false;
    sciencePayloadMutationAllowed: false;
    cinematicConsumerAllowed: false;
  }>;
  networkAttempted: false;
  automaticRetryApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

function parseProfile(profileCsv: string): readonly ThroughputPointV384[] {
  if (
    Buffer.byteLength(profileCsv, "utf8") <= 0 ||
    Buffer.byteLength(profileCsv, "utf8") > 512 * 1024 ||
    profileCsv.includes("\0")
  ) {
    throw new Error("v384-profile-size");
  }
  const lines = profileCsv.replaceAll("\r\n", "\n").trimEnd().split("\n");
  if (lines[0] !== "wavelength_m,throughput" || lines.length !== 3302) {
    throw new Error("v384-profile-schema");
  }
  const points = lines.slice(1).map((line) => {
    const fields = line.split(",");
    if (fields.length !== 2) throw new Error("v384-profile-columns");
    const wavelengthM = Number(fields[0]);
    const throughput = Number(fields[1]);
    if (
      !Number.isFinite(wavelengthM) ||
      !Number.isFinite(throughput) ||
      wavelengthM <= 0 ||
      throughput < 0 ||
      throughput > 1
    ) {
      throw new Error("v384-profile-values");
    }
    return Object.freeze({ wavelengthM, throughput });
  });
  const endpointMatches = (value: number, expected: number) =>
    Math.abs(value - expected) / expected < 1e-15;
  if (
    !endpointMatches(points[0].wavelengthM, 4e-7) ||
    !endpointMatches(points[points.length - 1].wavelengthM, 7e-7) ||
    points.some(
      (point, index) =>
        index > 0 && point.wavelengthM <= points[index - 1].wavelengthM,
    )
  ) {
    throw new Error("v384-profile-boundary");
  }
  return Object.freeze(points);
}

function observedPhotonSpectralRadiancePerWavelength(
  wavelengthM: number,
  temperatureK: number,
  redshiftFactor: number,
) {
  const observedFrequencyHz = V384_SPEED_OF_LIGHT_M_S / wavelengthM;
  const emittedFrequencyHz = observedFrequencyHz / redshiftFactor;
  const exponent =
    (KERR_PLANCK_CONSTANT_J_S_V328 * emittedFrequencyHz) /
    (V384_BOLTZMANN_CONSTANT_J_K * temperatureK);
  const emittedEnergySpectralRadiance =
    (2 *
      KERR_PLANCK_CONSTANT_J_S_V328 *
      emittedFrequencyHz ** 3) /
    (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
  const observedEnergySpectralRadiance =
    redshiftFactor ** 3 * emittedEnergySpectralRadiance;
  const photonSpectralRadiancePerHz =
    observedEnergySpectralRadiance /
    (KERR_PLANCK_CONSTANT_J_S_V328 * observedFrequencyHz);
  const value =
    photonSpectralRadiancePerHz *
    (V384_SPEED_OF_LIGHT_M_S / wavelengthM ** 2);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("v384-spectral-radiance-nonphysical");
  }
  return value;
}

function integrateProfile(
  points: readonly ThroughputPointV384[],
  temperatureK: number,
  redshiftFactor: number,
  weighted: boolean,
) {
  let sum = 0;
  let correction = 0;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];
    const leftValue =
      observedPhotonSpectralRadiancePerWavelength(
        left.wavelengthM,
        temperatureK,
        redshiftFactor,
      ) * (weighted ? left.throughput : 1);
    const rightValue =
      observedPhotonSpectralRadiancePerWavelength(
        right.wavelengthM,
        temperatureK,
        redshiftFactor,
      ) * (weighted ? right.throughput : 1);
    const term =
      0.5 * (right.wavelengthM - left.wavelengthM) * (leftValue + rightValue);
    const next = sum + term;
    correction +=
      Math.abs(sum) >= Math.abs(term)
        ? sum - next + term
        : term - next + sum;
    sum = next;
  }
  const value = sum + correction;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("v384-integral-nonphysical");
  }
  return value;
}

const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

export function createMeasuredVisiblePhotonObservableV384(
  photonViewValue: KerrSciencePhotonBandViewV328,
  profileCsv: string,
): MeasuredVisiblePhotonObservableComputationV384 {
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  const points = parseProfile(profileCsv);
  let maximumReconstruction = 0;
  let maximumSourceQuadrature = 0;
  const rows = photonView.rays.map((ray) => {
    const source = ray.measurements.find(
      (measurement) => measurement.bandId === "visible",
    );
    if (!source) throw new Error(`v384-visible-source:${ray.rayIndex}`);
    const reconstructed = integrateProfile(
      points,
      ray.effectiveTemperatureK,
      ray.redshiftFactor,
      false,
    );
    const weighted = integrateProfile(
      points,
      ray.effectiveTemperatureK,
      ray.redshiftFactor,
      true,
    );
    const unweightedReconstructionRelativeDifference = relativeDifference(
      reconstructed,
      source.observedPhotonRadiancePerSM2Sr,
    );
    const effectiveBandThroughput = weighted / reconstructed;
    if (
      unweightedReconstructionRelativeDifference >=
        V384_UNWEIGHTED_RECONSTRUCTION_LIMIT ||
      !(weighted > 0 && weighted < reconstructed) ||
      !(effectiveBandThroughput > 0 && effectiveBandThroughput <= 1)
    ) {
      throw new Error(
        `v384-ray-gate:${ray.rayIndex}:${unweightedReconstructionRelativeDifference}:${effectiveBandThroughput}`,
      );
    }
    maximumReconstruction = Math.max(
      maximumReconstruction,
      unweightedReconstructionRelativeDifference,
    );
    maximumSourceQuadrature = Math.max(
      maximumSourceQuadrature,
      source.quadratureRelativeDifference,
    );
    return Object.freeze({
      rayIndex: ray.rayIndex,
      spinA: ray.spinA,
      redshiftFactor: ray.redshiftFactor,
      effectiveTemperatureK: ray.effectiveTemperatureK,
      sourcePhotonRadiancePerSM2Sr: source.observedPhotonRadiancePerSM2Sr,
      reconstructedUnweightedPhotonRadiancePerSM2Sr: reconstructed,
      throughputWeightedPhotonRadiancePerSM2Sr: weighted,
      effectiveBandThroughput,
      unweightedReconstructionRelativeDifference,
      sourcePhotonQuadratureRelativeDifference:
        source.quadratureRelativeDifference,
      electronExpectationApplicable: false as const,
    });
  });
  if (rows.length !== 4) throw new Error("v384-row-count");
  return Object.freeze({
    rows: Object.freeze(rows),
    maxima: Object.freeze({
      unweightedReconstructionRelativeDifference: maximumReconstruction,
      sourcePhotonQuadratureRelativeDifference: maximumSourceQuadrature,
    }),
  });
}

export function parseMeasuredVisiblePhotonObservableArtifactV384(
  value: unknown,
): MeasuredVisiblePhotonObservableArtifactV384 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredVisiblePhotonObservableArtifactV384>)
    : null;
  const rows = source?.rows ?? [];
  if (
    !source ||
    source.version !== MEASURED_VISIBLE_PHOTON_OBSERVABLE_VERSION_V384 ||
    source.status !==
      "throughput-weighted-visible-photon-observable-qualified-dual-domain-electron-authority-withheld" ||
    !source.source ||
    ![
      source.source.v328PhotonArtifactSha256,
      source.source.v328FullShortAuthoritySha256,
      source.source.v383ThroughputArtifactSha256,
      source.source.v383ProfileFileSha256,
      source.source.v383SourceRowCanonicalSha256,
    ].every((entry) => SHA256.test(entry)) ||
    source.source.denseAggregateSha256 !== null ||
    rows.length !== 4 ||
    new Set(rows.map((row) => row.rayIndex)).size !== 4 ||
    rows.some(
      (row) =>
        ![
          row.sourcePhotonRadiancePerSM2Sr,
          row.reconstructedUnweightedPhotonRadiancePerSM2Sr,
          row.throughputWeightedPhotonRadiancePerSM2Sr,
          row.effectiveBandThroughput,
          row.unweightedReconstructionRelativeDifference,
          row.pythonOracleRelativeDifference,
          row.sourcePhotonQuadratureRelativeDifference,
        ].every(Number.isFinite) ||
        !(row.throughputWeightedPhotonRadiancePerSM2Sr > 0) ||
        !(row.effectiveBandThroughput > 0 && row.effectiveBandThroughput <= 1) ||
        row.unweightedReconstructionRelativeDifference >=
          V384_UNWEIGHTED_RECONSTRUCTION_LIMIT ||
        row.pythonOracleRelativeDifference >= V384_CROSS_IMPLEMENTATION_LIMIT ||
        row.electronExpectationApplicable !== false,
    ) ||
    source.counts?.authorityDiskRayCount !== 4 ||
    source.counts.observableRowCount !== 4 ||
    source.counts.unavailableNonDiskRayCount !== 12 ||
    !source.maxima ||
    source.maxima.unweightedReconstructionRelativeDifference >=
      V384_UNWEIGHTED_RECONSTRUCTION_LIMIT ||
    source.maxima.pythonOracleRelativeDifference >=
      V384_CROSS_IMPLEMENTATION_LIMIT ||
    source.algorithms?.integrationDomainIndependent !== true ||
    source.algorithms.parserIndependent !== true ||
    source.algorithms.sourceRowsShaMatched !== true ||
    source.algorithms.deterministicReplay !== true ||
    source.export?.csvPath !==
      "dist/science/measured-visible-photon-observable-v384/observable.csv" ||
    !SHA256.test(source.export?.csvFileSha256 ?? "") ||
    source.export?.rowCount !== 4 ||
    source.operator !==
      "integral-observed-photon-spectral-radiance-times-dimensionless-throughput" ||
    source.assumptions?.length !== 3 ||
    source.authorityBoundary?.photonObservableQualified !== true ||
    source.authorityBoundary.detectorElectronExpectationAvailable !== false ||
    source.authorityBoundary.sourceDossierAvailable !== false ||
    source.authorityBoundary.detectorNoiseAuthorityAvailable !== false ||
    source.authorityBoundary.observationGeometryAuthorityAvailable !== false ||
    source.authorityBoundary.visibleMeasuredAuthorityGranted !== false ||
    source.authorityBoundary.measuredBandAuthorityCount !== 0 ||
    source.authorityBoundary.observedCountsAvailable !== false ||
    source.authorityBoundary.scienceImageAvailable !== false ||
    source.authorityBoundary.runtimePackagingAllowed !== false ||
    source.authorityBoundary.sciencePayloadMutationAllowed !== false ||
    source.authorityBoundary.cinematicConsumerAllowed !== false ||
    source.networkAttempted !== false ||
    source.automaticRetryApplied !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v384-observable-artifact-identity");
  }
  return value as MeasuredVisiblePhotonObservableArtifactV384;
}
