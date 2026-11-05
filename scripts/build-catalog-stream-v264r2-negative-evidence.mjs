import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const ROOT = resolve(".");
const RESULT = "dist/science/browser-catalog-v264r2-result.json";
const ATTEMPT_SOURCE = "test-results/atlas-catalog-stream-v264r-e440f-hin-the-corrected-cold-gate";
const ATTEMPT_OUTPUT = "dist/science/catalog-stream-v264r2-failed-attempt";
const TRACE_SOURCE = `${ATTEMPT_SOURCE}/trace.zip`;
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const EXPECTED_V9_SHA = "68ea2f7972213bd420ffe9b85f6b02a3be977c58e3f3094d57d3796fbd45f421";
const EXPECTED_V10_SHA = "68fd59ae6d91a9e7882fd20bc26f2052566c1eeed7667d3b751bbd8a3810cfc9";

const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const extractTraceEntry = (entry) => {
  const result = spawnSync("tar", ["-xOf", resolve(ROOT, TRACE_SOURCE), entry], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`Unable to extract ${entry}: ${result.stderr}`);
  return result.stdout;
};
const numericTraceValues = (trace, field) => [...trace.matchAll(new RegExp(`"k":"${field}","v":\\{"n":([0-9.eE+-]+)`, "g"))]
  .map((match) => Number(match[1])).filter(Number.isFinite);
const maximumTraceValue = (trace, field) => Math.max(...numericTraceValues(trace, field));

