import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_INPUT_ORDER,
  V390_OUTPUT_ORDER,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";

export const KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392 =
  "v392-kerr-physical-covariance-pack-v1" as const;
export const KERR_PHYSICAL_COVARIANCE_ADMISSION_VERSION_V392 =
  "v392-kerr-physical-covariance-admission-v1" as const;
export const V392_SYMMETRY_RELATIVE_TOLERANCE = 1e-12;
export const V392_PSD_RELATIVE_TOLERANCE = 1e-12;
export const V392_ORACLE_RELATIVE_LIMIT = 2e-12;

const SHA256 = /^[a-f0-9]{64}$/;
const BAND_IDS = new Set<KerrThinDiskBandIdV320>([
  "visible",
  "euv",
  "soft-x-ray",
]);

export type KerrCovarianceMatrix3V392 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

export type KerrProjectedCovarianceMatrix2V392 = readonly [
  readonly [number, number],
  readonly [number, number],
];

export type KerrPhysicalCovariancePackRowV392 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  covariance: KerrCovarianceMatrix3V392;
  crossCovariance: Readonly<{
    photonRadianceRedshift: number;
    photonRadiancePageThorneFlux: number;
    redshiftPageThorneFlux: number;
  }>;
}>;

export type KerrPhysicalCovariancePackV392 = Readonly<{
  version: typeof KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392;
  packId: string;
  contentClass:
    | "physical-observation-covariance"
    | "synthetic-validation-fixture";
  publicationIntent: "publishable" | "validation-only";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    covarianceSourceIdentity: string;
    covarianceSourceArtifactSha256: string;
  }>;
  parameterOrder: typeof V390_INPUT_ORDER;
  outputOrder: typeof V390_OUTPUT_ORDER;
  covarianceSemantics: "natural-log-input-perturbation-covariance";
  crossCovariancePolicy: Readonly<{
    mode: "explicit-values" | "zero-under-independence-evidence";
    evidenceSha256: string;
    independenceStatement: string | null;
  }>;
  rows: readonly KerrPhysicalCovariancePackRowV392[];
}>;

export type KerrCovarianceAdmissionRejectionV392 =
  | "pack-not-object"
  | "pack-version"
  | "pack-identity"
  | "content-class"
  | "synthetic-fixture-marked-publishable"
  | "transfer-source-sha"
  | "parameter-order"
  | "output-order"
  | "covariance-semantics"
  | "source-identity"
  | "source-sha"
  | "row-set"
  | "non-finite-covariance"
  | "asymmetric-covariance"
  | "negative-eigenvalue"
  | "missing-cross-covariance"
  | "cross-covariance-mismatch"
  | "missing-independence-evidence";

export type KerrPhysicalCovarianceAdmissionResultV392 = Readonly<{
  status: "admitted-physical" | "admitted-validation-only" | "rejected";
  projectionAllowed: boolean;
  publishablePhysicalCovariance: boolean;
  rejectionReasons: readonly KerrCovarianceAdmissionRejectionV392[];
  checkedRowCount: number;
  minimumEigenvalue: number | null;
  maximumSymmetryRelativeError: number | null;
}>;

export type KerrPhysicalCovarianceProjectionRowV392 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: KerrThinDiskBandIdV320;
  inputCovariance: KerrCovarianceMatrix3V392;
  projectedCovariance: KerrProjectedCovarianceMatrix2V392;
  conditionedTemperatureLogStandardDeviation: number;
  sourceModelTemperatureLogStandardDeviation: number;
  outputCorrelation: number | null;
}>;

export type KerrPhysicalCovarianceProjectionV392 = Readonly<{
  admissionStatus: "admitted-physical" | "admitted-validation-only";
  publicationAllowed: boolean;
  rows: readonly KerrPhysicalCovarianceProjectionRowV392[];
}>;

