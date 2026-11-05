import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_HIGH_ENERGY_RESPONSE_INTAKE_ARTIFACT_VERSION_V428,
  KERR_V427_ARTIFACT_FILE_SHA256_V428,
  KERR_V427_ARTIFACT_SHA256_V428,
  KERR_V427_EVIDENCE_FILE_SHA256_V428,
  KERR_V427_EVIDENCE_SHA256_V428,
  KERR_V427_POINTER_FILE_SHA256_V428,
  KERR_V427_POINTER_SHA256_V428,
  canonicalShaV428,
  compileKerrHighEnergyResponseIntakeV428,
  parseKerrHighEnergyResponseIntakeArtifactV428,
  type KerrHighEnergyResponseIntakeArtifactV428,
  type KerrHighEnergyResponseSubmissionSchemaV428,
} from "../app/lib/kerrHighEnergyResponseIntakeV428";
import type { KerrHighEnergyResponseAcquisitionSubmissionV427 } from "../app/lib/kerrHighEnergyResponseAcquisitionPackV427";

const root = process.cwd();
const outputRoot = "dist/science/kerr-high-energy-response-intake-v428";
const paths = {
  v427Artifact: "dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json",
  v427Evidence: "dist/science/orbit-atlas-shadow-v427-evidence.json",
  v427Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v427.json",
  report: `${outputRoot}/fixture-intake-report.json`,
  normalized: `${outputRoot}/normalized-fixture-submission.json`,
  schema: `${outputRoot}/response-submission-schema.json`,
  artifact: `${outputRoot}/intake-firewall.json`,
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>;
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
function atomic(path: string, value: unknown): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, target);
}

const v427Artifact = read(paths.v427Artifact);
const v427Evidence = read(paths.v427Evidence);
const v427Pointer = read(paths.v427Pointer);
if (
  fileSha(paths.v427Artifact) !== KERR_V427_ARTIFACT_FILE_SHA256_V428 ||
  v427Artifact.artifactSha256 !== KERR_V427_ARTIFACT_SHA256_V428 ||
  fileSha(paths.v427Evidence) !== KERR_V427_EVIDENCE_FILE_SHA256_V428 ||
  v427Evidence.evidenceSha256 !== KERR_V427_EVIDENCE_SHA256_V428 ||
  fileSha(paths.v427Pointer) !== KERR_V427_POINTER_FILE_SHA256_V428 ||
  v427Pointer.pointerSha256 !== KERR_V427_POINTER_SHA256_V428
) throw new Error("v428-v427-source-lock");
const report = read(paths.report);
const normalized = read(paths.normalized) as KerrHighEnergyResponseAcquisitionSubmissionV427;
const schema = read(paths.schema) as KerrHighEnergyResponseSubmissionSchemaV428;
const view = compileKerrHighEnergyResponseIntakeV428(report, normalized, schema, fileSha(paths.normalized));
const unsigned = {
  version: KERR_HIGH_ENERGY_RESPONSE_INTAKE_ARTIFACT_VERSION_V428,
  generatedAt: String(v427Artifact.generatedAt),
  status: view.status,
  sourceFiles: Object.freeze({
    v427ArtifactFileSha256: KERR_V427_ARTIFACT_FILE_SHA256_V428,
    v427EvidenceFileSha256: KERR_V427_EVIDENCE_FILE_SHA256_V428,
    v427PointerFileSha256: KERR_V427_POINTER_FILE_SHA256_V428,
    pythonFixtureReportFileSha256: fileSha(paths.report),
    normalizedFixtureFileSha256: fileSha(paths.normalized),
    submissionSchemaFileSha256: fileSha(paths.schema),
  }),
  view,
  deterministicReplay: true as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  measuredSubmissionPresent: false as const,
  measuredImportAttempted: false as const,
  measuredDataRowCount: 0 as const,
  scienceResponseApplicationCount: 0 as const,
  artifactSha256: "pending",
};
const artifact = parseKerrHighEnergyResponseIntakeArtifactV428({ ...unsigned, artifactSha256: canonicalShaV428(unsigned) }) as KerrHighEnergyResponseIntakeArtifactV428;
atomic(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, limits: artifact.view.limits, fixtureRows: artifact.view.counts.fixtureDataRowCount, mutationsRejected: `${artifact.view.fixture.rejectedMutationCount}/${artifact.view.fixture.mutationCount}`, pythonTypeScriptMaximumDifference: artifact.view.fixture.pythonTypeScriptMaximumDifference, measuredSubmissionCount: 0, measuredImportAttemptCount: 0, measuredAuthority: false, scienceApplications: 0 }, null, 2));
