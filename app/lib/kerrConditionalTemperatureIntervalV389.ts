import {
  parseKerrGeometryConditionedTemperatureArtifactV388,
  type KerrGeometryConditionedTemperatureArtifactV388,
} from "./kerrGeometryConditionedTemperatureV388";
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

export const KERR_CONDITIONAL_TEMPERATURE_INTERVAL_VERSION_V389 =
  "v389-kerr-conditional-temperature-exact-interval-v1" as const;
export const V389_INTEGRATION_STEPS = 4_096 as const;
export const V389_ROOT_ITERATIONS = 80 as const;
export const V389_INTERVAL_RELATIVE_RADIUS_LIMIT = 3e-6;
export const V389_ORACLE_RELATIVE_LIMIT = 2e-7;

const SHA256 = /^[a-f0-9]{64}$/;
const BAND_IDS_V389 = new Set<KerrThinDiskBandIdV320>([
  "visible",
  "euv",
  "soft-x-ray",
]);

const finitePositive = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;
const finiteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
function validBracketingInterval(
  value: unknown,
  central: unknown,
  strict = true,
) {
  if (!finitePositive(central) || !value || typeof value !== "object") {
    return false;
  }
  const interval = value as { lower?: unknown; upper?: unknown };
  if (!finitePositive(interval.lower) || !finitePositive(interval.upper)) {
    return false;
  }
  return strict
    ? interval.lower < central && central < interval.upper
    : interval.lower <= central && central <= interval.upper;
}

export type ConditionalTemperatureIntervalRowV389 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  photonCentralPerSM2Sr: number;
  photonRelativeRadius: number;
  photonIntervalPerSM2Sr: Readonly<{ lower: number; upper: number }>;
  productTemperatureCentralK: number;
  productTemperatureIntervalK: Readonly<{ lower: number; upper: number }>;
  geometryRedshiftInterval: Readonly<{ lower: number; upper: number }>;
  conditionedTemperatureCentralK: number;
  conditionedTemperatureNumericalIntervalK: Readonly<{
    lower: number;
    upper: number;
  }>;
  conditionedTemperatureNumericalRelativeRadius: number;
  sourceModelTemperatureCentralK: number;
  pageThorneFluxRelativeRadius: number;
  sourceModelTemperatureIntervalK: Readonly<{ lower: number; upper: number }>;
  sourceModelTemperatureRelativeRadius: number;
  numericalAndSourceModelIntervalsOverlap: boolean;
  pythonOracleMaximumRelativeDifference: number;
  absoluteTemperatureInterval: null;
}>;

export type ConditionalTemperatureIntervalComputationV389 = Readonly<{
  rows: readonly Omit<
    ConditionalTemperatureIntervalRowV389,
    "pythonOracleMaximumRelativeDifference"
  >[];
  maxima: Readonly<{
    photonRelativeRadius: number;
    conditionedTemperatureNumericalRelativeRadius: number;
    sourceModelTemperatureRelativeRadius: number;
  }>;
  overlapCount: number;
}>;

