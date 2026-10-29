import {
  parseMeasuredVisiblePhotonObservableArtifactV384,
  type MeasuredVisiblePhotonObservableArtifactV384,
} from "./measuredVisiblePhotonObservableV384";
import {
  parseMeasuredVisibleThroughputArtifactV383,
  type MeasuredVisibleThroughputArtifactV383,
} from "./measuredVisibleThroughputV383";

export const MEASURED_VISIBLE_PHOTON_ERROR_BUDGET_VERSION_V385 =
  "v385-visible-photon-error-budget-v1" as const;
export const V385_KNOWN_COMPUTATIONAL_UPPER_BOUND_LIMIT = 2e-7;
export const V385_ORACLE_RELATIVE_DIFFERENCE_LIMIT = 1e-15;

const SHA256 = /^[a-f0-9]{64}$/;

export type PhotonErrorNumericComponentV385 = Readonly<{
  id:
    | "v328-photon-quadrature"
    | "v383-throughput-normalization"
    | "v384-band-reconstruction"
    | "v384-cross-domain-integration";
  status: "quantified";
  relativeUpperBound: number;
  evidenceKind: "observed-numerical-difference";
  independenceEstablished: false;
}>;

export type PhotonErrorUnavailableComponentV385 = Readonly<{
  id: "throughput-calibration-systematic" | "source-model-systematic";
  status: "unavailable";
  reason:
    | "source-dossier-incomplete-no-calibration-covariance-or-repeat-uncertainty"
    | "v328-effective-temperature-redshift-and-thin-disk-model-uncertainty-not-provided";
  numericalPlaceholderUsed: false;
}>;

export type PhotonErrorBudgetRowV385 = Readonly<{
  rayIndex: number;
  photonObservablePerSM2Sr: number;
  quantifiedComponents: readonly PhotonErrorNumericComponentV385[];
  unavailableSystematics: readonly PhotonErrorUnavailableComponentV385[];
  knownComputationalUpperBoundRelative: number;
  knownComputationalInterval: Readonly<{ lower: number; upper: number }>;
  pythonOracleRelativeDifference: number;
  totalScientificUncertaintyRelative: "unavailable";
  totalScientificInterval: null;
}>;

export type MeasuredVisiblePhotonErrorBudgetComputationV385 = Readonly<{
  rows: readonly Omit<PhotonErrorBudgetRowV385, "pythonOracleRelativeDifference">[];
  maximumKnownComputationalUpperBoundRelative: number;
}>;

