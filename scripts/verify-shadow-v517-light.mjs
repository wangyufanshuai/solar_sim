import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v516-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v516.json",
  receipt:
    "dist/science/kerr-uncertainty-independent-verification-v517/verification-receipt.json",
  runtime: "dist/science/kerr-uncertainty-independent-verification-v517/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  evidence: "dist/science/orbit-atlas-shadow-v517-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v517.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
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
const text = (path) => bytes(path).toString("utf8");
const read = (path) => JSON.parse(text(path));
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

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const receipt = read(paths.receipt);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v516-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v516" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  receipt.version !== "v517-kerr-uncertainty-independent-verification-receipt-v1" ||
  runtime.version !== "v517-kerr-uncertainty-independent-verification-runtime-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v517-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v517" ||
  sha(receipt) !== receipt.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.verificationReceiptSha256 !== receipt.artifactSha256 ||
  evidence.dependency.v517VerificationReceiptSha256 !== receipt.artifactSha256 ||
  evidence.dependency.v517RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
) {
  throw new Error("v517-canonical-chain");
}

if (
  receipt.verification.independentImplementation !== true ||
  receipt.verification.importedV516Parser !== false ||
  receipt.verification.importedV516Builder !== false ||
  receipt.verification.artifactCanonicalValid !== true ||
  receipt.verification.sourceManifestValid !== true ||
  receipt.verification.transitionCount !== 512 ||
  receipt.verification.witnessCount !== 512 ||
  receipt.verification.recomputedWitnessCount !== 512 ||
  receipt.verification.checkpointCount !== 8 ||
  receipt.verification.matchedCheckpointCount !== 8 ||
  receipt.verification.passCount !== 2 ||
  receipt.verification.chainHeadSha256 !== receipt.verification.repeatHeadSha256 ||
  receipt.verification.chainHeadMatches !== true ||
  receipt.verification.witnessMismatchCount !== 0 ||
  receipt.verification.checkpointMismatchCount !== 0 ||
  receipt.verification.sequenceMismatchCount !== 0 ||
  receipt.verification.invalidShaCount !== 0 ||
  receipt.verification.boundaryViolationCount !== 0 ||
  receipt.verification.artifactBytes <= 0 ||
  receipt.verification.artifactBytes > 128 * 1024 ||
  receipt.verification.artifactMaximumBytes !== 128 * 1024
) {
  throw new Error("v517-verification-boundary");
}

if (
  runtime.runtime.serverFingerprintCacheHit !== true ||
  runtime.runtime.automaticRequestCount !== 0 ||
  runtime.runtime.explicitRequestCount !== 1 ||
  runtime.runtime.singleFlightConsumerCount !== 2 ||
  runtime.runtime.notificationCount !== 4 ||
  runtime.runtime.peakSubscriptionCount !== 2 ||
  runtime.runtime.finalSubscriptionCount !== 0 ||
  runtime.runtime.finalObjectUrlCount !== 0 ||
  runtime.runtime.finalResourceStatus !== "baseline" ||
  runtime.runtime.responseCachePolicy !== "no-store" ||
  runtime.runtime.responseMaximumBytes !== 128 * 1024 ||
  runtime.runtime.localShadowOnly !== true ||
  receipt.lifecycle.networkRequestCount !== 0 ||
  receipt.lifecycle.workerCreated !== false ||
  receipt.lifecycle.objectUrlCount !== 0 ||
  receipt.lifecycle.canvasCreated !== false ||
  receipt.lifecycle.sceneRevisionDelta !== 0
) {
  throw new Error("v517-runtime-boundary");
}

if (
  receipt.boundary.detectorCalibrationStatus !== "incomplete-0-of-6" ||
  receipt.boundary.detectorAuthorityAvailable !== false ||
  receipt.boundary.scienceRasterAvailable !== false ||
  receipt.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
  receipt.boundary.browserQualification !== "not-run" ||
  receipt.boundary.localShadowDefaultApplied !== false ||
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
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.formalProductPointerAdvanced !== false ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v517DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v517DetectorAuthority !== "unavailable" ||
  pointer.capabilities.v517BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v517-continuity-boundary");
}

const verifier = text("scripts/verify-kerr-uncertainty-replay-witness-v517.ts");
const component = text("app/components/KerrUncertaintyIndependentVerificationV517.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV517.tsx");
const route = text(
  "app/api/atlas/relativity-evidence/v517/independent-verification/route.ts",
);
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  verifier.includes("kerrUncertaintyReplayWitnessV516") ||
  verifier.includes("build-kerr-uncertainty-replay-witness-v516") ||
  !component.includes('data-atlas-v517-recomputed-witness-count="512"') ||
  !component.includes('data-atlas-v517-imported-v516-parser="false"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  !wrapper.includes('import("./KerrUncertaintyIndependentVerificationV517")') ||
  wrapper.includes("fetch(") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('"Cache-Control": "no-store"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV517"') ||
  [verifier, component, wrapper, route, workbench].some((source) => source.includes("�"))
) {
  throw new Error("v517-source-boundary");
}

for (const [label, manifest, sourceSha256] of [
  ["receipt", receipt.sourceManifest, receipt.sourceSha256],
  ["runtime", runtime.sourceManifest, runtime.sourceSha256],
  ["evidence", evidence.sourceManifest, evidence.sourceSha256],
]) {
  for (const entry of manifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v517-${label}-source-manifest:${entry.path}`);
    }
  }
  if (sha(manifest) !== sourceSha256) {
    throw new Error(`v517-${label}-source-manifest-canonical`);
  }
}

for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v517-empty:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v517-low-memory-independent-replay-witness-verification",
      receiptSha256: receipt.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      witnessesRecomputed: 512,
      checkpointsMatched: 8,
      mismatches: 0,
      boundaryViolations: 0,
      automaticRequests: 0,
      explicitRequests: 1,
      finalResourceStatus: "baseline",
      detectorCalibration: "0/6",
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