export type KerrPhysicalCovarianceAdmissionArtifactV392 = Readonly<{
  version: typeof KERR_PHYSICAL_COVARIANCE_ADMISSION_VERSION_V392;
  generatedAt: string;
  status: "covariance-admission-validator-qualified-physical-input-unavailable-projection-not-run";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v391TrustRegionArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  schema: Readonly<{
    packVersion: typeof KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392;
    parameterOrder: typeof V390_INPUT_ORDER;
    outputOrder: typeof V390_OUTPUT_ORDER;
    covarianceSemantics: "natural-log-input-perturbation-covariance";
    requiredRowCount: 12;
    crossCovarianceRequired: true;
    independenceEvidenceRequiredForZeroCrossBlock: true;
  }>;
  validator: Readonly<{
    qualified: true;
    finiteCheck: true;
    symmetricCheck: true;
    positiveSemidefiniteCheck: true;
    sourceIdentityCheck: true;
    parameterOrderCheck: true;
    crossCovarianceCheck: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 6;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrCovarianceAdmissionRejectionV392;
      observedReason: KerrCovarianceAdmissionRejectionV392;
      rejected: true;
    }>[];
  }>;
  selfTest: Readonly<{
    fixtureClass: "synthetic-validation-fixture";
    publishable: false;
    projectionExecuted: true;
    projectedRowCount: 12;
    minimumEigenvalue: number;
    maximumSymmetryRelativeError: number;
    maximumPythonOracleRelativeDifference: number;
  }>;
  productionAdmission: Readonly<{
    physicalCovariancePackAvailable: false;
    physicalCovariancePackAdmitted: false;
    covarianceProjectionExecuted: false;
    projectedRows: null;
    unknownSystematicsTreatedAsZero: false;
    missingCrossCovarianceImputedAsIndependent: false;
    rssApplied: false;
    confidenceInterval: false;
    probabilityContentAssigned: false;
    absoluteScientificInterval: null;
  }>;
  qualification: Readonly<{
    covarianceAdmissionInfrastructureQualified: true;
    numericalProjectionPrimitiveQualified: true;
    physicalCovarianceQualified: false;
    absoluteScientificIntervalQualified: false;
    absoluteTemperatureAuthorityGranted: false;
    measuredAuthorityGranted: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
  }>;
  networkAttempted: false;
  sciencePayloadMutationAllowed: false;
  cinematicConsumerAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

type MutableRecord = Record<string, unknown>;

const isObject = (value: unknown): value is MutableRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const relativeError = (left: number, right: number) =>
  Math.abs(left - right) /
  Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

const asMatrix3 = (value: unknown): number[][] | null =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === 3 &&
      row.every((entry) => typeof entry === "number"),
  )
    ? (value as number[][])
    : null;

function jacobiEigenvalues3(matrix: readonly (readonly number[])[]) {
  const work = matrix.map((row) => [...row]);
  for (let iteration = 0; iteration < 32; iteration += 1) {
    let p = 0;
    let q = 1;
    let maximum = Math.abs(work[0][1]);
    for (const [left, right] of [
      [0, 2],
      [1, 2],
    ] as const) {
      const candidate = Math.abs(work[left][right]);
      if (candidate > maximum) {
        maximum = candidate;
        p = left;
        q = right;
      }
    }
    const scale = Math.max(1, ...work.flat().map((entry) => Math.abs(entry)));
    if (maximum <= Number.EPSILON * scale * 8) break;
    const angle = 0.5 * Math.atan2(
      2 * work[p][q],
      work[q][q] - work[p][p],
    );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const app = work[p][p];
    const aqq = work[q][q];
    const apq = work[p][q];
    work[p][p] =
      cosine * cosine * app - 2 * sine * cosine * apq + sine * sine * aqq;
    work[q][q] =
      sine * sine * app + 2 * sine * cosine * apq + cosine * cosine * aqq;
    work[p][q] = 0;
    work[q][p] = 0;
    for (let index = 0; index < 3; index += 1) {
      if (index === p || index === q) continue;
      const aip = work[index][p];
      const aiq = work[index][q];
      work[index][p] = cosine * aip - sine * aiq;
      work[p][index] = work[index][p];
      work[index][q] = sine * aip + cosine * aiq;
      work[q][index] = work[index][q];
    }
  }
  return [work[0][0], work[1][1], work[2][2]].sort(
    (left, right) => left - right,
  );
}

const addReason = (
  target: KerrCovarianceAdmissionRejectionV392[],
  reason: KerrCovarianceAdmissionRejectionV392,
) => {
  if (!target.includes(reason)) target.push(reason);
};

