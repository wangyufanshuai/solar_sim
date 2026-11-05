import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v394-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v394.json",
  artifact: "dist/science/kerr-global-observability-v395/observability.json",
  oracle: "dist/science/kerr-global-observability-v395/python-oracle.json",
  sourceDossier: "dist/staging/measured-authority-v382-visible/manifest.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v395-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v395.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const oracle = read(paths.oracle);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence)
  || previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256
  || previousPointer.capabilities?.v394InputCovariance !== "qualified-36x36-1296-coefficients"
  || previousPointer.capabilities?.v394PhysicalGlobalCovariance !== "unavailable"
  || artifact.version !== "v395-kerr-global-observability-v1"
  || artifact.status !== "global-jacobian-observability-qualified-physical-mode-attribution-unavailable"
  || sha(artifact) !== artifact.artifactSha256
  || artifact.source?.v394GlobalCovarianceArtifactSha256 !== previousEvidence.dependency?.globalPropagationArtifactSha256
  || artifact.dimensions?.rank !== 24 || artifact.dimensions?.nullity !== 12
  || artifact.dimensions?.pseudoinverseCoefficientCount !== 864
  || artifact.structure?.blockCount !== 12 || artifact.structure?.pageThorneFluxInNullDirection !== false
  || artifact.validator?.qualified !== true || artifact.validator?.rejectedAdversarialFixtureCount !== 8
  || artifact.validator?.adversarialFixtures?.length !== 8
  || artifact.validator.adversarialFixtures.some((fixture) => fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason)
  || Math.max(...Object.values(artifact.residuals ?? {}).filter((value) => typeof value === "number")) >= 2e-12
  || artifact.syntheticModeAudit?.publishable !== false || artifact.syntheticModeAudit?.modeCount !== 3
  || artifact.syntheticModeAudit?.modes?.some((mode) => mode.physicalAttributionAllowed !== false)
  || artifact.productionAdmission?.physicalNuisanceModesAvailable !== false
  || artifact.productionAdmission?.physicalModeAttributionExecuted !== false
  || artifact.productionAdmission?.nullspacePriorAssigned !== false
  || artifact.productionAdmission?.unobservableDirectionsTreatedAsZero !== false
  || artifact.productionAdmission?.probabilityContentAssigned !== false
  || artifact.qualification?.structuralObservabilityQualified !== true
  || artifact.qualification?.physicalModeAttributionQualified !== false
  || oracle.status !== "qualified-independent-global-observability-oracle"
  || oracle.rank !== 24 || oracle.nullity !== 12
  || oracle.physicalNuisanceModesAvailable !== false || oracle.physicalModeAttributionExecuted !== false
  || existsSync(resolve(root, paths.sourceDossier)) || existsSync(resolve(root, paths.envelope))
  || existsSync(resolve(root, paths.imageJson)) || existsSync(resolve(root, paths.imageCsv))
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0
  || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v395-boundary");

const sourcePaths = [
  "app/lib/kerrGlobalObservabilityV395.ts", "app/lib/kerrGlobalObservabilityV395.test.ts",
  "scripts/run-kerr-global-observability-oracle-v395.py", "scripts/build-kerr-global-observability-v395.ts",
  "app/lib/kerrGlobalObservabilityServerV395.ts", "app/lib/kerrGlobalObservabilityServerV395.test.ts",
  "app/api/atlas/relativity-evidence/v395/observability/route.ts", "app/api/atlas/relativity-evidence/v395/observability/route.test.ts",
  "app/components/KerrNullspaceObservatoryV395.tsx", "app/components/KerrNullspaceObservatoryV395.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/lib/atlasShadowCapabilityPointerV395.ts",
  "app/lib/atlasShadowCapabilityPointerV395.test.ts", "scripts/build-shadow-candidate-v395.mjs",
  "scripts/reseal-shadow-evidence-chain-v395.mjs", "scripts/verify-shadow-v395-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v395-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "global-observability-v395-qualified-physical-mode-attribution-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v394EvidenceSha256: previousEvidence.evidenceSha256,
    v394PointerSha256: previousPointer.pointerSha256,
    observabilityArtifactSha256: artifact.artifactSha256,
    observabilityFileSha256: fileSha(paths.artifact),
    pythonOracleArtifactSha256: oracle.artifactSha256,
    pythonOracleFileSha256: fileSha(paths.oracle),
    v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256,
    v394GlobalCovarianceArtifactSha256: artifact.source.v394GlobalCovarianceArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  observability: {
    inputDimension: artifact.dimensions.inputDimension, outputDimension: artifact.dimensions.outputDimension,
    rank: artifact.dimensions.rank, nullity: artifact.dimensions.nullity,
    maximumConditionNumber: artifact.structure.maximumConditionNumber,
    nullMeaning: artifact.structure.nullMeaning,
    rejectedAdversarialFixtureCount: artifact.validator.rejectedAdversarialFixtureCount,
    maximumResidual: Math.max(artifact.residuals.maximumNullResidual, artifact.residuals.maximumNullOrthonormalityResidual, artifact.residuals.maximumPenroseResidual, artifact.residuals.maximumProjectorResidual, artifact.residuals.maximumProjectorComplementResidual),
    maximumPythonOracleRelativeDifference: artifact.residuals.maximumPythonOracleRelativeDifference,
  },
  authorityBoundary: {
    structuralObservabilityQualified: true, analyticPseudoinverseQualified: true, nullspaceBasisQualified: true,
    syntheticModeAuditPublishable: false, physicalNuisanceModesAvailable: false,
    physicalModeAttributionExecuted: false, nullspacePriorAssigned: false,
    unobservableDirectionsTreatedAsZero: false, probabilityContentAssigned: false,
    confidenceInterval: false, absoluteScientificIntervalQualified: false,
    sciencePayloadMutationAllowed: false, cinematicConsumerAllowed: false,
  },
  runtime: { profile: "science-cinematic-v11-v377", consumer: "KerrNullspaceObservatoryV395", endpoint: "/api/atlas/relativity-evidence/v395/observability", responseMaximumBytes: 128 * 1024, noStore: true, localShadowOnly: true, defaultApplied: false, legacyV9Default: true },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  networkAttempted: false, automaticRetryApplied: false, browserQualification: "not-run",
  sourceManifest, sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  releaseBoundary: "structural-observability-only-never-nullspace-as-prior-unobservable-as-zero-synthetic-mode-as-physical-probability-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v395", generatedAt: new Date().toISOString(), status: evidence.status,
  formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true,
  capabilities: {
    v394GlobalCovariance: "qualified-infrastructure-physical-model-unavailable",
    v395JacobianRank: "qualified-rank-24", v395Nullspace: "qualified-nullity-12",
    v395Pseudoinverse: "qualified-analytic-36x24", v395Projectors: "qualified-observable-plus-null-equals-identity",
    v395Validator: "qualified-8-of-8-adversarial-rejections", v395PhysicalModeAttribution: "unavailable",
    v395NullspacePrior: "not-assigned", v395RuntimeConsumer: "v11-nullspace-observatory-wired",
    v395PromotionBoundary: "structural-observability-only-zero-physical-modes-zero-prior-zero-probability",
    v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, rank: pointer.capabilities.v395JacobianRank, nullspace: pointer.capabilities.v395Nullspace, physical: pointer.capabilities.v395PhysicalModeAttribution, dense: pointer.capabilities.v314CorrectedDense, browser: pointer.capabilities.browserQualification }, null, 2));
