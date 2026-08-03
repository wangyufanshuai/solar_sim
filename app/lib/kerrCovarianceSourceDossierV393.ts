import type { KerrThinDiskBandIdV320 } from "./kerrThinDiskBandImagingV320";
import {
  KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392,
  parseKerrPhysicalCovarianceAdmissionArtifactV392,
  validateKerrPhysicalCovariancePackV392,
  type KerrCovarianceMatrix3V392,
  type KerrPhysicalCovarianceAdmissionArtifactV392,
  type KerrPhysicalCovariancePackV392,
} from "./kerrPhysicalCovarianceAdmissionV392";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_INPUT_ORDER,
  V390_OUTPUT_ORDER,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";

export const KERR_COVARIANCE_SOURCE_DOSSIER_VERSION_V393 =
  "v393-kerr-covariance-source-dossier-v1" as const;
export const KERR_COVARIANCE_SOURCE_ADMISSION_VERSION_V393 =
  "v393-kerr-covariance-source-admission-v1" as const;
export const V393_ORACLE_RELATIVE_LIMIT = 2e-12;

const SHA256 = /^[a-f0-9]{64}$/;
const BAND_IDS = new Set<KerrThinDiskBandIdV320>([
  "visible",
  "euv",
  "soft-x-ray",
]);
const PARAMETER_SET = new Set<string>(V390_INPUT_ORDER);

export const V393_COMPONENT_AUTHORITIES = Object.freeze({
  "ln-photon-radiance": "detector-radiometry-calibration",
  "ln-redshift-factor": "geometry-redshift-model-validation",
  "ln-page-thorne-flux": "disk-flux-model-validation",
} as const);
export const V393_CROSS_PAIRS = Object.freeze([
  Object.freeze({
    id: "photon-radiance--redshift",
    left: "ln-photon-radiance",
    right: "ln-redshift-factor",
  }),
  Object.freeze({
    id: "photon-radiance--page-thorne-flux",
    left: "ln-photon-radiance",
    right: "ln-page-thorne-flux",
  }),
  Object.freeze({
    id: "redshift--page-thorne-flux",
    left: "ln-redshift-factor",
    right: "ln-page-thorne-flux",
  }),
] as const);

type ParameterIdV393 = (typeof V390_INPUT_ORDER)[number];
type CrossPairIdV393 = (typeof V393_CROSS_PAIRS)[number]["id"];

export type KerrCovarianceComponentSourceV393 = Readonly<{
  parameterId: ParameterIdV393;
  authorityClass: (typeof V393_COMPONENT_AUTHORITIES)[ParameterIdV393];
  contentClass: "physical-source" | "synthetic-validation-fixture";
  sourceIdentity: string;
  sourceArtifactSha256: string;
  rows: readonly Readonly<{
    rayIndex: number;
    rayId: string;
    bandId: KerrThinDiskBandIdV320;
    logStandardDeviation: number;
  }>[];
}>;

export type KerrCovarianceCrossSourceV393 = Readonly<{
  pairId: CrossPairIdV393;
  leftParameter: ParameterIdV393;
  rightParameter: ParameterIdV393;
  evidenceMode:
    | "joint-estimator"
    | "independence-evidence"
    | "synthetic-validation-fixture";
  contentClass: "physical-source" | "synthetic-validation-fixture";
  sourceIdentity: string;
  sourceArtifactSha256: string;
  independenceStatement: string | null;
  rows: readonly Readonly<{
    rayIndex: number;
    rayId: string;
    bandId: KerrThinDiskBandIdV320;
    correlationCoefficient: number;
  }>[];
}>;

export type KerrCovarianceSourceDossierV393 = Readonly<{
  version: typeof KERR_COVARIANCE_SOURCE_DOSSIER_VERSION_V393;
  dossierId: string;
  contentClass:
    | "physical-observation-dossier"
    | "synthetic-validation-fixture";
  publicationIntent: "publishable" | "validation-only";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v392AdmissionArtifactSha256: string;
    dossierSourceArtifactSha256: string;
    combinedCrossEvidenceSha256: string;
  }>;
  parameterOrder: typeof V390_INPUT_ORDER;
  covarianceSemantics: "natural-log-input-perturbation-covariance";
  componentSources: readonly KerrCovarianceComponentSourceV393[];
  crossSources: readonly KerrCovarianceCrossSourceV393[];
}>;

