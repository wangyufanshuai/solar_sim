import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const engineRoot = resolve(root, "..", "..", "orbit-relativity-engine");
const engineArtifactRelativeRoot = "dist/observation-v3-reference-v587-64x64-final";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fileSha = (path) => sha256(readFileSync(path));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b)).map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readEngineJson = (path) => JSON.parse(readFileSync(resolve(engineRoot, path), "utf8"));

const freeze = readJson("docs/release/v587/freeze-audit-v587.json");
const state = readJson("docs/release/v587/current-state-receipt-v587.json");
const pointer = readJson("dist/release/orbit-atlas-current-research-candidate-v587.json");
const formal = readJson("dist/release/orbit-atlas-current-product-evidence-v263.json");
const dense = readJson("dist/science/kerr-campaign-v314/campaign-state.json");
const summary = readJson("public/data/kerr-observation-v587/observation-summary.json");
const webReceipt = readJson("public/data/kerr-observation-v587/web-export-receipt.json");
const postBuild = readJson("docs/release/v587/postbuild-acceptance-v587.json");
const liteBuild = readJson("dist/release/atlas-lite-build-resource-v562.json");
const standaloneBuild = readJson("dist/release/atlas-build-resource-v562.json");
const localBuild = readJson("dist/release/atlas-local-shadow-build-resource-v562.json");
const engineManifest = readEngineJson(`${engineArtifactRelativeRoot}/engine-manifest.json`);
const convergence = readEngineJson(`${engineArtifactRelativeRoot}/convergence-report.json`);
const engineReverification = readEngineJson(`${engineArtifactRelativeRoot}/observation-reverification-receipt.json`);

const failures = [];
const check = (condition, reason) => { if (!condition) failures.push(reason); };
const without = (value, ...keys) => {
  const copy = { ...value };
  for (const key of keys) delete copy[key];
  return copy;
};
const verifyFileRecord = (entry, base, prefix) => {
  const absolute = resolve(base, entry.path);
  check(existsSync(absolute), `${prefix}-missing:${entry.path}`);
  if (!existsSync(absolute)) return;
  check(statSync(absolute).size === entry.bytes, `${prefix}-bytes:${entry.path}`);
  check(fileSha(absolute) === entry.sha256, `${prefix}-sha:${entry.path}`);
};

for (const entry of freeze.frozenSnapshot ?? []) verifyFileRecord(entry, root, "frozen");
for (const entry of freeze.preservedUserEdits ?? []) verifyFileRecord(entry, root, "preserved-edit");
for (const entry of state.sourceManifest ?? []) verifyFileRecord(entry, root, "source");
for (const entry of engineManifest.sourceManifest ?? []) verifyFileRecord(entry, engineRoot, "engine-source");
for (const entry of engineManifest.files ?? []) verifyFileRecord(entry, resolve(engineRoot, engineArtifactRelativeRoot), "engine-artifact");
for (const entry of postBuild.evidence?.screenshots ?? []) verifyFileRecord(entry, root, "postbuild-screenshot");
if (postBuild.evidence?.rawSoak) verifyFileRecord(postBuild.evidence.rawSoak, root, "postbuild-soak");

check(freeze.snapshotSha256 === canonicalSha(without(freeze, "snapshotSha256")), "freeze-receipt-sha");
check(state.sourceSha256 === canonicalSha(state.sourceManifest), "state-source-sha");
check(state.receiptSha256 === canonicalSha(without(state, "sourceSha256", "receiptSha256")), "state-receipt-sha");
check(pointer.pointerSha256 === canonicalSha(without(pointer, "pointerSha256")), "candidate-pointer-sha");
check(postBuild.receiptSha256 === canonicalSha(without(postBuild, "receiptSha256")), "postbuild-receipt-sha");

const requiredEvidencePaths = [
  "docs/release/v587/postbuild-acceptance-v587.json",
  "docs/release/v587/postbuild-qa/browser-soak-raw-v587.json",
  "docs/release/v587/postbuild-qa/final-desktop-science-1440x900.png",
  "docs/release/v587/postbuild-qa/final-desktop-cinematic-1440x900.png",
  "docs/release/v587/postbuild-qa/final-mobile-science-390x844.png",
  "docs/release/v587/postbuild-qa/final-mobile-cinematic-390x844.png",
  "dist/release/atlas-local-shadow-build-resource-v562.json",
  "scripts/build-v587-postbuild-acceptance.mjs",
  "scripts/start-atlas-standalone.mjs",
  `../../orbit-relativity-engine/${engineArtifactRelativeRoot}/engine-manifest.json`,
  `../../orbit-relativity-engine/${engineArtifactRelativeRoot}/convergence-report.json`,
  `../../orbit-relativity-engine/${engineArtifactRelativeRoot}/observation-reverification-receipt.json`,
];
const recordedPaths = new Set((state.sourceManifest ?? []).map((entry) => entry.path));
for (const path of requiredEvidencePaths) check(recordedPaths.has(path), `source-evidence-unbound:${path}`);

