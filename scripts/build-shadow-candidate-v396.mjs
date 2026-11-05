import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v395-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v395.json",
  artifact: "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json",
  oracle: "dist/science/kerr-auxiliary-constraint-design-v396/python-oracle.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v396-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v396.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

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
  || previousPointer.capabilities?.v395JacobianRank !== "qualified-rank-24"
  || previousPointer.capabilities?.v395Nullspace !== "qualified-nullity-12"
  || previousPointer.capabilities?.v314CorrectedDense !== "incomplete-0-of-49"
  || artifact.version !== "v396-kerr-auxiliary-constraint-design-v1"
  || artifact.status !== "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable"
  || sha(artifact) !== artifact.artifactSha256
  || artifact.design?.strategyCount !== 5
  || artifact.design?.blockCount !== 12
  || artifact.design?.evaluationCount !== 60
  || artifact.design?.fullyLiftingStrategyCount !== 3
  || artifact.design?.negativeControlStrategyCount !== 2
  || artifact.design?.minimumConstraintsForFullRank !== 12
  || artifact.design?.baselineRank !== 24
  || artifact.design?.fullRank !== 36
  || artifact.design?.strategies?.length !== 5
  || artifact.validator?.qualified !== true
  || artifact.validator?.rejectedAdversarialFixtureCount !== 7
  || artifact.residuals?.maximumPythonOracleRelativeDifference >= 2e-12
  || artifact.productionAdmission?.instrumentResponseAvailable !== false
  || artifact.productionAdmission?.physicalNoiseCovarianceAvailable !== false
  || artifact.productionAdmission?.auxiliaryMeasurementDataAvailable !== false
  || artifact.productionAdmission?.physicalConstraintSelectionExecuted !== false
  || artifact.productionAdmission?.structuralCandidatePromotedToRecommendation !== false
  || artifact.productionAdmission?.fisherInformationClaimed !== false
  || artifact.productionAdmission?.posteriorClaimed !== false
  || artifact.productionAdmission?.probabilityContentAssigned !== false
  || artifact.qualification?.structuralConstraintDesignQualified !== true
  || artifact.qualification?.instrumentFeasibilityQualified !== false
  || artifact.qualification?.physicalMeasurementRecommendationQualified !== false
  || artifact.networkAttempted !== false
  || artifact.sciencePayloadMutationAllowed !== false
  || artifact.cinematicConsumerAllowed !== false
  || oracle.status !== "qualified-independent-auxiliary-constraint-oracle"
  || oracle.evaluationCount !== 60
  || oracle.rankLiftingEvaluationCount !== 36
  || oracle.minimumConstraintsForFullRank !== 12
  || oracle.instrumentFeasibilityAvailable !== false
  || state.status !== "incomplete-0-of-49"
  || state.completedShardCount !== 0
  || state.attemptConsumed !== false
  || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn"
  || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied"
  || formalEvidence.contracts?.eihOnePnMutation !== "not-applied"
  || formalEvidence.contracts?.singleCanvas !== true
  || formalEvidence.contracts?.legacyRootAttributes !== 603
  || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v396-boundary");

