import {
  parseKerrPhotonSourceIdentifiabilityArtifactV387,
  type KerrPhotonSourceIdentifiabilityArtifactV387,
} from "./kerrPhotonSourceIdentifiabilityV387";
import {
  KERR_PLANCK_CONSTANT_J_S_V328,
  parseKerrSciencePhotonBandViewV328,
  type KerrSciencePhotonBandViewV328,
} from "./kerrSciencePhotonBandsV328";
import {
  parseKerrThinDiskBandImagingViewV320,
  type KerrThinDiskBandIdV320,
  type KerrThinDiskBandImagingViewV320,
} from "./kerrThinDiskBandImagingV320";
import {
  V384_BOLTZMANN_CONSTANT_J_K,
  V384_SPEED_OF_LIGHT_M_S,
} from "./measuredVisiblePhotonObservableV384";

export const KERR_GEOMETRY_CONDITIONED_TEMPERATURE_VERSION_V388 =
  "v388-kerr-geometry-conditioned-temperature-v1" as const;
export const V388_INTEGRATION_STEPS = 8_192 as const;
export const V388_ROOT_ITERATIONS = 96 as const;
export const V388_REPLAY_RELATIVE_LIMIT = 2e-6;
export const V388_ORACLE_RELATIVE_LIMIT = 2e-7;
export const V388_KNOWN_NUMERICAL_UPPER_BOUND_LIMIT = 2e-6;

const SHA256 = /^[a-f0-9]{64}$/;
const CARTER_FORMULATION =
  "carter-mino-dop853-constraint-stabilized-v296" as const;
const KS_FORMULATION =
  "cartesian-kerr-schild-hamiltonian-dop853-v292" as const;

type GeometryExecutionV388 = Readonly<{
  rayId: string;
  formulation: string;
  toleranceClass: string;
  branch: string;
  classification: string;
  redshift: number | null;
  redshiftApplicability: string;
  invalid: boolean;
  timeout: boolean;
}>;

export type KerrGeometryRedshiftGateV388 = Readonly<{
  version: "v296-kerr-geometry-redshift-short-gate-v1";
  status: "geometry-redshift-qualified";
  geometryRedshiftQualified: true;
  executionCount: 128;
  expectedExecutionCount: 128;
  thresholds: Readonly<{
    maxRedshiftDifference: number;
    invalidOrTimeout: 0;
    abDeterministic: true;
  }>;
  executions: readonly GeometryExecutionV388[];
  evidenceSha256: string;
}>;

export type GeometryConditionedTemperatureRowV388 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  sourcePhotonRadiancePerSM2Sr: number;
  inferredProductTemperatureK: number;
  geometryRedshiftCarter: number;
  geometryRedshiftKerrSchild: number;
  geometryRedshiftRelativeDifference: number;
  conditionedTemperatureCarterK: number;
  conditionedTemperatureKerrSchildK: number;
  sourceEffectiveTemperatureK: number;
  carterTemperatureReplayRelativeDifference: number;
  kerrSchildTemperatureReplayRelativeDifference: number;
  formulationTemperatureRelativeDifference: number;
  inversionPhotonResidualRelative: number;
  knownNumericalComponents: Readonly<{
    v328PhotonQuadratureRelative: number;
    inversionResidualRelative: number;
    geometryRedshiftRelative: number;
    pageThorneTemperatureQuadratureRelative: number;
  }>;
  knownNumericalUpperBoundRelative: number;
  pythonOracleMaximumRelativeDifference: number;
  absoluteTemperatureUncertaintyRelative: "unavailable";
}>;

export type GeometryConditionedTemperatureComputationV388 = Readonly<{
  rows: readonly Omit<
    GeometryConditionedTemperatureRowV388,
    "pythonOracleMaximumRelativeDifference"
  >[];
  rayAudits: readonly Readonly<{
    rayIndex: number;
    rayId: string;
    spectralRowCount: 3;
    geometryPriorRow: readonly [0, 1];
    singularValues: readonly [number, number];
    conditionNumber: number;
    augmentedRank: 2;
  }>[];
  maxima: Readonly<{
    temperatureReplayRelativeDifference: number;
    formulationTemperatureRelativeDifference: number;
    inversionPhotonResidualRelative: number;
    knownNumericalUpperBoundRelative: number;
  }>;
}>;

