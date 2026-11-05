import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v514-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v514.json",
  replay: "dist/science/kerr-uncertainty-replay-v515/replay.json",
  runtime: "dist/science/kerr-uncertainty-replay-v515/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  evidence: "dist/science/orbit-atlas-shadow-v515-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v515.json",
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
const replay = read(paths.replay);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v514-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v514" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  replay.version !== "v515-kerr-uncertainty-visual-replay-v1" ||
  runtime.version !== "v515-kerr-uncertainty-replay-runtime-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v515-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v515" ||
  sha(replay) !== replay.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.replayArtifactSha256 !== replay.artifactSha256 ||
  evidence.dependency.v515ReplayArtifactSha256 !== replay.artifactSha256 ||
  evidence.dependency.v515RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
) {
  throw new Error("v515-canonical-chain");
}

if (
  replay.replay.transitionCount !== 512 ||
  replay.replay.encodingBuildCount !== 1024 ||
  replay.replay.scienceEncodingCount !== 512 ||
  replay.replay.cinematicEncodingCount !== 512 ||
  replay.replay.modeNotificationCount !== 512 ||
  replay.replay.finalMode !== "science" ||
  replay.replay.finalModeRevision !== 512 ||
  replay.replay.scientificPayloadMismatchCount !== 0 ||
  replay.replay.scientificRowMismatchCount !== 0 ||
  replay.replay.visualSignatureMismatchCount !== 0 ||
  replay.replay.numericStyleViolationCount !== 0 ||
  replay.replay.scientificMutationCount !== 0 ||
  replay.replay.nonDeterministicResultCount !== 0 ||
  replay.profile.id !== "science-cinematic-v7r1-v514" ||
  replay.profile.numericStyleInputCount !== 0 ||
  replay.profile.scienceBloomIntensity !== 0 ||
  replay.profile.scienceGradeIntensity !== 0 ||
  replay.boundary.scientificFieldMutationAllowed !== false ||
  replay.boundary.uncertaintyDrivenColorAllowed !== false ||
  replay.boundary.uncertaintyDrivenBloomAllowed !== false ||
  replay.boundary.uncertaintyDrivenExposureAllowed !== false ||
  replay.boundary.uncertaintyDrivenAnimationAllowed !== false ||
  replay.lifecycle.finalResourceStatus !== "baseline" ||
  replay.lifecycle.sceneRevisionDelta !== 0 ||
  replay.lifecycle.canvasCreated !== false
) {
  throw new Error("v515-replay-boundary");
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
  runtime.runtime.localShadowOnly !== true
) {
  throw new Error("v515-runtime-boundary");
}

if (
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
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  pointer.formalProductPointer !== "v263" ||
  pointer.formalProductPointerAdvanced !== false ||
  pointer.localShadowDefaultApplied !== false ||
  pointer.capabilities.v515DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v515DetectorAuthority !== "unavailable" ||
  pointer.capabilities.v515BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v515-continuity-boundary");
}

const component = text("app/components/KerrUncertaintyReplayLedgerV515.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV515.tsx");
const route = text("app/api/atlas/relativity-evidence/v515/uncertainty-replay/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v515-transition-count="512"') ||
  !component.includes('data-atlas-v515-automatic-request-count="0"') ||
  !component.includes('data-atlas-v515-scientific-mutation="false"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  !wrapper.includes('lazy(()=>import("./KerrUncertaintyReplayLedgerV515"))') ||
  wrapper.includes("fetch(") ||
  !route.includes('delivery!=="local-shadow"') ||
  !route.includes('"Cache-Control":"no-store"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV515"') ||
  [component, wrapper, route, workbench].some((source) => source.includes("�"))
) {
  throw new Error("v515-source-boundary");
}

for (const [label, manifest, sourceSha256] of [
  ["replay", replay.sourceManifest, replay.sourceSha256],
  ["runtime", runtime.sourceManifest, runtime.sourceSha256],
  ["evidence", evidence.sourceManifest, evidence.sourceSha256],
]) {
  for (const entry of manifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v515-${label}-source-manifest:${entry.path}`);
    }
  }
  if (sha(manifest) !== sourceSha256) {
    throw new Error(`v515-${label}-source-manifest-canonical`);
  }
}

for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) {
    throw new Error(`v515-empty:${path}`);
  }
}

console.log(
  JSON.stringify(
    {
      status: "passed-v515-low-memory-uncertainty-replay",
      replayArtifactSha256: replay.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      transitions: 512,
      encodingBuilds: 1024,
      scientificMismatches: 0,
      scientificMutations: 0,
      automaticRequests: 0,
      explicitRequests: 1,
      singleFlightConsumers: 2,
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
