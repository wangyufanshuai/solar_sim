import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const rawSamplesPath = "docs/release/v592/browser-soak-raw-samples-heap-v592.csv";
const rawReleasePath = "docs/release/v592/browser-release-restore-raw-v592.json";
const outputPath = "docs/release/v592/browser-soak-resource-receipt-v592.json";
const finalSoakScreenshotPath = "docs/release/v592/screenshots/live-matrix/soak-final-30m.png";
const JS_HEAP_FINAL_GROWTH_MAX_BYTES = 64 * 1024 * 1024;
const JS_HEAP_PEAK_GROWTH_MAX_BYTES = 128 * 1024 * 1024;

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
const canonicalSha = (value) => sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function fileRecord(path) {
  const bytes = readFileSync(resolve(root, path));
  return { path, bytes: bytes.byteLength, sha256: sha256(bytes) };
}
function atomicWrite(path, text) {
  const absolute = resolve(root, path);
  mkdirSync(dirname(absolute), { recursive: true });
  const partial = `${absolute}.part`;
  writeFileSync(partial, text, { flag: "wx" });
  rmSync(absolute, { force: true });
  renameSync(partial, absolute);
}
function parseBoolean(value) {
  assert(value === "true" || value === "false", `v592-soak-boolean:${value}`);
  return value === "true";
}

const rawSamplesBytes = readFileSync(resolve(root, rawSamplesPath));
const lines = rawSamplesBytes.toString("utf8").trim().split(/\r?\n/);
const header = lines.shift()?.split(",") ?? [];
const legacyHeader = [
  "index", "elapsedMs", "epochMs", "visibilityState", "memoryAvailable", "fpsMedian", "frameDeltaMs",
  "gpuBytes", "resourceBytes", "textures", "programs", "drawCalls", "canvasCount", "payloadStable",
  "scientificWriteback",
];
const heapHeader = [
  ...legacyHeader,
  "heapTelemetry", "heapUsedBytes", "heapTotalBytes", "heapLimitBytes",
];
const hasHeapColumns = header.join(",") === heapHeader.join(",");
assert(hasHeapColumns || header.join(",") === legacyHeader.join(","), "v592-soak-csv-header");
const samples = lines.map((line, rowIndex) => {
  const values = line.split(",");
  const expectedHeader = hasHeapColumns ? heapHeader : legacyHeader;
  assert(values.length === expectedHeader.length, `v592-soak-csv-columns:${rowIndex}`);
  const sample = Object.fromEntries(expectedHeader.map((key, index) => [key, values[index]]));
  return {
    index: Number(sample.index),
    elapsedMs: Number(sample.elapsedMs),
    epochMs: Number(sample.epochMs),
    visibilityState: sample.visibilityState,
    memoryAvailable: parseBoolean(sample.memoryAvailable),
    fpsMedian: Number(sample.fpsMedian),
    frameDeltaMs: Number(sample.frameDeltaMs),
    gpuBytes: Number(sample.gpuBytes),
    resourceBytes: Number(sample.resourceBytes),
    textures: Number(sample.textures),
    programs: Number(sample.programs),
    drawCalls: Number(sample.drawCalls),
    canvasCount: Number(sample.canvasCount),
    payloadStable: parseBoolean(sample.payloadStable),
    scientificWriteback: parseBoolean(sample.scientificWriteback),
    heapTelemetry: sample.heapTelemetry ?? (sample.memoryAvailable === "true" ? "available-performance-memory" : "unavailable-performance-memory-not-exposed"),
    heapUsedBytes: sample.heapUsedBytes === undefined ? null : Number(sample.heapUsedBytes),
    heapTotalBytes: sample.heapTotalBytes === undefined ? null : Number(sample.heapTotalBytes),
    heapLimitBytes: sample.heapLimitBytes === undefined ? null : Number(sample.heapLimitBytes),
  };
});
assert(samples.length === 59, "v592-soak-sample-count");
assert(samples.every((sample, index) => sample.index === index), "v592-soak-sample-sequence");
assert(samples.at(-1).elapsedMs >= 1_800_000, "v592-soak-duration");
assert(samples.every((sample) => sample.visibilityState === "visible"), "v592-soak-visibility");
if (hasHeapColumns) {
  assert(samples.every((sample) => sample.memoryAvailable === true), "v592-soak-memory-telemetry-state");
  assert(samples.every((sample) => sample.heapTelemetry === "available-performance-memory"), "v592-soak-memory-telemetry-kind");
  assert(samples.every((sample) => Number.isFinite(sample.heapUsedBytes) && sample.heapUsedBytes > 0), "v592-soak-memory-used");
  assert(samples.every((sample) => Number.isFinite(sample.heapTotalBytes) && sample.heapTotalBytes > 0), "v592-soak-memory-total");
  assert(samples.every((sample) => Number.isFinite(sample.heapLimitBytes) && sample.heapLimitBytes > 0), "v592-soak-memory-limit");
} else {
  assert(samples.every((sample) => sample.memoryAvailable === false), "v592-soak-memory-telemetry-state");
}
assert(samples.every((sample) => sample.canvasCount === 1), "v592-soak-single-canvas");
assert(samples.every((sample) => sample.payloadStable && !sample.scientificWriteback), "v592-soak-payload-boundary");
assert(samples.every((sample) => [sample.fpsMedian, sample.frameDeltaMs, sample.gpuBytes, sample.resourceBytes, sample.textures, sample.programs, sample.drawCalls].every((value) => Number.isFinite(value) && value >= 0)), "v592-soak-renderer-telemetry");
assert(samples.every((sample) => sample.payloadStable), "v592-soak-payload-stability");

