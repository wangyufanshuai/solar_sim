import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v516-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v516.json",
  receipt:
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
  runtime: "dist/science/kerr-uncertainty-independent-verification-v517/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v517-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v517.json",
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
const receipt = read(paths.receipt);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.version !== "orbit-atlas-shadow-v516-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v516" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  receipt.version !== "v517-kerr-uncertainty-independent-verification-receipt-v1" ||
  sha(receipt) !== receipt.artifactSha256 ||
  runtime.version !== "v517-kerr-uncertainty-independent-verification-runtime-audit-v1" ||
  sha(runtime) !== runtime.artifactSha256 ||
  runtime.source.verificationReceiptSha256 !== receipt.artifactSha256 ||
  receipt.verification.independentImplementation !== true ||
  receipt.verification.importedV516Parser !== false ||
  receipt.verification.importedV516Builder !== false ||
  receipt.verification.recomputedWitnessCount !== 512 ||
  receipt.verification.matchedCheckpointCount !== 8 ||
  receipt.verification.witnessMismatchCount !== 0 ||
  receipt.verification.checkpointMismatchCount !== 0 ||
  receipt.verification.sequenceMismatchCount !== 0 ||
  receipt.verification.boundaryViolationCount !== 0 ||
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
  throw new Error("v517-evidence-boundary");
}

const sourcePaths = [
  paths.previousEvidence,
  paths.previousPointer,
  paths.receipt,
  paths.runtime,
  paths.detector,
  paths.dense,
  paths.formal,
  "app/lib/kerrUncertaintyIndependentVerificationV517.ts",
  "app/lib/kerrUncertaintyIndependentVerificationV517.test.ts",
  "app/lib/kerrUncertaintyIndependentVerificationServerV517.ts",
  "app/lib/kerrUncertaintyIndependentVerificationServerV517.test.ts",
  "app/lib/kerrUncertaintyIndependentVerificationClientV517.ts",
  "app/lib/kerrUncertaintyIndependentVerificationClientV517.test.ts",
  "app/api/atlas/relativity-evidence/v517/independent-verification/route.ts",
  "app/api/atlas/relativity-evidence/v517/independent-verification/route.test.ts",
  "app/components/KerrUncertaintyIndependentVerificationV517.tsx",
  "app/components/KerrUncertaintyIndependentVerificationV517.test.tsx",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV517.ts",
  "app/lib/kerrPhotonMetrologyObservatoryIntentV517.test.ts",
  "app/components/KerrPhotonMetrologyObservatoryIntentV517.tsx",
  "app/components/KerrPhotonMetrologyObservatoryIntentV517.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/components/AtlasAppShell.tsx",
  "app/lib/atlasResourceLifecycle.ts",
  "scripts/verify-kerr-uncertainty-replay-witness-v517.ts",
  "scripts/build-kerr-uncertainty-independent-verification-runtime-v517.ts",
  "scripts/build-shadow-candidate-v517.mjs",
  "scripts/build-shadow-v517.mjs",
  "scripts/verify-shadow-v517-light.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const status =
  "v517-independent-replay-witness-verification-qualified-heavy-browser-pending";
const unsigned = {
  version: "orbit-atlas-shadow-v517-evidence-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  dependency: {
    v516EvidenceSha256: previousEvidence.evidenceSha256,
    v516PointerSha256: previousPointer.pointerSha256,
    v517VerificationReceiptSha256: receipt.artifactSha256,
    v517RuntimeArtifactSha256: runtime.artifactSha256,
    v511InstrumentMatrixSha256: detector.artifactSha256,
    v314StateSha256: dense.stateSha256,
  },
  verification: receipt.verification,
  lifecycle: receipt.lifecycle,
  runtime: runtime.runtime,
  detectorBoundary: {
    measuredCalibrationFiles: detector.counts.measuredCalibrationFiles,
    requiredMeasuredCalibrationFiles: detector.counts.requiredMeasuredCalibrationFiles,
    detectorAuthorityAvailable: detector.boundary.detectorResponseAvailable,
    scienceRasterAvailable: detector.boundary.scienceRasterAvailable,
    fitsProducts: detector.boundary.fitsProducts,
    pngProducts: detector.boundary.pngProducts,
  },
  scienceBoundary: receipt.boundary,
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
    "v517-independent-verifier-no-v516-parser-builder-import-recomputed-all-512-witnesses-matched-eight-checkpoints-verified-source-manifest-zero-mismatch-violation-single-flight-runtime-baseline",
  ],
  boundaryStatement:
    "An independent implementation now verifies the complete v516 witness chain and its source manifest. The receipt is provenance evidence only and does not create measured detector, dense, raster, browser, or product authority.",
};
const evidence = { ...unsigned, evidenceSha256: sha(unsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v517",
  generatedAt: "2026-08-01T00:00:00Z",
  status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v516WitnessChain: "qualified-512-witnesses-8-checkpoints",
    v517IndependentImplementation: "qualified-no-v516-parser-or-builder",
    v517WitnessRecomputation: "qualified-512-of-512",
    v517CheckpointVerification: "qualified-8-of-8",
    v517SourceManifestVerification: "qualified",
    v517CanonicalVerification: "qualified",
    v517WitnessMismatch: "qualified-zero",
    v517SequenceMismatch: "qualified-zero",
    v517BoundaryViolation: "qualified-zero",
    v517RuntimeRequestPolicy: "qualified-auto-0-explicit-1-single-flight-2-consumers",
    v517Lifecycle: "qualified-baseline",
    v517DetectorCalibration: "incomplete-0-of-6",
    v517DetectorAuthority: "unavailable",
    v517ScienceRaster: "unavailable",
    v517BrowserQualification: "not-run",
    v517VisualMatrixQualification: "not-run",
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
      receiptSha256: receipt.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      witnessesRecomputed: receipt.verification.recomputedWitnessCount,
      checkpointsMatched: receipt.verification.matchedCheckpointCount,
      mismatches: 0,
      boundaryViolations: 0,
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
