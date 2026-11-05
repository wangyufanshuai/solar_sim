import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";
const FAILURE = "tools/asset-cache/gaia-dr3-presentation-v9-shards/failure.json";
const CHECKPOINT_DB = "tools/asset-cache/gaia-dr3-presentation-v9-shards/candidate-progress.sqlite";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const fileSha256 = async (path) => sha256(await readFile(resolve(ROOT, path)));
const readJson = async (path) => JSON.parse(await readFile(resolve(ROOT, path), "utf8"));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;

const [failure, progress, v264r3, productPointer] = await Promise.all([
  readJson(FAILURE),
  readJson("dist/science/kerr-dense-campaign-progress-v8.json"),
  readJson("dist/science/catalog-stream-v264r3-preflight-negative-evidence.json"),
  readJson("dist/release/orbit-atlas-current-product-evidence-v263.json"),
]);
if (progress.codeSha256 !== EXPECTED_CODE_SHA || progress.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) {
  throw new Error("Science SHA changed before v265 evidence closure");
}
if (failure.status !== "blocked" || failure.completedShards !== 0 || failure.automaticRetryApplied !== false) {
  throw new Error("v265 failure checkpoint does not describe the first non-retried shard failure");
}

const checkpointArtifacts = await Promise.all([FAILURE, CHECKPOINT_DB].map(async (path) => ({
  path,
  bytes: (await stat(resolve(ROOT, path))).size,
  sha256: await fileSha256(path),
})));
const evidence = {
  version: "v265-gaia-presentation-negative-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "blocked-esa-socket-shard-zero-shadow-retained",
  phasePromotionApplied: false,
  implementation: {
    contract: "GaiaPresentationTileManifestV9",
    exactTargetRows: 10_000_000,
    recordBytes: 24,
    archiveExpectedBytes: 240_000_000,
    orders: [3, 6, 8],
    shardMaximumRows: 100_000,
    maximumShards: 102,
    diskPreflight: { requiredGiB: 20, observedGiB: 41.58, passed: true },
    fixtureReconstruction: {
      status: "passed",
      rows: 256,
      archiveBytes: 6_144,
      command: ".venv-science/Scripts/python.exe scripts/test-gaia-presentation-v9.py",
    },
    sourceHashes: {
      contract: await fileSha256("app/lib/gaiaPresentationCatalogV9.ts"),
      contractTest: await fileSha256("app/lib/gaiaPresentationCatalogV9.test.ts"),
      fetcher: await fileSha256("scripts/fetch-gaia-presentation-v9.py"),
      builder: await fileSha256("scripts/build-gaia-presentation-v9.py"),
      fixtureTest: await fileSha256("scripts/test-gaia-presentation-v9.py"),
    },
  },
  fetchAttempt: {
    command: ".venv-science/Scripts/python.exe scripts/fetch-gaia-presentation-v9.py",
    endpoint: "https://gea.esac.esa.int/tap-server/tap/sync",
    failedShard: 0,
    completedShards: 0,
    failureClass: "windows-socket-address-allocation-error-10048",
    rawError: failure.error,
    failedAt: failure.failedAt,
    automaticRetryApplied: false,
    thresholdRelaxationApplied: false,
    oldOneMillionCheckpointReused: false,
    artifacts: checkpointArtifacts,
  },
  gates: {
    dataAvailable: false,
    exactTenMillionRows: false,
    archiveIntegrity: "not-run",
    runtimeIntegration: "not-started-due-data-gate",
    liteIsolation: "contract-only-not-release-validated",
    v265PromotionQualified: false,
  },
  release: {
    currentProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    currentProductPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
    currentProductStatus: productPointer.localCandidateValidationStatus,
    pointerAdvancedToV265: false,
    independentV266WorkContinues: true,
    vercelApplied: false,
  },
  priorProductEvidence: {
    v264r3Status: v264r3.status,
    v264r3EvidenceSha256: v264r3.evidenceSha256,
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
  boundary: "v265-presentation-data-fetch-failed-before-first-shard-no-retry-no-runtime-or-science-mutation-v266-continues",
};
evidence.evidenceSha256 = sha256(JSON.stringify(canonicalize(evidence)));
const evidencePath = "dist/science/gaia-presentation-v265-negative-evidence.json";
await writeFile(resolve(ROOT, evidencePath), `${JSON.stringify(evidence, null, 2)}\n`);

const shadowPointer = {
  version: "orbit-atlas-current-local-shadow-candidate-v265",
  generatedAt: evidence.generatedAt,
  status: "blocked-v265-data-v266-continues",
  productPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  productPointerSha256: await fileSha256("dist/release/orbit-atlas-current-product-evidence-v263.json"),
  source: evidencePath,
  sourceSha256: await fileSha256(evidencePath),
  promotionApplied: false,
  nextIndependentPhase: "v266-observing-planner-2.0",
  publicDeploymentBlocked: true,
};
await writeFile(resolve(ROOT, "dist/release/orbit-atlas-current-local-shadow-candidate-v265.json"), `${JSON.stringify(shadowPointer, null, 2)}\n`);
console.log(JSON.stringify({
  evidence: evidencePath,
  status: evidence.status,
  evidenceSha256: evidence.evidenceSha256,
  completedShards: 0,
  automaticRetryApplied: false,
  v266Continues: true,
}, null, 2));
