import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v514-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v514.json",
  replay: "dist/science/kerr-uncertainty-replay-v515/replay.json",
  runtime: "dist/science/kerr-uncertainty-replay-v515/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v515-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v515.json",
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
const replay = read(paths.replay);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v514-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v514" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  replay.version !== "v515-kerr-uncertainty-visual-replay-v1" ||
  sha(replay) !== replay.artifactSha256 ||
  runtime.version !== "v515-kerr-uncertainty-replay-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.replayArtifactSha256 !== replay.artifactSha256 ||
  replay.replay.transitionCount !== 512 ||
  replay.replay.encodingBuildCount !== 1024 ||
  replay.replay.scientificPayloadMismatchCount !== 0 ||
  replay.replay.scientificRowMismatchCount !== 0 ||
  replay.replay.visualSignatureMismatchCount !== 0 ||
  replay.replay.numericStyleViolationCount !== 0 ||
  replay.replay.scientificMutationCount !== 0 ||
  replay.replay.nonDeterministicResultCount !== 0 ||
  replay.replay.automaticRequestCount !== 0 ||
  replay.replay.explicitRequestCount !== 1 ||
  replay.lifecycle.finalResourceStatus !== "baseline" ||
  runtime.runtime.serverFingerprintCacheHit !== true ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  detector.version !== "v511-kerr-instrument-authority-matrix-v1" ||
  sha(detector) !== detector.artifactSha256 ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  detector.counts.requiredMeasuredCalibrationFiles !== 6 ||
  detector.boundary.detectorResponseAvailable !== false ||
  detector.boundary.observedCountsAvailable !== false ||
  detector.boundary.observedIntensityAvailable !== false ||
  detector.boundary.scienceRasterAvailable !== false ||
  detector.boundary.fitsProducts !== 0 ||
  detector.boundary.pngProducts !== 0 ||
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
  throw new Error("v515-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.replay,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrUncertaintyReplayV515.ts",
  "app/lib/kerrUncertaintyReplayV515.test.ts",
  "app/lib/kerrUncertaintyReplayServerV515.ts",
  "app/lib/kerrUncertaintyReplayServerV515.test.ts",
  "app/lib/kerrUncertaintyReplayClientV515.ts",
  "app/lib/kerrUncertaintyReplayClientV515.test.ts",
  "app/api/atlas/relativity-evidence/v515/uncertainty-replay/route.ts",
  "app/api/atlas/relativity-evidence/v515/uncertainty-replay/route.test.ts",
  "app/components/KerrUncertaintyReplayLedgerV515.tsx",
  "app/components/KerrUncertaintyReplayLedgerV515.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV515.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV515.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV515.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV515.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/kerrUncertaintyVisualEncodingV514.ts",
  "app/lib/kerrProductUncertaintyEligibilityV513.ts",
  "app/lib/atlasCalibrationHudModeStoreV506.ts",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/build-kerr-uncertainty-replay-v515.ts",
  "scripts/build-kerr-uncertainty-replay-runtime-v515.ts",
  "scripts/build-shadow-candidate-v515.mjs",
  "scripts/build-shadow-v515.mjs",
  "scripts/verify-shadow-v515-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v515-uncertainty-replay-qualified-512-transitions-runtime-single-flight-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v515-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v514EvidenceSha256: previousEvidence.evidenceSha256,
    v514PointerSha256: previousPointer.pointerSha256,
    v515ReplayArtifactSha256: replay.artifactSha256,
    v515RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  replay: replay.replay,
  lifecycle: replay.lifecycle,
  profile: replay.profile,
  runtime: runtime.runtime,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    observedCountsAvailable: detector.boundary.observedCountsAvailable,
    observedIntensityAvailable: detector.boundary.observedIntensityAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
    fitsProducts: detector.boundary.fitsProducts,
    pngProducts: detector.boundary.pngProducts,
  },
  scienceBoundary: replay.boundary,
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
    "v515-512-mode-transitions-1024-encodings-zero-payload-row-visual-style-mutation-nondeterminism-mismatches-two-consumer-single-flight-no-automatic-request-baseline-lifecycle",
  ],
  boundaryStatement:
    "The replay proves deterministic Science/Cinematic visual switching without scientific mutation. It does not create detector authority, dense authority, raster products, browser qualification, or product promotion.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v515",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v514VisualProfile: "science-cinematic-v7r1-v514",
    v515ReplayTransitions: "qualified-512-of-512",
    v515EncodingBuilds: "qualified-1024",
    v515ScientificPayloadStability: "qualified-zero-mismatch",
    v515ScientificRowsStability: "qualified-zero-mismatch",
    v515VisualSignatureStability: "qualified-zero-mismatch",
    v515NumericStyleViolations: "qualified-zero",
    v515ScientificMutation: "forbidden-zero-observed",
    v515RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v515Lifecycle: "qualified-2-subscriptions-baseline",
    v515DetectorCalibration: "incomplete-0-of-6",
    v515DetectorAuthority: "unavailable",
    v515ObservedCounts: "unavailable",
    v515ObservedIntensity: "unavailable",
    v515ScienceRaster: "unavailable",
    v515FitsProducts: "unavailable-0",
    v515PngProducts: "unavailable-0",
    v515BrowserQualification: "not-run",
    v515VisualMatrixQualification: "not-run",
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
      replayArtifactSha256: replay.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      transitions: replay.replay.transitionCount,
      encodingBuilds: replay.replay.encodingBuildCount,
      mismatches: 0,
      automaticRequests: runtime.runtime.automaticRequestCount,
      explicitRequests: runtime.runtime.explicitRequestCount,
      finalResourceStatus: runtime.runtime.finalResourceStatus,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