export type KerrCovarianceDossierRejectionV393 =
  | "dossier-not-object"
  | "dossier-version"
  | "dossier-identity"
  | "synthetic-fixture-marked-publishable"
  | "transfer-source-sha"
  | "admission-source-sha"
  | "source-sha"
  | "parameter-order"
  | "covariance-semantics"
  | "component-source-set"
  | "component-authority-mismatch"
  | "component-content-class-mismatch"
  | "component-row-set"
  | "non-finite-standard-deviation"
  | "negative-standard-deviation"
  | "cross-source-set"
  | "cross-source-order"
  | "cross-content-class-mismatch"
  | "cross-row-set"
  | "correlation-out-of-range"
  | "independence-evidence-missing"
  | "assembled-pack-rejected";

export type KerrCovarianceDossierAdmissionV393 = Readonly<{
  status: "admitted-physical" | "admitted-validation-only" | "rejected";
  packAssemblyAllowed: boolean;
  publicationAllowed: boolean;
  rejectionReasons: readonly KerrCovarianceDossierRejectionV393[];
  componentSourceCount: number;
  crossSourceCount: number;
  checkedComponentRowCount: number;
  checkedCrossRowCount: number;
}>;

export type KerrCovarianceSourceAdmissionArtifactV393 = Readonly<{
  version: typeof KERR_COVARIANCE_SOURCE_ADMISSION_VERSION_V393;
  generatedAt: string;
  status: "covariance-source-dossier-validator-qualified-physical-sources-unavailable-pack-not-built";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v392AdmissionArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  schema: Readonly<{
    parameterOrder: typeof V390_INPUT_ORDER;
    componentSourceCount: 3;
    crossSourceCount: 3;
    rowCountPerSource: 12;
    covarianceSemantics: "natural-log-input-perturbation-covariance";
    jointEstimatorOrIndependenceEvidenceRequired: true;
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 9;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrCovarianceDossierRejectionV393;
      observedReason: KerrCovarianceDossierRejectionV393;
      rejected: true;
    }>[];
  }>;
  selfTest: Readonly<{
    fixtureClass: "synthetic-validation-fixture";
    publishable: false;
    assembledPackStatus: "admitted-validation-only";
    assembledRowCount: 12;
    componentSourceCount: 3;
    crossSourceCount: 3;
    maximumPythonOracleRelativeDifference: number;
  }>;
  productionAdmission: Readonly<{
    dossierAvailable: false;
    componentSourcesAvailable: 0;
    requiredComponentSources: 3;
    crossSourcesAvailable: 0;
    requiredCrossSources: 3;
    covariancePackBuilt: false;
    covariancePackAdmitted: false;
    covarianceProjectionExecuted: false;
    unknownSystematicsTreatedAsZero: false;
    missingCorrelationTreatedAsIndependent: false;
    syntheticFixturePublishable: false;
    confidenceInterval: false;
    probabilityContentAssigned: false;
    absoluteScientificInterval: null;
  }>;
  qualification: Readonly<{
    covarianceSourceDossierInfrastructureQualified: true;
    correlatedPackAssemblyPrimitiveQualified: true;
    physicalSourceDossierQualified: false;
    physicalCovarianceQualified: false;
    absoluteScientificIntervalQualified: false;
    absoluteTemperatureAuthorityGranted: false;
    measuredAuthorityGranted: false;
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
const addReason = (
  target: KerrCovarianceDossierRejectionV393[],
  reason: KerrCovarianceDossierRejectionV393,
) => {
  if (!target.includes(reason)) target.push(reason);
};
const rowKey = (row: { rayIndex?: unknown; rayId?: unknown; bandId?: unknown }) =>
  `${row.rayIndex}:${row.rayId}:${row.bandId}`;

export function validateKerrCovarianceSourceDossierV393(
  value: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
): KerrCovarianceDossierAdmissionV393 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
    admissionValue,
  );
  if (!isObject(value)) {
    return Object.freeze({
      status: "rejected" as const,
      packAssemblyAllowed: false,
      publicationAllowed: false,
      rejectionReasons: Object.freeze(["dossier-not-object"] as const),
      componentSourceCount: 0,
      crossSourceCount: 0,
      checkedComponentRowCount: 0,
      checkedCrossRowCount: 0,
    });
  }
  const dossier = value;
  const reasons: KerrCovarianceDossierRejectionV393[] = [];
  if (dossier.version !== KERR_COVARIANCE_SOURCE_DOSSIER_VERSION_V393) {
    addReason(reasons, "dossier-version");
  }
  if (typeof dossier.dossierId !== "string" || dossier.dossierId.length < 3) {
    addReason(reasons, "dossier-identity");
  }
  if (
    dossier.contentClass !== "physical-observation-dossier" &&
    dossier.contentClass !== "synthetic-validation-fixture"
  ) {
    addReason(reasons, "dossier-identity");
  }
  if (
    dossier.contentClass === "synthetic-validation-fixture" &&
    dossier.publicationIntent === "publishable"
  ) {
    addReason(reasons, "synthetic-fixture-marked-publishable");
  }
  const source = isObject(dossier.source) ? dossier.source : null;
  if (source?.v390TransferArtifactSha256 !== transfer.artifactSha256) {
    addReason(reasons, "transfer-source-sha");
  }
  if (source?.v392AdmissionArtifactSha256 !== admission.artifactSha256) {
    addReason(reasons, "admission-source-sha");
  }
  if (
    !SHA256.test(String(source?.dossierSourceArtifactSha256 ?? "")) ||
    !SHA256.test(String(source?.combinedCrossEvidenceSha256 ?? ""))
  ) {
    addReason(reasons, "source-sha");
  }
  if (JSON.stringify(dossier.parameterOrder) !== JSON.stringify(V390_INPUT_ORDER)) {
    addReason(reasons, "parameter-order");
  }
  if (
    dossier.covarianceSemantics !==
    "natural-log-input-perturbation-covariance"
  ) {
    addReason(reasons, "covariance-semantics");
  }
  const expectedRows = new Set(transfer.rows.map(rowKey));
  const components = Array.isArray(dossier.componentSources)
    ? dossier.componentSources
    : [];
  const componentIds = new Set<string>();
  let componentRowCount = 0;
  for (const componentValue of components) {
    if (!isObject(componentValue)) {
      addReason(reasons, "component-source-set");
      continue;
    }
    const parameterId = String(componentValue.parameterId);
    componentIds.add(parameterId);
    if (!PARAMETER_SET.has(parameterId)) {
      addReason(reasons, "component-source-set");
    } else if (
      componentValue.authorityClass !==
      V393_COMPONENT_AUTHORITIES[parameterId as ParameterIdV393]
    ) {
      addReason(reasons, "component-authority-mismatch");
    }
    const expectedContentClass =
      dossier.contentClass === "synthetic-validation-fixture"
        ? "synthetic-validation-fixture"
        : "physical-source";
    if (componentValue.contentClass !== expectedContentClass) {
      addReason(reasons, "component-content-class-mismatch");
    }
    if (
      typeof componentValue.sourceIdentity !== "string" ||
      componentValue.sourceIdentity.length < 3 ||
      !SHA256.test(String(componentValue.sourceArtifactSha256 ?? ""))
    ) {
      addReason(reasons, "source-sha");
    }
    const rows = Array.isArray(componentValue.rows) ? componentValue.rows : [];
    componentRowCount += rows.length;
    const observedRows = new Set<string>();
    for (const entry of rows) {
      if (!isObject(entry)) {
        addReason(reasons, "component-row-set");
        continue;
      }
      observedRows.add(rowKey(entry));
      if (
        !Number.isInteger(entry.rayIndex) ||
        typeof entry.rayId !== "string" ||
        !BAND_IDS.has(entry.bandId as KerrThinDiskBandIdV320) ||
        !expectedRows.has(rowKey(entry))
      ) {
        addReason(reasons, "component-row-set");
      }
      if (
        typeof entry.logStandardDeviation !== "number" ||
        !Number.isFinite(entry.logStandardDeviation)
      ) {
        addReason(reasons, "non-finite-standard-deviation");
      } else if (entry.logStandardDeviation < 0) {
        addReason(reasons, "negative-standard-deviation");
      }
    }
    if (
      rows.length !== 12 ||
      observedRows.size !== 12 ||
      [...expectedRows].some((key) => !observedRows.has(key))
    ) {
      addReason(reasons, "component-row-set");
    }
  }
  if (
    components.length !== 3 ||
    componentIds.size !== 3 ||
    V390_INPUT_ORDER.some((parameter) => !componentIds.has(parameter))
  ) {
    addReason(reasons, "component-source-set");
  }

  const crosses = Array.isArray(dossier.crossSources)
    ? dossier.crossSources
    : [];
  const crossIds = new Set<string>();
  let crossRowCount = 0;
  for (const crossValue of crosses) {
    if (!isObject(crossValue)) {
      addReason(reasons, "cross-source-set");
      continue;
    }
    const pairId = String(crossValue.pairId);
    crossIds.add(pairId);
    const expectedPair = V393_CROSS_PAIRS.find((pair) => pair.id === pairId);
    if (!expectedPair) {
      addReason(reasons, "cross-source-set");
    } else if (
      crossValue.leftParameter !== expectedPair.left ||
      crossValue.rightParameter !== expectedPair.right
    ) {
      addReason(reasons, "cross-source-order");
    }
    const expectedContentClass =
      dossier.contentClass === "synthetic-validation-fixture"
        ? "synthetic-validation-fixture"
        : "physical-source";
    if (crossValue.contentClass !== expectedContentClass) {
      addReason(reasons, "cross-content-class-mismatch");
    }
    if (
      typeof crossValue.sourceIdentity !== "string" ||
      crossValue.sourceIdentity.length < 3 ||
      !SHA256.test(String(crossValue.sourceArtifactSha256 ?? ""))
    ) {
      addReason(reasons, "source-sha");
    }
    const rows = Array.isArray(crossValue.rows) ? crossValue.rows : [];
    crossRowCount += rows.length;
    const observedRows = new Set<string>();
    let allZero = true;
    for (const entry of rows) {
      if (!isObject(entry)) {
        addReason(reasons, "cross-row-set");
        continue;
      }
      observedRows.add(rowKey(entry));
      if (!expectedRows.has(rowKey(entry))) {
        addReason(reasons, "cross-row-set");
      }
      if (
        typeof entry.correlationCoefficient !== "number" ||
        !Number.isFinite(entry.correlationCoefficient) ||
        Math.abs(entry.correlationCoefficient) > 1
      ) {
        addReason(reasons, "correlation-out-of-range");
      } else if (entry.correlationCoefficient !== 0) {
        allZero = false;
      }
    }
    if (
      rows.length !== 12 ||
      observedRows.size !== 12 ||
      [...expectedRows].some((key) => !observedRows.has(key))
    ) {
      addReason(reasons, "cross-row-set");
    }
    if (
      allZero &&
      (crossValue.evidenceMode !== "independence-evidence" ||
        typeof crossValue.independenceStatement !== "string" ||
        crossValue.independenceStatement.trim().length < 16)
    ) {
      addReason(reasons, "independence-evidence-missing");
    }
    if (
      !allZero &&
      crossValue.evidenceMode !== "joint-estimator" &&
      crossValue.evidenceMode !== "synthetic-validation-fixture"
    ) {
      addReason(reasons, "cross-source-order");
    }
  }
  if (
    crosses.length !== 3 ||
    crossIds.size !== 3 ||
    V393_CROSS_PAIRS.some((pair) => !crossIds.has(pair.id))
  ) {
    addReason(reasons, "cross-source-set");
  }
  if (
    crosses.length === 3 &&
    V393_CROSS_PAIRS.every((pair) => crossIds.has(pair.id)) &&
    !reasons.some((reason) =>
      [
        "cross-source-set",
        "cross-source-order",
        "cross-row-set",
        "correlation-out-of-range",
      ].includes(reason),
    )
  ) {
    for (const expectedRow of transfer.rows) {
      const key = rowKey(expectedRow);
      const correlations = V393_CROSS_PAIRS.map((pair) => {
        const sourceEntry = crosses.find(
          (candidate) =>
            isObject(candidate) && candidate.pairId === pair.id,
        ) as MutableRecord | undefined;
        const row = (sourceEntry?.rows as MutableRecord[] | undefined)?.find(
          (candidate) => rowKey(candidate) === key,
        );
        return Number(row?.correlationCoefficient);
      });
      const [rho01, rho02, rho12] = correlations;
      const determinant =
        1 + 2 * rho01 * rho02 * rho12 - rho01 ** 2 - rho02 ** 2 - rho12 ** 2;
      if (!Number.isFinite(determinant) || determinant < -1e-12) {
        addReason(reasons, "assembled-pack-rejected");
        break;
      }
    }
  }
  const rejected = reasons.length > 0;
  const validationOnly =
    !rejected && dossier.contentClass === "synthetic-validation-fixture";
  return Object.freeze({
    status: rejected
      ? ("rejected" as const)
      : validationOnly
        ? ("admitted-validation-only" as const)
        : ("admitted-physical" as const),
    packAssemblyAllowed: !rejected,
    publicationAllowed:
      !rejected &&
      dossier.contentClass === "physical-observation-dossier" &&
      dossier.publicationIntent === "publishable",
    rejectionReasons: Object.freeze(reasons),
    componentSourceCount: components.length,
    crossSourceCount: crosses.length,
    checkedComponentRowCount: componentRowCount,
    checkedCrossRowCount: crossRowCount,
  });
}

