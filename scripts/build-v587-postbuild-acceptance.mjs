import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync, renameSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const engineRoot = resolve(root, "..", "..", "orbit-relativity-engine");
const rawPath = "docs/release/v587/postbuild-qa/browser-soak-raw-v587.json";
const outputPath = "docs/release/v587/postbuild-acceptance-v587.json";
const engineManifestPath = "dist/observation-v3-reference-v587-64x64-final/engine-manifest.json";
const screenshotPaths = [
  "docs/release/v587/postbuild-qa/final-desktop-science-1440x900.png",
  "docs/release/v587/postbuild-qa/final-desktop-cinematic-1440x900.png",
  "docs/release/v587/postbuild-qa/final-mobile-science-390x844.png",
  "docs/release/v587/postbuild-qa/final-mobile-cinematic-390x844.png",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value === null || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.keys(value).sort((left, right) => left.localeCompare(right)).map((key) => [key, canonicalize(value[key])]));
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const readEngineJson = (path) => JSON.parse(readFileSync(resolve(engineRoot, path), "utf8"));
const fileRecord = (path) => {
  const absolute = resolve(root, path);
  const bytes = readFileSync(absolute);
  return { path, bytes: statSync(absolute).size, sha256: sha256(bytes) };
};

const raw = readJson(rawPath);
const summary = readJson("public/data/kerr-observation-v587/observation-summary.json");
const webReceipt = readJson("public/data/kerr-observation-v587/web-export-receipt.json");
const engineManifest = readEngineJson(engineManifestPath);
const liteBuild = readJson("dist/release/atlas-lite-build-resource-v562.json");
const standaloneBuild = readJson("dist/release/atlas-build-resource-v562.json");
const localBuild = readJson("dist/release/atlas-local-shadow-build-resource-v562.json");
const formalPointer = readJson("dist/release/orbit-atlas-current-product-evidence-v263.json");
const dense = readJson("dist/science/kerr-campaign-v314/campaign-state.json");
const localBuildId = readFileSync(resolve(root, ".next-atlas-local-shadow-current/BUILD_ID"), "utf8").trim();
const liteBuildId = readFileSync(resolve(root, ".next-atlas-lite-current/BUILD_ID"), "utf8").trim();
const standaloneBuildId = readFileSync(resolve(root, ".next-atlas-standalone-current/BUILD_ID"), "utf8").trim();
const samples = raw.samples ?? [];
const steady = samples.filter((sample) => sample.phase === "steady");
const baseline = samples[0];
const released = samples.at(-1);
const failures = [];
const check = (condition, reason) => { if (!condition) failures.push(reason); };
const resourceKeys = ["programs", "textures", "renderTargets", "resourceBytes", "resourceGpuBytes"];
const sameResources = baseline && released && resourceKeys.every((key) => baseline[key] === released[key]);
const unique = (values) => [...new Set(values)];
const minimum = (values) => Math.min(...values);
const maximum = (values) => Math.max(...values);

check(raw.version === "v587-postbuild-browser-soak-raw-v1", "raw-version");
check(Number(raw.durationSeconds) >= 1800, "soak-duration");
check(samples.length === 32 && steady.length === 30, "soak-sample-count");
check(samples.every((sample) => sample.status === "ready" && sample.blockedReason === "none"), "runtime-ready");
check(samples.every((sample) => sample.payloadStable === "true"), "payload-stability");
check(unique(samples.map((sample) => sample.payloadSha)).length === 1, "payload-sha-uniqueness");
check(samples.every((sample) => sample.payloadSha === summary.authorityReference), "payload-sha-binding");
check(samples.every((sample) => sample.canvasCount === 1), "single-canvas");
check(unique(steady.map((sample) => sample.variant)).sort().join(",") === "desktop,mobile", "variant-coverage");
check(unique(steady.map((sample) => sample.mode)).sort().join(",") === "cinematic,science", "mode-coverage");
check(minimum(steady.map((sample) => sample.medianFps)) >= 45, "scientific-fps");
check(maximum(steady.map((sample) => sample.frameP95Ms)) <= 1000 / 45, "scientific-frame-p95");
check(samples.every((sample) => sample.renderTargets === 0), "render-target-leak");
check(sameResources, "resource-baseline-return");
check(Array.isArray(raw.browserErrors) && raw.browserErrors.length === 0, "browser-errors");
check(summary.status === "qualified-cpu-float64-kerr-observation-reference", "summary-status");
check(summary.counts?.unresolvedCellCount === 0, "quadtree-unresolved");
check(summary.benchmarks?.kerrSchildOracle?.executedRayCount === 64, "ks-executed");
check(summary.benchmarks?.kerrSchildOracle?.requiredRayCount === 64, "ks-required");
check(summary.benchmarks?.kerrSchildOracle?.qualified === true, "ks-qualified");
check(summary.authority?.geometryReferenceGranted === true, "geometry-reference");
check(summary.authority?.polarizationTransportReferenceGranted === true, "polarization-reference");
check(summary.authority?.radiativeTransferGranted === false, "radiative-boundary");
check(summary.authority?.measuredAuthorityGranted === false, "measured-boundary");
check(summary.authority?.gpuAuthorityGranted === false, "gpu-boundary");
check(engineManifest.manifestSha256 === webReceipt.sourceManifestSha256, "web-engine-manifest-binding");
check(engineManifest.summarySha256 === summary.summarySha256, "summary-engine-binding");
check([liteBuild, standaloneBuild, localBuild].every((receipt) => receipt.status === "passed"), "build-status");
check([liteBuild, standaloneBuild, localBuild].every((receipt) => receipt.heapMb === 8192), "build-heap-policy");
check(localBuild.profile === "local-shadow" && localBuild.rootPageHeldForLocalShadow === true, "local-build-profile");
check(formalPointer.version === "v263-current-product-evidence-pointer", "formal-pointer");
check(dense.status === "incomplete-0-of-49" && dense.completedShardCount === 0, "dense-boundary");

