import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v430-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v430.json",
  v430Artifact: "dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json",
  artifact: "dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress.json",
  oracle: "dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress-oracle.json",
  contract: "dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress-contract.json",
  exportManifest: "dist/science/kerr-high-energy-likelihood-stress-v431/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v431-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v431.json",
};
const expected = Object.freeze({
  previousEvidenceCanonical: "9717bf3d26c3bd58b2b53dd013f2ae7199d20dea6c16fc432004d025950ca84e",
  previousEvidenceFile: "d79310afbd221891ec9f50424d9f0ab0e2328b0e7ac19a71cc7a544307fd4d19",
  previousPointerCanonical: "1f3c0458df3205eaa2229ebb2a0fcdf7d0e6fd94eafc763002e576582e355abf",
  previousPointerFile: "64507219eddbb2956d31e4b257bb1d075ea082f0879667e700f3a7bff18bda7e",
  v430ArtifactCanonical: "e666aa7c7d7f65dcc65e91e3e1075b60752f1996aa5d7deba6878c6b26bd7405",
  v430ArtifactFile: "18ac4d640611a6308f7a8275a755cb0d028094e6b734190d4f428065b76fe9c8",
  oracleCanonical: "55fe6c8fb0621444cd2687aa66607c394e6e15bb7c37b6ee80a2d3330f91fdd2",
  oracleFile: "bf57f621e55acf3a08676cc5412ddd99283aadf034a33bf4e37d437e449a9199",
  artifactCanonical: "291e960f25529c371f297deccdb3d436778ce905fbd29acea807887894d0c7e6",
  artifactFile: "034132d9396712924d8cf88992bbfd60c60f3d1a6fe248e69843aaf625c94400",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), v430Artifact = read(paths.v430Artifact), artifact = read(paths.artifact), oracle = read(paths.oracle), contract = read(paths.contract), exports = read(paths.exportManifest), state = read(paths.state), formal = read(paths.formal), formalEvidence = read(formal.source), view = artifact.view;
const scenarios = view?.scenarios ?? [];
if (
  previousEvidence.evidenceSha256 !== expected.previousEvidenceCanonical
  || fileSha(paths.previousEvidence) !== expected.previousEvidenceFile
  || previousPointer.pointerSha256 !== expected.previousPointerCanonical
  || fileSha(paths.previousPointer) !== expected.previousPointerFile
  || v430Artifact.artifactSha256 !== expected.v430ArtifactCanonical
  || fileSha(paths.v430Artifact) !== expected.v430ArtifactFile
  || artifact.version !== "v431-kerr-high-energy-likelihood-stress-artifact-v1"
  || artifact.artifactSha256 !== expected.artifactCanonical
  || fileSha(paths.artifact) !== expected.artifactFile
  || sha(artifact) !== artifact.artifactSha256
  || oracle.artifactSha256 !== expected.oracleCanonical
  || fileSha(paths.oracle) !== expected.oracleFile
  || oracle.status !== "qualified-simulated-likelihood-stress-discriminator-and-preregistered-routing-firewall-no-measured-authority"
  || oracle.campaign?.scenarioCount !== 6
  || oracle.counts?.syntheticCountCellCount !== 73728
  || oracle.counts.measuredObservedCountCount !== 0
  || oracle.counts.measuredHoldoutDatasetCount !== 0
  || oracle.counts.measuredResidualMetricCount !== 0
  || oracle.counts.measuredValidationRunCount !== 0
  || oracle.counts.alternativeLikelihoodImplementationQualifiedCount !== 0
  || oracle.qualification?.preregisteredRoutingFirewallQualified !== true
  || oracle.qualification.alternativeLikelihoodImplementationQualified !== false
  || oracle.qualification.measuredInstrumentPerformanceQualified !== false
  || oracle.measuredResponseAuthorityGranted !== false
  || contract.status !== "preregistered-simulated-stress-routing-contract-ready"
  || contract.selectionBasis !== "acquisition-provenance-and-preregistered-assumption-state-before-residual-fit"
  || contract.postHocLikelihoodSwitchForbidden !== true
  || contract.residualDiagnosticsMayAuditButNeverSelectFamily !== true
  || contract.alternativeLikelihoodImplementationsQualified?.length !== 0
  || contract.measuredAuthorityGranted !== false
  || scenarios.length !== 6
  || scenarios.filter((entry) => entry.expectedPoissonDisposition === "retain").length !== 1
  || scenarios.filter((entry) => entry.expectedPoissonDisposition === "reject-before-fit").length !== 5
  || scenarios.some((entry) => entry.calibrationGatePassed !== true || entry.holdoutGatePassed !== true || entry.deterministicReplayPassed !== true || entry.maximumPythonRelativeDifference >= 1e-8)
  || view.counts?.syntheticCountCellCount !== 73728
  || view.counts.measuredObservedCountCount !== 0
  || view.counts.measuredHoldoutDatasetCount !== 0
  || view.counts.measuredResidualMetricCount !== 0
  || view.counts.measuredValidationRunCount !== 0
  || view.counts.alternativeLikelihoodImplementationQualifiedCount !== 0
  || view.counts.scienceResponseApplicationCount !== 0
  || view.authorityBoundary?.stressGenerationMathAuthorityGranted !== true
  || view.authorityBoundary.discriminatorMathAuthorityGranted !== true
  || view.authorityBoundary.preregisteredRoutingFirewallAuthorityGranted !== true
  || view.authorityBoundary.alternativeLikelihoodImplementationAuthorityGranted !== false
  || view.authorityBoundary.fixturePerformanceAuthorityGranted !== false
  || view.authorityBoundary.measuredLikelihoodAuthorityGranted !== false
  || view.authorityBoundary.measuredInstrumentPerformanceAuthorityGranted !== false
  || view.authorityBoundary.measuredResponseAuthorityGranted !== false
  || view.authorityBoundary.scienceProjectionAuthorityGranted !== false
  || exports.version !== "v431-kerr-high-energy-likelihood-stress-export-manifest-v1"
  || exports.artifactSha256 !== artifact.artifactSha256
  || exports.scenarioCount !== 6
  || exports.syntheticCountCellCount !== 73728
  || exports.measuredObservedCountCount !== 0
  || exports.measuredValidationRunCount !== 0
  || exports.alternativeLikelihoodImplementationQualifiedCount !== 0
  || exports.measuredResponseAuthority !== "unavailable"
  || exports.scienceResponseApplicationCount !== 0
  || exports.denseShardExecuted !== false
  || Object.values(exports.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-high-energy-likelihood-stress-v431/${entry.path}`))
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v431-boundary");

const sourcePaths = [
  "app/lib/kerrHighEnergyLikelihoodStressV431.ts", "app/lib/kerrHighEnergyLikelihoodStressV431.test.ts", "app/lib/kerrHighEnergyLikelihoodStressServerV431.ts", "app/lib/kerrHighEnergyLikelihoodStressServerV431.test.ts", "app/lib/kerrHighEnergyLikelihoodStressClientV431.ts", "app/lib/kerrHighEnergyLikelihoodStressClientV431.test.ts", "app/lib/atlasShadowCapabilityPointerV431.ts", "app/lib/atlasShadowCapabilityPointerV431.test.ts", "app/api/atlas/relativity-evidence/v431/high-energy-likelihood-stress/route.ts", "app/api/atlas/relativity-evidence/v431/high-energy-likelihood-stress/route.test.ts", "app/components/KerrHighEnergyLikelihoodStressV431.tsx", "app/components/KerrHighEnergyLikelihoodStressV431.test.tsx", "app/components/KerrEvidenceObservatoryV405.tsx", "scripts/run-kerr-high-energy-likelihood-stress-oracle-v431.py", "scripts/test-kerr-high-energy-likelihood-stress-v431.py", "scripts/build-kerr-high-energy-likelihood-stress-v431.ts", "scripts/export-kerr-high-energy-likelihood-stress-v431.py", "scripts/build-kerr-high-energy-likelihood-stress-chain-v431.mjs", "scripts/build-shadow-candidate-v431.mjs", "scripts/reseal-shadow-evidence-chain-v431.mjs", "scripts/verify-shadow-v431-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v431-evidence-v1",
  generatedAt: artifact.generatedAt,
  status: "likelihood-stress-discriminator-and-preregistered-routing-firewall-qualified-simulated-fixture-only-alternative-likelihood-and-measured-authority-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: { v430EvidenceSha256: previousEvidence.evidenceSha256, v430PointerSha256: previousPointer.pointerSha256, v430EvidenceFileSha256: fileSha(paths.previousEvidence), v430PointerFileSha256: fileSha(paths.previousPointer), v430ArtifactSha256: v430Artifact.artifactSha256, v430ArtifactFileSha256: fileSha(paths.v430Artifact), v431ArtifactSha256: artifact.artifactSha256, v431ArtifactFileSha256: fileSha(paths.artifact), pythonOracleArtifactSha256: oracle.artifactSha256, pythonOracleFileSha256: fileSha(paths.oracle), stressContractFileSha256: fileSha(paths.contract), exportManifestFileSha256: fileSha(paths.exportManifest) },
  likelihoodStress: { status: view.status, campaign: view.campaign, selection: view.selection, scenarios: view.scenarios, counts: view.counts, products: view.products, authorityBoundary: view.authorityBoundary, exports: Object.fromEntries(Object.entries(exports.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }])) },
  qualification: { syntheticStressGenerationQualified: true, nominalPoissonRecoveryQualified: true, overdispersionDiscriminatorQualified: true, correlationDiscriminatorQualified: true, backgroundMixtureDiscriminatorQualified: true, deadTimeDiscriminatorQualified: true, pileupMigrationDiscriminatorQualified: true, preregisteredRoutingFirewallQualified: true, deterministicReplayQualified: true, alternativeLikelihoodImplementationQualifiedCount: 0, measuredObservedCountCount: 0, measuredHoldoutDatasetCount: 0, measuredResidualMetricCount: 0, measuredValidationRunCount: 0, measuredInstrumentAuthorityQualified: false, scienceResponseApplicationCount: 0, denseAuthorityQualified: false, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, holdoutCountArraysInReactState: false, covarianceInReactState: false, fullOracleDownloadAvailable: true, canvasCreated: false, postHocLikelihoodSwitch: false, alternativeLikelihoodClaim: false, fixturePerformanceClaim: false, measurementClaim: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v431-synthetic-likelihood-stress-discriminator-and-preregistered-routing-firewall-only-no-qualified-alternative-likelihood-measured-goodness-of-fit-instrument-authority-science-response-dense-browser-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v431", generatedAt: artifact.generatedAt, status: evidence.status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: { v430CountLikelihoodMath: "qualified-preserved", v431SyntheticStressGeneration: "qualified", v431NominalPoissonRecovery: "qualified", v431OverdispersionDiscriminator: "qualified", v431CorrelationDiscriminator: "qualified", v431BackgroundMixtureDiscriminator: "qualified", v431DeadTimeDiscriminator: "qualified", v431PileupMigrationDiscriminator: "qualified", v431PreregisteredRoutingFirewall: "qualified", v431AlternativeLikelihoodImplementations: "zero-qualified", v431MeasuredObservedCounts: "zero", v431MeasuredHoldoutDatasets: "zero", v431MeasuredResidualMetrics: "zero", v431MeasuredValidationRuns: "zero", v431MeasuredInstrumentAuthority: "unavailable", v431ScienceResponseApplications: "zero", v431BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, scenarios: view.scenarios.map((entry) => ({ id: entry.id, disposition: entry.expectedPoissonDisposition, family: entry.requiredLikelihoodFamily, coverage90: entry.holdoutMetrics.poissonPredictiveCoverage90, varianceRatio: entry.holdoutMetrics.meanVarianceToPoissonRatio })), counts: view.counts, alternativeLikelihoods: pointer.capabilities.v431AlternativeLikelihoodImplementations, measuredAuthority: pointer.capabilities.v431MeasuredInstrumentAuthority, browser: pointer.capabilities.v431BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