export function validateKerrPhysicalCovariancePackV392(
  value: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
): KerrPhysicalCovarianceAdmissionResultV392 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const reasons: KerrCovarianceAdmissionRejectionV392[] = [];
  if (!isObject(value)) {
    return Object.freeze({
      status: "rejected" as const,
      projectionAllowed: false,
      publishablePhysicalCovariance: false,
      rejectionReasons: Object.freeze(["pack-not-object"] as const),
      checkedRowCount: 0,
      minimumEigenvalue: null,
      maximumSymmetryRelativeError: null,
    });
  }
  const pack = value;
  if (pack.version !== KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392) {
    addReason(reasons, "pack-version");
  }
  if (typeof pack.packId !== "string" || pack.packId.length < 3) {
    addReason(reasons, "pack-identity");
  }
  const contentClass = pack.contentClass;
  if (
    contentClass !== "physical-observation-covariance" &&
    contentClass !== "synthetic-validation-fixture"
  ) {
    addReason(reasons, "content-class");
  }
  if (
    contentClass === "synthetic-validation-fixture" &&
    pack.publicationIntent === "publishable"
  ) {
    addReason(reasons, "synthetic-fixture-marked-publishable");
  }
  if (
    pack.publicationIntent !== "publishable" &&
    pack.publicationIntent !== "validation-only"
  ) {
    addReason(reasons, "pack-identity");
  }
  const source = isObject(pack.source) ? pack.source : null;
  if (
    source?.v390TransferArtifactSha256 !== transfer.artifactSha256
  ) {
    addReason(reasons, "transfer-source-sha");
  }
  if (
    typeof source?.covarianceSourceIdentity !== "string" ||
    source.covarianceSourceIdentity.length < 3
  ) {
    addReason(reasons, "source-identity");
  }
  if (!SHA256.test(String(source?.covarianceSourceArtifactSha256 ?? ""))) {
    addReason(reasons, "source-sha");
  }
  if (JSON.stringify(pack.parameterOrder) !== JSON.stringify(V390_INPUT_ORDER)) {
    addReason(reasons, "parameter-order");
  }
  if (JSON.stringify(pack.outputOrder) !== JSON.stringify(V390_OUTPUT_ORDER)) {
    addReason(reasons, "output-order");
  }
  if (
    pack.covarianceSemantics !==
    "natural-log-input-perturbation-covariance"
  ) {
    addReason(reasons, "covariance-semantics");
  }
  const crossPolicy = isObject(pack.crossCovariancePolicy)
    ? pack.crossCovariancePolicy
    : null;
  if (!crossPolicy) {
    addReason(reasons, "missing-cross-covariance");
  } else if (
    crossPolicy.mode !== "explicit-values" &&
    crossPolicy.mode !== "zero-under-independence-evidence"
  ) {
    addReason(reasons, "missing-cross-covariance");
  } else if (!SHA256.test(String(crossPolicy.evidenceSha256 ?? ""))) {
    addReason(reasons, "missing-cross-covariance");
  }

  const rows = Array.isArray(pack.rows) ? pack.rows : [];
  const expectedKeys = new Set(
    transfer.rows.map((row) => `${row.rayIndex}:${row.rayId}:${row.bandId}`),
  );
  const observedKeys = new Set<string>();
  let minimumEigenvalue = Number.POSITIVE_INFINITY;
  let maximumSymmetryRelativeError = 0;
  let allCrossTermsZero = true;
  for (const rowValue of rows) {
    if (!isObject(rowValue)) {
      addReason(reasons, "row-set");
      continue;
    }
    const key = `${rowValue.rayIndex}:${rowValue.rayId}:${rowValue.bandId}`;
    observedKeys.add(key);
    if (
      !Number.isInteger(rowValue.rayIndex) ||
      typeof rowValue.rayId !== "string" ||
      !BAND_IDS.has(rowValue.bandId as KerrThinDiskBandIdV320) ||
      !expectedKeys.has(key)
    ) {
      addReason(reasons, "row-set");
    }
    const matrix = asMatrix3(rowValue.covariance);
    if (!matrix) {
      addReason(reasons, "non-finite-covariance");
      continue;
    }
    if (!matrix.flat().every(Number.isFinite)) {
      addReason(reasons, "non-finite-covariance");
      continue;
    }
    const matrixScale = Math.max(
      Number.MIN_VALUE,
      ...matrix.flat().map((entry) => Math.abs(entry)),
    );
    for (let left = 0; left < 3; left += 1) {
      for (let right = left + 1; right < 3; right += 1) {
        maximumSymmetryRelativeError = Math.max(
          maximumSymmetryRelativeError,
          relativeError(matrix[left][right], matrix[right][left]),
        );
      }
    }
    if (maximumSymmetryRelativeError > V392_SYMMETRY_RELATIVE_TOLERANCE) {
      addReason(reasons, "asymmetric-covariance");
    }
    const symmetric = matrix.map((row, left) =>
      row.map((entry, right) =>
        left === right ? entry : 0.5 * (entry + matrix[right][left]),
      ),
    );
    const rowMinimumEigenvalue = jacobiEigenvalues3(symmetric)[0];
    minimumEigenvalue = Math.min(minimumEigenvalue, rowMinimumEigenvalue);
    if (rowMinimumEigenvalue < -V392_PSD_RELATIVE_TOLERANCE * matrixScale) {
      addReason(reasons, "negative-eigenvalue");
    }
    const cross = isObject(rowValue.crossCovariance)
      ? rowValue.crossCovariance
      : null;
    if (!cross) {
      addReason(reasons, "missing-cross-covariance");
      continue;
    }
    const crossValues = [
      cross.photonRadianceRedshift,
      cross.photonRadiancePageThorneFlux,
      cross.redshiftPageThorneFlux,
    ];
    if (!crossValues.every((entry) => typeof entry === "number" && Number.isFinite(entry))) {
      addReason(reasons, "missing-cross-covariance");
      continue;
    }
    if (
      cross.photonRadianceRedshift !== matrix[0][1] ||
      cross.photonRadiancePageThorneFlux !== matrix[0][2] ||
      cross.redshiftPageThorneFlux !== matrix[1][2]
    ) {
      addReason(reasons, "cross-covariance-mismatch");
    }
    if (crossValues.some((entry) => entry !== 0)) allCrossTermsZero = false;
  }
  if (
    rows.length !== 12 ||
    observedKeys.size !== 12 ||
    expectedKeys.size !== observedKeys.size ||
    [...expectedKeys].some((key) => !observedKeys.has(key))
  ) {
    addReason(reasons, "row-set");
  }
  if (
    allCrossTermsZero &&
    (crossPolicy?.mode !== "zero-under-independence-evidence" ||
      typeof crossPolicy.independenceStatement !== "string" ||
      crossPolicy.independenceStatement.trim().length < 16)
  ) {
    addReason(reasons, "missing-independence-evidence");
  }
  if (
    !allCrossTermsZero &&
    crossPolicy?.mode !== "explicit-values"
  ) {
    addReason(reasons, "cross-covariance-mismatch");
  }
  const rejected = reasons.length > 0;
  const admittedValidationOnly =
    !rejected && contentClass === "synthetic-validation-fixture";
  return Object.freeze({
    status: rejected
      ? ("rejected" as const)
      : admittedValidationOnly
        ? ("admitted-validation-only" as const)
        : ("admitted-physical" as const),
    projectionAllowed: !rejected,
    publishablePhysicalCovariance:
      !rejected &&
      contentClass === "physical-observation-covariance" &&
      pack.publicationIntent === "publishable",
    rejectionReasons: Object.freeze(reasons),
    checkedRowCount: rows.length,
    minimumEigenvalue: Number.isFinite(minimumEigenvalue)
      ? minimumEigenvalue
      : null,
    maximumSymmetryRelativeError:
      rows.length > 0 ? maximumSymmetryRelativeError : null,
  });
}