check(formal.version === "v263-current-product-evidence-pointer", "formal-pointer-version");
check(formal.publicDeploymentBlocked === true && formal.vercelApplied === false, "formal-deployment-boundary");
check(state.formalProduct.pointer === "v263" && state.formalProduct.mutableByV587 === false, "state-formal-pointer");
check(state.formalProduct.pointerSha256 === fileSha(resolve(root, state.formalProduct.pointerPath)), "state-formal-pointer-sha");
check(state.status === "candidate-observation-reference-ks-64-of-64-zero-unresolved-postbuild-browser-and-soak-qualified-image-convergence-pending", "state-status");
check(pointer.formalProductPointer === "v263" && pointer.activeProductPointerChanged === false, "candidate-active-pointer-boundary");
check(pointer.status === "research-candidate-not-active-image-convergence-pending" && pointer.promotionAllowed === false && pointer.publicPreviewAuthorization === false, "candidate-promotion-boundary");
check(pointer.sourceReceiptSha256 === state.receiptSha256, "candidate-state-binding");
check(pointer.denseCampaignStatus === "incomplete-0-of-49" && pointer.denseImageAuthorityGranted === false, "candidate-dense-boundary");
check(pointer.measuredAuthorityGranted === false && pointer.gpuAuthorityGranted === false && pointer.radiativeTransferGranted === false, "candidate-authority-boundary");
check(dense.status === "incomplete-0-of-49" && dense.completedShardCount === 0, "dense-zero-of-49-boundary");

const oracle = summary.benchmarks?.kerrSchildOracle;
check(summary.status === "qualified-cpu-float64-kerr-observation-reference", "summary-status");
check(summary.counts?.rayCount === 1380 && summary.counts?.eventCount === 3179, "summary-ray-event-count");
check(summary.counts?.unresolvedCellCount === 0, "summary-unresolved");
check(summary.counts?.projectionMaskedCellCount === postBuild.science?.projectionMaskedCellCount, "summary-projection-mask-count");
check(summary.counts?.projectionMaskedAreaM2 === postBuild.science?.projectionMaskedAreaM2, "summary-projection-mask-area");
check(oracle?.requiredRayCount === 64 && oracle?.requestedRayCount === 64 && oracle?.executedRayCount === 64, "ks-oracle-64-of-64");
check(oracle?.selection?.stratificationQualified === true && oracle?.classificationAgreement === true && oracle?.parallelTransportQualified === true && oracle?.qualified === true, "ks-oracle-qualification");
check(oracle?.selection?.selectedClassificationCounts?.capture > 0 && oracle?.selection?.selectedClassificationCounts?.disk_hit > 0 && oracle?.selection?.selectedClassificationCounts?.escape > 0, "ks-terminal-stratification");
check(oracle?.selection?.selectedRadialTurnCount > 0 && oracle?.selection?.selectedPolarTurnCount > 0 && oracle?.selection?.selectedSeparatrixCount >= oracle?.selection?.requiredSeparatrixCount, "ks-turning-separatrix-stratification");
check(oracle?.maxEndpointDifferenceM <= oracle?.thresholds?.endpointDifferenceM, "ks-endpoint-threshold");
check(oracle?.maxRedshiftRelativeDifference <= oracle?.thresholds?.redshiftRelativeDifference, "ks-redshift-threshold");
check(oracle?.maxEvpaDifferenceRad <= oracle?.thresholds?.evpaDifferenceRad, "ks-evpa-threshold");
check(oracle?.maxRegularNormalizedHamiltonian <= oracle?.thresholds?.regularNormalizedHamiltonian, "ks-regular-hamiltonian-threshold");
check(oracle?.maxSeparatrixNormalizedHamiltonian <= oracle?.thresholds?.separatrixNormalizedHamiltonian, "ks-separatrix-hamiltonian-threshold");
check(oracle?.maxWalkerPenroseRelativeDrift <= oracle?.thresholds?.walkerPenroseRelativeDrift, "ks-walker-penrose-threshold");

check(engineManifest.manifestSha256 === webReceipt.sourceManifestSha256 && engineManifest.manifestSha256 === postBuild.science?.engineManifestSha256, "engine-web-postbuild-manifest-binding");
check(engineManifest.artifactSha256 === summary.authorityReference && engineManifest.artifactSha256 === postBuild.science?.artifactSha256, "engine-scientific-payload-binding");
check(engineManifest.summarySha256 === summary.summarySha256 && engineManifest.summarySha256 === postBuild.science?.summarySha256, "engine-summary-binding");
check(engineManifest.sourceSha256 === postBuild.science?.sourceSha256, "engine-source-binding");
check(engineManifest.authorityState === summary.status && engineManifest.files?.length === 19, "engine-manifest-contract");
check(engineReverification.status === "passed-current-worktree-observation-manifest-and-scientific-roundtrip", "engine-reverification-status");
check(engineReverification.manifestSha256 === engineManifest.manifestSha256 && engineReverification.scientificVerification?.artifactSha256 === engineManifest.artifactSha256, "engine-reverification-binding");
check(engineReverification.scientificVerification?.verified === true && engineReverification.scientificVerification?.hdf5RoundTripQualified === true && engineReverification.scientificVerification?.fitsRoundTripQualified === true && engineReverification.scientificVerification?.deterministicReplayQualified === true, "engine-scientific-roundtrip");
check(summary.authority?.geometryReferenceGranted === true && summary.authority?.polarizationTransportReferenceGranted === true, "summary-reference-authority");
check(summary.authority?.measuredAuthorityGranted === false && summary.authority?.gpuAuthorityGranted === false && summary.authority?.radiativeTransferGranted === false, "summary-authority-boundary");
check(webReceipt.sourceVerified === true && webReceipt.presentationOnly === true && webReceipt.scientificPayloadMutation === false, "web-presentation-boundary");

