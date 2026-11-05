import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_ARTIFACT_VERSION_V431,
  KERR_V430_ARTIFACT_FILE_SHA256_V431,
  KERR_V430_ARTIFACT_SHA256_V431,
  KERR_V430_EVIDENCE_FILE_SHA256_V431,
  KERR_V430_EVIDENCE_SHA256_V431,
  KERR_V430_ORACLE_FILE_SHA256_V431,
  KERR_V430_ORACLE_SHA256_V431,
  KERR_V430_POINTER_FILE_SHA256_V431,
  KERR_V430_POINTER_SHA256_V431,
  canonicalShaV431,
  createKerrHighEnergyLikelihoodStressViewV431,
  parseKerrHighEnergyLikelihoodStressArtifactV431,
  parseKerrHighEnergyLikelihoodStressOracleV431,
  type KerrHighEnergyLikelihoodStressArtifactV431,
  type KerrHighEnergyLikelihoodStressContractV431,
} from "../app/lib/kerrHighEnergyLikelihoodStressV431";

const root = process.cwd();
const outputRoot = "dist/science/kerr-high-energy-likelihood-stress-v431";
const paths = {
  v430: "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json",
  v430Oracle: "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood-oracle.json",
  v430Evidence: "dist/science/orbit-atlas-shadow-v430-evidence.json",
  v430Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v430.json",
  oracle: `${outputRoot}/likelihood-stress-oracle.json`,
  contract: `${outputRoot}/likelihood-stress-contract.json`,
  artifact: `${outputRoot}/likelihood-stress.json`,
  csv: `${outputRoot}/likelihood-stress-scenarios.csv`,
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as Record<string, unknown>;
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const atomic = (path: string, value: string) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, value, "utf8"); renameSync(temporary, target); };
const v430 = read(paths.v430), v430Oracle = read(paths.v430Oracle), v430Evidence = read(paths.v430Evidence), v430Pointer = read(paths.v430Pointer);
if (fileSha(paths.v430) !== KERR_V430_ARTIFACT_FILE_SHA256_V431 || v430.artifactSha256 !== KERR_V430_ARTIFACT_SHA256_V431 || fileSha(paths.v430Oracle) !== KERR_V430_ORACLE_FILE_SHA256_V431 || v430Oracle.artifactSha256 !== KERR_V430_ORACLE_SHA256_V431 || fileSha(paths.v430Evidence) !== KERR_V430_EVIDENCE_FILE_SHA256_V431 || v430Evidence.evidenceSha256 !== KERR_V430_EVIDENCE_SHA256_V431 || fileSha(paths.v430Pointer) !== KERR_V430_POINTER_FILE_SHA256_V431 || v430Pointer.pointerSha256 !== KERR_V430_POINTER_SHA256_V431) throw new Error("v431-source-lock");
const oracle = parseKerrHighEnergyLikelihoodStressOracleV431(read(paths.oracle));
const contract = read(paths.contract) as KerrHighEnergyLikelihoodStressContractV431;
const view = createKerrHighEnergyLikelihoodStressViewV431(oracle, contract);
const unsigned = {
  version: KERR_HIGH_ENERGY_LIKELIHOOD_STRESS_ARTIFACT_VERSION_V431,
  generatedAt: String(v430.generatedAt),
  status: view.status,
  sourceFiles: Object.freeze({ v430ArtifactFileSha256: KERR_V430_ARTIFACT_FILE_SHA256_V431, v430OracleFileSha256: KERR_V430_ORACLE_FILE_SHA256_V431, v430EvidenceFileSha256: KERR_V430_EVIDENCE_FILE_SHA256_V431, v430PointerFileSha256: KERR_V430_POINTER_FILE_SHA256_V431, pythonOracleFileSha256: fileSha(paths.oracle), stressContractFileSha256: fileSha(paths.contract) }),
  pythonOracleArtifactSha256: oracle.artifactSha256,
  view,
  deterministicReplay: true as const,
  networkAttempted: false as const,
  denseShardExecuted: false as const,
  measuredObservedCountsPresent: false as const,
  measuredHoldoutPresent: false as const,
  measuredValidationRunCount: 0 as const,
  scienceResponseApplicationCount: 0 as const,
  artifactSha256: "pending",
};
const artifact = parseKerrHighEnergyLikelihoodStressArtifactV431({ ...unsigned, artifactSha256: canonicalShaV431(unsigned) }) as KerrHighEnergyLikelihoodStressArtifactV431;
atomic(paths.artifact, `${JSON.stringify(artifact, null, 2)}\n`);
const header = "scenarioId,stressKind,poissonAdmissibleByProvenance,requiredLikelihoodFamily,expectedPoissonDisposition,holdoutReplicates,meanPoissonDeviancePerDof,meanPearsonChiSquarePerDof,meanVarianceToPoissonRatio,meanAbsoluteOffDiagonalResidualCorrelation,poissonPredictiveCoverage90,maximumAbsoluteStandardizedMeanBias,angleClosureRmsZ,channelClosureRmsZ,maximumAbsoluteMeanChannelClosureZ,maximumPythonRelativeDifference,measuredAuthority,alternativeLikelihoodImplementationAuthority,sourceKind";
const lines = [header, ...view.scenarios.map((scenario) => [scenario.id, scenario.stressKind, scenario.poissonAdmissibleByProvenance, scenario.requiredLikelihoodFamily, scenario.expectedPoissonDisposition, scenario.holdoutMetrics.replicateCount, scenario.holdoutMetrics.meanPoissonDeviancePerDof, scenario.holdoutMetrics.meanPearsonChiSquarePerDof, scenario.holdoutMetrics.meanVarianceToPoissonRatio, scenario.holdoutMetrics.meanAbsoluteOffDiagonalResidualCorrelation, scenario.holdoutMetrics.poissonPredictiveCoverage90, scenario.holdoutMetrics.maximumAbsoluteStandardizedMeanBias, scenario.holdoutMetrics.angleClosureRmsZ, scenario.holdoutMetrics.channelClosureRmsZ, scenario.holdoutMetrics.maximumAbsoluteMeanChannelClosureZ, scenario.maximumPythonRelativeDifference, "unavailable", "not-qualified", "fixed-seed-simulated-stress-nonpublishable"].join(","))];
atomic(paths.csv, `${lines.join("\n")}\n`);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, counts: artifact.view.counts, scenarios: artifact.view.scenarios.map((scenario) => ({ id: scenario.id, family: scenario.requiredLikelihoodFamily, disposition: scenario.expectedPoissonDisposition, coverage90: scenario.holdoutMetrics.poissonPredictiveCoverage90, varianceRatio: scenario.holdoutMetrics.meanVarianceToPoissonRatio, crossLanguageDifference: scenario.maximumPythonRelativeDifference })), measuredAuthority: false, alternativeLikelihoodImplementations: 0, scienceApplications: 0 }, null, 2));
