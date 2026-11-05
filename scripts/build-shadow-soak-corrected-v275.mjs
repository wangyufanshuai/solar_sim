import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const REPORT_PATH = "dist/science/lifecycle-soak-v275-corrected-current-memory.json";
const PLAYWRIGHT_PATH = "output/playwright/v275-shadow-soak-corrected-current-memory-result.json";
const CONFIG_PATH = "playwright.atlas.soak-v275-corrected.config.ts";
const SPEC_PATH = "tests/atlas-browser/atlas-lifecycle-soak-v178.spec.ts";
const OUTPUT = "dist/science/lifecycle-soak-v275-corrected-current-memory-evidence.json";
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
const resourceDeltas = Object.fromEntries(resourceKeys.map((key) => [key, report.released[key] - report.baseline[key]]));
const resourcesReturned = Object.values(resourceDeltas).every((delta) => delta === 0);
const passed = report.passed === true
  && report.measuredCycles === 30
  && report.webGlTextureAuditEnabled === true
  && report.stableHeapOlsSlopeBytesPerCycle <= report.stableHeapOlsSlopeLimitBytesPerCycle
  && report.netLiveWebGlTexturesSinceBaseline <= report.webGlTextureLiveGrowthLimit
  && report.finalWebGlTextureAudit.live.length <= report.baselineWebGlTextureAudit.live.length + report.webGlTextureLiveGrowthLimit
  && resourcesReturned
  && report.consoleErrors.length === 0
  && report.pageErrors.length === 0
  && playwright.stats?.expected === 1
  && playwright.stats?.unexpected === 0
  && playwright.stats?.flaky === 0
  && playwright.stats?.skipped === 0;
if (!passed) throw new Error("v275 corrected current-memory 30-cycle soak is not passing");

const evidence = {
  version: "v275-shadow-soak-corrected-current-memory-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "passed-current-memory-corrected-30-cycle-soak-nonqualifying",
  formalResourceStabilityQualificationApplied: false,
  automaticRetryApplied: false,
  explicitCorrectedAttemptApplied: true,
  report: { path: REPORT_PATH, sha256: await fileSha256(REPORT_PATH) },
  playwright: {
    path: PLAYWRIGHT_PATH,
    sha256: await fileSha256(PLAYWRIGHT_PATH),
    expected: playwright.stats.expected,
    unexpected: playwright.stats.unexpected,
    durationMs: Math.round(playwright.stats.duration),
  },
  config: { path: CONFIG_PATH, sha256: await fileSha256(CONFIG_PATH) },
  spec: { path: SPEC_PATH, sha256: await fileSha256(SPEC_PATH) },
  measurements: {
    measuredCycles: report.measuredCycles,
    baselineHeapBytes: report.baselineHeap,
    finalHeapBytes: report.finalHeap,
    heapSlopeBytesPerCycle: report.stableHeapOlsSlopeBytesPerCycle,
    heapSlopeLimitBytesPerCycle: report.stableHeapOlsSlopeLimitBytesPerCycle,
    baselineLiveWebGlTextures: report.baselineWebGlTextureAudit.live.length,
    finalLiveWebGlTextures: report.finalWebGlTextureAudit.live.length,
    createdWebGlTexturesSinceBaseline: report.createdWebGlTexturesSinceBaseline,
    deletedWebGlTexturesSinceBaseline: report.deletedWebGlTexturesSinceBaseline,
    netLiveWebGlTexturesSinceBaseline: report.netLiveWebGlTexturesSinceBaseline,
    replacedLiveTextureIdentities: report.newLiveWebGlTextures.length,
    resourceDeltas,
    resourcesReturned,
    consoleErrors: report.consoleErrors.length,
    pageErrors: report.pageErrors.length,
  },
  priorNegativeEvidence: "dist/science/lifecycle-soak-v275-diagnostic-negative-evidence.json",
  boundary: "user-authorized-current-memory-local-shadow-soak-formal-resource-gate-skipped",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
