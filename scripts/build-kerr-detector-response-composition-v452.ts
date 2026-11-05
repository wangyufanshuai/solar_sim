import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalPayloadV452,
  computeKerrDetectorResponseCompositionV452,
  parseKerrDetectorResponseCompositionArtifactV452,
  type KerrDetectorResponseCompositionInputV452,
  type KerrDetectorResponseCompositionResultV452,
} from "../app/lib/kerrDetectorResponseCompositionV452";

const root = process.cwd();
const paths = {
  admission: "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
  fixture: "dist/science/kerr-detector-response-composition-v452/typescript-fixture.json",
  oracle: "dist/science/kerr-detector-response-composition-v452/python-oracle.json",
  v447: "dist/science/kerr-detector-electron-kernel-v447/electron-kernel-qualification.json",
  v449: "dist/science/kerr-detector-poisson-gaussian-v449/likelihood-qualification.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-detector-response-composition-v452/response-composition-qualification.json",
};
const read = (path: string): Record<string, unknown> => JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;
const sha = (value: unknown): string => createHash("sha256").update(canonicalPayloadV452(value)).digest("hex");
const relative = (left: number, right: number): number => Math.abs(left - right) / Math.max(Number.MIN_VALUE, Math.abs(left), Math.abs(right));
const admission = read(paths.admission);
const fixture = read(paths.fixture);
const oracle = read(paths.oracle);
const v447 = read(paths.v447);
const v449 = read(paths.v449);
const state = read(paths.state);
const formal = read(paths.formal);
const formalSource = read(String(formal.source));
const admissionQualification = admission.qualification as Record<string, unknown>;
const admissionBoundary = admission.boundary as Record<string, unknown>;
const formalScience = formalSource.science as Record<string, unknown>;
const formalContracts = formalSource.contracts as Record<string, unknown>;
if (
  admission.status !== "blocked-v443-detector-inputs-missing" ||
  admissionQualification.measuredDetectorAuthorityGranted !== false ||
  admissionBoundary.fixtureExpectedElectronsMayBeJoined !== true ||
  fixture.status !== "test-fixture-only-no-measured-authority" ||
  !Array.isArray(fixture.rows) || fixture.rows.length !== 4 || !Array.isArray(fixture.results) || fixture.results.length !== 4 ||
  oracle.status !== "qualified-50-digit-decimal-response-composition-fixture-only" || oracle.precisionDigits !== 50 || !Array.isArray(oracle.rows) || oracle.rows.length !== 4 ||
  v447.status !== "qualified-unit-strict-electron-expectation-kernel-fixture-only-measured-authority-unavailable" ||
  v449.status !== "qualified-exact-poisson-gaussian-reference-fixture-only-normal-approximation-diagnostic" ||
  state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalScience.defaultKernel !== "legacy-eih-1pn" || formalContracts.singleCanvas !== true || formalContracts.legacyRootAttributes !== 603 || formalContracts.evidenceLedgerClaims !== 84
) throw new Error("v452-source-boundary");
const rows = fixture.rows as KerrDetectorResponseCompositionInputV452[];
const replay = rows.map(computeKerrDetectorResponseCompositionV452);
if (sha(replay) !== sha(fixture.results)) throw new Error("v452-typescript-replay");
type OracleRow = { fixtureId: string; sourceExpectedElectrons: number; totalExpectedElectrons: number; expectedAduDiagnostic: number; };
let oracleSourceRelative = 0; let oracleTotalRelative = 0; let oracleAduRelative = 0;
for (const row of replay) {
  const other = (oracle.rows as OracleRow[]).find((entry) => entry.fixtureId === row.fixtureId);
  if (!other) throw new Error(`v452-oracle-row:${row.fixtureId}`);
  oracleSourceRelative = Math.max(oracleSourceRelative, relative(row.sourceExpectedElectrons, other.sourceExpectedElectrons));
  oracleTotalRelative = Math.max(oracleTotalRelative, relative(row.totalExpectedElectrons, other.totalExpectedElectrons));
  oracleAduRelative = Math.max(oracleAduRelative, relative(row.expectedAduDiagnostic, other.expectedAduDiagnostic));
}
if (Math.max(oracleSourceRelative, oracleTotalRelative, oracleAduRelative) >= 1e-12) throw new Error("v452-python-oracle");
const typedRows = replay as KerrDetectorResponseCompositionResultV452[];
const conservationRelative = Math.max(...typedRows.map((row) => {
  const separated = row.sourceExpectedElectrons + row.backgroundExpectedElectrons + row.darkExpectedElectrons;
  return Math.abs(row.totalExpectedElectrons - separated) / Math.max(Number.MIN_VALUE, row.totalExpectedElectrons);
}));
const unsigned = {
  version: "v452-kerr-detector-response-composition-artifact-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "qualified-unit-response-composition-fixture-only-measured-authority-unavailable",
  source: { v451AdmissionArtifactSha256: String(admission.artifactSha256), v447ArtifactSha256: String(v447.artifactSha256), v449ArtifactSha256: String(v449.artifactSha256) },
  rows: typedRows,
  counts: { fixtureRowCount: 4, includesQeRows: typedRows.filter((row) => row.semantics === "throughput-includes-detector-qe").length, excludesQeRows: typedRows.filter((row) => row.semantics === "throughput-excludes-detector-qe").length, measuredRowCount: 0, observedCountRowCount: 0, scienceRasterRowCount: 0 },
  maxima: { oracleSourceRelative, oracleTotalRelative, oracleAduRelative, conservationRelative, limit: 1e-12 as const, qualified: true as const },
  semanticContract: { collectingAreaExcludesThroughput: true, throughputNotDoubleApplied: true, qeModeExplicit: true, gainExcludedFromElectronExpectation: true, backgroundAndDarkSeparated: true, normalLikelihoodAuthorityNotGranted: true },
  qualification: { unitResponseCompositionQualified: true, pythonDecimalOracleQualified: true, deterministicReplayQualified: true, throughputModeBoundaryQualified: true, gainBoundaryQualified: true, measuredDetectorAuthorityGranted: false, observedCountsAvailable: false, scienceRasterAllowed: false, browserQualification: "not-run" as const },
  boundary: { v451AdmissionStatus: "blocked-v443-detector-inputs-missing" as const, fixtureJoinAllowed: true, measuredProjectionAllowed: false, expectedAduAuthority: false, scienceImageMaterializationAllowed: false, networkAttempted: false, automaticRetryApplied: false },
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
};
const artifact = parseKerrDetectorResponseCompositionArtifactV452({ ...unsigned, artifactSha256: sha(unsigned) });
const target = resolve(root, paths.output); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(artifact, null, 2)}\n`, "utf8"); renameSync(part, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, fixtureRows: 4, includesQeRows: artifact.counts.includesQeRows, excludesQeRows: artifact.counts.excludesQeRows, maximumOracleRelative: Math.max(oracleSourceRelative, oracleTotalRelative, oracleAduRelative), expectedAduAuthority: false, measuredDetectorAuthority: false, scienceRasterRows: 0 }, null, 2));