const result = await readJson(RESULT);
const testResult = result.suites?.[0]?.specs?.[0]?.tests?.[0]?.results?.[0];
if (!testResult || testResult.status !== "failed" || testResult.retry !== 0) throw new Error("v264.2 reporter is not the single non-retried failure");
const measurement = Number(testResult.error?.message?.match(/Received:\s+(?:\x1b\[[0-9;]*m)?([0-9.]+)/)?.[1]);
if (!Number.isFinite(measurement) || Math.abs(measurement - 772.6899999976158) > 1e-6) throw new Error("Unexpected v264.2 cold-ready measurement");

const [v9, v10, currentPointer, progress, oldV264, oldV264r1] = await Promise.all([
  readJson("dist/catalog-healpix-v9/manifest.json"),
  readJson("dist/catalog-healpix-v10/manifest.json"),
  readJson("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson("dist/science/catalog-stream-v264-negative-evidence.json"),
  readJson("dist/science/catalog-stream-v264r1-negative-evidence.json"),
]);
if (v9.manifestSha256 !== EXPECTED_V9_SHA || v10.manifestSha256 !== EXPECTED_V10_SHA) throw new Error("Catalog canonical history changed");
if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) throw new Error("Science SHA changed");
if (currentPointer.localCandidateValidationStatus !== "local-validation-passed-public-deployment-blocked") throw new Error("Current product pointer moved unexpectedly");

const trace = extractTraceEntry("1-trace.trace");
const networkText = extractTraceEntry("1-trace.network");
const networkRows = networkText.trim().split(/\r?\n/).map((line) => JSON.parse(line))
  .filter((entry) => entry.type === "resource-snapshot")
  .map((entry) => entry.snapshot)
  .filter((snapshot) => snapshot.request.url.includes("catalog-v8.bin") && snapshot.request.headers.some((header) => header.name.toLowerCase() === "range"))
  .map((snapshot) => {
    const startedMs = Date.parse(snapshot.startedDateTime);
    return {
      range: snapshot.request.headers.find((header) => header.name.toLowerCase() === "range")?.value ?? "",
      startedMs,
      endedMs: startedMs + Number(snapshot.time),
      durationMs: Number(snapshot.time),
      waitMs: Number(snapshot.timings.wait),
      receiveMs: Number(snapshot.timings.receive),
      bytes: Number(snapshot.response.headers.find((header) => header.name.toLowerCase() === "content-length")?.value ?? 0),
    };
  }).sort((left, right) => left.startedMs - right.startedMs);
if (networkRows.length !== 8) throw new Error(`Expected 8 archive ranges, found ${networkRows.length}`);
const events = networkRows.flatMap((row) => [{ at: row.startedMs, delta: 1 }, { at: row.endedMs, delta: -1 }])
  .sort((left, right) => left.at - right.at || left.delta - right.delta);
let active = 0;
let maximumConcurrency = 0;
for (const event of events) { active += event.delta; maximumConcurrency = Math.max(maximumConcurrency, active); }
const slowestRange = [...networkRows].sort((left, right) => right.durationMs - left.durationMs)[0];

const auditAttachment = testResult.attachments.find((entry) => entry.name === "atlas-runtime-audit-v263");
const runtimeAudit = JSON.parse(Buffer.from(auditAttachment.body, "base64").toString("utf8"));
if (runtimeAudit.consoleErrors.length || runtimeAudit.pageErrors.length || runtimeAudit.missingResources.length || runtimeAudit.rendererFaults !== 0) throw new Error("Runtime audit was not clean");

await mkdir(resolve(ROOT, ATTEMPT_OUTPUT), { recursive: true });
for (const source of [`${ATTEMPT_SOURCE}/error-context.md`, `${ATTEMPT_SOURCE}/test-failed-1.png`, `${ATTEMPT_SOURCE}/trace.zip`, "test-results/.last-run.json"]) {
  await copyFile(resolve(ROOT, source), resolve(ROOT, ATTEMPT_OUTPUT, basename(source)));
}
const artifact = async (name) => {
  const path = `${ATTEMPT_OUTPUT}/${name}`;
  return { path, bytes: (await stat(resolve(ROOT, path))).size, sha256: await fileSha256(path) };
};

const telemetry = {
  readyMs: maximumTraceValue(trace, "readyMs"),
  persistentReadMs: maximumTraceValue(trace, "persistentReadMs"),
  networkWallMs: maximumTraceValue(trace, "networkWallMs"),
  checksumMs: maximumTraceValue(trace, "checksumMs"),
  decodeTimeMs: maximumTraceValue(trace, "decodeTimeMs"),
  persistentQueueDepthMaximum: maximumTraceValue(trace, "persistentQueueDepth"),
  persistentFlushMs: maximumTraceValue(trace, "persistentFlushMs"),
  persistentCacheEntries: maximumTraceValue(trace, "persistentCacheEntries"),
  mergedRangeRequestCount: maximumTraceValue(trace, "mergedRangeRequestCount"),
  selectedRangeBytes: maximumTraceValue(trace, "selectedRangeBytes"),
  gapRangeBytes: maximumTraceValue(trace, "gapRangeBytes"),
  coldBootstrapBytes: maximumTraceValue(trace, "coldBootstrapBytes"),
};

const evidence = {
  version: "v264r2-catalog-stream-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-v10-large-range-local-throughput-shadow-retained",
  phasePromotionApplied: false,
  attempt: {
    command: "npx playwright test --config=playwright.atlas.catalog-v264r2.config.ts",
    buildId: (await readFile(resolve(ROOT, ".next-atlas-standalone-current/BUILD_ID"), "utf8")).trim(),
    project: "desktop-chrome-1440x900",
    workers: 1,
    retries: 0,
    exitCode: 1,
    elapsedMs: result.stats.duration,
    testDurationMs: testResult.duration,
    failedTest: result.suites[0].specs[0].title,
    failedAssertion: { metric: "cold-streaming-to-ready-ms", measured: measurement, limit: 400, passed: false },
    telemetry,
    networkDiagnostic: {
      archiveRangeRequests: networkRows.length,
      archiveRangeBytes: networkRows.reduce((sum, row) => sum + row.bytes, 0),
      archiveRangeWallSpanMs: networkRows.at(-1).endedMs - networkRows[0].startedMs,
      averageRequestMs: networkRows.reduce((sum, row) => sum + row.durationMs, 0) / networkRows.length,
      averageWaitMs: networkRows.reduce((sum, row) => sum + row.waitMs, 0) / networkRows.length,
      averageReceiveMs: networkRows.reduce((sum, row) => sum + row.receiveMs, 0) / networkRows.length,
      maximumConcurrency,
      slowestRange,
      remainingDominantStage: "local-content-pack-large-range-receive-throughput",
    },
    confirmedImprovements: [
      "v10-index-983040-bytes",
      "range-count-77-to-8",
      "cold-bootstrap-2585016-under-2621440",
      "gap-safe-selected-decode-32000-records",
      "persistent-read-1.755ms",
      "background-flush-14.455ms",
    ],
    checksNotReached: [
      "cold-transfer-assertion",
      "archive-range-count-assertion",
      "indexeddb-store-count-assertions",
      "ten-cycle-warm-switch-p95",
      "selected-source-resolution",
    ],
    artifacts: await Promise.all([
      artifact("error-context.md"), artifact("test-failed-1.png"), artifact("trace.zip"), artifact(".last-run.json"),
      { path: RESULT, bytes: (await stat(resolve(ROOT, RESULT))).size, sha256: await fileSha256(RESULT) },
    ]),
    automaticRetryApplied: false,
    thresholdRelaxationApplied: false,
  },
  implementation: {
    candidateBuildQualified: false,
    v9CanonicalSha256: v9.manifestSha256,
    v10CanonicalSha256: v10.manifestSha256,
    v10IndexBytes: v10.index.byteLength,
    historicalEvidence: {
      v264EvidenceSha256: oldV264.evidenceSha256,
      v264r1EvidenceSha256: oldV264r1.evidenceSha256,
      overwritten: false,
    },
    sourceHashes: {
      compactContract: await fileSha256("app/lib/catalogTileV10.ts"),
      compactBuilder: await fileSha256("scripts/build-catalog-healpix-v10.py"),
      streamWorker: await fileSha256("app/workers/catalogStream.worker.ts"),
      browserSpec: await fileSha256("tests/atlas-browser/atlas-catalog-stream-v264r2.spec.ts"),
    },
  },
  release: {
    currentProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    currentProductPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    pointerAdvancedToV264r2: false,
    v265Started: false,
    v266Started: false,
    vercelApplied: false,
  },
  science: {
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    codeSha256: progress.codeSha256,
    screenSha256: progress.finiteObserverScreenManifestSha256,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  boundary: "v264.2-product-streaming-failure-no-retry-no-science-or-runtime-physics-mutation",
};
evidence.evidenceSha256 = sha256(JSON.stringify(canonicalize(evidence)));
const output = resolve(ROOT, "dist/science/catalog-stream-v264r2-negative-evidence.json");
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output, status: evidence.status, evidenceSha256: evidence.evidenceSha256, measuredMs: measurement, networkWallMs: telemetry.networkWallMs, automaticRetryApplied: false, v265Started: false, v266Started: false }, null, 2));