function projectMatrix(
  transfer: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
  ],
  covariance: KerrCovarianceMatrix3V392,
): KerrProjectedCovarianceMatrix2V392 {
  const projected = [
    [0, 0],
    [0, 0],
  ];
  for (let left = 0; left < 2; left += 1) {
    for (let right = 0; right < 2; right += 1) {
      let value = 0;
      for (let inputLeft = 0; inputLeft < 3; inputLeft += 1) {
        for (let inputRight = 0; inputRight < 3; inputRight += 1) {
          value +=
            transfer[left][inputLeft] *
            covariance[inputLeft][inputRight] *
            transfer[right][inputRight];
        }
      }
      projected[left][right] = value;
    }
  }
  return Object.freeze([
    Object.freeze([projected[0][0], projected[0][1]] as const),
    Object.freeze([projected[1][0], projected[1][1]] as const),
  ] as const);
}

export function projectKerrPhysicalCovarianceV392(
  packValue: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
): KerrPhysicalCovarianceProjectionV392 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = validateKerrPhysicalCovariancePackV392(
    packValue,
    transfer,
  );
  if (!admission.projectionAllowed || admission.status === "rejected") {
    throw new Error(
      `v392-covariance-pack-rejected:${admission.rejectionReasons.join(",")}`,
    );
  }
  const pack = packValue as KerrPhysicalCovariancePackV392;
  const rows = pack.rows.map((row) => {
    const transferRow = transfer.rows.find(
      (candidate) =>
        candidate.rayIndex === row.rayIndex &&
        candidate.rayId === row.rayId &&
        candidate.bandId === row.bandId,
    );
    if (!transferRow) throw new Error("v392-projection-row-identity");
    const projectedCovariance = projectMatrix(
      transferRow.transferMatrix,
      row.covariance,
    );
    const conditioned = Math.sqrt(Math.max(0, projectedCovariance[0][0]));
    const source = Math.sqrt(Math.max(0, projectedCovariance[1][1]));
    const denominator = conditioned * source;
    return Object.freeze({
      rayIndex: row.rayIndex,
      rayId: row.rayId,
      bandId: row.bandId,
      inputCovariance: row.covariance,
      projectedCovariance,
      conditionedTemperatureLogStandardDeviation: conditioned,
      sourceModelTemperatureLogStandardDeviation: source,
      outputCorrelation:
        denominator > 0 ? projectedCovariance[0][1] / denominator : null,
    });
  });
  return Object.freeze({
    admissionStatus: admission.status,
    publicationAllowed: admission.publishablePhysicalCovariance,
    rows: Object.freeze(rows),
  });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createKerrCovarianceControlFixtureV392(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
): KerrPhysicalCovariancePackV392 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const rows = transfer.rows.map((row, index) => {
    const scale = 1 + index * 0.025;
    const covariance = Object.freeze([
      Object.freeze([4e-4 * scale, 2e-5 * scale, -1e-5 * scale] as const),
      Object.freeze([2e-5 * scale, 1e-4 * scale, 1.5e-5 * scale] as const),
      Object.freeze([-1e-5 * scale, 1.5e-5 * scale, 9e-4 * scale] as const),
    ] as const);
    return Object.freeze({
      rayIndex: row.rayIndex,
      rayId: row.rayId,
      bandId: row.bandId,
      covariance,
      crossCovariance: Object.freeze({
        photonRadianceRedshift: covariance[0][1],
        photonRadiancePageThorneFlux: covariance[0][2],
        redshiftPageThorneFlux: covariance[1][2],
      }),
    });
  });
  return Object.freeze({
    version: KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392,
    packId: "v392-validator-control-fixture",
    contentClass: "synthetic-validation-fixture",
    publicationIntent: "validation-only",
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      covarianceSourceIdentity: "v392-deterministic-validator-control",
      covarianceSourceArtifactSha256: "a".repeat(64),
    }),
    parameterOrder: V390_INPUT_ORDER,
    outputOrder: V390_OUTPUT_ORDER,
    covarianceSemantics: "natural-log-input-perturbation-covariance",
    crossCovariancePolicy: Object.freeze({
      mode: "explicit-values" as const,
      evidenceSha256: "b".repeat(64),
      independenceStatement: null,
    }),
    rows: Object.freeze(rows),
  });
}