export function assembleKerrCovariancePackFromDossierV393(
  dossierValue: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
): KerrPhysicalCovariancePackV392 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
    admissionValue,
  );
  const dossierAdmission = validateKerrCovarianceSourceDossierV393(
    dossierValue,
    transfer,
    admission,
  );
  if (!dossierAdmission.packAssemblyAllowed) {
    throw new Error(
      `v393-dossier-rejected:${dossierAdmission.rejectionReasons.join(",")}`,
    );
  }
  const dossier = dossierValue as KerrCovarianceSourceDossierV393;
  const components = new Map(
    dossier.componentSources.map((source) => [source.parameterId, source]),
  );
  const crosses = new Map(
    dossier.crossSources.map((source) => [source.pairId, source]),
  );
  const rows = transfer.rows.map((transferRow) => {
    const key = rowKey(transferRow);
    const standardDeviations = V390_INPUT_ORDER.map((parameter) => {
      const row = components
        .get(parameter)
        ?.rows.find((entry) => rowKey(entry) === key);
      if (!row) throw new Error("v393-component-row-identity");
      return row.logStandardDeviation;
    });
    const correlations = V393_CROSS_PAIRS.map((pair) => {
      const row = crosses
        .get(pair.id)
        ?.rows.find((entry) => rowKey(entry) === key);
      if (!row) throw new Error("v393-cross-row-identity");
      return row.correlationCoefficient;
    });
    const [sigmaPhoton, sigmaRedshift, sigmaFlux] = standardDeviations;
    const [rhoPhotonRedshift, rhoPhotonFlux, rhoRedshiftFlux] = correlations;
    const covariance = Object.freeze([
      Object.freeze([
        sigmaPhoton ** 2,
        rhoPhotonRedshift * sigmaPhoton * sigmaRedshift,
        rhoPhotonFlux * sigmaPhoton * sigmaFlux,
      ] as const),
      Object.freeze([
        rhoPhotonRedshift * sigmaPhoton * sigmaRedshift,
        sigmaRedshift ** 2,
        rhoRedshiftFlux * sigmaRedshift * sigmaFlux,
      ] as const),
      Object.freeze([
        rhoPhotonFlux * sigmaPhoton * sigmaFlux,
        rhoRedshiftFlux * sigmaRedshift * sigmaFlux,
        sigmaFlux ** 2,
      ] as const),
    ] as const) satisfies KerrCovarianceMatrix3V392;
    return Object.freeze({
      rayIndex: transferRow.rayIndex,
      rayId: transferRow.rayId,
      bandId: transferRow.bandId,
      covariance,
      crossCovariance: Object.freeze({
        photonRadianceRedshift: covariance[0][1],
        photonRadiancePageThorneFlux: covariance[0][2],
        redshiftPageThorneFlux: covariance[1][2],
      }),
    });
  });
  const allCrossesIndependent = dossier.crossSources.every(
    (source) =>
      source.evidenceMode === "independence-evidence" &&
      source.rows.every((row) => row.correlationCoefficient === 0),
  );
  const pack = Object.freeze({
    version: KERR_PHYSICAL_COVARIANCE_PACK_VERSION_V392,
    packId: `${dossier.dossierId}:assembled-v393`,
    contentClass:
      dossier.contentClass === "synthetic-validation-fixture"
        ? ("synthetic-validation-fixture" as const)
        : ("physical-observation-covariance" as const),
    publicationIntent: dossier.publicationIntent,
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      covarianceSourceIdentity: dossier.dossierId,
      covarianceSourceArtifactSha256:
        dossier.source.dossierSourceArtifactSha256,
    }),
    parameterOrder: V390_INPUT_ORDER,
    outputOrder: V390_OUTPUT_ORDER,
    covarianceSemantics: "natural-log-input-perturbation-covariance" as const,
    crossCovariancePolicy: Object.freeze({
      mode: allCrossesIndependent
        ? ("zero-under-independence-evidence" as const)
        : ("explicit-values" as const),
      evidenceSha256: dossier.source.combinedCrossEvidenceSha256,
      independenceStatement: allCrossesIndependent
        ? dossier.crossSources.map((source) => source.independenceStatement).join(" | ")
        : null,
    }),
    rows: Object.freeze(rows),
  });
  const packAdmission = validateKerrPhysicalCovariancePackV392(pack, transfer);
  if (
    packAdmission.status === "rejected" ||
    !packAdmission.projectionAllowed
  ) {
    throw new Error(
      `v393-assembled-pack-rejected:${packAdmission.rejectionReasons.join(",")}`,
    );
  }
  return pack;
}

