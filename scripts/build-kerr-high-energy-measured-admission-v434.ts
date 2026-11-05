import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_HIGH_ENERGY_MEASURED_ADMISSION_ARTIFACT_VERSION_V434,
  KERR_V433_ARTIFACT_FILE_SHA256_V434,
  KERR_V433_ARTIFACT_SHA256_V434,
  KERR_V433_EVIDENCE_FILE_SHA256_V434,
  KERR_V433_EVIDENCE_SHA256_V434,
  KERR_V433_ORACLE_FILE_SHA256_V434,
  KERR_V433_ORACLE_SHA256_V434,
  KERR_V433_POINTER_FILE_SHA256_V434,
  KERR_V433_POINTER_SHA256_V434,
  canonicalShaV434,
  createKerrMeasuredAdmissionViewV434,
  parseKerrMeasuredAdmissionArtifactV434,
  parseKerrMeasuredAdmissionOracleV434,
  type KerrMeasuredAdmissionArtifactV434,
  type KerrMeasuredAdmissionContractV434,
} from "../app/lib/kerrHighEnergyMeasuredAdmissionV434";

const root = process.cwd();
const outputRoot = "dist/science/kerr-high-energy-measured-admission-v434";
const paths = {
  v433Artifact: "dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance.json",
  v433Oracle: "dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance-oracle.json",
  v433Evidence: "dist/science/orbit-atlas-shadow-v433-evidence.json",
  v433Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v433.json",
  oracle: `${outputRoot}/measured-admission-oracle.json`, contract: `${outputRoot}/measured-admission-contract.json`, fixture: `${outputRoot}/measured-admission-fixture.json`, artifact: `${outputRoot}/measured-admission.json`, csv: `${outputRoot}/measured-admission-gates.csv`,
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>;
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value, "utf8"); renameSync(temporary, target); };

const v433Artifact = read(paths.v433Artifact), v433Oracle = read(paths.v433Oracle), v433Evidence = read(paths.v433Evidence), v433Pointer = read(paths.v433Pointer);
if (v433Artifact.artifactSha256 !== KERR_V433_ARTIFACT_SHA256_V434 || fileSha(paths.v433Artifact) !== KERR_V433_ARTIFACT_FILE_SHA256_V434 || v433Oracle.artifactSha256 !== KERR_V433_ORACLE_SHA256_V434 || fileSha(paths.v433Oracle) !== KERR_V433_ORACLE_FILE_SHA256_V434 || v433Evidence.evidenceSha256 !== KERR_V433_EVIDENCE_SHA256_V434 || fileSha(paths.v433Evidence) !== KERR_V433_EVIDENCE_FILE_SHA256_V434 || v433Pointer.pointerSha256 !== KERR_V433_POINTER_SHA256_V434 || fileSha(paths.v433Pointer) !== KERR_V433_POINTER_FILE_SHA256_V434) throw new Error("v434-source-lock");
const oracle = parseKerrMeasuredAdmissionOracleV434(read(paths.oracle));
const contract = read(paths.contract) as KerrMeasuredAdmissionContractV434;
const view = createKerrMeasuredAdmissionViewV434(oracle, contract);
const unsigned = {
  version: KERR_HIGH_ENERGY_MEASURED_ADMISSION_ARTIFACT_VERSION_V434,
  generatedAt: String(v433Artifact.generatedAt), status: view.status,
  sourceFiles: Object.freeze({ v433ArtifactFileSha256: KERR_V433_ARTIFACT_FILE_SHA256_V434, v433OracleFileSha256: KERR_V433_ORACLE_FILE_SHA256_V434, v433EvidenceFileSha256: KERR_V433_EVIDENCE_FILE_SHA256_V434, v433PointerFileSha256: KERR_V433_POINTER_FILE_SHA256_V434, pythonOracleFileSha256: fileSha(paths.oracle), admissionContractFileSha256: fileSha(paths.contract), fixtureFileSha256: fileSha(paths.fixture) }),
  pythonOracleArtifactSha256: oracle.artifactSha256, view, deterministicReplay: true as const, networkAttempted: false as const, measuredImportAttempted: false as const, measuredPackPresent: false as const, denseShardExecuted: false as const, scienceResponseApplicationCount: 0 as const, artifactSha256: "pending",
};
const artifact = parseKerrMeasuredAdmissionArtifactV434({ ...unsigned, artifactSha256: canonicalShaV434(unsigned) }) as KerrMeasuredAdmissionArtifactV434;
atomic(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
const gateRows = [
  ["identity-sha", true, "fixture-only"], ["channel-layout", true, "fixture-only"], ["campaign-disjointness", true, "fixture-only"], ["raw-event-disjointness", true, "fixture-only"], ["holdout-independence", true, "fixture-only"], ["preregistration", true, "fixture-only"], ["cross-block-independence", true, "fixture-only"], ["threshold-policy", true, "fixture-only"], ["independent-review", false, "not-run"],
] as const;
const header = "gateId,validatorPassed,authorityScope,measuredPackPresent,scienceAdmitted,scienceResponseApplications";
const lines = [header, ...gateRows.map(([id, passed, scope]) => [id, passed, scope, false, false, 0].join(","))];
atomic(paths.csv, `${lines.join("\n")}\n`);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, oracleArtifactSha256: oracle.artifactSha256, gates: artifact.view.gates, fixture: artifact.view.fixture, counts: artifact.view.counts, scienceBoundary: artifact.view.scienceBoundary, measuredPackPresent: false, scienceApplications: 0 }, null, 2));
