import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_ARTIFACT_VERSION_V429,
  KERR_V426_RESPONSE_FILE_SHA256_V429,
  KERR_V428_ARTIFACT_FILE_SHA256_V429,
  KERR_V428_ARTIFACT_SHA256_V429,
  KERR_V428_EVIDENCE_FILE_SHA256_V429,
  KERR_V428_EVIDENCE_SHA256_V429,
  KERR_V428_POINTER_FILE_SHA256_V429,
  KERR_V428_POINTER_SHA256_V429,
  canonicalShaV429,
  createKerrHighEnergyResponseUncertaintyViewV429,
  parseKerrHighEnergyResponseUncertaintyArtifactV429,
  parseKerrHighEnergyResponseUncertaintyOracleV429,
  type KerrHighEnergyResponseUncertaintyArtifactV429,
  type KerrHighEnergyResponseValidationProtocolV429,
} from "../app/lib/kerrHighEnergyResponseUncertaintyV429";

const root = process.cwd();
const outputRoot = "dist/science/kerr-high-energy-response-uncertainty-v429";
const paths = {
  v426: "dist/science/kerr-high-energy-response-v426/response-contract.json",
  v428: "dist/science/kerr-high-energy-response-intake-v428/intake-firewall.json",
  v428Evidence: "dist/science/orbit-atlas-shadow-v428-evidence.json",
  v428Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v428.json",
  oracle: `${outputRoot}/uncertainty-oracle.json`,
  protocol: `${outputRoot}/independent-validation-protocol.json`,
  artifact: `${outputRoot}/response-uncertainty.json`,
  csv: `${outputRoot}/prediction-uncertainty-diagonal.csv`,
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>;
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
function atomicText(path: string, value: string): void { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value, "utf8"); renameSync(temporary, target); }

const v426 = read(paths.v426), v428 = read(paths.v428), v428Evidence = read(paths.v428Evidence), v428Pointer = read(paths.v428Pointer);
if (fileSha(paths.v426) !== KERR_V426_RESPONSE_FILE_SHA256_V429 || fileSha(paths.v428) !== KERR_V428_ARTIFACT_FILE_SHA256_V429 || v428.artifactSha256 !== KERR_V428_ARTIFACT_SHA256_V429 || fileSha(paths.v428Evidence) !== KERR_V428_EVIDENCE_FILE_SHA256_V429 || v428Evidence.evidenceSha256 !== KERR_V428_EVIDENCE_SHA256_V429 || fileSha(paths.v428Pointer) !== KERR_V428_POINTER_FILE_SHA256_V429 || v428Pointer.pointerSha256 !== KERR_V428_POINTER_SHA256_V429 || v426.view && (v426.view as { counts?: { scienceResponseApplicationCount?: number } }).counts?.scienceResponseApplicationCount !== 0) throw new Error("v429-source-lock");
const oracle = parseKerrHighEnergyResponseUncertaintyOracleV429(read(paths.oracle));
const protocol = read(paths.protocol) as KerrHighEnergyResponseValidationProtocolV429;
const view = createKerrHighEnergyResponseUncertaintyViewV429(oracle, protocol);
const unsigned = {
  version: KERR_HIGH_ENERGY_RESPONSE_UNCERTAINTY_ARTIFACT_VERSION_V429,
  generatedAt: String(v428.generatedAt),
  status: view.status,
  sourceFiles: Object.freeze({ v426ResponseFileSha256: KERR_V426_RESPONSE_FILE_SHA256_V429, v428IntakeFileSha256: KERR_V428_ARTIFACT_FILE_SHA256_V429, v428EvidenceFileSha256: KERR_V428_EVIDENCE_FILE_SHA256_V429, v428PointerFileSha256: KERR_V428_POINTER_FILE_SHA256_V429, pythonOracleFileSha256: fileSha(paths.oracle), validationProtocolFileSha256: fileSha(paths.protocol) }),
  pythonOracleArtifactSha256: oracle.artifactSha256,
  view,
  deterministicReplay: true as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  observedCountsPresent: false as const,
  measuredHoldoutPresent: false as const,
  measuredValidationRunCount: 0 as const,
  scienceResponseApplicationCount: 0 as const,
  artifactSha256: "pending",
};
const artifact = parseKerrHighEnergyResponseUncertaintyArtifactV429({ ...unsigned, artifactSha256: canonicalShaV429(unsigned) }) as KerrHighEnergyResponseUncertaintyArtifactV429;
atomicText(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
const angles = oracle.fixture.analyzerAnglesDeg;
const lines = ["observationIndex,analyzerAngleDeg,detectorChannelIndex,predictedCount,responseParameterVariance,redistributionVariance,totalVariance,observedCount,residualApplicability,sourceKind"];
for (let index = 0; index < 24; index += 1) lines.push([index, angles[Math.floor(index / 6)], index % 6, oracle.expected.predictedCounts[index], oracle.expected.parameterCovarianceContribution[index][index], oracle.expected.redistributionCovarianceContribution[index][index], oracle.expected.totalCovariance[index][index], "", "unavailable-no-measured-holdout", "test-fixture-nonpublishable"].join(","));
atomicText(paths.csv, `${lines.join("\n")}\n`);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, model: artifact.view.model, fixtureMetrics: artifact.view.fixture.metrics, maximumPythonRelativeDifference: artifact.view.fixture.maximumPythonRelativeDifference, predictedCounts: 24, observedCounts: 0, measuredValidationRuns: 0, residualMetrics: 0, measuredAuthority: false, scienceApplications: 0 }, null, 2));
