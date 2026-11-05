import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v515-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v515.json",
  artifact: "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json",
  runtime: "dist/science/kerr-uncertainty-replay-witness-v516/runtime-audit.json",
  detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
  evidence: "dist/science/orbit-atlas-shadow-v516-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v516.json",
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
const artifact = read(paths.artifact);
const runtime = read(paths.runtime);
const detector = read(paths.detector);
const evidence = read(paths.evidence);
const pointer = read(paths.pointer);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.version !== "orbit-atlas-shadow-v515-evidence-v1" ||
  sha(previousEvidence) !== previousEvidence.evidenceSha256 ||
  previousPointer.version !== "orbit-atlas-current-local-shadow-candidate-v515" ||
  sha(previousPointer) !== previousPointer.pointerSha256 ||
  artifact.version !== "v516-kerr-uncertainty-replay-witness-chain-v1" ||
  runtime.version !== "v516-kerr-uncertainty-replay-witness-runtime-audit-v1" ||
  evidence.version !== "orbit-atlas-shadow-v516-evidence-v1" ||
  pointer.version !== "orbit-atlas-current-local-shadow-candidate-v516" ||
  sha(artifact) !== artifact.artifactSha256 ||
  sha(runtime) !== runtime.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  runtime.source.witnessArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v516WitnessArtifactSha256 !== artifact.artifactSha256 ||
  evidence.dependency.v516RuntimeArtifactSha256 !== runtime.artifactSha256 ||
  pointer.evidence.fileSha256 !== fileSha(paths.evidence) ||
  pointer.evidence.canonicalSha256 !== evidence.evidenceSha256
) {
  throw new Error("v516-canonical-chain");
}

if (
  artifact.chain.transitionCount !== 512 ||
  artifact.chain.witnessCount !== 512 ||
  artifact.chain.checkpointInterval !== 64 ||
  artifact.chain.checkpointCount !== 8 ||
  artifact.chain.passCount !== 2 ||
  artifact.chain.headSha256 !== artifact.chain.repeatHeadSha256 ||
  artifact.chain.mismatchCount !== 0 ||
  artifact.chain.alternationMismatchCount !== 0 ||
  artifact.chain.revisionMismatchCount !== 0 ||
  artifact.chain.scientificDigestMismatchCount !== 0 ||
  artifact.chain.visualDigestMismatchCount !== 0 ||
  artifact.chain.numericStyleViolationCount !== 0 ||
  artifact.chain.scientificMutationCount !== 0 ||
  artifact.chain.notificationCountPerPass !== 512 ||
  artifact.chain.finalMode !== "science" ||
  artifact.chain.finalModeRevision !== 512 ||
  artifact.basis.scientificRowCount !== 9 ||
  artifact.basis.numericStyleInputCount !== 0 ||
  artifact.basis.scientificMutationAllowed !== false ||
  artifact.witnesses.length !== 512 ||
  artifact.checkpoints.length !== 8
) {
  throw new Error("v516-witness-boundary");
}

