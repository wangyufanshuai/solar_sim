import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const artifact = async (name) => {
  const path = `dist/science/catalog-stream-v264-failed-attempt/${name}`;
  return { path, bytes: (await stat(resolve(ROOT, path))).size, sha256: await fileSha256(path) };
};

const [catalog, productPointer, progress] = await Promise.all([
  readJson("dist/catalog-healpix-v9/manifest.json"),
  readJson("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
]);
if (catalog.manifestSha256 !== "68ea2f7972213bd420ffe9b85f6b02a3be977c58e3f3094d57d3796fbd45f421") throw new Error("Catalog v9 manifest changed after the failed gate");
if (productPointer.localCandidateValidationStatus !== "local-validation-passed-public-deployment-blocked") throw new Error("v263 current product pointer changed unexpectedly");
if (progress.codeSha256 !== "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8") throw new Error("science code SHA changed");
if (progress.finiteObserverScreenManifestSha256 !== "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037") throw new Error("science screen SHA changed");

const evidence = {
  version: "v264-catalog-stream-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-cold-load-p95-shadow-retained",
  phasePromotionApplied: false,
  attempt: {
    command: "npx playwright test --config=playwright.atlas.catalog-v264.config.ts",
    buildId: "cSEGcbGKi-dTytWXWIupv",
    project: "desktop-chrome-1440x900",
    workers: 1,
    retries: 0,
    exitCode: 1,
    elapsedMs: 16_800,
    testDurationMs: 9_700,
    failedTest: "v264 streams checksummed tiles, persists ranges and resolves selected sources",
    failedAssertion: {
      metric: "cold-streaming-to-ready-ms",
      measured: 832.4600000008941,
      limit: 400,
      passed: false,
    },
    checksPassedBeforeFailure: [
      "v9-manifest-route-200",
      "v9-contract-active-no-fallback",
      "indexeddb-persistent-cache-ready",
      "active-range-requests-returned-zero",
      "maximum-concurrent-ranges-at-most-four",
      "persistent-cache-positive-and-at-most-128-mib",
      "memory-cache-at-most-64-mib",
      "console-page-404-renderer-fault-audit-zero-until-failure",
    ],
    checksNotReached: [
      "initial-transfer-at-most-2.5-mib",
      "warm-switch-p95-at-most-100-ms",
      "warm-switch-no-additional-archive-range",
      "selected-source-resolution",
      "indexeddb-entry-count-positive-final-check",
    ],
    artifacts: await Promise.all([artifact("error-context.md"), artifact("test-failed-1.png"), artifact("trace.zip"), artifact("last-run.json")]),
    automaticRetryApplied: false,
    thresholdRelaxationApplied: false,
  },
  implementation: {
    catalogManifest: "dist/catalog-healpix-v9/manifest.json",
    catalogManifestSha256: await fileSha256("dist/catalog-healpix-v9/manifest.json"),
    catalogCanonicalSha256: catalog.manifestSha256,
    rows: catalog.counts.renderable,
    tileIndexBytes: catalog.index.byteLength,
    sourceIndexBytes: catalog.sourceIndex.data.byteLength,
    sourceDirectoryBytes: catalog.sourceIndex.directory.byteLength,
    persistentCacheLimitBytes: catalog.cache.persistentBytes,
    memoryCacheLimitBytes: catalog.cache.memoryBytes,
    maxConcurrentRanges: catalog.cache.maxConcurrentRanges,
    historicalV8Overwritten: false,
  },
  release: {
    v263CurrentProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    v263CurrentProductPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    pointerAdvancedToV264: false,
    v264CandidateBuildQualified: false,
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
  boundary: "v264-product-catalog-streaming-failure-no-science-or-runtime-physics-mutation",
};
evidence.evidenceSha256 = sha256(JSON.stringify(canonicalize(evidence)));
const output = resolve(ROOT, "dist/science/catalog-stream-v264-negative-evidence.json");
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({ output, status: evidence.status, evidenceSha256: evidence.evidenceSha256, measuredMs: evidence.attempt.failedAssertion.measured, limitMs: evidence.attempt.failedAssertion.limit, automaticRetryApplied: false }, null, 2));
