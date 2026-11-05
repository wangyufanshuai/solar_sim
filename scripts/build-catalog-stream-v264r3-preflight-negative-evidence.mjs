import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const ROOT = resolve(".");
const RESULT = "dist/science/browser-catalog-v264r3-transport-preflight.json";
const ATTEMPT_OUTPUT = "dist/science/catalog-stream-v264r3-preflight-failed-attempt";
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const EXPECTED_V10_SHA = "68fd59ae6d91a9e7882fd20bc26f2052566c1eeed7667d3b751bbd8a3810cfc9";

const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

const [result, v10, currentPointer, progress, oldV264, oldV264r1, oldV264r2] = await Promise.all([
  readJson(RESULT),
  readJson("dist/catalog-healpix-v10/manifest.json"),
  readJson("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson("dist/science/catalog-stream-v264-negative-evidence.json"),
  readJson("dist/science/catalog-stream-v264r1-negative-evidence.json"),
  readJson("dist/science/catalog-stream-v264r2-negative-evidence.json"),
]);
if (v10.manifestSha256 !== EXPECTED_V10_SHA) throw new Error("V10 canonical history changed");
if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) {
  throw new Error("Science SHA changed");
}
const testResult = result.suites?.[0]?.specs?.[0]?.tests?.[0]?.results?.[0];
if (!testResult || testResult.status !== "failed" || testResult.retry !== 0) {
  throw new Error("v264.3 preflight is not the single non-retried failure");
}
const metricAttachment = testResult.attachments.find((entry) => entry.name === "atlas-v264r3-transport-preflight");
const runtimeAttachment = testResult.attachments.find((entry) => entry.name === "atlas-runtime-audit-v263");
if (!metricAttachment?.body || !runtimeAttachment?.body) throw new Error("v264.3 preflight attachments are incomplete");
const metrics = JSON.parse(Buffer.from(metricAttachment.body, "base64").toString("utf8"));
const runtimeAudit = JSON.parse(Buffer.from(runtimeAttachment.body, "base64").toString("utf8"));
if (!(metrics.wallMs > 250) || metrics.bytes !== 1_592_448 || metrics.maximumConcurrency > 4) {
  throw new Error("v264.3 preflight failure metrics do not match the frozen gate");
}
if (metrics.rows.length !== 8 || metrics.rows.some((row) => row.status !== 206 || row.delivery !== "buffered-v1")) {
  throw new Error("v264.3 buffered delivery integrity was not preserved");
}
if (runtimeAudit.consoleErrors.length || runtimeAudit.pageErrors.length || runtimeAudit.missingResources.length || runtimeAudit.rendererFaults !== 0) {
  throw new Error("v264.3 runtime audit was not clean");
}

await mkdir(resolve(ROOT, ATTEMPT_OUTPUT), { recursive: true });
for (const attachment of testResult.attachments.filter((entry) => entry.path)) {
  await copyFile(attachment.path, resolve(ROOT, ATTEMPT_OUTPUT, basename(attachment.path)));
}
await copyFile(resolve(ROOT, RESULT), resolve(ROOT, ATTEMPT_OUTPUT, basename(RESULT)));
const artifact = async (name) => {
  const path = `${ATTEMPT_OUTPUT}/${name}`;
  return { path, bytes: (await stat(resolve(ROOT, path))).size, sha256: await fileSha256(path) };
};
const artifactNames = (await Promise.all(
  testResult.attachments.filter((entry) => entry.path).map((entry) => basename(entry.path)),
)).concat(basename(RESULT));

const evidence = {
  version: "v264r3-buffered-transport-preflight-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "failed-buffered-transport-preflight-shadow-retained",
  phasePromotionApplied: false,
  preflight: {
    command: "npx playwright test --config=playwright.atlas.catalog-v264r3-transport.config.ts",
    buildId: (await readFile(resolve(ROOT, ".next-atlas-standalone-current/BUILD_ID"), "utf8")).trim(),
    workers: 1,
    retries: 0,
    exitCode: 1,
    elapsedMs: result.stats.duration,
    testDurationMs: testResult.duration,
    wallMs: metrics.wallMs,
    limitMs: 250,
    transferredBytes: metrics.bytes,
    rangeRequests: metrics.rows.length,
    maximumConcurrency: metrics.maximumConcurrency,
    delivery: "buffered-v1",
    rows: metrics.rows,
    runtimeAudit,
    artifacts: await Promise.all([...new Set(artifactNames)].map(artifact)),
    automaticRetryApplied: false,
    thresholdRelaxationApplied: false,
    formalGateConsumed: false,
    formalGateRun: false,
  },
  implementation: {
    boundedBufferedRangeMaximumBytes: 2 * 1024 * 1024,
    maximumFourRequestBufferBytes: 8 * 1024 * 1024,
    v10CanonicalSha256: v10.manifestSha256,
    v10ColdUpperBoundBytes: v10.transfer.coldUpperBoundBytes,
    historicalEvidence: {
      v264: oldV264.evidenceSha256,
      v264r1: oldV264r1.evidenceSha256,
      v264r2: oldV264r2.evidenceSha256,
      overwritten: false,
    },
    sourceHashes: {
      deliveryContract: await fileSha256("app/lib/atlasBufferedRangeDeliveryV1.ts"),
      contentPackServer: await fileSha256("app/lib/atlasContentPackServerV3.ts"),
      contentPackRoute: await fileSha256("app/api/atlas/content-packs/[pack]/files/[...path]/route.ts"),
      streamWorker: await fileSha256("app/workers/catalogStream.worker.ts"),
      preflightSpec: await fileSha256("tests/atlas-browser/atlas-catalog-transport-v264r3.spec.ts"),
    },
  },
  release: {
    currentProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    currentProductPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    currentProductStatus: currentPointer.localCandidateValidationStatus,
    pointerAdvancedToV264r3: false,
    continueIndependentShadowWork: ["v265", "v266"],
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
  boundary: "v264.3-product-transport-preflight-failure-no-formal-gate-no-retry-independent-shadow-work-continues",
};
evidence.evidenceSha256 = sha256(JSON.stringify(canonicalize(evidence)));
const output = resolve(ROOT, "dist/science/catalog-stream-v264r3-preflight-negative-evidence.json");
await writeFile(output, `${JSON.stringify(evidence, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: evidence.status,
  evidenceSha256: evidence.evidenceSha256,
  wallMs: metrics.wallMs,
  limitMs: 250,
  formalGateConsumed: false,
  continueIndependentShadowWork: true,
}, null, 2));