export function createKerrCovarianceDossierControlFixtureV393(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
): KerrCovarianceSourceDossierV393 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(
    transferValue,
  );
  const admission = parseKerrPhysicalCovarianceAdmissionArtifactV392(
    admissionValue,
  );
  const componentSources = V390_INPUT_ORDER.map((parameterId, parameterIndex) =>
    Object.freeze({
      parameterId,
      authorityClass: V393_COMPONENT_AUTHORITIES[parameterId],
      contentClass: "synthetic-validation-fixture" as const,
      sourceIdentity: `v393-control:${parameterId}`,
      sourceArtifactSha256: String(parameterIndex + 1).repeat(64),
      rows: Object.freeze(
        transfer.rows.map((row, index) => {
          const scaleRoot = Math.sqrt(1 + index * 0.025);
          const base = [0.02, 0.01, 0.03][parameterIndex];
          return Object.freeze({
            rayIndex: row.rayIndex,
            rayId: row.rayId,
            bandId: row.bandId,
            logStandardDeviation: base * scaleRoot,
          });
        }),
      ),
    }),
  );
  const correlations = [0.1, -1 / 60, 0.05] as const;
  const crossSources = V393_CROSS_PAIRS.map((pair, pairIndex) =>
    Object.freeze({
      pairId: pair.id,
      leftParameter: pair.left,
      rightParameter: pair.right,
      evidenceMode: "synthetic-validation-fixture" as const,
      contentClass: "synthetic-validation-fixture" as const,
      sourceIdentity: `v393-control:${pair.id}`,
      sourceArtifactSha256: String(pairIndex + 4).repeat(64),
      independenceStatement: null,
      rows: Object.freeze(
        transfer.rows.map((row) =>
          Object.freeze({
            rayIndex: row.rayIndex,
            rayId: row.rayId,
            bandId: row.bandId,
            correlationCoefficient: correlations[pairIndex],
          }),
        ),
      ),
    }),
  );
  return Object.freeze({
    version: KERR_COVARIANCE_SOURCE_DOSSIER_VERSION_V393,
    dossierId: "v393-correlated-source-control-fixture",
    contentClass: "synthetic-validation-fixture",
    publicationIntent: "validation-only",
    source: Object.freeze({
      v390TransferArtifactSha256: transfer.artifactSha256,
      v392AdmissionArtifactSha256: admission.artifactSha256,
      dossierSourceArtifactSha256: "a".repeat(64),
      combinedCrossEvidenceSha256: "b".repeat(64),
    }),
    parameterOrder: V390_INPUT_ORDER,
    covarianceSemantics: "natural-log-input-perturbation-covariance",
    componentSources: Object.freeze(componentSources),
    crossSources: Object.freeze(crossSources),
  });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createKerrCovarianceDossierAdversarialFixturesV393(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  admissionValue: KerrPhysicalCovarianceAdmissionArtifactV392,
) {
  const control = createKerrCovarianceDossierControlFixtureV393(
    transferValue,
    admissionValue,
  );
  const wrongAdmissionSha = clone(control) as unknown as MutableRecord;
  (wrongAdmissionSha.source as MutableRecord).v392AdmissionArtifactSha256 =
    "c".repeat(64);
  const missingComponent = clone(control) as unknown as MutableRecord;
  (missingComponent.componentSources as unknown[]).pop();
  const wrongAuthority = clone(control) as unknown as MutableRecord;
  (wrongAuthority.componentSources as MutableRecord[])[0].authorityClass =
    "disk-flux-model-validation";
  const negativeSigma = clone(control) as unknown as MutableRecord;
  (((negativeSigma.componentSources as MutableRecord[])[0].rows as MutableRecord[])[0]
    .logStandardDeviation) = -1;
  const missingCross = clone(control) as unknown as MutableRecord;
  (missingCross.crossSources as unknown[]).pop();
  const invalidCorrelation = clone(control) as unknown as MutableRecord;
  (((invalidCorrelation.crossSources as MutableRecord[])[0].rows as MutableRecord[])[0]
    .correlationCoefficient) = 1.01;
  const nonPsdCorrelation = clone(control) as unknown as MutableRecord;
  const nonPsdValues = [0.9, 0.9, -0.9] as const;
  for (let index = 0; index < 3; index += 1) {
    for (const row of (
      (nonPsdCorrelation.crossSources as MutableRecord[])[index]
        .rows as MutableRecord[]
    )) {
      row.correlationCoefficient = nonPsdValues[index];
    }
  }
  const missingIndependence = clone(control) as unknown as MutableRecord;
  const independenceCross = (missingIndependence.crossSources as MutableRecord[])[0];
  independenceCross.evidenceMode = "independence-evidence";
  independenceCross.independenceStatement = null;
  for (const row of independenceCross.rows as MutableRecord[]) {
    row.correlationCoefficient = 0;
  }
  const syntheticPublishable = clone(control) as unknown as MutableRecord;
  syntheticPublishable.publicationIntent = "publishable";
  return Object.freeze([
    Object.freeze({ id: "wrong-admission-sha", value: wrongAdmissionSha, expectedReason: "admission-source-sha" as const }),
    Object.freeze({ id: "missing-component-source", value: missingComponent, expectedReason: "component-source-set" as const }),
    Object.freeze({ id: "component-authority-mismatch", value: wrongAuthority, expectedReason: "component-authority-mismatch" as const }),
    Object.freeze({ id: "negative-standard-deviation", value: negativeSigma, expectedReason: "negative-standard-deviation" as const }),
    Object.freeze({ id: "missing-cross-source", value: missingCross, expectedReason: "cross-source-set" as const }),
    Object.freeze({ id: "correlation-out-of-range", value: invalidCorrelation, expectedReason: "correlation-out-of-range" as const }),
    Object.freeze({ id: "joint-correlation-not-psd", value: nonPsdCorrelation, expectedReason: "assembled-pack-rejected" as const }),
    Object.freeze({ id: "missing-independence-evidence", value: missingIndependence, expectedReason: "independence-evidence-missing" as const }),
    Object.freeze({ id: "synthetic-marked-publishable", value: syntheticPublishable, expectedReason: "synthetic-fixture-marked-publishable" as const }),
  ]);
}

