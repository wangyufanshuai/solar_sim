import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const text = (path) => bytes(path).toString("utf8");
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const replayPath =
  "dist/science/atlas-calibration-evidence-replay-v508/replay-audit.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v508-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v508.json";
const replay = read(replayPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const previousEvidence = read("dist/science/orbit-atlas-shadow-v507-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v507.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  replay.version !== "v508-atlas-calibration-evidence-replay-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v508-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v508" ||
  sha(replay) !== replay.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  evidence.dependency.v507EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v507PointerSha256 !== previousPointer.pointerSha256 ||
  evidence.dependency.v508ReplayArtifactSha256 !== replay.artifactSha256 ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256 ||
  pointer.evidence.fileSha256 !== fileSha(evidencePath)
) {
  throw new Error("v508-canonical-chain");
}

if (
  replay.replay.requestCount !== 2 ||
  replay.replay.readinessRequestCount !== 1 ||
  replay.replay.preflightRequestCount !== 1 ||
  replay.replay.readinessPromiseSingleFlight !== true ||
  replay.replay.preflightPromiseSingleFlight !== true ||
  replay.replay.readinessReferencePreserved !== true ||
  replay.replay.readinessNotifications !== 2 ||
  replay.replay.preflightNotifications !== 2 ||
  replay.replay.finalMode !== "cinematic" ||
  replay.replay.finalHudRevision !== 1 ||
  replay.evidenceStores.channelCount !== 2 ||
  replay.evidenceStores.totalListenerCount !== 0 ||
  replay.evidenceStores.totalRequestCount !== 2 ||
  replay.evidenceStores.responseLimitBytes !== 128 * 1024 ||
  replay.evidenceStores.noStoreTransport !== true ||
  replay.evidenceStores.implicitRetryAllowed !== false ||
  replay.evidenceStores.appShellSubscription !== false ||
  replay.scienceBoundary.readinessPayloadReferencePreserved !== true ||
  replay.scienceBoundary.calibrationAdmitted !== false ||
  replay.scienceBoundary.measuredDetectorAuthorityGranted !== false ||
  replay.scienceBoundary.scientificFieldMutationAllowed !== false ||
  replay.scienceBoundary.sceneRevisionDelta !== 0 ||
  replay.resources.finalDiff.status !== "baseline" ||
  replay.resources.finalDiff.subscriptions !== 0 ||
  replay.resources.finalDiff.identityChanged !== false ||
  replay.resources.finalDiff.ownerChanged !== false ||
  replay.resources.returnedToBaseline !== true
) {
  throw new Error("v508-replay-boundary");
}

const client = text("app/lib/atlasCalibrationEvidenceClientV508.ts");
const readiness = text("app/components/KerrMeasuredCalibrationReadinessV503.tsx");
const preflight = text("app/components/KerrMeasuredCalibrationPreflightV504.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV504.tsx");
const appShell = text("app/components/AtlasAppShell.tsx");
if (
  readiness.includes("fetch(") ||
  preflight.includes("fetch(") ||
  readiness.includes("useRef") ||
  preflight.includes("useRef") ||
  !readiness.includes("subscribeAtlasCalibrationReadinessV508") ||
  !preflight.includes("subscribeAtlasCalibrationPreflightV508") ||
  !client.includes('fetch(url, { cache: "no-store" })') ||
  !client.includes("if (requestPromise) return requestPromise") ||
  !wrapper.includes('data-atlas-v508-evidence-client="external-single-flight-two-channel"') ||
  appShell.includes("atlasCalibrationEvidenceClientV508") ||
  [client, readiness, preflight, wrapper].some(
    (source) =>
      source.includes("Math.random") ||
      source.includes("<canvas") ||
      source.includes("physicsEngine") ||
      source.includes("setSceneRevision"),
  )
) {
  throw new Error("v508-runtime-boundary");
}

if (
  evidence.runtime.externalEvidenceChannelCount !== 2 ||
  evidence.runtime.componentLocalFetchCount !== 0 ||
  evidence.runtime.componentLocalRequestRefCount !== 0 ||
  evidence.runtime.appShellSubscription !== false ||
  evidence.scienceBoundary.calibrationAdmitted !== false ||
  evidence.scienceBoundary.scienceRaster !== "unavailable" ||
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
  pointer.localShadowDefaultApplied !== false
) {
  throw new Error("v508-continuity-boundary");
}

for (const entry of replay.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v508-replay-source-manifest:${entry.path}`);
  }
}
if (sha(replay.sourceManifest) !== replay.sourceSha256) {
  throw new Error("v508-replay-source-manifest-canonical");
}
for (const entry of evidence.sourceManifest) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v508-evidence-source-manifest:${entry.path}`);
  }
}
if (sha(evidence.sourceManifest) !== evidence.sourceSha256) {
  throw new Error("v508-evidence-source-manifest-canonical");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v508-low-memory-external-evidence-single-flight-replay",
      replayArtifactSha256: replay.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      requests: "1/1",
      totalRequests: 2,
      crossUnmountCache: "qualified",
      finalMode: "cinematic",
      finalResourceStatus: "baseline",
      scienceMutation: false,
      browserQualification: "not-run",
      denseCampaign: "0/49",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