const values = (key) => samples.map((sample) => sample[key]);
const unique = (key) => [...new Set(values(key))];
const sortedFps = values("fpsMedian").toSorted((left, right) => left - right);
const medianFps = sortedFps[Math.floor(sortedFps.length / 2)];
assert(sortedFps[0] >= 55, "v592-soak-fps-threshold");
for (const key of ["gpuBytes", "resourceBytes", "textures", "programs", "drawCalls"]) {
  assert(unique(key).length === 1, `v592-soak-resource-drift:${key}`);
}

const heapValues = hasHeapColumns ? samples.map((sample) => sample.heapUsedBytes) : [];
const heapBaselineBytes = heapValues[0] ?? null;
const heapFinalBytes = heapValues.at(-1) ?? null;
const heapMinimumBytes = heapValues.length ? Math.min(...heapValues) : null;
const heapMaximumBytes = heapValues.length ? Math.max(...heapValues) : null;
const heapFinalGrowthBytes = heapBaselineBytes === null || heapFinalBytes === null ? null : heapFinalBytes - heapBaselineBytes;
const heapPeakGrowthBytes = heapBaselineBytes === null || heapMaximumBytes === null ? null : heapMaximumBytes - heapBaselineBytes;
const jsHeapGrowthGatePassed = hasHeapColumns
  && heapFinalGrowthBytes !== null
  && heapPeakGrowthBytes !== null
  && heapFinalGrowthBytes <= JS_HEAP_FINAL_GROWTH_MAX_BYTES
  && heapPeakGrowthBytes <= JS_HEAP_PEAK_GROWTH_MAX_BYTES;

const releaseRaw = JSON.parse(readFileSync(resolve(root, rawReleasePath), "utf8"));
assert(releaseRaw.version === "v592-browser-strict-release-restore-raw-v1", "v592-release-raw-version");
assert(releaseRaw.route === "/local-shadow-v592" && releaseRaw.browser === "Codex in-app browser", "v592-release-browser-boundary");
assert(releaseRaw.cycles.length === 4, "v592-release-cycle-count");
assert(releaseRaw.consolePageWebglErrorWarningCount === 0, "v592-release-errors");
assert(
  releaseRaw.releasedState.candidateBytes === 0
  && releaseRaw.releasedState.candidateResources === 0
  && releaseRaw.releasedState.sceneNodes === 0
  && releaseRaw.releasedState.programDelta === 0
  && releaseRaw.releasedState.rendererTextureDelta === 0
  && releaseRaw.releasedState.rendererGeometryDelta === 0
  && releaseRaw.releasedState.releaseStatus === "released-zero"
  && releaseRaw.releasedState.payloadStable === true
  && releaseRaw.releasedState.scientificWriteback === false,
  "v592-release-zero-state",
);
assert(
  releaseRaw.restoredState.candidateBytes === releaseRaw.baseline.candidateBytes
  && releaseRaw.restoredState.candidateResources === releaseRaw.baseline.candidateResources
  && releaseRaw.restoredState.sceneNodes === releaseRaw.baseline.sceneNodes
  && releaseRaw.restoredState.programDelta === releaseRaw.baseline.programDelta
  && releaseRaw.restoredState.rendererTextureDelta === releaseRaw.baseline.rendererTextureDelta
  && releaseRaw.restoredState.rendererGeometryDelta === releaseRaw.baseline.rendererGeometryDelta
  && releaseRaw.restoredState.releaseStatus === "armed"
  && releaseRaw.restoredState.payloadStable === true
  && releaseRaw.restoredState.scientificWriteback === false,
  "v592-restore-baseline-state",
);
const finalSoakScreenshot = fileRecord(finalSoakScreenshotPath);
for (const screenshot of [releaseRaw.screenshots.released, releaseRaw.screenshots.restored, finalSoakScreenshot]) {
  const observed = fileRecord(screenshot.path);
  assert(observed.bytes === screenshot.bytes && observed.sha256 === screenshot.sha256, `v592-soak-screenshot:${screenshot.path}`);
}