export function createKerrCovarianceAdversarialFixturesV392(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
) {
  const control = createKerrCovarianceControlFixtureV392(transferValue);
  const wrongSha = clone(control) as MutableRecord;
  (wrongSha.source as MutableRecord).v390TransferArtifactSha256 = "c".repeat(64);
  const wrongOrder = clone(control) as MutableRecord;
  wrongOrder.parameterOrder = [
    "ln-redshift-factor",
    "ln-photon-radiance",
    "ln-page-thorne-flux",
  ];
  const asymmetric = clone(control) as MutableRecord;
  ((asymmetric.rows as MutableRecord[])[0].covariance as number[][])[0][1] *= 2;
  const indefinite = clone(control) as MutableRecord;
  ((indefinite.rows as MutableRecord[])[0].covariance as number[][])[0][0] = -1;
  const missingCross = clone(control) as MutableRecord;
  delete missingCross.crossCovariancePolicy;
  const syntheticPublishable = clone(control) as MutableRecord;
  syntheticPublishable.publicationIntent = "publishable";
  return Object.freeze([
    Object.freeze({ id: "wrong-transfer-sha", value: wrongSha, expectedReason: "transfer-source-sha" as const }),
    Object.freeze({ id: "wrong-parameter-order", value: wrongOrder, expectedReason: "parameter-order" as const }),
    Object.freeze({ id: "asymmetric-covariance", value: asymmetric, expectedReason: "asymmetric-covariance" as const }),
    Object.freeze({ id: "negative-eigenvalue", value: indefinite, expectedReason: "negative-eigenvalue" as const }),
    Object.freeze({ id: "missing-cross-block", value: missingCross, expectedReason: "missing-cross-covariance" as const }),
    Object.freeze({ id: "synthetic-marked-publishable", value: syntheticPublishable, expectedReason: "synthetic-fixture-marked-publishable" as const }),
  ]);
}