let previousWitnessSha256 = artifact.chain.genesisSha256;
for (const [index, witness] of artifact.witnesses.entries()) {
  const mode = index % 2 === 0 ? "cinematic" : "science";
  const expected = sha({
    version: "v516-kerr-uncertainty-transition-witness-v1",
    index,
    mode,
    revision: index + 1,
    scientificPayloadKey: artifact.source.scientificPayloadKey,
    scientificRowsSha256: artifact.basis.scientificRowsSha256,
    scienceVisualSignatureSha256: artifact.basis.scienceVisualSignatureSha256,
    cinematicVisualSignatureSha256: artifact.basis.cinematicVisualSignatureSha256,
    previousWitnessSha256,
    numericStyleInputCount: 0,
    scientificMutation: false,
  });
  if (
    witness.index !== index ||
    witness.mode !== mode ||
    witness.revision !== index + 1 ||
    witness.witnessSha256 !== expected
  ) {
    throw new Error(`v516-witness-recompute:${index}`);
  }
  previousWitnessSha256 = witness.witnessSha256;
}
if (previousWitnessSha256 !== artifact.chain.headSha256) {
  throw new Error("v516-witness-head");
}
for (const [index, checkpoint] of artifact.checkpoints.entries()) {
  const transitionIndex = (index + 1) * 64 - 1;
  if (
    checkpoint.transitionIndex !== transitionIndex ||
    checkpoint.mode !== "science" ||
    checkpoint.revision !== transitionIndex + 1 ||
    checkpoint.witnessSha256 !== artifact.witnesses[transitionIndex].witnessSha256
  ) {
    throw new Error(`v516-checkpoint:${index}`);
  }
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
  artifact.lifecycle.peakSubscriptionCount !== 1 ||
  artifact.lifecycle.finalSubscriptionCount !== 0 ||
  artifact.lifecycle.finalResourceStatus !== "baseline" ||
  artifact.lifecycle.canvasCreated !== false ||
  artifact.lifecycle.sceneRevisionDelta !== 0
) {
  throw new Error("v516-runtime-boundary");
}

if (
  artifact.boundary.fullTransitionPayloadEmbedded !== false ||
  artifact.boundary.scientificFieldMutationAllowed !== false ||
  artifact.boundary.uncertaintyDrivenPresentationAllowed !== false ||
  artifact.boundary.detectorAuthorityAvailable !== false ||
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
  pointer.capabilities.v516DetectorCalibration !== "incomplete-0-of-6" ||
  pointer.capabilities.v516DetectorAuthority !== "unavailable" ||
  pointer.capabilities.v516BrowserQualification !== "not-run" ||
  pointer.capabilities.v314DenseCampaign !== "incomplete-0-of-49"
) {
  throw new Error("v516-continuity-boundary");
}

const component = text("app/components/KerrUncertaintyReplayWitnessV516.tsx");
const wrapper = text("app/components/KerrPhotonMetrologyObservatoryIntentV516.tsx");
const route = text("app/api/atlas/relativity-evidence/v516/replay-witness/route.ts");
const workbench = text("app/components/RelativityResearchWorkbenchV280.tsx");
if (
  !component.includes('data-atlas-v516-witness-count="512"') ||
  !component.includes('data-atlas-v516-checkpoint-count="8"') ||
  !component.includes('data-atlas-v516-scientific-mutation="false"') ||
  component.includes("Math.random") ||
  component.includes("<canvas") ||
  !wrapper.includes('lazy(() => import("./KerrUncertaintyReplayWitnessV516"))') ||
  wrapper.includes("fetch(") ||
  !route.includes('delivery !== "local-shadow"') ||
  !route.includes('"Cache-Control": "no-store"') ||
  !workbench.includes('from "./KerrPhotonMetrologyObservatoryIntentV516"') ||
  [component, wrapper, route, workbench].some((source) => source.includes("�"))
) {
  throw new Error("v516-source-boundary");
}

for (const [label, manifest, sourceSha256] of [
  ["artifact", artifact.sourceManifest, artifact.sourceSha256],
  ["runtime", runtime.sourceManifest, runtime.sourceSha256],
  ["evidence", evidence.sourceManifest, evidence.sourceSha256],
]) {
  for (const entry of manifest) {
    if (fileSha(entry.path) !== entry.sha256) {
      throw new Error(`v516-${label}-source-manifest:${entry.path}`);
    }
  }
  if (sha(manifest) !== sourceSha256) {
    throw new Error(`v516-${label}-source-manifest-canonical`);
  }
}

for (const path of Object.values(paths)) {
  if (statSync(resolve(root, path)).size <= 0) throw new Error(`v516-empty:${path}`);
}

console.log(
  JSON.stringify(
    {
      status: "passed-v516-low-memory-content-addressed-replay-witness",
      witnessArtifactSha256: artifact.artifactSha256,
      runtimeArtifactSha256: runtime.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      witnesses: 512,
      checkpoints: 8,
      passes: 2,
      chainHead: artifact.chain.headSha256,
      mismatches: 0,
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
