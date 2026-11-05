import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v362-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v362.json",
  plan: "dist/science/kerr-detector-calibration-plan-v363/plan.json",
  replay: "dist/science/kerr-detector-calibration-plan-v363/replay.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v363-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v363.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const plan = read(paths.plan);
const replay = read(paths.replay);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.status !== "visual-v9-instrument-lab-v362-implemented-browser-pending-calibration-blocked-dense-incomplete-0-of-49"
  || previousPointer.capabilities?.v362InstrumentLab !== "five-synthetic-stages-qualified-measured-stage-blocked-read-only"
  || plan.version !== "v363-kerr-detector-calibration-acquisition-plan-v1"
  || plan.status !== "qualified-synthetic-calibration-acquisition-design-measured-input-still-blocked"
  || !/^[a-f0-9]{64}$/.test(plan.artifactSha256 ?? "") || plan.counts?.sourceRowCount !== 12 || plan.counts?.bandCount !== 3
  || plan.counts?.missingRequirementCount !== 11 || plan.counts?.acquisitionTaskCount !== 9 || plan.counts?.parameterCount !== 7
  || plan.requirementCoverage?.length !== 11 || plan.requirementCoverage.some((entry) => entry.covered !== true || entry.taskIds?.length < 1)
  || plan.identifiability?.rank !== 7 || plan.identifiability?.fullColumnRank !== true
  || plan.rankingBasis !== "relative-log-ratio-from-synthetic-v360-only"
  || plan.sampleSizeAuthority !== "planning-floor-only-no-measured-variance-power-analysis"
  || plan.measuredCalibrationAuthority !== "blocked-input-unavailable-v361" || plan.measuredPerformanceClaimed !== false
  || plan.taskExecutionStatus !== "not-run-plan-only" || plan.attemptConsumed !== false || plan.networkAttempted !== false
  || plan.scienceCinematicBoundary !== "calibration-plan-and-priorities-never-cinematic-color-input"
  || replay.deterministic !== true || replay.identifiabilityRank !== 7 || replay.measuredPerformanceClaimed !== false
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied") throw new Error("v363-calibration-plan-boundary");
const sourcePaths = [
  "app/lib/kerrDetectorCalibrationPlanV363.ts", "app/lib/kerrDetectorCalibrationPlanV363.test.ts",
  "app/lib/kerrDetectorCalibrationPlanServerV363.ts", "app/lib/kerrDetectorCalibrationPlanServerV363.test.ts",
  "app/api/atlas/relativity-evidence/v363/calibration-plan/route.ts", "app/api/atlas/relativity-evidence/v363/calibration-plan/route.test.ts",
  "app/components/DetectorCalibrationPlanSurfaceV363.tsx", "app/components/DetectorCalibrationPlanSurfaceV363.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV363.ts", "app/lib/atlasShadowCapabilityPointerV363.test.ts",
  "app/components/RelativityResearchWorkbenchV280.tsx", "scripts/build-kerr-detector-calibration-plan-v363.ts",
  "scripts/build-shadow-candidate-v363.mjs", "scripts/verify-shadow-v363-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v363-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "calibration-plan-v363-qualified-plan-only-measured-input-blocked-browser-pending-dense-incomplete-0-of-49",
  dependency: { v362EvidenceSha256: previousEvidence.evidenceSha256, v362PointerSha256: previousPointer.pointerSha256, planArtifactSha256: plan.artifactSha256 },
  calibrationPlan: {
    status: plan.status,
    sourceRowCount: plan.counts.sourceRowCount,
    bandCount: plan.counts.bandCount,
    missingRequirementCount: plan.counts.missingRequirementCount,
    acquisitionTaskCount: plan.counts.acquisitionTaskCount,
    quantitativeTaskCount: plan.counts.quantitativeTaskCount,
    parameterCount: plan.counts.parameterCount,
    requirementCoverageComplete: plan.requirementCoverage.every((entry) => entry.covered),
    structuralRank: plan.identifiability.rank,
    fullColumnRank: plan.identifiability.fullColumnRank,
    bandPriority: replay.bandPriority,
    rankingBasis: plan.rankingBasis,
    sampleSizeAuthority: plan.sampleSizeAuthority,
    measuredCalibrationAuthority: plan.measuredCalibrationAuthority,
    measuredPerformanceClaimed: plan.measuredPerformanceClaimed,
    taskExecutionStatus: plan.taskExecutionStatus,
    attemptConsumed: plan.attemptConsumed,
    networkAttempted: plan.networkAttempted,
    scienceCinematicBoundary: plan.scienceCinematicBoundary,
    artifactSha256: plan.artifactSha256,
  },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "calibration-acquisition-design-only-measured-input-still-blocked-no-science-cinematic-or-product-promotion",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v363",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v361Calibration: "blocked-measured-calibration-input-unavailable",
    v362VisualProfile: "science-cinematic-v9-instrument-lab-shadow",
    v362InstrumentLab: "five-synthetic-stages-qualified-measured-stage-blocked-read-only",
    v363CalibrationPlan: "qualified-plan-only-nine-tasks-eleven-requirements",
    v363Identifiability: "structural-full-rank-7-of-7-numerical-conditioning-awaits-measurements",
    v363BandPriority: "euv-soft-x-ray-visible-synthetic-planning-only",
    v363MeasuredAuthority: "blocked-input-unavailable-no-performance-claim",
    v363TaskExecution: "not-run-plan-only-attempt-not-consumed",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, planArtifactSha256: plan.artifactSha256, tasks: plan.counts.acquisitionTaskCount, requirements: plan.counts.missingRequirementCount, rank: plan.identifiability.rank, bandPriority: replay.bandPriority, measuredAuthority: pointer.capabilities.v363MeasuredAuthority, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
