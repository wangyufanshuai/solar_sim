import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v432-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v432.json",
  artifact: "dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance.json",
  oracle: "dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance-oracle.json",
  contract: "dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance-contract.json",
  boundary: "dist/science/kerr-high-energy-joint-nuisance-v433/science-boundary.json",
  exportManifest: "dist/science/kerr-high-energy-joint-nuisance-v433/export-manifest.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v433-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v433.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence), previousPointer = read(paths.previousPointer), artifact = read(paths.artifact), oracle = read(paths.oracle), contract = read(paths.contract), boundary = read(paths.boundary), exportsManifest = read(paths.exportManifest), state = read(paths.state), formal = read(paths.formal), formalEvidence = read(formal.source);
if (previousEvidence.evidenceSha256 !== "0490b3b26707d4fbc1643fede113271cb808b2fe6a94ed7f660edf9e7000687b" || fileSha(paths.previousEvidence) !== "70e861c3afce923a1506ea053c4ddd7500cefca8d8ede7410116ad86d18c4e31" || previousPointer.pointerSha256 !== "a0c7cb31bed6520d5ddd9a05a376a32a3430b20b93b0248009659c74d6570e1d" || fileSha(paths.previousPointer) !== "4258d1ce98f1a70aa9bc079fed4e297e5dde98e279613468f279fcc4a57b3530" || sha(artifact) !== artifact.artifactSha256 || artifact.artifactSha256 !== exportsManifest.artifactSha256 || oracle.artifactSha256 !== artifact.pythonOracleArtifactSha256 || contract.scienceAdmission?.currentStatus !== "not-admitted-no-measured-response-or-likelihood-authority" || boundary.status !== "implemented-not-admitted" || boundary.admitted !== false || artifact.view?.families?.length !== 2 || artifact.view?.counts?.covarianceDimension !== 24 || artifact.view?.counts?.monteCarloDrawCount !== 16384 || artifact.view?.counts?.scienceResponseApplicationCount !== 0 || artifact.view?.authorityBoundary?.scienceAdmissionGranted !== false || artifact.view?.authorityBoundary?.measuredCrossBlockIndependenceAuthorityGranted !== false || exportsManifest.scienceBoundaryStatus !== "implemented-not-admitted" || exportsManifest.measuredResponseAuthority !== "unavailable" || exportsManifest.measuredLikelihoodAuthority !== "unavailable" || exportsManifest.scienceResponseApplicationCount !== 0 || Object.values(exportsManifest.exports ?? {}).some((entry) => entry.sha256 !== fileSha(`dist/science/kerr-high-energy-joint-nuisance-v433/${entry.path}`)) || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false || formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v433-boundary");

const sourcePaths = [
  "app/lib/kerrHighEnergyJointNuisanceV433.ts", "app/lib/kerrHighEnergyJointNuisanceV433.test.ts",
  "app/lib/kerrHighEnergyJointNuisanceServerV433.ts", "app/lib/kerrHighEnergyJointNuisanceServerV433.test.ts",
  "app/lib/kerrHighEnergyJointNuisanceClientV433.ts", "app/lib/kerrHighEnergyJointNuisanceClientV433.test.ts",
  "app/lib/atlasShadowCapabilityPointerV433.ts", "app/lib/atlasShadowCapabilityPointerV433.test.ts",
  "app/api/atlas/relativity-evidence/v433/high-energy-joint-nuisance/route.ts", "app/api/atlas/relativity-evidence/v433/high-energy-joint-nuisance/route.test.ts",
  "app/components/KerrHighEnergyJointNuisanceV433.tsx", "app/components/KerrHighEnergyJointNuisanceV433.test.tsx",
  "app/components/KerrEvidenceObservatoryV405.tsx",
  "scripts/run-kerr-high-energy-joint-nuisance-oracle-v433.py", "scripts/test-kerr-high-energy-joint-nuisance-v433.py",
  "scripts/build-kerr-high-energy-joint-nuisance-v433.ts", "scripts/export-kerr-high-energy-joint-nuisance-v433.py",
  "scripts/build-kerr-high-energy-joint-nuisance-chain-v433.mjs", "scripts/build-shadow-candidate-v433.mjs",
  "scripts/reseal-shadow-evidence-chain-v433.mjs", "scripts/verify-shadow-v433-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const exportsSummary = Object.fromEntries(Object.entries(exportsManifest.exports).map(([id, entry]) => [id, { fileSha256: entry.sha256, semantic: entry.semantic }]));
const status = "joint-nuisance-covariance-qualified-synthetic-only-science-boundary-implemented-not-admitted-browser-pending-dense-incomplete-0-of-49";
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v433-evidence-v1", generatedAt: artifact.generatedAt, status,
  dependency: { v432EvidenceSha256: previousEvidence.evidenceSha256, v432PointerSha256: previousPointer.pointerSha256, v432EvidenceFileSha256: fileSha(paths.previousEvidence), v432PointerFileSha256: fileSha(paths.previousPointer), v433ArtifactSha256: artifact.artifactSha256, v433ArtifactFileSha256: fileSha(paths.artifact), pythonOracleArtifactSha256: oracle.artifactSha256, pythonOracleFileSha256: fileSha(paths.oracle), nuisanceContractFileSha256: fileSha(paths.contract), scienceBoundaryFileSha256: fileSha(paths.boundary), exportManifestFileSha256: fileSha(paths.exportManifest) },
  jointNuisance: { status: artifact.view.status, model: artifact.view.model, families: artifact.view.families, counts: artifact.view.counts, products: artifact.view.products, authorityBoundary: artifact.view.authorityBoundary, scienceBoundary: artifact.scienceBoundary, exports: exportsSummary },
  qualification: { jointNuisanceAnalyticMathQualified: true, responseDecompositionQualified: true, negativeBinomialJointCovarianceQualified: true, poissonLognormalJointCovarianceQualified: true, monteCarloCrossValidationQualified: true, syntheticFactorizationQualified: true, measuredCrossBlockIndependenceQualified: false, measuredResponseAuthorityQualified: false, measuredLikelihoodAuthorityQualified: false, scienceAdmissionQualified: false, scienceResponseApplicationCount: 0, denseAuthorityQualified: false, browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  runtimeIntegration: { v13EvidenceObservatory: true, summaryOnlyInReactState: true, fullCovarianceInReactState: false, fullOracleDownloadAvailable: true, immutableScienceBoundaryDownloadAvailable: true, canvasCreated: false, fixturePerformanceClaim: false, measurementClaim: false, scienceAdmissionClaim: false },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: 0, plannedShardCount: state.plannedShardCount, attemptConsumed: false, aggregateAvailable: false, stateSha256: state.stateSha256 },
  sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, ordinaryStandaloneProfile: "legacy-v9", liteProfile: "legacy-v9", localShadowDefaultProfile: "legacy-v9", localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "v433-synthetic-joint-response-redistribution-and-likelihood-nuisance-covariance-only-science-boundary-implemented-not-admitted-no-measured-cross-block-response-likelihood-holdout-dense-browser-or-product-authority",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = { version: "orbit-atlas-current-local-shadow-candidate-v433", generatedAt: artifact.generatedAt, status, formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true, capabilities: { v432AlternativeLikelihoodAuthority: "qualified-preserved", v433JointNuisanceAnalyticMath: "qualified-synthetic-only", v433NegativeBinomialJointCovariance: "qualified-synthetic-only", v433PoissonLognormalJointCovariance: "qualified-synthetic-only", v433MonteCarloCrossValidation: "qualified-synthetic-only", v433SyntheticFactorization: "qualified-synthetic-only", v433MeasuredCrossBlockIndependence: "unavailable", v433MeasuredResponseAuthority: "unavailable", v433MeasuredLikelihoodAuthority: "unavailable", v433ScienceBoundary: "implemented-not-admitted", v433ScienceResponseApplications: "zero", v433BrowserQualification: "not-run", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable" }, evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 } };
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, artifactSha256: artifact.artifactSha256, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, families: artifact.view.families.map((family) => ({ family: family.family, jointTrace: family.traceBudget.joint, minimumEigenvalue: family.metrics.jointMinimumEigenvalue, conditionNumber: family.metrics.jointConditionNumber, monteCarloDifference: family.monteCarlo.metrics.relativeFrobeniusCovarianceDifference })), counts: artifact.view.counts, scienceBoundary: pointer.capabilities.v433ScienceBoundary, measuredResponse: pointer.capabilities.v433MeasuredResponseAuthority, measuredLikelihood: pointer.capabilities.v433MeasuredLikelihoodAuthority, scienceApplications: pointer.capabilities.v433ScienceResponseApplications, browser: pointer.capabilities.v433BrowserQualification, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
