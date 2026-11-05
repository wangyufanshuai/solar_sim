import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v361-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v361.json",
  audit: "dist/science/atlas-visual-v9-v362/audit.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v362-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v362.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const read = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => { const target = resolve(root, relative); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const audit = read(paths.audit);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (previousEvidence.status !== "detector-calibration-v361-blocked-input-unavailable"
  || previousPointer.capabilities?.v361Calibration !== "blocked-measured-calibration-input-unavailable"
  || audit.version !== "v362-atlas-visual-v9-instrument-lab-runtime-audit-v1"
  || audit.status !== "implemented-v9-instrument-lab-science-frozen-browser-pending"
  || !/^[a-f0-9]{64}$/.test(audit.artifactSha256 ?? "")
  || audit.matrix?.rowCount !== 40 || audit.matrix?.scienceFieldsEquivalent !== true || audit.matrix?.cinematicFieldsPairwiseDistinct !== true
  || audit.rendering?.status !== "qualified-v9-instrument-science-frozen-cinematic-distinct"
  || audit.rendering?.sciencePayloadByteIdentical !== true || audit.rendering?.measuredCalibrationUsedForCinematicColor !== false
  || audit.instrumentLab?.status !== "implemented-synthetic-instrument-chain-measured-calibration-blocked"
  || audit.instrumentLab?.syntheticQualifiedCount !== 5 || audit.instrumentLab?.measuredQualifiedCount !== 0
  || audit.instrumentLab?.measuredCalibration?.status !== "blocked-measured-calibration-input-unavailable"
  || audit.instrumentLab?.scienceBufferMutationAllowed !== false || audit.instrumentLab?.cinematicColorInputAllowed !== false
  || audit.runtimeConsumer?.scienceBufferMutationAllowed !== false || audit.runtimeConsumer?.cinematicColorInputAllowed !== false
  || audit.assetRuntime?.selector !== "local-shadow-v9-instrument-lab-v362" || audit.assetRuntime?.beforeIntent !== "no-deep-space-intent"
  || audit.assetRuntime?.lite !== "lite-boundary" || audit.assetRuntime?.ordinaryStandalone !== "ordinary-standalone-boundary"
  || audit.ab?.localShadowManualOnly !== true || audit.ab?.defaultApplied !== false || audit.ab?.legacyV9NameAndDefaultUnchanged !== true
  || audit.browserQualification !== "not-run"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.workerPhysicsMutation !== "not-applied") throw new Error("v362-visual-boundary-mismatch");
const sourcePaths = [
  "app/lib/atlasVisualProfileV299.ts", "app/lib/atlasVisualRuntimeConsumptionV300.ts", "app/lib/atlasVisualRuntimeMatrixV362.ts",
  "app/lib/kerrStrongGravityVisualV305.ts", "app/lib/kerrScienceCinematicV9V362.ts", "app/lib/kerrInstrumentLabV362.ts",
  "app/lib/kerrInstrumentLabServerV362.ts", "app/lib/atlasVisualAssetsV289.ts", "app/components/AtlasVisualABControlV261.tsx",
  "app/components/ScienceCinematicVisualSurfaceV261.tsx", "app/components/KerrInstrumentLabSurfaceV362.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx", "app/api/atlas/relativity-evidence/v362/instrument-lab/route.ts",
  "scripts/build-visual-runtime-v362.ts", "scripts/build-shadow-candidate-v362.mjs", "scripts/verify-shadow-v362-light.mjs", "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v362-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "visual-v9-instrument-lab-v362-implemented-browser-pending-calibration-blocked-dense-incomplete-0-of-49",
  dependency: { v361EvidenceSha256: previousEvidence.evidenceSha256, v361PointerSha256: previousPointer.pointerSha256, visualAuditArtifactSha256: audit.artifactSha256 },
  visual: { profile: "science-cinematic-v9-v362", label: audit.ab.label, direction: audit.visualDirection, runtimeMatrixRows: audit.matrix.rowCount, runtimeGroupCount: audit.matrix.groups.length, profiles: audit.matrix.profiles, v8ProfileDigestSha256: audit.profileDigests.v8ProfileDigestSha256, v9ProfileDigestSha256: audit.profileDigests.v9ProfileDigestSha256, scienceOutputDigest: audit.rendering.scienceOutputDigest, sciencePayloadByteIdentical: audit.rendering.sciencePayloadByteIdentical, cinematicDigests: audit.rendering.cinematicDigests, localShadowManualOnly: true, defaultApplied: false, runtimeConsumer: audit.runtimeConsumer, assetRuntime: audit.assetRuntime },
  instrumentLab: audit.instrumentLab,
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "v9-instrument-lab-manual-local-shadow-science-frozen-measured-calibration-blocked-heavy-and-dense-qualification-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v362",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v360BreakEven: "qualified-synthetic-count-domain-parity-requirements",
    v361Calibration: "blocked-measured-calibration-input-unavailable",
    v362VisualProfile: "science-cinematic-v9-instrument-lab-shadow",
    v362RuntimeMatrix: "v5-v6-v7-v8-v9-eight-groups-forty-consumption-rows",
    v362ScienceBoundary: "linear-profile-invariant-authority-buffer-byte-identical",
    v362CinematicBoundary: "seeded-deterministic-pairwise-distinct-no-measured-calibration-color-input",
    v362InstrumentLab: "five-synthetic-stages-qualified-measured-stage-blocked-read-only",
    v362DefaultBoundary: "manual-local-shadow-only-default-legacy-v9",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, auditArtifactSha256: audit.artifactSha256, rows: audit.matrix.rowCount, profiles: audit.matrix.profiles, instrument: pointer.capabilities.v362InstrumentLab, calibration: pointer.capabilities.v361Calibration, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
