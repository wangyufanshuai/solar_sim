import {
  parseKerrConditionalTemperatureIntervalArtifactV389,
  type KerrConditionalTemperatureIntervalArtifactV389,
} from "./kerrConditionalTemperatureIntervalV389";
import {
  parseKerrPhotonSourceIdentifiabilityArtifactV387,
  type KerrPhotonSourceIdentifiabilityArtifactV387,
} from "./kerrPhotonSourceIdentifiabilityV387";
import { KERR_PLANCK_CONSTANT_J_S_V328 } from "./kerrSciencePhotonBandsV328";
import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import {
  V384_BOLTZMANN_CONSTANT_J_K,
  V384_SPEED_OF_LIGHT_M_S,
} from "./measuredVisiblePhotonObservableV384";

export const KERR_TEMPERATURE_SYSTEMATICS_TRANSFER_VERSION_V390 =
  "v390-kerr-temperature-systematics-transfer-v1" as const;
export const V390_INTEGRATION_STEPS = 4_096 as const;
export const V390_ROOT_ITERATIONS = 80 as const;
export const V390_FINITE_DIFFERENCE_STEP = 1e-5 as const;
export const V390_FINITE_DIFFERENCE_RELATIVE_LIMIT = 2e-7;
export const V390_ORACLE_RELATIVE_LIMIT = 2e-7;
export const V390_OPERATOR_CONDITION_LIMIT = 16;

const SHA256 = /^[a-f0-9]{64}$/;
const BAND_IDS = new Set<KerrThinDiskBandIdV320>([
  "visible",
  "euv",
  "soft-x-ray",
]);
export const V390_INPUT_ORDER = Object.freeze([
  "ln-photon-radiance",
  "ln-redshift-factor",
  "ln-page-thorne-flux",
] as const);
export const V390_OUTPUT_ORDER = Object.freeze([
  "ln-conditioned-temperature",
  "ln-source-model-temperature",
] as const);

export type KerrTemperatureSystematicsTransferRowV390 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  planckLogPhotonSensitivity: number;
  transferMatrix: readonly [
    readonly [number, -1, 0],
    readonly [0, 0, 0.25],
  ];
  singularValues: readonly [number, 0.25];
  rank: 2;
  conditionNumber: number;
  finiteDifference: Readonly<{
    photonRadianceToConditionedTemperature: number;
    redshiftToConditionedTemperature: number;
    pageThorneFluxToSourceTemperature: number;
    maximumRelativeDifference: number;
  }>;
  pythonOracleMaximumRelativeDifference: number;
  physicalSystematicVectorAdmitted: false;
  projectedPhysicalCovariance: null;
  absoluteScientificInterval: null;
}>;

export type KerrTemperatureSystematicsTransferComputationV390 = Readonly<{
  rows: readonly Omit<
    KerrTemperatureSystematicsTransferRowV390,
    "pythonOracleMaximumRelativeDifference"
  >[];
  maxima: Readonly<{
    finiteDifferenceRelativeDifference: number;
    conditionNumber: number;
  }>;
}>;

