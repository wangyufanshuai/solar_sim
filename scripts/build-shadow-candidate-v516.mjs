import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v515-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v515.json",
  artifact: "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json",
  runtime: "dist/science/kerr-uncertainty-replay-witness-v516/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v516-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v516.json",
};
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "evidenceSha256",
  "pointerSha256",
  "stageChainSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v515-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v515" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v516-kerr-uncertainty-replay-witness-chain-v1" ||
  sha(artifact) !== artifact.artifactSha256 ||
  runtime.version !== "v516-kerr-uncertainty-replay-witness-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.witnessArtifactSha256 !== artifact.artifactSha256 ||
  artifact.chain.transitionCount !== 512 ||
  artifact.chain.witnessCount !== 512 ||
  artifact.chain.checkpointCount !== 8 ||
  artifact.chain.passCount !== 2 ||
  artifact.chain.headSha256 !== artifact.chain.repeatHeadSha256 ||
  artifact.chain.mismatchCount !== 0 ||
  artifact.chain.scientificDigestMismatchCount !== 0 ||
  artifact.chain.visualDigestMismatchCount !== 0 ||
  artifact.chain.numericStyleViolationCount !== 0 ||
  artifact.chain.scientificMutationCount !== 0 ||
  runtime.runtime.serverFingerprintCacheHit !== true ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  detector.boundary.detectorResponseAvailable !== false ||
  detector.boundary.scienceRasterAvailable !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v516-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.artifact,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrUncertaintyReplayWitnessV516.ts",
  "app/lib/kerrUncertaintyReplayWitnessV516.test.ts",
  "app/lib/kerrUncertaintyReplayWitnessServerV516.ts",
  "app/lib/kerrUncertaintyReplayWitnessServerV516.test.ts",
  "app/lib/kerrUncertaintyReplayWitnessClientV516.ts",
  "app/lib/kerrUncertaintyReplayWitnessClientV516.test.ts",
  "app/api/atlas/relativity-evidence/v516/replay-witness/route.ts",
  "app/api/atlas/relativity-evidence/v516/replay-witness/route.test.ts",
  "app/components/KerrUncertaintyReplayWitnessV516.tsx",
  "app/components/KerrUncertaintyReplayWitnessV516.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV516.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV516.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV516.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV516.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/kerrUncertaintyReplayV515.ts",
  "app/lib/kerrUncertaintyVisualEncodingV514.ts",
  "app/lib/kerrProductUncertaintyEligibilityV513.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-uncertainty-replay-witness-v516.ts",
  "scripts/build-kerr-uncertainty-replay-witness-runtime-v516.ts",
  "scripts/build-shadow-candidate-v516.mjs",
  "scripts/build-shadow-v516.mjs",
  "scripts/verify-shadow-v516-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v516-content-addressed-replay-witness-qualified-512-transitions-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v516-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v515EvidenceSha256: previousEvidence.evidenceSha256,
    v515PointerSha256: previousPointer.pointerSha256,
    v516WitnessArtifactSha256: artifact.artifactSha256,
    v516RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  basis: artifact.basis,
  chain: artifact.chain,
  checkpoints: artifact.checkpoints,
  lifecycle: artifact.lifecycle,
  runtime: runtime.runtime,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
    fitsProducts: detector.boundary.fitsProducts,
    pngProducts: detector.boundary.pngProducts,
  },
  scienceBoundary: artifact.boundary,
  denseCampaign: {
    namespace: "v314",
    status: dense.status,
    completedShardCount: dense.completedShardCount,
    plannedShardCount: dense.plannedShardCount,
    attemptConsumed: dense.attemptConsumed,
    aggregateAvailable: dense.aggregateAvailable,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  qualification: [
    "v516-512-content-addressed-transition-witnesses-eight-checkpoints-two-independent-passes-identical-chain-head-zero-scientific-visual-style-mutation-mismatches-single-flight-runtime-baseline",
  ],
  boundaryStatement:
    "Each replay transition is now individually bound to immutable scientific and visual digests. The compact witness chain proves provenance and repeatability without embedding mutable scientific payloads or creating detector, dense, browser, raster, or product authority.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v516",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v515Replay: "qualified-512-transitions",
    v516TransitionWitnesses: "qualified-512-of-512",
    v516CheckpointCadence: "qualified-8-at-64-transition-interval",
    v516IndependentPasses: "qualified-2",
    v516ChainHeadRepeatability: "qualified-identical",
    v516ChainMismatch: "qualified-zero",
    v516ScientificDigestMismatch: "qualified-zero",
    v516VisualDigestMismatch: "qualified-zero",
    v516NumericStyleViolations: "qualified-zero",
    v516ScientificMutation: "forbidden-zero-observed",
    v516RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v516Lifecycle: "qualified-baseline",
    v516DetectorCalibration: "incomplete-0-of-6",
    v516DetectorAuthority: "unavailable",
    v516ScienceRaster: "unavailable",
    v516BrowserQualification: "not-run",
    v516VisualMatrixQualification: "not-run",
    v314DenseCampaign: "incomplete-0-of-49",
  },
  promotion: {
    promotionAllowed: false,
    scienceRasterPayloadAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    localShadowDefaultApplied: false,
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);

console.log(
  JSON.stringify(
    {
      status,
      witnessArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      witnesses: artifact.chain.witnessCount,
      checkpoints: artifact.chain.checkpointCount,
      passes: artifact.chain.passCount,
      chainHead: artifact.chain.headSha256,
      mismatchCount: artifact.chain.mismatchCount,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