const scientificPayloadSha256 = releaseRaw.releasedState.payloadSha256;
assert(scientificPayloadSha256 === releaseRaw.restoredState.payloadSha256, "v592-release-payload-drift");
const candidateManifest = JSON.parse(readFileSync(resolve(root, "public/data/living-universe-v592/manifest.json"), "utf8"));
const standaloneBuild = JSON.parse(readFileSync(resolve(root, "dist/release/atlas-v592-standalone-build-resource.json"), "utf8"));
const liteBuild = JSON.parse(readFileSync(resolve(root, "dist/release/atlas-v592-lite-build-resource.json"), "utf8"));
assert(
  releaseRaw.capturedBuildIds?.standalone === standaloneBuild.buildId
  && releaseRaw.capturedBuildIds?.lite === liteBuild.buildId,
  "v592-release-build-identity",
);
const telemetryQualified = hasHeapColumns && jsHeapGrowthGatePassed;
const telemetryAvailable = hasHeapColumns;
const unsigned = {
  version: "v592-browser-soak-resource-receipt-v1",
  generatedAt: new Date(samples[0].epochMs).toISOString(),
  status: telemetryQualified
    ? "completed-30-minute-visible-soak-renderer-stable-js-heap-telemetry-qualified"
    : telemetryAvailable
      ? "completed-30-minute-visible-soak-renderer-stable-js-heap-telemetry-available"
      : "completed-30-minute-visible-soak-renderer-stable-js-heap-telemetry-unavailable",
  route: "/local-shadow-v592",
  browser: "Codex in-app browser",
  capturedCandidateManifestSha256: candidateManifest.manifestSha256,
  capturedBuildIds: { standalone: standaloneBuild.buildId, lite: liteBuild.buildId },
  source: {
    samples: fileRecord(rawSamplesPath),
    releaseRestore: fileRecord(rawReleasePath),
    finalSoakScreenshot,
    releaseScreenshot: releaseRaw.screenshots.released,
    restoreScreenshot: releaseRaw.screenshots.restored,
  },
  soak: {
    durationMs: samples.at(-1).elapsedMs,
    sampleCount: samples.length,
    visibleSampleCount: samples.filter((sample) => sample.visibilityState === "visible").length,
    fpsMedian: {
      minimum: sortedFps[0],
      median: medianFps,
      maximum: sortedFps.at(-1),
    },
    rendererResources: {
      gpuBytes: unique("gpuBytes")[0],
      resourceBytes: unique("resourceBytes")[0],
      textures: unique("textures")[0],
      programs: unique("programs")[0],
      drawCalls: unique("drawCalls")[0],
      sustainedGrowthObserved: false,
    },
    memoryTelemetry: {
      state: hasHeapColumns ? "available-performance-memory" : "unavailable-performance-memory-not-exposed",
      availableSampleCount: hasHeapColumns ? heapValues.length : 0,
      baselineUsedBytes: heapBaselineBytes,
      finalUsedBytes: heapFinalBytes,
      minimumUsedBytes: heapMinimumBytes,
      maximumUsedBytes: heapMaximumBytes,
      finalGrowthBytes: heapFinalGrowthBytes,
      peakGrowthBytes: heapPeakGrowthBytes,
      finalGrowthMaximumBytes: JS_HEAP_FINAL_GROWTH_MAX_BYTES,
      peakGrowthMaximumBytes: JS_HEAP_PEAK_GROWTH_MAX_BYTES,
      jsHeapGrowthGatePassed,
      rendererResourceCountersUsedAsSupplement: !hasHeapColumns,
    },
    canvasCount: 1,
    scientificPayloadSha256,
    scientificPayloadStable: true,
    scientificPayloadWriteback: false,
    consolePageWebglErrorWarningCount: 0,
  },
  resourceLifecycle: {
    strictCycleCount: releaseRaw.cycles.length,
    releasedState: releaseRaw.releasedState,
    restoredState: releaseRaw.restoredState,
    rendererMemoryPolicy: releaseRaw.rendererMemoryPolicy,
    releaseZeroPassed: true,
    restoreBaselinePassed: true,
  },
  admission: {
    thirtyMinuteDurationPassed: true,
    visibilityPassed: true,
    performancePassed: true,
    rendererResourceNoGrowthPassed: true,
    releaseRestorePassed: true,
    jsHeapTelemetryAvailable: hasHeapColumns,
    jsHeapGrowthGatePassed,
    fullMemoryGatePassed: telemetryQualified,
    singleCanvasPassed: true,
    payloadIsolationPassed: true,
    errorGatePassed: true,
  },
  policy: {
    noSyntheticTelemetry: true,
    noHeapClaimWhenUnavailable: true,
    heapGrowthThresholdsPreRegistered: true,
    noAlternateBrowser: true,
    noProductionDeployment: true,
    formalProductPointer: "v263",
    scientificPayloadWriteback: false,
  },
};
const receipt = { ...unsigned, receiptSha256: canonicalSha(unsigned) };
atomicWrite(outputPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({
  status: receipt.status,
  durationMs: receipt.soak.durationMs,
  sampleCount: receipt.soak.sampleCount,
  fpsMinimum: receipt.soak.fpsMedian.minimum,
  rendererResourceNoGrowthPassed: receipt.admission.rendererResourceNoGrowthPassed,
  jsHeapGrowthGatePassed: receipt.admission.jsHeapGrowthGatePassed,
  releaseRestorePassed: receipt.admission.releaseRestorePassed,
  receiptSha256: receipt.receiptSha256,
}, null, 2));
