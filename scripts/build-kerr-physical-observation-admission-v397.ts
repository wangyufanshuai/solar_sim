import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createKerrPhysicalObservationAdversarialFixturesV397,
  createKerrPhysicalObservationControlFixtureV397,
  parseKerrPhysicalObservationAdmissionArtifactV397,
  validateKerrPhysicalObservationPackV397,
} from "../app/lib/kerrPhysicalObservationAdmissionV397";
import { parseKerrCovarianceSourceAdmissionArtifactV393 } from "../app/lib/kerrCovarianceSourceDossierV393";
import { parseKerrTemperatureSystematicsTransferArtifactV390, V390_INPUT_ORDER } from "../app/lib/kerrTemperatureSystematicsTransferV390";

const root = process.cwd();
const paths = {
  transfer: "dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json",
  sourceAdmission: "dist/science/kerr-covariance-source-admission-v393/source-admission.json",
  constraint: "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json",
  oracle: "dist/science/kerr-physical-observation-admission-v397/python-oracle.json",
  artifact: "dist/science/kerr-physical-observation-admission-v397/observation-admission.json",
};
const shaBytes = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => shaBytes(JSON.stringify(canonicalize(value)));
const bounded = (path: string, maximum: number) => { const target = resolve(root, path); const metadata = statSync(target); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > maximum) throw new Error(`v397-input-size:${path}`); return readFileSync(target); };
const atomic = (path: string, value: string) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value); renameSync(temporary, target); };
const relative = (left: number, right: number) => Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));

const transfer = parseKerrTemperatureSystematicsTransferArtifactV390(JSON.parse(bounded(paths.transfer, 128 * 1024).toString("utf8")));
const sourceAdmission = parseKerrCovarianceSourceAdmissionArtifactV393(JSON.parse(bounded(paths.sourceAdmission, 128 * 1024).toString("utf8")));
const constraint = JSON.parse(bounded(paths.constraint, 128 * 1024).toString("utf8")) as { artifactSha256?: string; status?: string };
const oracle = JSON.parse(bounded(paths.oracle, 64 * 1024).toString("utf8")) as Record<string, unknown>;
if (constraint.status !== "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable" || typeof constraint.artifactSha256 !== "string") throw new Error("v397-constraint-identity");
const constraintSha256 = constraint.artifactSha256;
if (oracle.status !== "qualified-independent-observation-admission-oracle" || oracle.source && (oracle.source as Record<string, unknown>).v390TransferArtifactSha256 !== transfer.artifactSha256 || oracle.source && (oracle.source as Record<string, unknown>).v393SourceAdmissionArtifactSha256 !== sourceAdmission.artifactSha256 || oracle.source && (oracle.source as Record<string, unknown>).v396ConstraintDesignArtifactSha256 !== constraintSha256 || oracle.requiredSourceCount !== 3 || oracle.requiredCrossLinkCount !== 3 || oracle.requiredRowCountPerSource !== 12 || oracle.controlCheckedRowCount !== 36 || oracle.physicalObservationPackAvailable !== false || oracle.networkAttempted !== false) throw new Error("v397-oracle-identity");

const control = createKerrPhysicalObservationControlFixtureV397(transfer, sourceAdmission, constraintSha256);
const controlValidation = validateKerrPhysicalObservationPackV397(control, transfer, sourceAdmission, constraintSha256);
if (controlValidation.status !== "admitted-validation-only" || controlValidation.publicationAllowed !== false || controlValidation.sourceCount !== 3 || controlValidation.crossLinkCount !== 3 || controlValidation.checkedRowCount !== 36) throw new Error("v397-control-validation");
const fixtures = createKerrPhysicalObservationAdversarialFixturesV397(transfer, sourceAdmission, constraintSha256).map((fixture) => { const result = validateKerrPhysicalObservationPackV397(fixture.value, transfer, sourceAdmission, constraintSha256); if (result.status !== "rejected" || !result.rejectionReasons.includes(fixture.expectedReason)) throw new Error(`v397-attack:${fixture.id}`); return Object.freeze({ id: fixture.id, expectedReason: fixture.expectedReason, observedReason: fixture.expectedReason, rejected: true as const }); });
const oracleDeterminant = Number(oracle.controlCorrelationMatrixDeterminant);
const controlDeterminant = 1 + 2 * 0.1 * (-1 / 60) * 0.05 - 0.1 ** 2 - (-1 / 60) ** 2 - 0.05 ** 2;
const unsigned = {
  version: "v397-kerr-physical-observation-admission-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "observation-admission-contract-qualified-physical-pack-unavailable" as const,
  source: Object.freeze({ v390TransferArtifactSha256: transfer.artifactSha256, v393SourceAdmissionArtifactSha256: sourceAdmission.artifactSha256, v396ConstraintDesignArtifactSha256: constraintSha256, fullShortAuthoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6" }),
  schema: Object.freeze({ parameterOrder: V390_INPUT_ORDER, sourceCount: 3 as const, crossLinkCount: 3 as const, rowCountPerSource: 12 as const, requiredLicenseStatus: "explicit" as const, units: "log-natural" as const, coordinateFrame: "zamo-screen-local" as const, epochScale: "TDB" as const, psdCorrelationCheck: true as const }),
  validator: Object.freeze({ qualified: true as const, acceptedControlFixtureCount: 1 as const, rejectedAdversarialFixtureCount: 9 as const, adversarialFixtures: Object.freeze(fixtures) }),
  selfTest: Object.freeze({ fixtureClass: "synthetic-validation-fixture" as const, admissionStatus: "admitted-validation-only" as const, publicationAllowed: false as const, sourceCount: 3 as const, crossLinkCount: 3 as const, checkedRowCount: 36 as const, correlationMatrixDeterminant: controlDeterminant, maximumPythonOracleRelativeDifference: relative(controlDeterminant, oracleDeterminant) }),
  productionAdmission: Object.freeze({ physicalObservationPackAvailable: false as const, requiredSources: 3 as const, availableSources: 0 as const, requiredCrossLinks: 3 as const, availableCrossLinks: 0 as const, sourceLicenseVerified: false as const, covariancePackBuilt: false as const, physicalConstraintSelectionExecuted: false as const, instrumentResponseAvailable: false as const, confidenceInterval: false as const, probabilityContentAssigned: false as const, absoluteScientificInterval: null }),
  qualification: Object.freeze({ admissionContractQualified: true as const, provenanceRequirementsQualified: true as const, physicalObservationPackQualified: false as const, physicalConstraintSelectionQualified: false as const, measuredAuthorityGranted: false as const, scienceImageAvailable: false as const }),
  networkAttempted: false as const,
  sciencePayloadMutationAllowed: false as const,
  cinematicConsumerAllowed: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const candidate = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
const artifact = parseKerrPhysicalObservationAdmissionArtifactV397(candidate);
atomic(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, sourceCount: 3, crossLinkCount: 3, checkedRowCount: 36, correlationMatrixDeterminant: controlDeterminant, maximumPythonOracleRelativeDifference: artifact.selfTest.maximumPythonOracleRelativeDifference, physicalObservationPackAvailable: false }, null, 2));