export function parseKerrPhysicalCovarianceAdmissionArtifactV392(
  value: unknown,
): KerrPhysicalCovarianceAdmissionArtifactV392 {
  const source = isObject(value)
    ? (value as Partial<KerrPhysicalCovarianceAdmissionArtifactV392>)
    : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures)
    ? source.validator.adversarialFixtures
    : [];
  if (
    !source ||
    source.version !== KERR_PHYSICAL_COVARIANCE_ADMISSION_VERSION_V392 ||
    source.status !==
      "covariance-admission-validator-qualified-physical-input-unavailable-projection-not-run" ||
    !source.source ||
    Object.keys(source.source).length !== 3 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    source.schema?.packVersion !== KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392 ||
    JSON.stringify(source.schema.parameterOrder) !== JSON.stringify(V390_INPUT_ORDER) ||
    JSON.stringify(source.schema.outputOrder) !== JSON.stringify(V390_OUTPUT_ORDER) ||
    source.schema.covarianceSemantics !==
      "natural-log-input-perturbation-covariance" ||
    source.schema.requiredRowCount !== 12 ||
    source.schema.crossCovarianceRequired !== true ||
    source.schema.independenceEvidenceRequiredForZeroCrossBlock !== true ||
    source.validator?.qualified !== true ||
    source.validator.finiteCheck !== true ||
    source.validator.symmetricCheck !== true ||
    source.validator.positiveSemidefiniteCheck !== true ||
    source.validator.sourceIdentityCheck !== true ||
    source.validator.parameterOrderCheck !== true ||
    source.validator.crossCovarianceCheck !== true ||
    source.validator.acceptedControlFixtureCount !== 1 ||
    source.validator.rejectedAdversarialFixtureCount !== 6 ||
    fixtures.length !== 6 ||
    fixtures.some(
      (fixture) =>
        fixture.rejected !== true ||
        fixture.expectedReason !== fixture.observedReason,
    ) ||
    source.selfTest?.fixtureClass !== "synthetic-validation-fixture" ||
    source.selfTest.publishable !== false ||
    source.selfTest.projectionExecuted !== true ||
    source.selfTest.projectedRowCount !== 12 ||
    !(source.selfTest.minimumEigenvalue >= 0) ||
    source.selfTest.maximumSymmetryRelativeError >
      V392_SYMMETRY_RELATIVE_TOLERANCE ||
    source.selfTest.maximumPythonOracleRelativeDifference >=
      V392_ORACLE_RELATIVE_LIMIT ||
    source.productionAdmission?.physicalCovariancePackAvailable !== false ||
    source.productionAdmission.physicalCovariancePackAdmitted !== false ||
    source.productionAdmission.covarianceProjectionExecuted !== false ||
    source.productionAdmission.projectedRows !== null ||
    source.productionAdmission.unknownSystematicsTreatedAsZero !== false ||
    source.productionAdmission.missingCrossCovarianceImputedAsIndependent !==
      false ||
    source.productionAdmission.rssApplied !== false ||
    source.productionAdmission.confidenceInterval !== false ||
    source.productionAdmission.probabilityContentAssigned !== false ||
    source.productionAdmission.absoluteScientificInterval !== null ||
    source.qualification?.covarianceAdmissionInfrastructureQualified !== true ||
    source.qualification.numericalProjectionPrimitiveQualified !== true ||
    source.qualification.physicalCovarianceQualified !== false ||
    source.qualification.absoluteScientificIntervalQualified !== false ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.observedCountsAvailable !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v392-covariance-admission-artifact-identity");
  }
  return value as KerrPhysicalCovarianceAdmissionArtifactV392;
}