export type KerrGeometryConditionedTemperatureArtifactV388 = Readonly<{
  version: typeof KERR_GEOMETRY_CONDITIONED_TEMPERATURE_VERSION_V388;
  generatedAt: string;
  status:
    "geometry-conditioned-temperature-replay-qualified-absolute-authority-withheld";
  source: Readonly<{
    v296GeometryEvidenceSha256: string;
    v320BandArtifactSha256: string;
    v328PhotonArtifactSha256: string;
    v387IdentifiabilityArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  rows: readonly GeometryConditionedTemperatureRowV388[];
  rayAudits: GeometryConditionedTemperatureComputationV388["rayAudits"];
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    inversionCount: 12;
    geometryPriorCount: 4;
  }>;
  maxima: Readonly<{
    temperatureReplayRelativeDifference: number;
    formulationTemperatureRelativeDifference: number;
    inversionPhotonResidualRelative: number;
    knownNumericalUpperBoundRelative: number;
    pythonOracleRelativeDifference: number;
  }>;
  identifiability: Readonly<{
    spectralOnlyRank: 1;
    geometryConditionedRank: 2;
    independentPrior: "v296-dual-formulation-kerr-redshift";
    recoveredParameter: "effective-temperature-under-frozen-page-thorne-planck-model";
    algebra: "ln-T-equals-ln-gT-minus-ln-g";
    degeneracyBrokenComputationally: true;
  }>;
  uncertainty: Readonly<{
    combinationPolicy: "linear-sum-no-independence-proof-no-rss";
    knownNumericalBudgetQualified: true;
    knownNumericalIntervalIsConfidenceInterval: false;
    geometryPhysicalModelSystematicAvailable: false;
    diskPhysicalModelSystematicAvailable: false;
    detectorCalibrationCovarianceAvailable: false;
    absoluteTemperatureUncertaintyQualified: false;
    numericalPlaceholderUsed: false;
  }>;
  qualification: Readonly<{
    conditionalTemperatureReplayQualified: true;
    augmentedIdentifiabilityQualified: true;
    absoluteTemperatureAuthorityGranted: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.csv";
    csvFileSha256: string;
    rowCount: 12;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

function parseGeometryGate(value: unknown): KerrGeometryRedshiftGateV388 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<KerrGeometryRedshiftGateV388>)
    : null;
  if (
    !source ||
    source.version !== "v296-kerr-geometry-redshift-short-gate-v1" ||
    source.status !== "geometry-redshift-qualified" ||
    source.geometryRedshiftQualified !== true ||
    source.executionCount !== 128 ||
    source.expectedExecutionCount !== 128 ||
    source.thresholds?.invalidOrTimeout !== 0 ||
    source.thresholds.abDeterministic !== true ||
    !Array.isArray(source.executions) ||
    source.executions.length !== 128 ||
    !SHA256.test(source.evidenceSha256 ?? "")
  ) {
    throw new Error("v388-geometry-gate-identity");
  }
  return value as KerrGeometryRedshiftGateV388;
}