check(convergence.unresolvedCellCount === 0 && convergence.threshold === 0.001, "convergence-contract");
check(convergence.qualified === false && convergence.status === "candidate-convergence-or-resolution-incomplete", "image-convergence-remains-pending");
check(state.boundary?.imageConvergenceQualified === false && state.boundary?.denseImageAuthorityGranted === false && pointer.imageConvergenceQualified === false, "image-authority-boundary");
check(state.boundary?.projectionMaskedCellsExcludedFromDerivedWebFields === true, "projection-mask-boundary");

check([liteBuild, standaloneBuild, localBuild].every((receipt) => receipt.status === "passed" && receipt.heapMb === 8192 && receipt.rollbackSlotAvailable === true), "build-receipt-boundary");
check(localBuild.profile === "local-shadow" && localBuild.rootPageHeldForLocalShadow === true, "local-shadow-build-profile");
check(postBuild.status === "passed-postbuild-desktop-mobile-science-cinematic-30-minute-soak", "postbuild-status");
check(postBuild.qualification?.postBuildRouteQualified === true && postBuild.qualification?.desktopBrowserQualified === true && postBuild.qualification?.mobileBrowserQualified === true, "postbuild-browser-qualification");
check(postBuild.qualification?.scienceCinematicPayloadImmutabilityQualified === true && postBuild.qualification?.scientificScenePerformanceQualified === true, "postbuild-science-qualification");
check(postBuild.qualification?.soakQualified === true && postBuild.qualification?.resourceLifecycleQualified === true && postBuild.qualification?.consolePageRendererErrorsZero === true, "postbuild-soak-qualification");
check(postBuild.browser?.browserErrorCount === 0 && postBuild.browser?.canvasCount?.minimum === 1 && postBuild.browser?.canvasCount?.maximum === 1, "postbuild-browser-runtime");
check(postBuild.browser?.minimumMedianFps >= 45 && postBuild.browser?.maximumFrameP95Ms <= 1000 / 45, "postbuild-performance");
check(postBuild.soak?.durationSeconds >= 1800 && postBuild.soak?.steadyCycleCount === 30 && postBuild.soak?.totalSampleCount === 32 && postBuild.soak?.resourceBaselineReturned === true, "postbuild-soak-runtime");
check(state.boundary?.postBuildBrowserReplayBlocked === false && state.boundary?.postBuildBrowserReplayQualified === true && state.boundary?.soakQualified === true && state.boundary?.resourceLifecycleQualified === true, "state-postbuild-boundary");

check(existsSync(resolve(root, "proxy.ts")), "proxy-entry-missing");
check(!existsSync(resolve(root, "middleware.ts")), "next-double-entry");
check(existsSync(resolve(root, "app/local-shadow-v587/page.tsx")), "v587-route-missing");

const unsigned = {
  version: "v587-governance-verification-receipt-v2",
  status: failures.length === 0
    ? "passed-ks-64-of-64-zero-unresolved-postbuild-browser-soak-and-frozen-boundary"
    : "blocked-v587-governance-drift",
  formalProductPointer: "v263",
  candidatePointer: pointer.pointerSha256,
  currentStateReceipt: state.receiptSha256,
  freezeSnapshot: freeze.snapshotSha256,
  engineManifestSha256: engineManifest.manifestSha256,
  scientificPayloadSha256: engineManifest.artifactSha256,
  kerrSchildOracle: `${oracle?.executedRayCount ?? 0}/${oracle?.requiredRayCount ?? 64}`,
  unresolvedQuadtreeCellCount: summary.counts?.unresolvedCellCount,
  projectionMaskedCellCount: summary.counts?.projectionMaskedCellCount,
  postBuildAcceptanceReceiptSha256: postBuild.receiptSha256,
  soakDurationSeconds: postBuild.soak?.durationSeconds,
  soakSteadyCycleCount: postBuild.soak?.steadyCycleCount,
  imageConvergenceQualified: false,
  failureCount: failures.length,
  failures,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  radiativeTransferGranted: false,
  denseCampaignStatus: "incomplete-0-of-49",
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
const target = resolve(root, "docs/release/v587/governance-verification-v587.json");
mkdirSync(resolve(target, ".."), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
renameSync(part, target);
if (failures.length) {
  console.error(JSON.stringify(receipt, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(receipt, null, 2));
}