export function parseKerrCovarianceSourceAdmissionArtifactV393(
  value: unknown,
): KerrCovarianceSourceAdmissionArtifactV393 {
  const source = isObject(value)
    ? (value as Partial<KerrCovarianceSourceAdmissionArtifactV393>)
    : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures)
    ? source.validator.adversarialFixtures
    : [];
  if (
    !source ||
    source.version !== KERR_COVARIANCE_SOURCE_ADMISSION_VERSION_V393 ||
    source.status !==
      "covariance-source-dossier-validator-qualified-physical-sources-unavailable-pack-not-built" ||
    !source.source ||
    Object.keys(source.source).length !== 3 ||
    !Object.values(source.source).every((entry) => SHA256.test(entry)) ||
    JSON.stringify(source.schema?.parameterOrder) !== JSON.stringify(V390_INPUT_ORDER) ||
    source.schema?.componentSourceCount !== 3 ||
    source.schema.crossSourceCount !== 3 ||
    source.schema.rowCountPerSource !== 12 ||
    source.schema.covarianceSemantics !==
      "natural-log-input-perturbation-covariance" ||
    source.schema.jointEstimatorOrIndependenceEvidenceRequired !== true ||
    source.validator?.qualified !== true ||
    source.validator.acceptedControlFixtureCount !== 1 ||
    source.validator.rejectedAdversarialFixtureCount !== 9 ||
    fixtures.length !== 9 ||
    fixtures.some(
      (fixture) =>
        fixture.rejected !== true ||
        fixture.expectedReason !== fixture.observedReason,
    ) ||
    source.selfTest?.fixtureClass !== "synthetic-validation-fixture" ||
    source.selfTest.publishable !== false ||
    source.selfTest.assembledPackStatus !== "admitted-validation-only" ||
    source.selfTest.assembledRowCount !== 12 ||
    source.selfTest.componentSourceCount !== 3 ||
    source.selfTest.crossSourceCount !== 3 ||
    source.selfTest.maximumPythonOracleRelativeDifference >=
      V393_ORACLE_RELATIVE_LIMIT ||
    source.productionAdmission?.dossierAvailable !== false ||
    source.productionAdmission.componentSourcesAvailable !== 0 ||
    source.productionAdmission.requiredComponentSources !== 3 ||
    source.productionAdmission.crossSourcesAvailable !== 0 ||
    source.productionAdmission.requiredCrossSources !== 3 ||
    source.productionAdmission.covariancePackBuilt !== false ||
    source.productionAdmission.covariancePackAdmitted !== false ||
    source.productionAdmission.covarianceProjectionExecuted !== false ||
    source.productionAdmission.unknownSystematicsTreatedAsZero !== false ||
    source.productionAdmission.missingCorrelationTreatedAsIndependent !== false ||
    source.productionAdmission.syntheticFixturePublishable !== false ||
    source.productionAdmission.confidenceInterval !== false ||
    source.productionAdmission.probabilityContentAssigned !== false ||
    source.productionAdmission.absoluteScientificInterval !== null ||
    source.qualification?.covarianceSourceDossierInfrastructureQualified !== true ||
    source.qualification.correlatedPackAssemblyPrimitiveQualified !== true ||
    source.qualification.physicalSourceDossierQualified !== false ||
    source.qualification.physicalCovarianceQualified !== false ||
    source.qualification.absoluteScientificIntervalQualified !== false ||
    source.qualification.absoluteTemperatureAuthorityGranted !== false ||
    source.qualification.measuredAuthorityGranted !== false ||
    source.qualification.scienceImageAvailable !== false ||
    source.networkAttempted !== false ||
    source.sciencePayloadMutationAllowed !== false ||
    source.cinematicConsumerAllowed !== false ||
    source.formalProductPointer !== "v263" ||
    source.denseCampaignStatus !== "incomplete-0-of-49" ||
    source.browserQualification !== "not-run" ||
    !SHA256.test(source.artifactSha256 ?? "")
  ) {
    throw new Error("v393-covariance-source-admission-artifact-identity");
  }
  return value as KerrCovarianceSourceAdmissionArtifactV393;
}