export type KerrTemperatureSystematicsTransferArtifactV390 = Readonly<{
  version: typeof KERR_TEMPERATURE_SYSTEMATICS_TRANSFER_VERSION_V390;
  generatedAt: string;
  status:
    "systematics-transfer-operator-qualified-physical-covariance-unavailable";
  source: Readonly<{
    v389IntervalArtifactSha256: string;
    v387IdentifiabilityArtifactSha256: string;
    v386SensitivityArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  rows: readonly KerrTemperatureSystematicsTransferRowV390[];
  counts: Readonly<{
    rayCount: 4;
    bandCount: 3;
    transferCount: 12;
    inputCount: 3;
    outputCount: 2;
    coefficientCount: 72;
    rowRank: 2;
  }>;
  maxima: Readonly<{
    finiteDifferenceRelativeDifference: number;
    pythonOracleRelativeDifference: number;
    conditionNumber: number;
  }>;
  operator: Readonly<{
    inputOrder: typeof V390_INPUT_ORDER;
    outputOrder: typeof V390_OUTPUT_ORDER;
    semantics: "local-first-order-log-space-transfer";
    photonTransfer: "inverse-planck-log-sensitivity";
    redshiftTransfer: "exact-minus-one-from-T-equals-gT-over-g";
    pageThorneTransfer: "exact-one-quarter-from-T-proportional-F-one-quarter";
    nonlinearNumericalIntervalSource: "v389-exact-endpoint-propagation";
    derivativeValidationStep: typeof V390_FINITE_DIFFERENCE_STEP;
    derivativeValidationOnlyNotPhysicalUncertainty: true;
  }>;
  admission: Readonly<{
    photonDetectorCovarianceAvailable: false;
    geometryRedshiftPhysicalSystematicAvailable: false;
    pageThorneFluxPhysicalSystematicAvailable: false;
    nonPlanckSpectralSystematicAvailable: false;
    crossCovarianceAvailable: false;
    physicalSystematicVectorAdmitted: false;
    covarianceProjectionExecuted: false;
    syntheticFixturePublishable: false;
    unknownSystematicsTreatedAsZero: false;
    rssApplied: false;
    confidenceInterval: false;
    probabilityContentAssigned: false;
  }>;
  qualification: Readonly<{
    systematicsTransferOperatorQualified: true;
    exactNonlinearNumericalIntervalQualified: true;
    absoluteScientificIntervalQualified: false;
    absoluteTemperatureAuthorityGranted: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.csv";
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

function integratePhoton(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  productTemperatureK: number,
) {
  const width =
    (upperFrequencyHz - lowerFrequencyHz) / V390_INTEGRATION_STEPS;
  let total = 0;
  for (let index = 0; index <= V390_INTEGRATION_STEPS; index += 1) {
    const frequencyHz = lowerFrequencyHz + index * width;
    const exponent =
      (KERR_PLANCK_CONSTANT_J_S_V328 * frequencyHz) /
      (V384_BOLTZMANN_CONSTANT_J_K * productTemperatureK);
    const spectral =
      exponent > 700
        ? 0
        : (2 * frequencyHz ** 2) /
          (V384_SPEED_OF_LIGHT_M_S ** 2 * Math.expm1(exponent));
    const coefficient =
      index === 0 || index === V390_INTEGRATION_STEPS
        ? 1
        : index % 2 === 0
          ? 2
          : 4;
    total += coefficient * spectral;
  }
  const result = total * width / 3;
  if (!Number.isFinite(result) || result <= 0) {
    throw new Error("v390-planck-integral");
  }
  return result;
}

function invertProductTemperature(
  lowerFrequencyHz: number,
  upperFrequencyHz: number,
  photonRadiance: number,
) {
  if (!(photonRadiance > 0)) throw new Error("v390-photon-radiance");
  let lower = 100;
  let upper = 1e9;
  for (let iteration = 0; iteration < V390_ROOT_ITERATIONS; iteration += 1) {
    const midpoint = 0.5 * (lower + upper);
    if (
      integratePhoton(lowerFrequencyHz, upperFrequencyHz, midpoint) <
      photonRadiance
    ) {
      lower = midpoint;
    } else {
      upper = midpoint;
    }
  }
  return 0.5 * (lower + upper);
}

const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

export function createKerrTemperatureSystematicsTransferV390(
  intervalValue: KerrConditionalTemperatureIntervalArtifactV389,
  identifiabilityValue: KerrPhotonSourceIdentifiabilityArtifactV387,
): KerrTemperatureSystematicsTransferComputationV390 {
  const interval = parseKerrConditionalTemperatureIntervalArtifactV389(
    intervalValue,
  );
  const identifiability = parseKerrPhotonSourceIdentifiabilityArtifactV387(
    identifiabilityValue,
  );
  if (
    interval.source.v328PhotonArtifactSha256 !==
      identifiability.source.v328PhotonArtifactSha256 ||
    interval.source.fullShortAuthoritySha256 !==
      identifiability.source.v328FullShortAuthoritySha256
  ) {
    throw new Error("v390-source-identity");
  }
  let maximumFiniteDifferenceRelativeDifference = 0;
  let maximumConditionNumber = 0;
  const rows = interval.rows.map((intervalRow) => {
    const identityRow = identifiability.rows.find(
      (row) =>
        row.rayIndex === intervalRow.rayIndex &&
        row.bandId === intervalRow.bandId,
    );
    if (!identityRow || !(identityRow.logTemperatureSensitivity > 0)) {
      throw new Error(
        `v390-identifiability-row:${intervalRow.rayIndex}:${intervalRow.bandId}`,
      );
    }
    const photonTransfer = 1 / identityRow.logTemperatureSensitivity;
    const firstSingular = Math.hypot(photonTransfer, 1);
    const conditionNumber = firstSingular / 0.25;
    if (!(conditionNumber > 0 && conditionNumber < V390_OPERATOR_CONDITION_LIMIT)) {
      throw new Error("v390-condition-number");
    }
    const step = V390_FINITE_DIFFERENCE_STEP;
    const photonHigh = invertProductTemperature(
      identityRow.bandLowerFrequencyHz,
      identityRow.bandUpperFrequencyHz,
      intervalRow.photonCentralPerSM2Sr * Math.exp(step),
    );
    const photonLow = invertProductTemperature(
      identityRow.bandLowerFrequencyHz,
      identityRow.bandUpperFrequencyHz,
      intervalRow.photonCentralPerSM2Sr * Math.exp(-step),
    );
    const photonFiniteDifference =
      (Math.log(photonHigh) - Math.log(photonLow)) / (2 * step);
    const redshiftCentral = Math.sqrt(
      intervalRow.geometryRedshiftInterval.lower *
        intervalRow.geometryRedshiftInterval.upper,
    );
    const redshiftHighTemperature =
      intervalRow.productTemperatureCentralK /
      (redshiftCentral * Math.exp(step));
    const redshiftLowTemperature =
      intervalRow.productTemperatureCentralK /
      (redshiftCentral * Math.exp(-step));
    const redshiftFiniteDifference =
      (Math.log(redshiftHighTemperature) -
        Math.log(redshiftLowTemperature)) /
      (2 * step);
    const fluxHighTemperature =
      intervalRow.sourceModelTemperatureCentralK * Math.exp(step) ** 0.25;
    const fluxLowTemperature =
      intervalRow.sourceModelTemperatureCentralK * Math.exp(-step) ** 0.25;
    const fluxFiniteDifference =
      (Math.log(fluxHighTemperature) - Math.log(fluxLowTemperature)) /
      (2 * step);
    const maximumRelativeDifference = Math.max(
      relativeDifference(photonTransfer, photonFiniteDifference),
      relativeDifference(-1, redshiftFiniteDifference),
      relativeDifference(0.25, fluxFiniteDifference),
    );
    if (
      !Number.isFinite(maximumRelativeDifference) ||
      maximumRelativeDifference >= V390_FINITE_DIFFERENCE_RELATIVE_LIMIT
    ) {
      throw new Error(
        `v390-finite-difference:${intervalRow.rayIndex}:${intervalRow.bandId}:${maximumRelativeDifference}`,
      );
    }
    maximumFiniteDifferenceRelativeDifference = Math.max(
      maximumFiniteDifferenceRelativeDifference,
      maximumRelativeDifference,
    );
    maximumConditionNumber = Math.max(
      maximumConditionNumber,
      conditionNumber,
    );
    return Object.freeze({
      rayIndex: intervalRow.rayIndex,
      rayId: intervalRow.rayId,
      bandId: intervalRow.bandId,
      planckLogPhotonSensitivity: identityRow.logTemperatureSensitivity,
      transferMatrix: Object.freeze([
        Object.freeze([photonTransfer, -1, 0] as const),
        Object.freeze([0, 0, 0.25] as const),
      ] as const),
      singularValues: Object.freeze([firstSingular, 0.25] as const),
      rank: 2 as const,
      conditionNumber,
      finiteDifference: Object.freeze({
        photonRadianceToConditionedTemperature: photonFiniteDifference,
        redshiftToConditionedTemperature: redshiftFiniteDifference,
        pageThorneFluxToSourceTemperature: fluxFiniteDifference,
        maximumRelativeDifference,
      }),
      physicalSystematicVectorAdmitted: false as const,
      projectedPhysicalCovariance: null,
      absoluteScientificInterval: null,
    });
  });
  if (rows.length !== 12) throw new Error("v390-row-count");
  return Object.freeze({
    rows: Object.freeze(rows),
    maxima: Object.freeze({
      finiteDifferenceRelativeDifference:
        maximumFiniteDifferenceRelativeDifference,
      conditionNumber: maximumConditionNumber,
    }),
  });
}

export function parseKerrTemperatureSystematicsTransferArtifactV390(
  value: unknown,
): KerrTemperatureSystematicsTransferArtifactV390 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<KerrTemperatureSystematicsTransferArtifactV390>)
    : null;
  const rows = Array.isArray(source?.rows) ? source.rows : [];
  const keys = new Set(rows.map((row) => `${row.rayIndex}:${row.bandId}`));
  const rayIndexes = new Set(rows.map((row) => row.rayIndex));
  const maximumFiniteDifference = Math.max(
    ...rows.map((row) => row.finiteDifference.maximumRelativeDifference),
  );
  const maximumConditionNumber = Math.max(
    ...rows.map((row) => row.conditionNumber),
  );
  const maximumOracleDifference = Math.max(
    ...rows.map((row) => row.pythonOracleMaximumRelativeDifference),
  );
  if (
    !source ||
    source.version !== KERR_TEMPERATURE_SYSTEMATICS_TRANSFER_VERSION_V390 ||
    source.status !==
      "systematics-transfer-operator-qualified-physical-covariance-unavailable" ||
    !source.source ||
    Object.keys(source.source).length !== 4 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 12 ||
    keys.size !== 12 ||
    rayIndexes.size !== 4 ||
    rows.some(
      (row) =>
        !Number.isInteger(row.rayIndex) ||
        typeof row.rayId !== "string" ||
        row.rayId.length === 0 ||
        !BAND_IDS.has(row.bandId) ||
        !(row.planckLogPhotonSensitivity > 0) ||
        row.transferMatrix.length !== 2 ||
        row.transferMatrix[0].length !== 3 ||
        row.transferMatrix[1].length !== 3 ||
        !(row.transferMatrix[0][0] > 0) ||
        row.transferMatrix[0][1] !== -1 ||
        row.transferMatrix[0][2] !== 0 ||
        row.transferMatrix[1][0] !== 0 ||
        row.transferMatrix[1][1] !== 0 ||
        row.transferMatrix[1][2] !== 0.25 ||
        row.rank !== 2 ||
        row.singularValues[1] !== 0.25 ||
        row.conditionNumber !== row.singularValues[0] / 0.25 ||
        row.conditionNumber >= V390_OPERATOR_CONDITION_LIMIT ||
        row.finiteDifference.maximumRelativeDifference >=
          V390_FINITE_DIFFERENCE_RELATIVE_LIMIT ||
        row.pythonOracleMaximumRelativeDifference >= V390_ORACLE_RELATIVE_LIMIT ||
        row.physicalSystematicVectorAdmitted !== false ||
        row.projectedPhysicalCovariance !== null ||
        row.absoluteScientificInterval !== null,
    ) ||
    source.counts?.rayCount !== 4 ||
    source.counts.bandCount !== 3 ||
    source.counts.transferCount !== 12 ||
    source.counts.inputCount !== 3 ||
    source.counts.outputCount !== 2 ||
    source.counts.coefficientCount !== 72 ||
    source.counts.rowRank !== 2 ||
    source.maxima?.finiteDifferenceRelativeDifference !==
      maximumFiniteDifference ||
    source.maxima?.conditionNumber !== maximumConditionNumber ||
    source.maxima?.pythonOracleRelativeDifference !== maximumOracleDifference ||
    source.operator?.semantics !== "local-first-order-log-space-transfer" ||
    source.operator.photonTransfer !== "inverse-planck-log-sensitivity" ||
    source.operator.redshiftTransfer !==
      "exact-minus-one-from-T-equals-gT-over-g" ||
    source.operator.pageThorneTransfer !==
      "exact-one-quarter-from-T-proportional-F-one-quarter" ||
    source.operator.nonlinearNumericalIntervalSource !==
      "v389-exact-endpoint-propagation" ||
    source.operator.derivativeValidationStep !== V390_FINITE_DIFFERENCE_STEP ||
    source.operator.derivativeValidationOnlyNotPhysicalUncertainty !== true ||
    JSON.stringify(source.operator.inputOrder) !== JSON.stringify(V390_INPUT_ORDER) ||
    JSON.stringify(source.operator.outputOrder) !==
      JSON.stringify(V390_OUTPUT_ORDER) ||
    source.admission?.photonDetectorCovarianceAvailable !== false ||
    source.admission.geometryRedshiftPhysicalSystematicAvailable !== false ||
    source.admission.pageThorneFluxPhysicalSystematicAvailable !== false ||
    source.admission.nonPlanckSpectralSystematicAvailable !== false ||
    source.admission.crossCovarianceAvailable !== false ||
    source.admission.physicalSystematicVectorAdmitted !== false ||
    source.admission.covarianceProjectionExecuted !== false ||
    source.admission.syntheticFixturePublishable !== false ||
    source.admission.unknownSystematicsTreatedAsZero !== false ||
    source.admission.rssApplied !== false ||
    source.admission.confidenceInterval !== false ||
    source.admission.probabilityContentAssigned !== false ||
    source.qualification?.systematicsTransferOperatorQualified !== true ||
    source.qualification.exactNonlinearNumericalIntervalQualified !== true ||
    source.qualification.absoluteScientificIntervalQualified !== false ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.export?.csvPath !==
      "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.csv" ||
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
    throw new Error("v390-systematics-transfer-artifact-identity");
  }
  return value as KerrTemperatureSystematicsTransferArtifactV390;
}