export type MeasuredVisiblePhotonErrorBudgetArtifactV385 = Readonly<{
  version: typeof MEASURED_VISIBLE_PHOTON_ERROR_BUDGET_VERSION_V385;
  generatedAt: string;
  status:
    "computational-error-budget-qualified-scientific-systematics-unavailable";
  source: Readonly<{
    v384ObservableArtifactSha256: string;
    v384ObservableCsvSha256: string;
    v383ThroughputArtifactSha256: string;
    v328PhotonArtifactSha256: string;
  }>;
  rows: readonly PhotonErrorBudgetRowV385[];
  counts: Readonly<{
    rayCount: 4;
    quantifiedComponentCountPerRay: 4;
    unavailableSystematicCountPerRay: 2;
  }>;
  maxima: Readonly<{
    knownComputationalUpperBoundRelative: number;
    pythonOracleRelativeDifference: number;
  }>;
  combination: Readonly<{
    rule: "linear-sum-no-independence-proof";
    rssApplied: false;
    unknownSystematicsTreatedAsZero: false;
    knownComputationalIntervalIsConfidenceInterval: false;
    deterministicReplay: true;
  }>;
  qualification: Readonly<{
    computationalBudgetQualified: true;
    absoluteScientificBudgetQualified: false;
    throughputCalibrationSystematicAvailable: false;
    sourceModelSystematicAvailable: false;
    detectorElectronBudgetApplicable: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  export: Readonly<{
    csvPath:
      "dist/science/measured-visible-photon-error-budget-v385/error-budget.csv";
    csvFileSha256: string;
    rowCount: 4;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

const UNAVAILABLE_SYSTEMATICS = Object.freeze([
  Object.freeze({
    id: "throughput-calibration-systematic" as const,
    status: "unavailable" as const,
    reason:
      "source-dossier-incomplete-no-calibration-covariance-or-repeat-uncertainty" as const,
    numericalPlaceholderUsed: false as const,
  }),
  Object.freeze({
    id: "source-model-systematic" as const,
    status: "unavailable" as const,
    reason:
      "v328-effective-temperature-redshift-and-thin-disk-model-uncertainty-not-provided" as const,
    numericalPlaceholderUsed: false as const,
  }),
]);

export function createMeasuredVisiblePhotonErrorBudgetV385(
  observableValue: MeasuredVisiblePhotonObservableArtifactV384,
  throughputValue: MeasuredVisibleThroughputArtifactV383,
): MeasuredVisiblePhotonErrorBudgetComputationV385 {
  const observable = parseMeasuredVisiblePhotonObservableArtifactV384(
    observableValue,
  );
  const throughput = parseMeasuredVisibleThroughputArtifactV383(throughputValue);
  if (
    observable.source.v383ThroughputArtifactSha256 !==
      throughput.artifactSha256 ||
    throughput.authorityBoundary.sourceDossierAvailable !== false ||
    throughput.authorityBoundary.visibleMeasuredAuthorityGranted !== false
  ) {
    throw new Error("v385-source-identity");
  }
  const throughputNormalization =
    throughput.dualImplementation.maximumMetricRelativeDifference;
  let maximum = 0;
  const rows = observable.rows.map((row) => {
    const quantifiedComponents = Object.freeze([
      Object.freeze({
        id: "v328-photon-quadrature" as const,
        status: "quantified" as const,
        relativeUpperBound: row.sourcePhotonQuadratureRelativeDifference,
        evidenceKind: "observed-numerical-difference" as const,
        independenceEstablished: false as const,
      }),
      Object.freeze({
        id: "v383-throughput-normalization" as const,
        status: "quantified" as const,
        relativeUpperBound: throughputNormalization,
        evidenceKind: "observed-numerical-difference" as const,
        independenceEstablished: false as const,
      }),
      Object.freeze({
        id: "v384-band-reconstruction" as const,
        status: "quantified" as const,
        relativeUpperBound:
          row.unweightedReconstructionRelativeDifference,
        evidenceKind: "observed-numerical-difference" as const,
        independenceEstablished: false as const,
      }),
      Object.freeze({
        id: "v384-cross-domain-integration" as const,
        status: "quantified" as const,
        relativeUpperBound: row.pythonOracleRelativeDifference,
        evidenceKind: "observed-numerical-difference" as const,
        independenceEstablished: false as const,
      }),
    ]);
    const knownComputationalUpperBoundRelative = quantifiedComponents.reduce(
      (sum, component) => sum + component.relativeUpperBound,
      0,
    );
    if (
      !Number.isFinite(knownComputationalUpperBoundRelative) ||
      knownComputationalUpperBoundRelative <= 0 ||
      knownComputationalUpperBoundRelative >=
        V385_KNOWN_COMPUTATIONAL_UPPER_BOUND_LIMIT
    ) {
      throw new Error(
        `v385-known-budget:${row.rayIndex}:${knownComputationalUpperBoundRelative}`,
      );
    }
    maximum = Math.max(maximum, knownComputationalUpperBoundRelative);
    return Object.freeze({
      rayIndex: row.rayIndex,
      photonObservablePerSM2Sr:
        row.throughputWeightedPhotonRadiancePerSM2Sr,
      quantifiedComponents,
      unavailableSystematics: UNAVAILABLE_SYSTEMATICS,
      knownComputationalUpperBoundRelative,
      knownComputationalInterval: Object.freeze({
        lower:
          row.throughputWeightedPhotonRadiancePerSM2Sr *
          (1 - knownComputationalUpperBoundRelative),
        upper:
          row.throughputWeightedPhotonRadiancePerSM2Sr *
          (1 + knownComputationalUpperBoundRelative),
      }),
      totalScientificUncertaintyRelative: "unavailable" as const,
      totalScientificInterval: null,
    });
  });
  if (rows.length !== 4) throw new Error("v385-row-count");
  return Object.freeze({
    rows: Object.freeze(rows),
    maximumKnownComputationalUpperBoundRelative: maximum,
  });
}

export function parseMeasuredVisiblePhotonErrorBudgetArtifactV385(
  value: unknown,
): MeasuredVisiblePhotonErrorBudgetArtifactV385 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<MeasuredVisiblePhotonErrorBudgetArtifactV385>)
    : null;
  const rows = source?.rows ?? [];
  if (
    !source ||
    source.version !== MEASURED_VISIBLE_PHOTON_ERROR_BUDGET_VERSION_V385 ||
    source.status !==
      "computational-error-budget-qualified-scientific-systematics-unavailable" ||
    !source.source ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    rows.length !== 4 ||
    rows.some(
      (row) =>
        row.quantifiedComponents.length !== 4 ||
        row.unavailableSystematics.length !== 2 ||
        row.quantifiedComponents.some(
          (component) =>
            component.status !== "quantified" ||
            !Number.isFinite(component.relativeUpperBound) ||
            component.relativeUpperBound < 0 ||
            component.evidenceKind !== "observed-numerical-difference" ||
            component.independenceEstablished !== false,
        ) ||
        row.unavailableSystematics.some(
          (component) =>
            component.status !== "unavailable" ||
            component.numericalPlaceholderUsed !== false,
        ) ||
        !Number.isFinite(row.knownComputationalUpperBoundRelative) ||
        row.knownComputationalUpperBoundRelative <= 0 ||
        row.knownComputationalUpperBoundRelative >=
          V385_KNOWN_COMPUTATIONAL_UPPER_BOUND_LIMIT ||
        !Number.isFinite(row.knownComputationalInterval.lower) ||
        !Number.isFinite(row.knownComputationalInterval.upper) ||
        !(row.knownComputationalInterval.lower < row.photonObservablePerSM2Sr) ||
        !(row.knownComputationalInterval.upper > row.photonObservablePerSM2Sr) ||
        row.pythonOracleRelativeDifference >=
          V385_ORACLE_RELATIVE_DIFFERENCE_LIMIT ||
        row.totalScientificUncertaintyRelative !== "unavailable" ||
        row.totalScientificInterval !== null,
    ) ||
    source.counts?.rayCount !== 4 ||
    source.counts.quantifiedComponentCountPerRay !== 4 ||
    source.counts.unavailableSystematicCountPerRay !== 2 ||
    !source.maxima ||
    source.maxima.knownComputationalUpperBoundRelative >=
      V385_KNOWN_COMPUTATIONAL_UPPER_BOUND_LIMIT ||
    source.maxima.pythonOracleRelativeDifference >=
      V385_ORACLE_RELATIVE_DIFFERENCE_LIMIT ||
    source.combination?.rule !== "linear-sum-no-independence-proof" ||
    source.combination.rssApplied !== false ||
    source.combination.unknownSystematicsTreatedAsZero !== false ||
    source.combination.knownComputationalIntervalIsConfidenceInterval !== false ||
    source.combination.deterministicReplay !== true ||
    source.qualification?.computationalBudgetQualified !== true ||
    source.qualification.absoluteScientificBudgetQualified !== false ||
    source.qualification.throughputCalibrationSystematicAvailable !== false ||
    source.qualification.sourceModelSystematicAvailable !== false ||
    source.qualification.detectorElectronBudgetApplicable !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.export?.csvPath !==
      "dist/science/measured-visible-photon-error-budget-v385/error-budget.csv" ||
    !SHA256.test(source.export?.csvFileSha256 ?? "") ||
    source.export?.rowCount !== 4 ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v385-error-budget-artifact-identity");
  }
  return value as MeasuredVisiblePhotonErrorBudgetArtifactV385;
}