const unsigned = {
  version: "v587-postbuild-browser-acceptance-receipt-v1",
  generatedAt: raw.finishedAt,
  status: failures.length === 0
    ? "passed-postbuild-desktop-mobile-science-cinematic-30-minute-soak"
    : "blocked-postbuild-browser-or-soak-gate",
  build: {
    lite: { buildId: liteBuildId, profile: liteBuild.profile, status: liteBuild.status, heapMb: liteBuild.heapMb, rollbackSlotAvailable: liteBuild.rollbackSlotAvailable },
    standalone: { buildId: standaloneBuildId, profile: standaloneBuild.profile, status: standaloneBuild.status, heapMb: standaloneBuild.heapMb, rollbackSlotAvailable: standaloneBuild.rollbackSlotAvailable },
    localShadow: { buildId: localBuildId, profile: localBuild.profile, status: localBuild.status, heapMb: localBuild.heapMb, rollbackSlotAvailable: localBuild.rollbackSlotAvailable },
    swcRuntime: localBuild.swcRuntime,
    formalProfilesExcludeV587Route: true,
  },
  science: {
    engineManifestPath: `../../orbit-relativity-engine/${engineManifestPath}`,
    engineManifestSha256: engineManifest.manifestSha256,
    artifactSha256: engineManifest.artifactSha256,
    sourceSha256: engineManifest.sourceSha256,
    summarySha256: summary.summarySha256,
    scientificPayloadSha256: summary.authorityReference,
    rays: summary.counts.rayCount,
    events: summary.counts.eventCount,
    kerrSchildOracle: `${summary.benchmarks.kerrSchildOracle.executedRayCount}/${summary.benchmarks.kerrSchildOracle.requiredRayCount}`,
    unresolvedCellCount: summary.counts.unresolvedCellCount,
    projectionMaskedCellCount: summary.counts.projectionMaskedCellCount,
    projectionMaskedAreaM2: summary.counts.projectionMaskedAreaM2,
    geometryReferenceGranted: true,
    polarizationTransportReferenceGranted: true,
  },
  browser: {
    surface: "Codex In-app Browser",
    route: "http://127.0.0.1:3001/local-shadow-v587",
    desktopViewport: [1440, 900],
    mobileViewport: [390, 844],
    modes: unique(steady.map((sample) => sample.mode)).sort(),
    variants: unique(steady.map((sample) => sample.variant)).sort(),
    canvasCount: { minimum: minimum(samples.map((sample) => sample.canvasCount)), maximum: maximum(samples.map((sample) => sample.canvasCount)) },
    browserErrorCount: raw.browserErrors.length,
    minimumMedianFps: minimum(steady.map((sample) => sample.medianFps)),
    maximumFrameP95Ms: maximum(steady.map((sample) => sample.frameP95Ms)),
  },
  soak: {
    startedAt: raw.startedAt,
    finishedAt: raw.finishedAt,
    durationSeconds: raw.durationSeconds,
    steadyCycleCount: steady.length,
    totalSampleCount: samples.length,
    baseline: Object.fromEntries(resourceKeys.map((key) => [key, baseline[key]])),
    released: Object.fromEntries(resourceKeys.map((key) => [key, released[key]])),
    resourceBaselineReturned: sameResources,
    maximumPrograms: maximum(steady.map((sample) => sample.programs)),
    maximumTextures: maximum(steady.map((sample) => sample.textures)),
    maximumRenderTargets: maximum(steady.map((sample) => sample.renderTargets)),
    maximumTrackedBytes: maximum(steady.map((sample) => sample.resourceBytes)),
    maximumTrackedGpuBytes: maximum(steady.map((sample) => sample.resourceGpuBytes)),
  },
  evidence: {
    rawSoak: fileRecord(rawPath),
    screenshots: screenshotPaths.map(fileRecord),
    webExportReceipt: fileRecord("public/data/kerr-observation-v587/web-export-receipt.json"),
    summary: fileRecord("public/data/kerr-observation-v587/observation-summary.json"),
  },
  qualification: {
    postBuildRouteQualified: failures.length === 0,
    desktopBrowserQualified: failures.length === 0,
    mobileBrowserQualified: failures.length === 0,
    scienceCinematicPayloadImmutabilityQualified: failures.length === 0,
    scientificScenePerformanceQualified: failures.length === 0,
    soakQualified: failures.length === 0,
    resourceLifecycleQualified: failures.length === 0,
    consolePageRendererErrorsZero: failures.length === 0,
  },
  failures,
  boundary: {
    formalProductPointer: "v263",
    formalProductPointerChanged: false,
    denseCampaignStatus: "incomplete-0-of-49",
    denseExecutedByV587: false,
    gpuAuthorityGranted: false,
    measuredAuthorityGranted: false,
    radiativeTransferGranted: false,
    productionDeploymentAttempted: false,
    publicReleaseAttempted: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
const target = resolve(root, outputPath);
mkdirSync(resolve(target, ".."), { recursive: true });
const part = `${target}.${process.pid}.part`;
writeFileSync(part, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
renameSync(part, target);
console.log(JSON.stringify({ status: receipt.status, receiptSha256: receipt.receiptSha256, durationSeconds: raw.durationSeconds, steadyCycles: steady.length, minimumMedianFps: receipt.browser.minimumMedianFps, maximumFrameP95Ms: receipt.browser.maximumFrameP95Ms, resourceBaselineReturned: sameResources, browserErrors: raw.browserErrors.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
