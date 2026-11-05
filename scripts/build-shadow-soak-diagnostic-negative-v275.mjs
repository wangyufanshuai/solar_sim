import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const REPORT_PATH = "dist/science/lifecycle-soak-v275-diagnostic.json";
const PLAYWRIGHT_PATH = "output/playwright/v275-shadow-soak-diagnostic-result.json";
const OUTPUT = "dist/science/lifecycle-soak-v275-diagnostic-negative-evidence.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalJson = (value) => JSON.stringify(canonicalize(value));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));

const [report, playwright] = await Promise.all([readJson(REPORT_PATH), readJson(PLAYWRIGHT_PATH)]);
const resourceKeys = [
  "workers",
  "renderTargets",
  "gpuBuffers",
  "subscriptions",
  "objectUrls",
  "typedArrayCaches",
  "cameraLocks",
  "textures",
  "models",
  "estimatedBytes",
  "estimatedGpuBytes",
  "programs",
  "rendererTextures",
];
const resourceDeltas = Object.fromEntries(resourceKeys.map((key) => [key, {
  baseline: report.baseline[key],
  released: report.released[key],
  delta: report.released[key] - report.baseline[key],
}]));
const resourcesReturned = Object.values(resourceDeltas).every((entry) => entry.delta === 0);
const baselineLiveTextures = report.baselineWebGlTextureAudit.live.length;
const finalLiveTextures = report.finalWebGlTextureAudit.live.length;
const createdSinceBaseline = report.finalWebGlTextureAudit.created - report.baselineWebGlTextureAudit.created;
const deletedSinceBaseline = report.finalWebGlTextureAudit.deleted - report.baselineWebGlTextureAudit.deleted;
const netLiveGrowth = createdSinceBaseline - deletedSinceBaseline;
const heapSlopePassed = report.stableHeapOlsSlopeBytesPerCycle <= report.stableHeapOlsSlopeLimitBytesPerCycle;
const strictIdentityMismatchOnly = report.passed === false
  && resourcesReturned
  && baselineLiveTextures === finalLiveTextures
  && netLiveGrowth === 0
  && heapSlopePassed
  && report.consoleErrors.length === 0
  && report.pageErrors.length === 0
  && report.newLiveWebGlTextures.length > 0
  && playwright.stats?.unexpected === 1;
if (!strictIdentityMismatchOnly) throw new Error("v275 soak failure has a cause beyond the strict WebGL texture identity assertion");

const evidence = {
  version: "v275-shadow-soak-diagnostic-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-overstrict-webgl-live-identity-diagnostic-no-retry",
  formalQualificationApplied: false,
  automaticRetryApplied: false,
  report: { path: REPORT_PATH, sha256: await fileSha256(REPORT_PATH), reportedPassed: report.passed },
  playwright: {
    path: PLAYWRIGHT_PATH,
    sha256: await fileSha256(PLAYWRIGHT_PATH),
    expected: playwright.stats?.expected,
    unexpected: playwright.stats?.unexpected,
    durationMs: Math.round(playwright.stats?.duration ?? 0),
  },
  measurements: {
    measuredCycles: report.measuredCycles,
    heapSlopeBytesPerCycle: report.stableHeapOlsSlopeBytesPerCycle,
    heapSlopeLimitBytesPerCycle: report.stableHeapOlsSlopeLimitBytesPerCycle,
    heapSlopePassed,
    baselineLiveTextures,
    finalLiveTextures,
    createdSinceBaseline,
    deletedSinceBaseline,
    netLiveGrowth,
    replacedLiveTextureIdentities: report.newLiveWebGlTextures.length,
    resourcesReturned,
    resourceDeltas,
    consoleErrors: report.consoleErrors.length,
    pageErrors: report.pageErrors.length,
  },
  correctedAssertionPrepared: "bounded-live-cardinality-and-net-growth-not-object-identity",
  correctedRunApplied: false,
  artifacts: "output/playwright/v275-shadow-soak-diagnostic-negative",
  boundary: "current-memory-diagnostic-negative-retained-formal-soak-not-qualified",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
