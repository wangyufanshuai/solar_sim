import {
  parseKerrCovarianceSourceAdmissionArtifactV393,
  type KerrCovarianceSourceAdmissionArtifactV393,
} from "./kerrCovarianceSourceDossierV393";
import {
  parseKerrTemperatureSystematicsTransferArtifactV390,
  V390_INPUT_ORDER,
  type KerrTemperatureSystematicsTransferArtifactV390,
} from "./kerrTemperatureSystematicsTransferV390";

export const KERR_PHYSICAL_OBSERVATION_PACK_VERSION_V397 =
  "v397-kerr-physical-observation-pack-v1" as const;
export const KERR_PHYSICAL_OBSERVATION_ADMISSION_VERSION_V397 =
  "v397-kerr-physical-observation-admission-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const BAND_IDS = new Set(["visible", "euv", "soft-x-ray"]);
const SOURCE_KINDS = Object.freeze({
  "ln-photon-radiance": "detector-calibration",
  "ln-redshift-factor": "geometry-validation",
  "ln-page-thorne-flux": "model-validation",
} as const);
const CROSS_PAIRS = Object.freeze([
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

type ParameterIdV397 = (typeof V390_INPUT_ORDER)[number];
type SourceKindV397 = (typeof SOURCE_KINDS)[ParameterIdV397];
type CrossPairIdV397 = (typeof CROSS_PAIRS)[number]["id"];
type RowV397 = Readonly<{
  rayIndex: number;
  rayId: string;
  bandId: string;
  value: number;
  standardDeviation: number;
  qualityFlag: "accepted" | "upper-limit";
}>;

export type KerrPhysicalObservationSourceV397 = Readonly<{
  parameterId: ParameterIdV397;
  sourceKind: SourceKindV397;
  contentClass: "physical-source" | "synthetic-validation-fixture";
  sourceIdentity: string;
  sourceArtifactSha256: string;
  provenanceSha256: string;
  licenseStatus: "explicit" | "unverified";
  termsUrl: string | null;
  units: "log-natural";
  coordinateFrame: "zamo-screen-local";
  epochScale: "TDB";
  rows: readonly RowV397[];
}>;

export type KerrPhysicalObservationCrossLinkV397 = Readonly<{
  pairId: CrossPairIdV397;
  leftParameter: ParameterIdV397;
  rightParameter: ParameterIdV397;
  contentClass: "physical-source" | "synthetic-validation-fixture";
  evidenceMode: "joint-estimator" | "independence-evidence" | "synthetic-validation-fixture";
  sourceArtifactSha256: string;
  evidenceSha256: string;
  correlationCoefficient: number;
  independenceStatement: string | null;
}>;

export type KerrPhysicalObservationPackV397 = Readonly<{
  version: typeof KERR_PHYSICAL_OBSERVATION_PACK_VERSION_V397;
  packId: string;
  contentClass: "physical-observation-pack" | "synthetic-validation-fixture";
  publicationIntent: "publishable" | "validation-only";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v393SourceAdmissionArtifactSha256: string;
    v396ConstraintDesignArtifactSha256: string;
    packArtifactSha256: string;
  }>;
  parameterOrder: typeof V390_INPUT_ORDER;
  observationSemantics: "natural-log-observable-at-zamo-screen-epoch";
  sources: readonly KerrPhysicalObservationSourceV397[];
  crossLinks: readonly KerrPhysicalObservationCrossLinkV397[];
}>;

export type KerrPhysicalObservationAdmissionReasonV397 =
  | "pack-not-object"
  | "pack-version"
  | "pack-identity"
  | "synthetic-fixture-marked-publishable"
  | "source-identity"
  | "source-sha"
  | "provenance-sha"
  | "license-unverified"
  | "terms-missing"
  | "units-mismatch"
  | "frame-mismatch"
  | "epoch-mismatch"
  | "source-kind-mismatch"
  | "source-set"
  | "row-set"
  | "non-finite-observation"
  | "invalid-standard-deviation"
  | "cross-link-set"
  | "cross-link-order"
  | "cross-evidence-missing"
  | "correlation-out-of-range"
  | "correlation-not-psd"
  | "source-admission-sha"
  | "constraint-design-sha";

export type KerrPhysicalObservationAdmissionResultV397 = Readonly<{
  status: "admitted-physical" | "admitted-validation-only" | "rejected";
  publicationAllowed: boolean;
  rejectionReasons: readonly KerrPhysicalObservationAdmissionReasonV397[];
  sourceCount: number;
  crossLinkCount: number;
  checkedRowCount: number;
}>;

export type KerrPhysicalObservationAdmissionArtifactV397 = Readonly<{
  version: typeof KERR_PHYSICAL_OBSERVATION_ADMISSION_VERSION_V397;
  generatedAt: string;
  status: "observation-admission-contract-qualified-physical-pack-unavailable";
  source: Readonly<{
    v390TransferArtifactSha256: string;
    v393SourceAdmissionArtifactSha256: string;
    v396ConstraintDesignArtifactSha256: string;
    fullShortAuthoritySha256: string;
  }>;
  schema: Readonly<{
    parameterOrder: typeof V390_INPUT_ORDER;
    sourceCount: 3;
    crossLinkCount: 3;
    rowCountPerSource: 12;
    requiredLicenseStatus: "explicit";
    units: "log-natural";
    coordinateFrame: "zamo-screen-local";
    epochScale: "TDB";
    psdCorrelationCheck: true;
  }>;
  validator: Readonly<{
    qualified: true;
    acceptedControlFixtureCount: 1;
    rejectedAdversarialFixtureCount: 9;
    adversarialFixtures: readonly Readonly<{
      id: string;
      expectedReason: KerrPhysicalObservationAdmissionReasonV397;
      observedReason: KerrPhysicalObservationAdmissionReasonV397;
      rejected: true;
    }>[];
  }>;
  selfTest: Readonly<{
    fixtureClass: "synthetic-validation-fixture";
    admissionStatus: "admitted-validation-only";
    publicationAllowed: false;
    sourceCount: 3;
    crossLinkCount: 3;
    checkedRowCount: 36;
    correlationMatrixDeterminant: number;
    maximumPythonOracleRelativeDifference: number;
  }>;
  productionAdmission: Readonly<{
    physicalObservationPackAvailable: false;
    requiredSources: 3;
    availableSources: 0;
    requiredCrossLinks: 3;
    availableCrossLinks: 0;
    sourceLicenseVerified: false;
    covariancePackBuilt: false;
    physicalConstraintSelectionExecuted: false;
    instrumentResponseAvailable: false;
    confidenceInterval: false;
    probabilityContentAssigned: false;
    absoluteScientificInterval: null;
  }>;
  qualification: Readonly<{
    admissionContractQualified: true;
    provenanceRequirementsQualified: true;
    physicalObservationPackQualified: false;
    physicalConstraintSelectionQualified: false;
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
  target: KerrPhysicalObservationAdmissionReasonV397[],
  reason: KerrPhysicalObservationAdmissionReasonV397,
) => {
  if (!target.includes(reason)) target.push(reason);
};
const rowKey = (value: { rayIndex?: unknown; rayId?: unknown; bandId?: unknown }) =>
  `${value.rayIndex}:${value.rayId}:${value.bandId}`;

export function validateKerrPhysicalObservationPackV397(
  value: unknown,
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  sourceAdmissionValue: KerrCovarianceSourceAdmissionArtifactV393,
  constraintDesignSha256: string,
): KerrPhysicalObservationAdmissionResultV397 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(transferValue);
  const sourceAdmission = parseKerrCovarianceSourceAdmissionArtifactV393(sourceAdmissionValue);
  const reasons: KerrPhysicalObservationAdmissionReasonV397[] = [];
  if (!isObject(value)) {
    return Object.freeze({ status: "rejected", publicationAllowed: false, rejectionReasons: Object.freeze(["pack-not-object" as const]), sourceCount: 0, crossLinkCount: 0, checkedRowCount: 0 });
  }
  const pack = value;
  if (pack.version !== KERR_PHYSICAL_OBSERVATION_PACK_VERSION_V397) addReason(reasons, "pack-version");
  if (typeof pack.packId !== "string" || pack.packId.length < 3) addReason(reasons, "pack-identity");
  if (pack.contentClass !== "physical-observation-pack" && pack.contentClass !== "synthetic-validation-fixture") addReason(reasons, "pack-identity");
  if (pack.contentClass === "synthetic-validation-fixture" && pack.publicationIntent === "publishable") addReason(reasons, "synthetic-fixture-marked-publishable");
  const source = isObject(pack.source) ? pack.source : null;
  if (source?.v390TransferArtifactSha256 !== transfer.artifactSha256) addReason(reasons, "source-identity");
  if (source?.v393SourceAdmissionArtifactSha256 !== sourceAdmission.artifactSha256) addReason(reasons, "source-admission-sha");
  if (source?.v396ConstraintDesignArtifactSha256 !== constraintDesignSha256) addReason(reasons, "constraint-design-sha");
  if (!SHA256.test(String(source?.packArtifactSha256 ?? ""))) addReason(reasons, "source-sha");
  if (JSON.stringify(pack.parameterOrder) !== JSON.stringify(V390_INPUT_ORDER)) addReason(reasons, "source-identity");
  if (pack.observationSemantics !== "natural-log-observable-at-zamo-screen-epoch") addReason(reasons, "units-mismatch");
  const expectedRows = new Set(transfer.rows.map(rowKey));
  const sources = Array.isArray(pack.sources) ? pack.sources : [];
  const sourceIds = new Set<string>();
  let checkedRowCount = 0;
  for (const sourceValue of sources) {
    if (!isObject(sourceValue)) { addReason(reasons, "source-set"); continue; }
    const parameterId = String(sourceValue.parameterId);
    sourceIds.add(parameterId);
    if (!V390_INPUT_ORDER.includes(parameterId as ParameterIdV397)) addReason(reasons, "source-set");
    else {
      if (sourceValue.sourceKind !== SOURCE_KINDS[parameterId as ParameterIdV397]) addReason(reasons, "source-kind-mismatch");
    }
    if (!SHA256.test(String(sourceValue.sourceArtifactSha256 ?? ""))) addReason(reasons, "source-sha");
    if (!SHA256.test(String(sourceValue.provenanceSha256 ?? ""))) addReason(reasons, "provenance-sha");
    if (sourceValue.licenseStatus !== "explicit") addReason(reasons, "license-unverified");
    if (typeof sourceValue.termsUrl !== "string" || sourceValue.termsUrl.length < 8) addReason(reasons, "terms-missing");
    if (sourceValue.units !== "log-natural") addReason(reasons, "units-mismatch");
    if (sourceValue.coordinateFrame !== "zamo-screen-local") addReason(reasons, "frame-mismatch");
    if (sourceValue.epochScale !== "TDB") addReason(reasons, "epoch-mismatch");
    const rows = Array.isArray(sourceValue.rows) ? sourceValue.rows : [];
    const observedRows = new Set<string>();
    checkedRowCount += rows.length;
    for (const rowValue of rows) {
      if (!isObject(rowValue)) { addReason(reasons, "row-set"); continue; }
      const key = rowKey(rowValue);
      observedRows.add(key);
      if (!expectedRows.has(key) || !Number.isInteger(rowValue.rayIndex) || typeof rowValue.rayId !== "string" || !BAND_IDS.has(String(rowValue.bandId))) addReason(reasons, "row-set");
      if (typeof rowValue.value !== "number" || !Number.isFinite(rowValue.value)) addReason(reasons, "non-finite-observation");
      if (typeof rowValue.standardDeviation !== "number" || !Number.isFinite(rowValue.standardDeviation) || rowValue.standardDeviation <= 0) addReason(reasons, "invalid-standard-deviation");
      if (rowValue.qualityFlag !== "accepted" && rowValue.qualityFlag !== "upper-limit") addReason(reasons, "row-set");
    }
    if (rows.length !== 12 || observedRows.size !== 12 || [...expectedRows].some((key) => !observedRows.has(key))) addReason(reasons, "row-set");
  }
  if (sources.length !== 3 || sourceIds.size !== 3 || V390_INPUT_ORDER.some((id) => !sourceIds.has(id))) addReason(reasons, "source-set");
  const crossLinks = Array.isArray(pack.crossLinks) ? pack.crossLinks : [];
  const crossIds = new Set<string>();
  for (const crossValue of crossLinks) {
    if (!isObject(crossValue)) { addReason(reasons, "cross-link-set"); continue; }
    const pairId = String(crossValue.pairId);
    crossIds.add(pairId);
    const expectedPair = CROSS_PAIRS.find((pair) => pair.id === pairId);
    if (!expectedPair) addReason(reasons, "cross-link-set");
    else if (crossValue.leftParameter !== expectedPair.left || crossValue.rightParameter !== expectedPair.right) addReason(reasons, "cross-link-order");
    if (!SHA256.test(String(crossValue.sourceArtifactSha256 ?? "")) || !SHA256.test(String(crossValue.evidenceSha256 ?? ""))) addReason(reasons, "cross-evidence-missing");
    if (typeof crossValue.correlationCoefficient !== "number" || !Number.isFinite(crossValue.correlationCoefficient) || Math.abs(crossValue.correlationCoefficient) > 1) addReason(reasons, "correlation-out-of-range");
    if (crossValue.correlationCoefficient === 0 && (crossValue.evidenceMode !== "independence-evidence" || typeof crossValue.independenceStatement !== "string" || crossValue.independenceStatement.trim().length < 16)) addReason(reasons, "cross-evidence-missing");
  }
  if (crossLinks.length !== 3 || crossIds.size !== 3 || CROSS_PAIRS.some((pair) => !crossIds.has(pair.id))) addReason(reasons, "cross-link-set");
  if (crossLinks.length === 3 && crossIds.size === 3) {
    const [rho01, rho02, rho12] = CROSS_PAIRS.map((pair) => Number(crossLinks.find((link) => link.pairId === pair.id)?.correlationCoefficient));
    const determinant = 1 + 2 * rho01 * rho02 * rho12 - rho01 ** 2 - rho02 ** 2 - rho12 ** 2;
    if (!Number.isFinite(determinant) || determinant < -1e-12) addReason(reasons, "correlation-not-psd");
  }
  const rejected = reasons.length > 0;
  const validationOnly = !rejected && pack.contentClass === "synthetic-validation-fixture";
  return Object.freeze({ status: rejected ? "rejected" : validationOnly ? "admitted-validation-only" : "admitted-physical", publicationAllowed: !rejected && pack.contentClass === "physical-observation-pack" && pack.publicationIntent === "publishable", rejectionReasons: Object.freeze(reasons), sourceCount: sources.length, crossLinkCount: crossLinks.length, checkedRowCount });
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function createKerrPhysicalObservationControlFixtureV397(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  sourceAdmissionValue: KerrCovarianceSourceAdmissionArtifactV393,
  constraintDesignSha256: string,
): KerrPhysicalObservationPackV397 {
  const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(transferValue);
  const sourceAdmission = parseKerrCovarianceSourceAdmissionArtifactV393(sourceAdmissionValue);
  const sources = V390_INPUT_ORDER.map((parameterId, parameterIndex) => Object.freeze({
    parameterId,
    sourceKind: SOURCE_KINDS[parameterId],
    contentClass: "synthetic-validation-fixture" as const,
    sourceIdentity: `v397-control:${parameterId}`,
    sourceArtifactSha256: String(parameterIndex + 1).repeat(64),
    provenanceSha256: String(parameterIndex + 4).repeat(64),
    licenseStatus: "explicit" as const,
    termsUrl: "https://example.invalid/validation-terms",
    units: "log-natural" as const,
    coordinateFrame: "zamo-screen-local" as const,
    epochScale: "TDB" as const,
    rows: Object.freeze(transfer.rows.map((row, index) => Object.freeze({ rayIndex: row.rayIndex, rayId: row.rayId, bandId: row.bandId, value: 0.01 * (parameterIndex + 1) + index * 1e-4, standardDeviation: 0.001 * (parameterIndex + 1), qualityFlag: "accepted" as const }))),
  }));
  const crossLinks = CROSS_PAIRS.map((pair, index) => Object.freeze({ pairId: pair.id, leftParameter: pair.left, rightParameter: pair.right, contentClass: "synthetic-validation-fixture" as const, evidenceMode: "synthetic-validation-fixture" as const, sourceArtifactSha256: String(index + 7).repeat(64), evidenceSha256: ["a", "b", "c"][index].repeat(64), correlationCoefficient: [0.1, -1 / 60, 0.05][index], independenceStatement: null }));
  return Object.freeze({ version: KERR_PHYSICAL_OBSERVATION_PACK_VERSION_V397, packId: "v397-observation-admission-control-fixture", contentClass: "synthetic-validation-fixture", publicationIntent: "validation-only", source: Object.freeze({ v390TransferArtifactSha256: transfer.artifactSha256, v393SourceAdmissionArtifactSha256: sourceAdmission.artifactSha256, v396ConstraintDesignArtifactSha256: constraintDesignSha256, packArtifactSha256: "f".repeat(64) }), parameterOrder: V390_INPUT_ORDER, observationSemantics: "natural-log-observable-at-zamo-screen-epoch", sources: Object.freeze(sources), crossLinks: Object.freeze(crossLinks) });
}

export function createKerrPhysicalObservationAdversarialFixturesV397(
  transferValue: KerrTemperatureSystematicsTransferArtifactV390,
  sourceAdmissionValue: KerrCovarianceSourceAdmissionArtifactV393,
  constraintDesignSha256: string,
) {
  const control = createKerrPhysicalObservationControlFixtureV397(transferValue, sourceAdmissionValue, constraintDesignSha256);
  const wrongSource = clone(control) as unknown as MutableRecord; (wrongSource.source as MutableRecord).v393SourceAdmissionArtifactSha256 = "c".repeat(64);
  const wrongKind = clone(control) as unknown as MutableRecord; ((wrongKind.sources as MutableRecord[])[0]).sourceKind = "model-validation";
  const missingLicense = clone(control) as unknown as MutableRecord; ((missingLicense.sources as MutableRecord[])[1]).licenseStatus = "unverified";
  const missingTerms = clone(control) as unknown as MutableRecord; ((missingTerms.sources as MutableRecord[])[1]).termsUrl = null;
  const badUnits = clone(control) as unknown as MutableRecord; ((badUnits.sources as MutableRecord[])[2]).units = "flux";
  const badRow = clone(control) as unknown as MutableRecord; ((((badRow.sources as MutableRecord[])[0]).rows as MutableRecord[])[0]).value = Number.NaN;
  const badCorrelation = clone(control) as unknown as MutableRecord; ((badCorrelation.crossLinks as MutableRecord[])[0]).correlationCoefficient = 1.1;
  const nonPsd = clone(control) as unknown as MutableRecord; const values = [0.9, 0.9, -0.9]; (nonPsd.crossLinks as MutableRecord[]).forEach((link, index) => { link.correlationCoefficient = values[index]; });
  const syntheticPublishable = clone(control) as unknown as MutableRecord; syntheticPublishable.publicationIntent = "publishable";
  return Object.freeze([
    Object.freeze({ id: "wrong-source-admission-sha", value: wrongSource, expectedReason: "source-admission-sha" as const }),
    Object.freeze({ id: "wrong-source-kind", value: wrongKind, expectedReason: "source-kind-mismatch" as const }),
    Object.freeze({ id: "license-unverified", value: missingLicense, expectedReason: "license-unverified" as const }),
    Object.freeze({ id: "terms-missing", value: missingTerms, expectedReason: "terms-missing" as const }),
    Object.freeze({ id: "units-mismatch", value: badUnits, expectedReason: "units-mismatch" as const }),
    Object.freeze({ id: "non-finite-row", value: badRow, expectedReason: "non-finite-observation" as const }),
    Object.freeze({ id: "correlation-out-of-range", value: badCorrelation, expectedReason: "correlation-out-of-range" as const }),
    Object.freeze({ id: "correlation-not-psd", value: nonPsd, expectedReason: "correlation-not-psd" as const }),
    Object.freeze({ id: "synthetic-marked-publishable", value: syntheticPublishable, expectedReason: "synthetic-fixture-marked-publishable" as const }),
  ]);
}

export function parseKerrPhysicalObservationAdmissionArtifactV397(value: unknown): KerrPhysicalObservationAdmissionArtifactV397 {
  const source = isObject(value) ? value as Partial<KerrPhysicalObservationAdmissionArtifactV397> : null;
  const fixtures = Array.isArray(source?.validator?.adversarialFixtures) ? source.validator.adversarialFixtures : [];
  if (!source || source.version !== KERR_PHYSICAL_OBSERVATION_ADMISSION_VERSION_V397 || source.status !== "observation-admission-contract-qualified-physical-pack-unavailable" || !source.source || !Object.values(source.source).every((entry) => SHA256.test(entry)) || JSON.stringify(source.schema?.parameterOrder) !== JSON.stringify(V390_INPUT_ORDER) || source.schema?.sourceCount !== 3 || source.schema?.crossLinkCount !== 3 || source.schema?.rowCountPerSource !== 12 || source.schema?.requiredLicenseStatus !== "explicit" || source.schema?.units !== "log-natural" || source.schema?.coordinateFrame !== "zamo-screen-local" || source.schema?.epochScale !== "TDB" || source.schema?.psdCorrelationCheck !== true || source.validator?.qualified !== true || source.validator.acceptedControlFixtureCount !== 1 || source.validator.rejectedAdversarialFixtureCount !== 9 || fixtures.length !== 9 || fixtures.some((fixture) => fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason) || source.selfTest?.fixtureClass !== "synthetic-validation-fixture" || source.selfTest.admissionStatus !== "admitted-validation-only" || source.selfTest.publicationAllowed !== false || source.selfTest.sourceCount !== 3 || source.selfTest.crossLinkCount !== 3 || source.selfTest.checkedRowCount !== 36 || !(source.selfTest.correlationMatrixDeterminant > 0) || source.selfTest.maximumPythonOracleRelativeDifference >= 2e-12 || source.productionAdmission?.physicalObservationPackAvailable !== false || source.productionAdmission.availableSources !== 0 || source.productionAdmission.availableCrossLinks !== 0 || source.productionAdmission.sourceLicenseVerified !== false || source.productionAdmission.covariancePackBuilt !== false || source.productionAdmission.physicalConstraintSelectionExecuted !== false || source.productionAdmission.instrumentResponseAvailable !== false || source.productionAdmission.confidenceInterval !== false || source.productionAdmission.probabilityContentAssigned !== false || source.productionAdmission.absoluteScientificInterval !== null || source.qualification?.admissionContractQualified !== true || source.qualification.provenanceRequirementsQualified !== true || source.qualification.physicalObservationPackQualified !== false || source.qualification.physicalConstraintSelectionQualified !== false || source.qualification.measuredAuthorityGranted !== false || source.qualification.scienceImageAvailable !== false || source.networkAttempted !== false || source.sciencePayloadMutationAllowed !== false || source.cinematicConsumerAllowed !== false || source.formalProductPointer !== "v263" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run" || !SHA256.test(source.artifactSha256 ?? "")) throw new Error("v397-physical-observation-admission-artifact-identity");
  return value as KerrPhysicalObservationAdmissionArtifactV397;
}