export type KerrConditionalTemperatureIntervalArtifactV389 = Readonly<{
  version: typeof KERR_CONDITIONAL_TEMPERATURE_INTERVAL_VERSION_V389;
  generatedAt: string;
  status:
    "conditional-temperature-exact-interval-qualified-physical-systematics-unavailable";
  source: Readonly<{
    v388ReplayArtifactSha256: string;
    v328PhotonArtifactSha256: string;
    v320BandArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  rows: readonly ConditionalTemperatureIntervalRowV389[];
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    intervalCount: 12;
    overlapCount: number;
  }>;
  maxima: Readonly<{
    photonRelativeRadius: number;
    conditionedTemperatureNumericalRelativeRadius: number;
    sourceModelTemperatureRelativeRadius: number;
    pythonOracleRelativeDifference: number;
  }>;
  algorithms: Readonly<{
    photonToProductTemperature:
      "monotonic-bisection-on-planck-photon-integral";
    geometryConditioning: "exact-positive-interval-division-gT-over-g";
    pageThorneTemperature:
      "exact-fourth-root-map-from-positive-flux-interval";
    intervalCombination: "worst-case-endpoints-no-independence-proof-no-rss";
    deterministicReplay: true;
  }>;
  intervalSemantics: Readonly<{
    knownNumericalIntervalQualified: true;
    sourceModelNumericalIntervalQualified: true;
    confidenceInterval: false;
    probabilityContentAssigned: false;
    detectorCalibrationCovarianceAvailable: false;
    geometryPhysicalSystematicAvailable: false;
    nonPlanckSpectralSystematicAvailable: false;
    absoluteScientificIntervalQualified: false;
    numericalPlaceholderUsed: false;
  }>;
  qualification: Readonly<{
    exactNonlinearPropagationQualified: true;
    conditionalTemperatureReplayQualified: true;
    absoluteTemperatureAuthorityGranted: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.csv";
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

function integratePhotonAtProductTemperature(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  productTemperatureK: number,
) {
  const width =
    (upperFrequencyHz - lowerFrequencyHz) / V389_INTEGRATION_STEPS;
  let sum = 0;
  for (let index = 0; index <= V389_INTEGRATION_STEPS; index += 1) {
    const frequencyHz = lowerFrequencyHz + index * width;
    const exponent =
      (KERR_PLANCK_CONSTANT_J_S_V328 * frequencyHz) /
      (V384_BOLTZMANN_CONSTANT_J_K * productTemperatureK);
    const photonRadiance =
      (2 * frequencyHz ** 2) /
      (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
    const coefficient =
      index === 0 || index === V389_INTEGRATION_STEPS
        ? 1
        : index % 2 === 0
          ? 2
          : 4;
    sum += coefficient * photonRadiance;
  }
  const result = sum * width / 3;
  if (!Number.isFinite(result) || result < 0) {
    throw new Error("v389-product-integral");
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
  if (!(targetPhotonRadiance > 0)) throw new Error("v389-target");
  for (let iteration = 0; iteration < V389_ROOT_ITERATIONS; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    const value = integratePhotonAtProductTemperature(
      lowerFrequencyHz,
      upperFrequencyHz,
      midpoint,
    );
    if (value < targetPhotonRadiance) lower = midpoint;
    else upper = midpoint;
  }
  return 0.5 * (lower + upper);
}

function intervalRelativeRadius(
  central: number,
  interval: Readonly<{ lower: number; upper: number }>,
) {
  return Math.max(
    Math.abs(central - interval.lower),
    Math.abs(interval.upper - central),
  ) / central;
}

export function createKerrConditionalTemperatureIntervalV389(
  replayValue: KerrGeometryConditionedTemperatureArtifactV388,
  photonViewValue: KerrSciencePhotonBandViewV328,
  bandViewValue: KerrThinDiskBandImagingViewV320,
): ConditionalTemperatureIntervalComputationV389 {
  const replay = parseKerrGeometryConditionedTemperatureArtifactV388(
    replayValue,
  );
  const photonView = parseKerrSciencePhotonBandViewV328(photonViewValue);
  const bandView = parseKerrThinDiskBandImagingViewV320(bandViewValue);
  if (
    replay.source.v328PhotonArtifactSha256.length !== 64 ||
    replay.source.fullShortAuthoritySha256 !==
      photonView.source.fullShortAuthoritySha256 ||
    photonView.source.fullShortAuthoritySha256 !==
      bandView.source.fullShortAuthoritySha256
  ) {
    throw new Error("v389-source-identity");
  }
  let maximumPhotonRadius = 0;
  let maximumNumericalRadius = 0;
  let maximumSourceModelRadius = 0;
  let overlapCount = 0;
  const rows = replay.rows.map((replayRow) => {
    const photonRay = photonView.rays.find(
      (ray) => ray.rayIndex === replayRow.rayIndex,
    );
    const measurement = photonRay?.measurements.find(
      (entry) => entry.bandId === replayRow.bandId,
    );
    const bandSample = bandView.samples.find(
      (sample) => sample.rayIndex === replayRow.rayIndex && sample.applicable,
    );
    if (
      !measurement ||
      !bandSample ||
      !finitePositive(measurement.observedPhotonRadiancePerSM2Sr) ||
      !finitePositive(measurement.bandLowerFrequencyHz) ||
      !finitePositive(measurement.bandUpperFrequencyHz) ||
      measurement.bandLowerFrequencyHz >= measurement.bandUpperFrequencyHz ||
      !finitePositive(replayRow.geometryRedshiftCarter) ||
      !finitePositive(replayRow.geometryRedshiftKerrSchild) ||
      !finitePositive(replayRow.conditionedTemperatureCarterK) ||
      !finitePositive(bandSample.effectiveTemperatureK) ||
      !finiteNonNegative(
        bandSample.sourceErrorBudget.pageThorneQuadratureRelative,
      )
    ) {
      throw new Error(`v389-row-source:${replayRow.rayIndex}:${replayRow.bandId}`);
    }
    const photonRelativeRadius =
      measurement.quadratureRelativeDifference +
      replayRow.pythonOracleMaximumRelativeDifference +
      replayRow.inversionPhotonResidualRelative;
    if (!(photonRelativeRadius > 0 && photonRelativeRadius < 1)) {
      throw new Error("v389-photon-radius");
    }
    const photonIntervalPerSM2Sr = Object.freeze({
      lower:
        measurement.observedPhotonRadiancePerSM2Sr * (1 - photonRelativeRadius),
      upper:
        measurement.observedPhotonRadiancePerSM2Sr * (1 + photonRelativeRadius),
    });
    const productTemperatureCentralK = invertProductTemperature(
      measurement.bandLowerFrequencyHz,
      measurement.bandUpperFrequencyHz,
      measurement.observedPhotonRadiancePerSM2Sr,
    );
    const productTemperatureIntervalK = Object.freeze({
      lower: invertProductTemperature(
        measurement.bandLowerFrequencyHz,
        measurement.bandUpperFrequencyHz,
        photonIntervalPerSM2Sr.lower,
      ),
      upper: invertProductTemperature(
        measurement.bandLowerFrequencyHz,
        measurement.bandUpperFrequencyHz,
        photonIntervalPerSM2Sr.upper,
      ),
    });
    const geometryRedshiftInterval = Object.freeze({
      lower: Math.min(
        replayRow.geometryRedshiftCarter,
        replayRow.geometryRedshiftKerrSchild,
      ),
      upper: Math.max(
        replayRow.geometryRedshiftCarter,
        replayRow.geometryRedshiftKerrSchild,
      ),
    });
    if (
      !finitePositive(geometryRedshiftInterval.lower) ||
      geometryRedshiftInterval.lower > geometryRedshiftInterval.upper
    ) {
      throw new Error("v389-positive-redshift-interval");
    }
    const conditionedTemperatureCentralK =
      replayRow.conditionedTemperatureCarterK;
    const conditionedTemperatureNumericalIntervalK = Object.freeze({
      lower:
        productTemperatureIntervalK.lower / geometryRedshiftInterval.upper,
      upper:
        productTemperatureIntervalK.upper / geometryRedshiftInterval.lower,
    });
    const conditionedTemperatureNumericalRelativeRadius =
      intervalRelativeRadius(
        conditionedTemperatureCentralK,
        conditionedTemperatureNumericalIntervalK,
      );
    const pageThorneFluxRelativeRadius =
      bandSample.sourceErrorBudget.pageThorneQuadratureRelative;
    if (!(pageThorneFluxRelativeRadius >= 0 && pageThorneFluxRelativeRadius < 1)) {
      throw new Error("v389-page-thorne-radius");
    }
    const sourceModelTemperatureCentralK = bandSample.effectiveTemperatureK;
    const sourceModelTemperatureIntervalK = Object.freeze({
      lower:
        sourceModelTemperatureCentralK *
        (1 - pageThorneFluxRelativeRadius) ** 0.25,
      upper:
        sourceModelTemperatureCentralK *
        (1 + pageThorneFluxRelativeRadius) ** 0.25,
    });
    const sourceModelTemperatureRelativeRadius = intervalRelativeRadius(
      sourceModelTemperatureCentralK,
      sourceModelTemperatureIntervalK,
    );
    const numericalAndSourceModelIntervalsOverlap =
      conditionedTemperatureNumericalIntervalK.lower <=
        sourceModelTemperatureIntervalK.upper &&
      sourceModelTemperatureIntervalK.lower <=
        conditionedTemperatureNumericalIntervalK.upper;
    if (
      conditionedTemperatureNumericalRelativeRadius >=
        V389_INTERVAL_RELATIVE_RADIUS_LIMIT ||
      sourceModelTemperatureRelativeRadius >=
        V389_INTERVAL_RELATIVE_RADIUS_LIMIT
    ) {
      throw new Error(`v389-interval-gate:${replayRow.rayIndex}:${replayRow.bandId}`);
    }
    if (numericalAndSourceModelIntervalsOverlap) overlapCount += 1;
    maximumPhotonRadius = Math.max(maximumPhotonRadius, photonRelativeRadius);
    maximumNumericalRadius = Math.max(
      maximumNumericalRadius,
      conditionedTemperatureNumericalRelativeRadius,
    );
    maximumSourceModelRadius = Math.max(
      maximumSourceModelRadius,
      sourceModelTemperatureRelativeRadius,
    );
    return Object.freeze({
      rayIndex: replayRow.rayIndex,
      rayId: replayRow.rayId,
      bandId: replayRow.bandId,
      photonCentralPerSM2Sr: measurement.observedPhotonRadiancePerSM2Sr,
      photonRelativeRadius,
      photonIntervalPerSM2Sr,
      productTemperatureCentralK,
      productTemperatureIntervalK,
      geometryRedshiftInterval,
      conditionedTemperatureCentralK,
      conditionedTemperatureNumericalIntervalK,
      conditionedTemperatureNumericalRelativeRadius,
      sourceModelTemperatureCentralK,
      pageThorneFluxRelativeRadius,
      sourceModelTemperatureIntervalK,
      sourceModelTemperatureRelativeRadius,
      numericalAndSourceModelIntervalsOverlap,
      absoluteTemperatureInterval: null,
    });
  });
  if (rows.length !== 12) throw new Error("v389-row-count");
  return Object.freeze({
    rows: Object.freeze(rows),
    maxima: Object.freeze({
      photonRelativeRadius: maximumPhotonRadius,
      conditionedTemperatureNumericalRelativeRadius: maximumNumericalRadius,
      sourceModelTemperatureRelativeRadius: maximumSourceModelRadius,
    }),
    overlapCount,
  });
}

export function parseKerrConditionalTemperatureIntervalArtifactV389(
  value: unknown,
): KerrConditionalTemperatureIntervalArtifactV389 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<KerrConditionalTemperatureIntervalArtifactV389>)
    : null;
  const rows = Array.isArray(source?.rows) ? source.rows : [];
  const rayBands = new Map<number, Set<KerrThinDiskBandIdV320>>();
  for (const row of rows) {
    const bands = rayBands.get(row.rayIndex) ?? new Set<KerrThinDiskBandIdV320>();
    bands.add(row.bandId);
    rayBands.set(row.rayIndex, bands);
  }
  const overlapCount = rows.filter(
    (row) => row.numericalAndSourceModelIntervalsOverlap === true,
  ).length;
  const maximumPhotonRadius = Math.max(
    ...rows.map((row) => row.photonRelativeRadius),
  );
  const maximumNumericalRadius = Math.max(
    ...rows.map((row) => row.conditionedTemperatureNumericalRelativeRadius),
  );
  const maximumSourceModelRadius = Math.max(
    ...rows.map((row) => row.sourceModelTemperatureRelativeRadius),
  );
  const maximumOracleDifference = Math.max(
    ...rows.map((row) => row.pythonOracleMaximumRelativeDifference),
  );
  if (
    !source ||
    source.version !== KERR_CONDITIONAL_TEMPERATURE_INTERVAL_VERSION_V389 ||
    source.status !==
      "conditional-temperature-exact-interval-qualified-physical-systematics-unavailable" ||
    !source.source ||
    Object.keys(source.source).length !== 4 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 12 ||
    rayBands.size !== 4 ||
    [...rayBands.values()].some(
      (bands) =>
        bands.size !== 3 ||
        [...BAND_IDS_V389].some((bandId) => !bands.has(bandId)),
    ) ||
    rows.some(
      (row) =>
        !Number.isInteger(row.rayIndex) ||
        row.rayIndex < 0 ||
        typeof row.rayId !== "string" ||
        row.rayId.length === 0 ||
        !BAND_IDS_V389.has(row.bandId) ||
        !finitePositive(row.photonCentralPerSM2Sr) ||
        !finitePositive(row.photonRelativeRadius) ||
        row.photonRelativeRadius >= 1 ||
        !validBracketingInterval(
          row.photonIntervalPerSM2Sr,
          row.photonCentralPerSM2Sr,
        ) ||
        !validBracketingInterval(
          row.productTemperatureIntervalK,
          row.productTemperatureCentralK,
        ) ||
        !row.geometryRedshiftInterval ||
        !finitePositive(row.geometryRedshiftInterval.lower) ||
        !finitePositive(row.geometryRedshiftInterval.upper) ||
        row.geometryRedshiftInterval.lower >
          row.geometryRedshiftInterval.upper ||
        !validBracketingInterval(
          row.conditionedTemperatureNumericalIntervalK,
          row.conditionedTemperatureCentralK,
          false,
        ) ||
        !finiteNonNegative(
          row.conditionedTemperatureNumericalRelativeRadius,
        ) ||
        row.conditionedTemperatureNumericalRelativeRadius >=
          V389_INTERVAL_RELATIVE_RADIUS_LIMIT ||
        !finitePositive(row.sourceModelTemperatureCentralK) ||
        !finiteNonNegative(row.pageThorneFluxRelativeRadius) ||
        row.pageThorneFluxRelativeRadius >= 1 ||
        !validBracketingInterval(
          row.sourceModelTemperatureIntervalK,
          row.sourceModelTemperatureCentralK,
          row.pageThorneFluxRelativeRadius > 0,
        ) ||
        !finiteNonNegative(row.sourceModelTemperatureRelativeRadius) ||
        row.sourceModelTemperatureRelativeRadius >=
          V389_INTERVAL_RELATIVE_RADIUS_LIMIT ||
        typeof row.numericalAndSourceModelIntervalsOverlap !== "boolean" ||
        !finiteNonNegative(row.pythonOracleMaximumRelativeDifference) ||
        row.pythonOracleMaximumRelativeDifference >= V389_ORACLE_RELATIVE_LIMIT ||
        row.absoluteTemperatureInterval !== null,
    ) ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.intervalCount !== 12 ||
    source.counts.overlapCount !== overlapCount ||
    source.maxima?.photonRelativeRadius !== maximumPhotonRadius ||
    source.maxima?.conditionedTemperatureNumericalRelativeRadius !==
      maximumNumericalRadius ||
    source.maxima?.sourceModelTemperatureRelativeRadius !==
      maximumSourceModelRadius ||
    source.maxima?.pythonOracleRelativeDifference !== maximumOracleDifference ||
    (source.maxima?.conditionedTemperatureNumericalRelativeRadius ?? Infinity) >=
      V389_INTERVAL_RELATIVE_RADIUS_LIMIT ||
    (source.maxima?.sourceModelTemperatureRelativeRadius ?? Infinity) >=
      V389_INTERVAL_RELATIVE_RADIUS_LIMIT ||
    (source.maxima?.pythonOracleRelativeDifference ?? Infinity) >=
      V389_ORACLE_RELATIVE_LIMIT ||
    source.algorithms?.intervalCombination !==
      "worst-case-endpoints-no-independence-proof-no-rss" ||
    source.algorithms.photonToProductTemperature !==
      "monotonic-bisection-on-planck-photon-integral" ||
    source.algorithms.geometryConditioning !==
      "exact-positive-interval-division-gT-over-g" ||
    source.algorithms.pageThorneTemperature !==
      "exact-fourth-root-map-from-positive-flux-interval" ||
    source.algorithms.deterministicReplay !== true ||
    source.intervalSemantics?.knownNumericalIntervalQualified !== true ||
    source.intervalSemantics.sourceModelNumericalIntervalQualified !== true ||
    source.intervalSemantics.confidenceInterval !== false ||
    source.intervalSemantics.probabilityContentAssigned !== false ||
    source.intervalSemantics.detectorCalibrationCovarianceAvailable !== false ||
    source.intervalSemantics.geometryPhysicalSystematicAvailable !== false ||
    source.intervalSemantics.nonPlanckSpectralSystematicAvailable !== false ||
    source.intervalSemantics.absoluteScientificIntervalQualified !== false ||
    source.intervalSemantics.numericalPlaceholderUsed !== false ||
    source.qualification?.exactNonlinearPropagationQualified !== true ||
    source.qualification.conditionalTemperatureReplayQualified !== true ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.export?.csvPath !==
      "dist/science/kerr-conditional-temperature-interval-v389/temperature-interval.csv" ||
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
    throw new Error("v389-interval-artifact-identity");
  }
  return value as KerrConditionalTemperatureIntervalArtifactV389;
}
