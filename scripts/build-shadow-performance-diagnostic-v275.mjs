import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const REPORT_PATH = "dist/science/performance-v275-diagnostic.json";
const PLAYWRIGHT_PATH = "output/playwright/v275-shadow-performance-diagnostic-result.json";
const OUTPUT = "dist/science/performance-v275-diagnostic-evidence.json";
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
const expectedScenes = ["overview", "catalog-stellar", "scale-galactic", "research-workbench", "visual-v274"];
const finiteMetrics = report.samples.every((sample) => [
  sample.medianFps,
  sample.frameP95Ms,
  sample.frameSamples,
  sample.estimatedGpuBytes,
  sample.rendererTextures,
  sample.programs,
].every(Number.isFinite));
const passed = report.passed === true
  && report.formalQualificationApplied === false
  && report.softwareRenderer === false
  && report.resourcesReleased === true
  && /RTX 4060/i.test(report.adapter?.renderer ?? "")
  && JSON.stringify(report.samples.map((sample) => sample.id)) === JSON.stringify(expectedScenes)
  && finiteMetrics
  && report.samples.every((sample) => sample.medianFps >= (sample.id === "overview" ? 55 : 45)
    && sample.frameP95Ms <= 50
    && sample.frameSamples > 240
    && sample.estimatedGpuBytes <= 32 * 1024 * 1024)
  && playwright.stats?.expected === 1
  && playwright.stats?.unexpected === 0
  && playwright.stats?.flaky === 0
  && playwright.stats?.skipped === 0;
if (!passed) throw new Error("v275 current-memory RTX diagnostic is not passing");

const evidence = {
  version: "v275-shadow-performance-diagnostic-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "passed-current-memory-rtx4060-diagnostic-nonqualifying",
  formalQualificationApplied: false,
  automaticRetryApplied: false,
  report: { path: REPORT_PATH, sha256: await fileSha256(REPORT_PATH) },
  playwright: {
    path: PLAYWRIGHT_PATH,
    sha256: await fileSha256(PLAYWRIGHT_PATH),
    expected: playwright.stats.expected,
    unexpected: playwright.stats.unexpected,
    durationMs: Math.round(playwright.stats.duration),
  },
  adapter: report.adapter,
  samples: report.samples.map((sample) => ({
    id: sample.id,
    medianFps: sample.medianFps,
    frameP95Ms: sample.frameP95Ms,
    frameSamples: sample.frameSamples,
    estimatedGpuBytes: sample.estimatedGpuBytes,
  })),
  resourcesReleased: report.resourcesReleased,
  thresholds: report.thresholds,
  boundary: "current-memory-rtx-diagnostic-formal-resource-stability-gate-not-applied",
};
evidence.evidenceSha256 = sha256(canonicalJson(evidence));
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await writeFile(resolve(ROOT, OUTPUT), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, status: evidence.status, evidenceSha256: evidence.evidenceSha256 }, null, 2));
