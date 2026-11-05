import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const engineRoot = resolve(root, "..", "..", "orbit-relativity-engine");
const generatedAt = process.env.V587_GENERATED_AT ?? "2026-08-05T00:00:00Z";

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readBytes = (path) => readFileSync(path);
const fileSha = (path) => sha256(readBytes(path));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b)).map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function record(path, { required = true, label = path } = {}) {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    if (required) throw new Error(`v587-governance-missing:${label}:${path}`);
    return { path, exists: false };
  }
  const bytes = statSync(absolute).size;
  return { path, exists: true, bytes, sha256: fileSha(absolute) };
}

function recordEngine(path, { required = true } = {}) {
  const absolute = resolve(engineRoot, path);
  if (!existsSync(absolute)) {
    if (required) throw new Error(`v587-governance-engine-missing:${path}`);
    return { path: `../orbit-relativity-engine/${path}`, exists: false };
  }
  return {
    path: `../../orbit-relativity-engine/${path}`,
    exists: true,
    bytes: statSync(absolute).size,
    sha256: fileSha(absolute),
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function writeJson(path, value) {
  const target = resolve(root, path);
  mkdirSync(resolve(target, ".."), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
}

const formalPointer = readJson("dist/release/orbit-atlas-current-product-evidence-v263.json");
const sparsePointer = readJson("dist/release/orbit-atlas-current-local-shadow-candidate-v560.json");
const inheritedDense = readJson("dist/science/kerr-campaign-v579/campaign-state.json");
const gpuShadow = readJson("dist/science/kerr-gpu-shadow-v580/gpu-differential.json");
const engineArtifactRelativeRoot = "dist/observation-v3-reference-v587-64x64-final";
const engineManifestRelativePath = `${engineArtifactRelativeRoot}/engine-manifest.json`;
const engineConvergenceRelativePath = `${engineArtifactRelativeRoot}/convergence-report.json`;
const engineReverificationRelativePath = `${engineArtifactRelativeRoot}/observation-reverification-receipt.json`;
const engineManifest = JSON.parse(readFileSync(resolve(engineRoot, engineManifestRelativePath), "utf8"));
const convergence = JSON.parse(readFileSync(resolve(engineRoot, engineConvergenceRelativePath), "utf8"));
const engineReverification = JSON.parse(readFileSync(resolve(engineRoot, engineReverificationRelativePath), "utf8"));
const summary = readJson("public/data/kerr-observation-v587/observation-summary.json");
const webReceipt = readJson("public/data/kerr-observation-v587/web-export-receipt.json");
const postBuild = readJson("docs/release/v587/postbuild-acceptance-v587.json");
const visualManifest = readJson("public/data/kerr-observation-v587/visual-manifest.json");
const visualAcceptance = readJson("docs/release/v587/visual-acceptance-v587.json");
const liteBuild = readJson("dist/release/atlas-lite-build-resource-v562.json");
const standaloneBuild = readJson("dist/release/atlas-build-resource-v562.json");
const localBuild = readJson("dist/release/atlas-local-shadow-build-resource-v562.json");

if (formalPointer.version !== "v263-current-product-evidence-pointer") throw new Error("v587-formal-pointer");
if (formalPointer.publicDeploymentBlocked !== true || formalPointer.vercelApplied !== false) throw new Error("v587-formal-boundary");
if (sparsePointer.formalProductPointer !== "v263" || sparsePointer.capabilities.v560DenseScienceImage !== "incomplete-0-of-49") throw new Error("v587-sparse-boundary");
if (inheritedDense.formalProductPointer !== "v263" || inheritedDense.defaultKernel !== "legacy-eih-1pn") throw new Error("v587-inherited-dense-boundary");
if (gpuShadow.boundary?.formalProductPointer !== "v263" || gpuShadow.boundary?.gpuScientificPayloadWritebackAllowed !== false) throw new Error("v587-gpu-boundary");
if (summary.presentationOnly !== true || summary.authority?.measuredAuthorityGranted !== false || summary.authority?.gpuAuthorityGranted !== false || summary.authority?.radiativeTransferGranted !== false) throw new Error("v587-summary-boundary");
if (summary.status !== "qualified-cpu-float64-kerr-observation-reference" || summary.authority?.geometryReferenceGranted !== true || summary.authority?.polarizationTransportReferenceGranted !== true || summary.counts?.unresolvedCellCount !== 0 || summary.benchmarks?.kerrSchildOracle?.executedRayCount !== 64 || summary.benchmarks?.kerrSchildOracle?.qualified !== true) throw new Error("v587-reference-gate");
if (summary.benchmarks?.kerrSchildOracle?.requiredRayCount !== 64 || summary.benchmarks?.kerrSchildOracle?.selection?.stratificationQualified !== true || summary.benchmarks?.kerrSchildOracle?.classificationAgreement !== true || summary.benchmarks?.kerrSchildOracle?.parallelTransportQualified !== true) throw new Error("v587-oracle-coverage-gate");
if (engineManifest.manifestSha256 !== webReceipt.sourceManifestSha256 || engineManifest.summarySha256 !== summary.summarySha256) throw new Error("v587-engine-web-binding");
if (engineManifest.authorityState !== summary.status || engineManifest.artifactSha256 !== summary.authorityReference || engineManifest.sourceSha256 !== postBuild.science?.sourceSha256) throw new Error("v587-engine-authority-binding");
if (engineManifest.manifestSha256 !== postBuild.science?.engineManifestSha256 || engineManifest.artifactSha256 !== postBuild.science?.artifactSha256 || engineManifest.summarySha256 !== postBuild.science?.summarySha256) throw new Error("v587-engine-postbuild-binding");
if (engineReverification.status !== "passed-current-worktree-observation-manifest-and-scientific-roundtrip" || engineReverification.manifestSha256 !== engineManifest.manifestSha256 || engineReverification.scientificVerification?.verified !== true || engineReverification.scientificVerification?.artifactSha256 !== engineManifest.artifactSha256 || engineReverification.scientificVerification?.hdf5RoundTripQualified !== true || engineReverification.scientificVerification?.fitsRoundTripQualified !== true || engineReverification.scientificVerification?.deterministicReplayQualified !== true) throw new Error("v587-engine-reverification-gate");
if (convergence.unresolvedCellCount !== 0 || convergence.threshold !== 0.001 || convergence.qualified !== false || convergence.status !== "candidate-convergence-or-resolution-incomplete") throw new Error("v587-image-convergence-boundary");
if (webReceipt.presentationOnly !== true || webReceipt.scientificPayloadMutation !== false) throw new Error("v587-web-boundary");
if (visualManifest.authorityNamespace !== "candidate-v587" || visualManifest.boundary?.sciencePayloadWriteback !== false || visualManifest.boundary?.productionPromotionAllowed !== false) throw new Error("v587-visual-boundary");
if (!visualAcceptance.status.startsWith("passed-visual-gate") || visualAcceptance.boundary?.promotionAllowed !== false) throw new Error("v587-visual-acceptance-boundary");
if (liteBuild.status !== "passed" || standaloneBuild.status !== "passed") throw new Error("v587-build-boundary");
if (localBuild.status !== "passed" || localBuild.profile !== "local-shadow") throw new Error("v587-local-build-boundary");
if (postBuild.status !== "passed-postbuild-desktop-mobile-science-cinematic-30-minute-soak" || postBuild.qualification?.postBuildRouteQualified !== true || postBuild.qualification?.desktopBrowserQualified !== true || postBuild.qualification?.mobileBrowserQualified !== true || postBuild.qualification?.scienceCinematicPayloadImmutabilityQualified !== true || postBuild.qualification?.scientificScenePerformanceQualified !== true || postBuild.qualification?.soakQualified !== true || postBuild.qualification?.resourceLifecycleQualified !== true || postBuild.qualification?.consolePageRendererErrorsZero !== true || postBuild.browser?.browserErrorCount !== 0 || postBuild.browser?.canvasCount?.minimum !== 1 || postBuild.browser?.canvasCount?.maximum !== 1 || postBuild.browser?.minimumMedianFps < 45 || postBuild.soak?.durationSeconds < 1800 || postBuild.soak?.steadyCycleCount !== 30 || postBuild.soak?.totalSampleCount !== 32 || postBuild.soak?.resourceBaselineReturned !== true) throw new Error("v587-postbuild-boundary");

const frozenPaths = [
  "dist/release/orbit-atlas-current-product-evidence-v263.json",
  "dist/release/orbit-atlas-v263-local-validation-evidence.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v559.json",
  "dist/release/orbit-atlas-current-local-shadow-candidate-v560.json",
  "dist/science/orbit-atlas-shadow-v559-evidence.json",
  "dist/science/orbit-atlas-shadow-v560-evidence.json",
  "dist/content-packs/visual-candidate-v562.manifest.json",
  "dist/science/atlas-visual-candidate-v562/manifest.json",
  "app/data/atlasVisualCandidateAssetsV562.json",
  "app/lib/orbitAtlasPresentation.ts",
  "app/components/GalaxyEnvironmentSphere.tsx",
  "public/textures/sky/orbit-atlas-v9-base-8k.jpg",
  "public/textures/sky/orbit-atlas-v9-base-4k.jpg",
  "public/textures/sky/orbit-atlas-v9-stars-4k.jpg",
  "public/textures/sky/orbit-atlas-v9-stars-2k.jpg",
  "public/textures/sky/orbit-atlas-v9-dust-2k.jpg",
  "public/atlas-lite/textures/sky/orbit-atlas-v9-base-8k.jpg",
  "public/atlas-lite/textures/sky/orbit-atlas-v9-base-4k.jpg",
  "public/atlas-lite/textures/sky/orbit-atlas-v9-stars-4k.jpg",
  "public/atlas-lite/textures/sky/orbit-atlas-v9-stars-2k.jpg",
  "public/atlas-lite/textures/sky/orbit-atlas-v9-dust-2k.jpg",
];
const preservedUserEditPaths = ["next-env.d.ts", "public/textures/README.md"];
const frozenSnapshot = frozenPaths.map((path) => record(path));
const preservedUserEdits = preservedUserEditPaths.map((path) => record(path));
const previousFreezeAuditPath = "docs/release/v587/freeze-audit-v587.json";
const previousFreezeAudit = existsSync(resolve(root, previousFreezeAuditPath)) ? readJson(previousFreezeAuditPath) : null;
function assertSnapshotStable(previousEntries, currentEntries, label) {
  if (!previousEntries) return;
  const currentByPath = new Map(currentEntries.map((entry) => [entry.path, entry]));
  for (const previous of previousEntries) {
    const current = currentByPath.get(previous.path);
    if (!current || current.bytes !== previous.bytes || current.sha256 !== previous.sha256) {
      throw new Error(`v587-${label}-drift:${previous.path}`);
    }
  }
}
assertSnapshotStable(previousFreezeAudit?.frozenSnapshot, frozenSnapshot, "frozen-snapshot");
const preservedUserEditRollovers = [...(previousFreezeAudit?.preservedUserEditRollovers ?? [])];
const nextEnvGeneratedPattern = /^\/\/\/ <reference types="next" \/>\n\/\/\/ <reference types="next\/image-types\/global" \/>\nimport "\.\/\.next-atlas-(lite|standalone|local-shadow)-current\/types\/routes\.d\.ts";\n(?:import "\.\/\.next-atlas-\1-current\/types\/root-params\.d\.ts";\n)?\n\/\/ NOTE: This file should not be edited\n\/\/ see https:\/\/nextjs\.org\/docs\/app\/api-reference\/config\/typescript for more information\.$/;
if (previousFreezeAudit?.preservedUserEdits) {
  const currentByPath = new Map(preservedUserEdits.map((entry) => [entry.path, entry]));
  for (const previous of previousFreezeAudit.preservedUserEdits) {
    const current = currentByPath.get(previous.path);
    if (current && current.bytes === previous.bytes && current.sha256 === previous.sha256) continue;
    const controlledNextEnvRollover = previous.path === "next-env.d.ts"
      && current
      && nextEnvGeneratedPattern.test(readFileSync(resolve(root, current.path), "utf8").replace(/\r\n/g, "\n").trim());
    if (!controlledNextEnvRollover) throw new Error(`v587-preserved-user-edit-drift:${previous.path}`);
    if (!preservedUserEditRollovers.some((entry) => entry.path === previous.path && entry.currentSha256 === current.sha256)) {
      preservedUserEditRollovers.push({
        path: previous.path,
        previousBytes: previous.bytes,
        previousSha256: previous.sha256,
        currentBytes: current.bytes,
        currentSha256: current.sha256,
        reason: "next-16-generated-profile-route-types-rollover-no-manual-rewrite",
      });
    }
  }
}
const freezeUnsigned = {
  version: "v587-frozen-boundary-snapshot-v1",
  generatedAt,
  status: "passed-frozen-v263-v9-v559-v560-v562-byte-snapshot",
  priorSnapshotVerified: previousFreezeAudit !== null,
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  historicalEvidenceRewritten: false,
  frozenSnapshot,
  preservedUserEdits,
  preservedUserEditRollovers,
};
const freezeAudit = { ...freezeUnsigned, snapshotSha256: canonicalSha(freezeUnsigned) };

const engineSourceManifest = (engineManifest.sourceManifest ?? []).map((entry) => ({
  path: `../../orbit-relativity-engine/${entry.path}`,
  bytes: entry.bytes,
  sha256: entry.sha256,
}));
const v587SourcePaths = [
  "app/components/KerrObservationStageV587.tsx",
  "app/components/OrbitAtlasKerrObservatoryV587.tsx",
  "app/components/OrbitAtlasKerrObservatoryV587Lazy.tsx",
  "app/components/OrbitAtlasKerrObservatoryV587.test.tsx",
  "app/components/UniverseCanvas.tsx",
  "app/lib/atlasProxyContractV562.ts",
  "app/lib/kerrObservationV587.ts",
  "app/lib/kerrObservationV587.test.ts",
  "app/lib/kerrObservationVisualV587.test.ts",
  "app/lib/useV587Ktx2Texture.ts",
  "app/workers/kerrObservationProjectionV587.worker.ts",
  "app/local-shadow-v587/page.tsx",
  "scripts/build-v587-governance.mjs",
  "scripts/verify-v587-governance.mjs",
  "scripts/build-v587-postbuild-acceptance.mjs",
  "scripts/build-v587-visual-manifest.mjs",
  "scripts/build-v587-visual-acceptance.mjs",
  "scripts/build-atlas-profile.mjs",
  "scripts/run-atlas-current-focused-v562.mjs",
  "scripts/start-atlas-standalone.mjs",
  "design-qa.md",
];
const visualSourcePaths = [...new Set(visualManifest.assets.map((asset) => asset.sourcePath))];
const sourceManifest = [
  ...v587SourcePaths.map((path) => record(path)),
  record("public/data/kerr-observation-v587/observation-summary.json"),
  record("public/data/kerr-observation-v587/web-export-receipt.json"),
  record("public/data/kerr-observation-v587/visual-manifest.json"),
  ...visualSourcePaths.map((path) => record(path)),
  ...visualManifest.assets.flatMap((asset) => [
    record(`public${asset.ktx2}`),
    record(`public${asset.preview}`),
  ]),
  record("docs/release/v587/visual-acceptance-v587.json"),
  ...visualAcceptance.screenshots.map((entry) => record(entry.path)),
  record("docs/release/v587/postbuild-acceptance-v587.json"),
  record(postBuild.evidence.rawSoak.path),
  ...postBuild.evidence.screenshots.map((entry) => record(entry.path)),
  record("dist/release/atlas-lite-build-resource-v562.json"),
  record("dist/release/atlas-build-resource-v562.json"),
  record("dist/release/atlas-local-shadow-build-resource-v562.json"),
  recordEngine(engineManifestRelativePath),
  recordEngine(engineConvergenceRelativePath),
  recordEngine(engineReverificationRelativePath),
  ...engineSourceManifest,
].sort((left, right) => left.path.localeCompare(right.path));
const finalImageAreaChange = convergence.changes.at(-1)?.maximumRelativeChange ?? null;

const currentStateUnsigned = {
  version: "v587-orbit-atlas-current-state-receipt-v1",
  generatedAt,
  status: "candidate-observation-reference-ks-64-of-64-zero-unresolved-postbuild-browser-and-soak-qualified-image-convergence-pending",
  formalProduct: {
    pointer: "v263",
    defaultKernel: "legacy-eih-1pn",
    pointerPath: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    pointerSha256: fileSha(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json")),
    mutableByV587: false,
  },
  lanes: {
    v586TransportReference: {
      namespace: "kerr-transport-reference-v586",
      path: "../../orbit-relativity-engine/dist/kerr-transport-reference-v586/transport/transport-manifest.json",
      artifactSha256: fileSha(resolve(engineRoot, "dist/kerr-transport-reference-v586/transport/transport.json")),
      authorityState: "qualified-cpu-walker-penrose-independent-numerical-connection-parallel-transport",
      promotionAllowed: false,
    },
    activeSparseAtlasAuthority: {
      namespace: "v560-sparse-observation-envelope",
      path: "dist/release/orbit-atlas-current-local-shadow-candidate-v560.json",
      pointerSha256: fileSha(resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v560.json")),
      authorityState: sparsePointer.status,
      denseStatus: "incomplete-0-of-49",
      promotionAllowed: false,
    },
    v579InheritedDense: {
      namespace: "v579-inherited-dense-evidence",
      path: "dist/science/kerr-campaign-v579/campaign-state.json",
      stateSha256: inheritedDense.stateSha256,
      authorityState: "inherited-not-active-authority",
      denseStatus: "complete-inherited-not-promotable",
      promotionAllowed: false,
    },
    v580GpuInitializationShadow: {
      namespace: "v580-observer-initial-state-gpu-shadow",
      path: "dist/science/kerr-gpu-shadow-v580/gpu-differential.json",
      receiptSha256: gpuShadow.receiptSha256,
      authorityState: "shadow-only",
      scientificPayloadWritebackAllowed: false,
      promotionAllowed: false,
    },
    v587ObservationCandidate: {
      namespace: "v587-event-horizon-observatory",
      engineManifestSha256: engineManifest.manifestSha256,
      artifactSha256: engineManifest.artifactSha256,
      sourceSha256: engineManifest.sourceSha256,
      summarySha256: summary.summarySha256,
      webReceiptSha256: webReceipt.receiptSha256,
      engineReverificationResultSha256: engineReverification.resultSha256,
      convergenceReportSha256: convergence.reportSha256,
      visualManifestSha256: visualManifest.manifestSha256,
      visualAcceptanceReceiptSha256: visualAcceptance.receiptSha256,
      postBuildAcceptanceReceiptSha256: postBuild.receiptSha256,
      liteBuildStatus: liteBuild.status,
      standaloneBuildStatus: standaloneBuild.status,
      localShadowBuildStatus: localBuild.status,
      localShadowBuildId: postBuild.build.localShadow.buildId,
      kerrSchildOracle: {
        requiredRayCount: summary.benchmarks.kerrSchildOracle.requiredRayCount,
        executedRayCount: summary.benchmarks.kerrSchildOracle.executedRayCount,
        stratificationQualified: summary.benchmarks.kerrSchildOracle.selection.stratificationQualified,
        qualified: summary.benchmarks.kerrSchildOracle.qualified,
      },
      adaptiveSampling: {
        rayCount: summary.counts.rayCount,
        eventCount: summary.counts.eventCount,
        unresolvedCellCount: summary.counts.unresolvedCellCount,
        projectionMaskedCellCount: summary.counts.projectionMaskedCellCount,
        projectionMaskedAreaM2: summary.counts.projectionMaskedAreaM2,
        projectionMaskedCellsExcludedFromDerivedWebFields: true,
      },
      postBuildQualification: {
        desktopBrowserQualified: postBuild.qualification.desktopBrowserQualified,
        mobileBrowserQualified: postBuild.qualification.mobileBrowserQualified,
        scientificScenePerformanceQualified: postBuild.qualification.scientificScenePerformanceQualified,
        soakQualified: postBuild.qualification.soakQualified,
        resourceLifecycleQualified: postBuild.qualification.resourceLifecycleQualified,
        browserErrorCount: postBuild.browser.browserErrorCount,
        steadyCycleCount: postBuild.soak.steadyCycleCount,
        durationSeconds: postBuild.soak.durationSeconds,
      },
      imageConvergence: {
        threshold: convergence.threshold,
        finalMaximumRelativeChange: finalImageAreaChange,
        qualified: false,
        status: convergence.status,
      },
      authorityState: summary.status,
      promotionAllowed: false,
    },
  },
  authority: {
    geometryReferenceGranted: summary.authority.geometryReferenceGranted === true,
    polarizationTransportReferenceGranted: summary.authority.polarizationTransportReferenceGranted === true,
    radiativeTransferGranted: false,
    measuredAuthorityGranted: false,
    gpuAuthorityGranted: false,
  },
  boundary: {
    formalProductPointer: "v263",
    historicalV263EvidenceRewritten: false,
    legacyV9Rewritten: false,
    legacyEih1pnMutated: false,
    v559EvidenceRewritten: false,
    v560EvidenceRewritten: false,
    v562CandidateRewritten: false,
    researchCandidateOnly: true,
    finalSourceBrowserVisualQualified: true,
    postBuildBrowserReplayBlocked: false,
    postBuildBrowserReplayQualified: true,
    soakQualified: true,
    resourceLifecycleQualified: true,
    imageConvergenceQualified: false,
    denseImageAuthorityGranted: false,
    projectionMaskedCellsExcludedFromDerivedWebFields: true,
    liteBuildPassed: true,
    standaloneBuildPassed: true,
    localShadowBuildPassed: true,
    denseCampaignStatus: "incomplete-0-of-49",
    denseExecutionStartedByV587: false,
    gpuRaytraceStartedByV587: false,
    ixpePayloadDownloadedByV587: false,
    productionDeploymentByV587: false,
    publicReleaseByV587: false,
  },
  frozenSnapshotSha256: freezeAudit.snapshotSha256,
  sourceManifest,
};
const currentState = { ...currentStateUnsigned, sourceSha256: canonicalSha(sourceManifest), receiptSha256: canonicalSha(currentStateUnsigned) };

const candidatePointerUnsigned = {
  version: "orbit-atlas-current-research-candidate-v587",
  generatedAt,
  status: "research-candidate-not-active-image-convergence-pending",
  candidate: "v587-event-horizon-observatory",
  route: "/local-shadow-v587",
  engine: "v3-kerr-observation-reference",
  visual: "v587-kerr-observatory-single-canvas-postbuild-browser-and-soak-qualified",
  sourceReceipt: "docs/release/v587/current-state-receipt-v587.json",
  sourceReceiptSha256: currentState.receiptSha256,
  formalProductPointer: "v263",
  defaultKernel: "legacy-eih-1pn",
  activeProductPointerChanged: false,
  researchCandidatePointerOnly: true,
  promotionAllowed: false,
  publicPreviewAuthorization: false,
  kerrSchildOracle: "64-of-64-qualified",
  unresolvedQuadtreeCellCount: 0,
  projectionMaskedCellCount: summary.counts.projectionMaskedCellCount,
  postBuildBrowserReplayQualified: true,
  soakQualified: true,
  imageConvergenceQualified: false,
  denseImageAuthorityGranted: false,
  denseCampaignStatus: "incomplete-0-of-49",
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  radiativeTransferGranted: false,
  githubPushAttempted: false,
  productionDeploymentAttempted: false,
};
const candidatePointer = { ...candidatePointerUnsigned, pointerSha256: canonicalSha(candidatePointerUnsigned) };

writeJson("docs/release/v587/freeze-audit-v587.json", freezeAudit);
writeJson("docs/release/v587/current-state-receipt-v587.json", currentState);
writeJson("dist/release/orbit-atlas-current-research-candidate-v587.json", candidatePointer);

console.log(JSON.stringify({
  status: currentState.status,
  freezeAuditSha256: freezeAudit.snapshotSha256,
  currentStateReceiptSha256: currentState.receiptSha256,
  candidatePointerSha256: candidatePointer.pointerSha256,
  formalProductPointer: "v263",
  kerrSchildOracle: "64/64",
  unresolvedQuadtreeCellCount: 0,
  postBuildBrowserReplayQualified: true,
  soakQualified: true,
  imageConvergenceQualified: false,
  denseCampaignStatus: "incomplete-0-of-49",
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
}, null, 2));