function integratePhotonAtProductTemperature(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  productTemperatureK: number,
) {
  const width =
    (upperFrequencyHz - lowerFrequencyHz) / V388_INTEGRATION_STEPS;
  let sum = 0;
  for (let index = 0; index <= V388_INTEGRATION_STEPS; index += 1) {
    const frequencyHz = lowerFrequencyHz + index * width;
    const exponent =
      (KERR_PLANCK_CONSTANT_J_S_V328 * frequencyHz) /
      (V384_BOLTZMANN_CONSTANT_J_K * productTemperatureK);
    const photonRadiance =
      (2 * frequencyHz ** 2) /
      (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
    const coefficient =
      index === 0 || index === V388_INTEGRATION_STEPS
        ? 1
        : index % 2 === 0
          ? 2
          : 4;
    sum += coefficient * photonRadiance;
  }
  const result = sum * width / 3;
  if (!Number.isFinite(result) || result < 0) {
    throw new Error("v388-product-integral");
  }
  return result;
}

function invertProductTemperature(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  targetPhotonRadiance: number,
) {
  let lower = 100;
  let upper = 1e9;
  if (
    integratePhotonAtProductTemperature(
      lowerFrequencyHz,
      upperFrequencyHz,
      lower,
    ) >= targetPhotonRadiance ||
    integratePhotonAtProductTemperature(
      lowerFrequencyHz,
      upperFrequencyHz,
      upper,
    ) <= targetPhotonRadiance
  ) {
    throw new Error("v388-root-bracket");
  }
  for (let iteration = 0; iteration < V388_ROOT_ITERATIONS; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    const value = integratePhotonAtProductTemperature(
      lowerFrequencyHz,
      upperFrequencyHz,
      midpoint,
    );
    if (value < targetPhotonRadiance) lower = midpoint;
    else upper = midpoint;
  }
  const productTemperatureK = 0.5 * (lower + upper);
  const replay = integratePhotonAtProductTemperature(
    lowerFrequencyHz,
    upperFrequencyHz,
    productTemperatureK,
  );
  const residual =
    Math.abs(replay - targetPhotonRadiance) /
    Math.max(targetPhotonRadiance, replay);
  return Object.freeze({ productTemperatureK, residual });
}

const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

function augmentedSingularValues(sensitivities: readonly number[]) {
  const sumSquares = sensitivities.reduce(
    (sum, value) => sum + value * value,
    0,
  );
  const a = sumSquares;
  const b = sumSquares;
  const d = sumSquares + 1;
  const trace = a + d;
  const discriminant = Math.sqrt((a - d) ** 2 + 4 * b * b);
  const leading = Math.sqrt(0.5 * (trace + discriminant));
  const trailing = Math.sqrt(0.5 * (trace - discriminant));
  if (!(leading > trailing && trailing > 0)) {
    throw new Error("v388-augmented-rank");
  }
  return Object.freeze([leading, trailing] as const);
}

export function createKerrGeometryConditionedTemperatureV388(
  geometryGateValue: unknown,
  bandViewValue: KerrThinDiskBandImagingViewV320,
  photonViewValue: KerrSciencePhotonBandViewV328,
  identifiabilityValue: KerrPhotonSourceIdentifiabilityArtifactV387,
): GeometryConditionedTemperatureComputationV388 {
  const geometryGate = parseGeometryGate(geometryGateValue);
  const bandView = parseKerrThinDiskBandImagingViewV320(bandViewValue);
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  const identifiability = parseKerrPhotonSourceIdentifiabilityArtifactV387(
    identifiabilityValue,
  );
  if (
    bandView.source.fullShortAuthoritySha256 !==
      photonView.source.fullShortAuthoritySha256 ||
    identifiability.source.v328FullShortAuthoritySha256 !==
      photonView.source.fullShortAuthoritySha256 ||
    identifiability.global.rank !== 1
  ) {
    throw new Error("v388-source-identity");
  }
  let maximumReplay = 0;
  let maximumFormulation = 0;
  let maximumResidual = 0;
  let maximumKnownBudget = 0;
  const rows = photonView.rays.flatMap((photonRay, rayOffset) => {
    const rayId = `disk-${String(rayOffset).padStart(2, "0")}`;
    const bandSample = bandView.samples.find(
      (sample) => sample.rayIndex === photonRay.rayIndex && sample.applicable,
    );
    const carter = geometryGate.executions.find(
      (entry) =>
        entry.rayId === rayId &&
        entry.formulation === CARTER_FORMULATION &&
        entry.toleranceClass === "release" &&
        entry.branch === "A",
    );
    const kerrSchild = geometryGate.executions.find(
      (entry) =>
        entry.rayId === rayId &&
        entry.formulation === KS_FORMULATION &&
        entry.toleranceClass === "release" &&
        entry.branch === "A",
    );
    if (
      !bandSample ||
      bandSample.effectiveTemperatureK == null ||
      bandSample.redshiftFactor == null ||
      !bandSample.bands ||
      bandSample.sourceErrorBudget.pageThorneQuadratureRelative == null ||
      !carter ||
      !kerrSchild ||
      carter.classification !== "disk-hit" ||
      kerrSchild.classification !== "disk-hit" ||
      carter.redshiftApplicability !== "applicable" ||
      kerrSchild.redshiftApplicability !== "applicable" ||
      carter.redshift == null ||
      kerrSchild.redshift == null ||
      carter.invalid ||
      kerrSchild.invalid ||
      carter.timeout ||
      kerrSchild.timeout
    ) {
      throw new Error(`v388-geometry-prior:${rayId}`);
    }
    const geometryRedshiftRelativeDifference = relativeDifference(
      carter.redshift,
      kerrSchild.redshift,
    );
    return photonRay.measurements.map((measurement) => {
      const band = bandSample.bands!.find(
        (entry) => entry.id === measurement.bandId,
      );
      if (!band) throw new Error(`v388-band:${rayId}:${measurement.bandId}`);
      const inversion = invertProductTemperature(
        measurement.bandLowerFrequencyHz,
        measurement.bandUpperFrequencyHz,
        measurement.observedPhotonRadiancePerSM2Sr,
      );
      const conditionedTemperatureCarterK =
        inversion.productTemperatureK / carter.redshift!;
      const conditionedTemperatureKerrSchildK =
        inversion.productTemperatureK / kerrSchild.redshift!;
      const carterTemperatureReplayRelativeDifference = relativeDifference(
        conditionedTemperatureCarterK,
        bandSample.effectiveTemperatureK!,
      );
      const kerrSchildTemperatureReplayRelativeDifference = relativeDifference(
        conditionedTemperatureKerrSchildK,
        bandSample.effectiveTemperatureK!,
      );
      const formulationTemperatureRelativeDifference = relativeDifference(
        conditionedTemperatureCarterK,
        conditionedTemperatureKerrSchildK,
      );
      const geometryRedshiftRelative =
        Math.abs(carter.redshift! - kerrSchild.redshift!) /
        Math.min(carter.redshift!, kerrSchild.redshift!);
      const pageThorneTemperatureQuadratureRelative =
        bandSample.sourceErrorBudget.pageThorneQuadratureRelative! / 4;
      const knownNumericalComponents = Object.freeze({
        v328PhotonQuadratureRelative: measurement.quadratureRelativeDifference,
        inversionResidualRelative: inversion.residual,
        geometryRedshiftRelative,
        pageThorneTemperatureQuadratureRelative,
      });
      const knownNumericalUpperBoundRelative = Object.values(
        knownNumericalComponents,
      ).reduce((sum, component) => sum + component, 0);
      if (
        carterTemperatureReplayRelativeDifference >= V388_REPLAY_RELATIVE_LIMIT ||
        kerrSchildTemperatureReplayRelativeDifference >=
          V388_REPLAY_RELATIVE_LIMIT ||
        knownNumericalUpperBoundRelative >=
          V388_KNOWN_NUMERICAL_UPPER_BOUND_LIMIT
      ) {
        throw new Error(`v388-temperature-gate:${rayId}:${measurement.bandId}`);
      }
      maximumReplay = Math.max(
        maximumReplay,
        carterTemperatureReplayRelativeDifference,
        kerrSchildTemperatureReplayRelativeDifference,
      );
      maximumFormulation = Math.max(
        maximumFormulation,
        formulationTemperatureRelativeDifference,
      );
      maximumResidual = Math.max(maximumResidual, inversion.residual);
      maximumKnownBudget = Math.max(
        maximumKnownBudget,
        knownNumericalUpperBoundRelative,
      );
      return Object.freeze({
        rayIndex: photonRay.rayIndex,
        rayId,
        bandId: measurement.bandId,
        sourcePhotonRadiancePerSM2Sr:
          measurement.observedPhotonRadiancePerSM2Sr,
        inferredProductTemperatureK: inversion.productTemperatureK,
        geometryRedshiftCarter: carter.redshift!,
        geometryRedshiftKerrSchild: kerrSchild.redshift!,
        geometryRedshiftRelativeDifference,
        conditionedTemperatureCarterK,
        conditionedTemperatureKerrSchildK,
        sourceEffectiveTemperatureK: bandSample.effectiveTemperatureK!,
        carterTemperatureReplayRelativeDifference,
        kerrSchildTemperatureReplayRelativeDifference,
        formulationTemperatureRelativeDifference,
        inversionPhotonResidualRelative: inversion.residual,
        knownNumericalComponents,
        knownNumericalUpperBoundRelative,
        absoluteTemperatureUncertaintyRelative: "unavailable" as const,
      });
    });
  });
  if (rows.length !== 12) throw new Error("v388-row-count");
  const rayAudits = Object.freeze(
    photonView.rays.map((ray, rayOffset) => {
      const spectral = identifiability.rows
        .filter((row) => row.rayIndex === ray.rayIndex)
        .map((row) => row.logTemperatureSensitivity);
      if (spectral.length !== 3) throw new Error("v388-spectral-count");
      const singularValues = augmentedSingularValues(spectral);
      return Object.freeze({
        rayIndex: ray.rayIndex,
        rayId: `disk-${String(rayOffset).padStart(2, "0")}`,
        spectralRowCount: 3 as const,
        geometryPriorRow: Object.freeze([0, 1] as const),
        singularValues,
        conditionNumber: singularValues[0] / singularValues[1],
        augmentedRank: 2 as const,
      });
    }),
  );
  return Object.freeze({
    rows: Object.freeze(rows),
    rayAudits,
    maxima: Object.freeze({
      temperatureReplayRelativeDifference: maximumReplay,
      formulationTemperatureRelativeDifference: maximumFormulation,
      inversionPhotonResidualRelative: maximumResidual,
      knownNumericalUpperBoundRelative: maximumKnownBudget,
    }),
  });
}

export function parseKerrGeometryConditionedTemperatureArtifactV388(
  value: unknown,
): KerrGeometryConditionedTemperatureArtifactV388 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<KerrGeometryConditionedTemperatureArtifactV388>)
    : null;
  const rows = source?.rows ?? [];
  if (
    !source ||
    source.version !== KERR_GEOMETRY_CONDITIONED_TEMPERATURE_VERSION_V388 ||
    source.status !==
      "geometry-conditioned-temperature-replay-qualified-absolute-authority-withheld" ||
    !source.source ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 12 ||
    rows.some(
      (row) =>
        row.carterTemperatureReplayRelativeDifference >=
          V388_REPLAY_RELATIVE_LIMIT ||
        row.kerrSchildTemperatureReplayRelativeDifference >=
          V388_REPLAY_RELATIVE_LIMIT ||
        row.knownNumericalUpperBoundRelative >=
          V388_KNOWN_NUMERICAL_UPPER_BOUND_LIMIT ||
        row.pythonOracleMaximumRelativeDifference >= V388_ORACLE_RELATIVE_LIMIT ||
        row.absoluteTemperatureUncertaintyRelative !== "unavailable",
    ) ||
    source.rayAudits?.length !== 4 ||
    source.rayAudits.some(
      (entry) =>
        entry.spectralRowCount !== 3 ||
        entry.augmentedRank !== 2 ||
        entry.singularValues[0] <= entry.singularValues[1] ||
        entry.singularValues[1] <= 0,
    ) ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.inversionCount !== 12 ||
    source.counts.geometryPriorCount !== 4 ||
    (source.maxima?.temperatureReplayRelativeDifference ?? Infinity) >=
      V388_REPLAY_RELATIVE_LIMIT ||
    (source.maxima?.pythonOracleRelativeDifference ?? Infinity) >=
      V388_ORACLE_RELATIVE_LIMIT ||
    (source.maxima?.knownNumericalUpperBoundRelative ?? Infinity) >=
      V388_KNOWN_NUMERICAL_UPPER_BOUND_LIMIT ||
    source.identifiability?.spectralOnlyRank !== 1 ||
    source.identifiability.geometryConditionedRank !== 2 ||
    source.identifiability.degeneracyBrokenComputationally !== true ||
    source.uncertainty?.combinationPolicy !==
      "linear-sum-no-independence-proof-no-rss" ||
    source.uncertainty.knownNumericalBudgetQualified !== true ||
    source.uncertainty.knownNumericalIntervalIsConfidenceInterval !== false ||
    source.uncertainty.geometryPhysicalModelSystematicAvailable !== false ||
    source.uncertainty.diskPhysicalModelSystematicAvailable !== false ||
    source.uncertainty.detectorCalibrationCovarianceAvailable !== false ||
    source.uncertainty.absoluteTemperatureUncertaintyQualified !== false ||
    source.uncertainty.numericalPlaceholderUsed !== false ||
    source.qualification?.conditionalTemperatureReplayQualified !== true ||
    source.qualification.augmentedIdentifiabilityQualified !== true ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.export?.csvPath !==
      "dist/science/kerr-geometry-conditioned-temperature-v388/temperature-replay.csv" ||
    !SHA256.test(source.export?.csvFileSha256 ?? "") ||
    source.export?.rowCount !== 12 ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v388-temperature-artifact-identity");
  }
  return value as KerrGeometryConditionedTemperatureArtifactV388;
}