const sourcePaths = [
  "app/lib/kerrAuxiliaryConstraintDesignV396.ts",
  "app/lib/kerrAuxiliaryConstraintDesignV396.test.ts",
  "app/lib/kerrAuxiliaryConstraintDesignServerV396.ts",
  "app/lib/kerrAuxiliaryConstraintDesignServerV396.test.ts",
  "app/lib/atlasShadowCapabilityPointerV396.ts",
  "app/lib/atlasShadowCapabilityPointerV396.test.ts",
  "app/api/atlas/relativity-evidence/v396/constraint-design/route.ts",
  "app/api/atlas/relativity-evidence/v396/constraint-design/route.test.ts",
  "app/components/KerrConstraintForgeV396.tsx",
  "app/components/KerrConstraintForgeV396.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "scripts/run-kerr-auxiliary-constraint-oracle-v396.py",
  "scripts/build-kerr-auxiliary-constraint-design-v396.ts",
  "scripts/build-shadow-candidate-v396.mjs",
  "scripts/reseal-shadow-evidence-chain-v396.mjs",
  "scripts/verify-shadow-v396-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v396-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "auxiliary-constraint-structure-qualified-instrument-feasibility-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v395EvidenceSha256: previousEvidence.evidenceSha256,
    v395PointerSha256: previousPointer.pointerSha256,
    v396DesignArtifactSha256: artifact.artifactSha256,
    v396DesignFileSha256: fileSha(paths.artifact),
    v396PythonOracleArtifactSha256: oracle.artifactSha256,
    v396PythonOracleFileSha256: fileSha(paths.oracle),
    v390TransferArtifactSha256: artifact.source.v390TransferArtifactSha256,
    v395ObservabilityArtifactSha256: artifact.source.v395ObservabilityArtifactSha256,
    fullShortAuthoritySha256: artifact.source.fullShortAuthoritySha256,
  },
  design: {
    strategyCount: artifact.design.strategyCount,
    blockCount: artifact.design.blockCount,
    evaluationCount: artifact.design.evaluationCount,
    rankLiftingEvaluationCount: artifact.design.fullyLiftingStrategyCount * artifact.design.blockCount,
    negativeControlEvaluationCount: artifact.design.negativeControlStrategyCount * artifact.design.blockCount,
    baselineRank: artifact.design.baselineRank,
    fullRank: artifact.design.fullRank,
    minimumConstraintsForFullRank: artifact.design.minimumConstraintsForFullRank,
    maximumQualifiedStructuralConditionNumber: artifact.design.maximumQualifiedStructuralConditionNumber,
    conditioningSemantics: artifact.design.conditioningSemantics,
  },
  authorityBoundary: {
    structuralConstraintDesignQualified: true,
    rankLiftCandidatesIdentified: true,
    negativeControlsQualified: true,
    instrumentResponseAvailable: false,
    physicalNoiseCovarianceAvailable: false,
    physicalConstraintSelectionExecuted: false,
    structuralCandidatePromotedToRecommendation: false,
    fisherInformationClaimed: false,
    posteriorClaimed: false,
    probabilityContentAssigned: false,
    sciencePayloadMutationAllowed: false,
    cinematicConsumerAllowed: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "KerrConstraintForgeV396",
    endpoint: "/api/atlas/relativity-evidence/v396/constraint-design",
    responseMaximumBytes: 128 * 1024,
    noStore: true,
    localShadowOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  networkAttempted: false,
  automaticRetryApplied: false,
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  releaseBoundary: "structural-constraint-design-only-never-instrument-feasibility-never-physical-recommendation-never-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v396",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v395GlobalObservability: "qualified-rank-24-nullity-12",
    v396StructuralConstraintDesign: "qualified-60-evaluations-36-lifting-24-controls",
    v396MinimumConstraintsForFullRank: "12",
    v396Conditioning: "qualified-maximum-7.382690818495658",
    v396InstrumentFeasibility: "unavailable",
    v396PhysicalRecommendation: "forbidden",
    v396RuntimeConsumer: "v11-constraint-forge-wired",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({
  status: pointer.status,
  evidenceSha256: evidence.evidenceSha256,
  pointerSha256: pointer.pointerSha256,
  evaluations: artifact.design.evaluationCount,
  rankLifting: artifact.design.fullyLiftingStrategyCount,
  minimumConstraintsForFullRank: artifact.design.minimumConstraintsForFullRank,
  maximumConditionNumber: artifact.design.maximumQualifiedStructuralConditionNumber,
  instrumentFeasibility: artifact.qualification.instrumentFeasibilityQualified,
  dense: pointer.capabilities.v314CorrectedDense,
  browser: pointer.capabilities.browserQualification,
}, null, 2));
