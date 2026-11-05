#!/usr/bin/env node

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(".");
const CHECKPOINT = resolve(ROOT, "tools/asset-cache/gaia-dr3-presentation-v272-shards");
const attemptFlag = process.argv.indexOf("--attempt");
const attempt = attemptFlag >= 0 ? process.argv[attemptFlag + 1] : "";
if (attempt && !/^[a-z0-9-]+$/i.test(attempt)) throw new Error("v272 evidence attempt id is invalid");
const outputRelative = attempt
  ? `dist/science/gaia-presentation-v272-low-memory-series-negative-evidence-${attempt}.json`
  : "dist/science/gaia-presentation-v272-low-memory-series-negative-evidence.json";
const OUTPUT = resolve(ROOT, outputRelative);
const POINTER = resolve(ROOT, "dist/release/orbit-atlas-current-local-v272-checkpoint.json");
const EXPECTED_CODE_SHA = "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8";
const EXPECTED_SCREEN_SHA = "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]))
    : value;
const canonicalSha = (value) => sha256(JSON.stringify(canonicalize(value)));

async function sha256File(path) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path, { highWaterMark: 1024 * 1024 })) digest.update(chunk);
  return digest.digest("hex");
}

const [series, progress, preflight, science, formalPointer] = await Promise.all([
  readJson(resolve(CHECKPOINT, "series-state.json")),
  readJson(resolve(CHECKPOINT, "progress.json")),
  readJson(resolve(CHECKPOINT, "last-preflight.json")),
  readJson(resolve(ROOT, "dist/science/kerr-dense-campaign-progress-v8.json")),
  readJson(resolve(ROOT, "dist/release/orbit-atlas-current-product-evidence-v263.json")),
]);

if (science.codeSha256 !== EXPECTED_CODE_SHA || science.finiteObserverScreenManifestSha256 !== EXPECTED_SCREEN_SHA) {
  throw new Error("Frozen science SHA changed before v272 evidence");
}
if (formalPointer.version !== "v263-current-product-evidence-pointer") throw new Error("Formal product pointer moved away from v263");
if (series.automaticRetryApplied !== false || progress.automaticRetryApplied !== false) throw new Error("v272 retry boundary changed");
const terminalAttempt = series.attempts.at(-1);
if (!terminalAttempt || terminalAttempt.exitCode !== 1) throw new Error("v272 terminal attempt is not failed");
const shardAttempted = terminalAttempt.shardAttempted === true;
if (shardAttempted && (preflight.status !== "passed" || terminalAttempt.outcome !== "failed-no-retry")) {
  throw new Error("v272 attempted terminal shard lacks a passed preflight/no-retry failure");
}
if (!shardAttempted && (preflight.status !== "blocked" || preflight.shardAttempted !== false)) {
  throw new Error("v272 terminal preflight is not a non-attempted blocked shard");
}
if (progress.status === "ready-for-build" || progress.uniqueValidCandidateRows >= progress.targetValidRows) throw new Error("v272 negative evidence cannot describe a build-ready catalog");

let failureArtifact = null;
if (shardAttempted) {
  const prefix = `attempt-${String(terminalAttempt.shard).padStart(3, "0")}-`;
  const names = (await readdir(CHECKPOINT)).filter((name) => name.startsWith(prefix) && name.endsWith("-failed.json")).sort();
  const name = names.at(-1);
  if (!name) throw new Error("v272 attempted failure artifact is missing");
  const path = resolve(CHECKPOINT, name);
  const payload = await readJson(path);
  if (payload.shard !== terminalAttempt.shard || payload.automaticRetryApplied !== false) throw new Error("v272 failure artifact drifted");
  failureArtifact = { path: `tools/asset-cache/gaia-dr3-presentation-v272-shards/${name}`, sha256: await sha256File(path), payload };
}

const shards = [];
let previousEnd = 0;
for (let shard = 0; shard < progress.completedShards; shard += 1) {
  const prefix = `gaia-v9-${String(shard).padStart(3, "0")}`;
  const csvPath = resolve(CHECKPOINT, `${prefix}.csv`);
  const adqlPath = resolve(CHECKPOINT, `${prefix}.adql`);
  const sidecarPath = resolve(CHECKPOINT, `${prefix}.json`);
  const metadata = await readJson(sidecarPath);
  const [start, end] = metadata.randomIndexRange;
  if (metadata.version !== "v272-gaia-dr3-presentation-fetch-next-v2" || metadata.shard !== shard) throw new Error(`v272 shard ${shard} identity changed`);
  if (start !== previousEnd || end !== start + 100_000) throw new Error(`v272 shard ${shard} range overlap/discontinuity`);
  if (metadata.sha256 !== await sha256File(csvPath) || metadata.querySha256 !== await sha256File(adqlPath)) throw new Error(`v272 shard ${shard} SHA changed`);
  if (metadata.rowCount < 1 || metadata.rowCount > 100_000 || metadata.automaticRetryApplied !== false) throw new Error(`v272 shard ${shard} count/retry contract changed`);
  shards.push({
    shard,
    randomIndexRange: metadata.randomIndexRange,
    rowCount: metadata.rowCount,
    validRows: metadata.validRows,
    excludedBright: metadata.excludedBright,
    rejectedInvalid: metadata.rejectedInvalid,
    bytes: metadata.bytes,
    sha256: metadata.sha256,
    querySha256: metadata.querySha256,
    startedAt: metadata.startedAt,
    completedAt: metadata.completedAt,
  });
  previousEnd = end;
}

const generatedAt = new Date().toISOString();
const evidence = {
  version: "v272-gaia-10m-low-memory-series-negative-evidence-v1",
  generatedAt,
  status: shardAttempted ? "blocked-network-incomplete-shard-no-retry" : "blocked-resource-preflight-shard-not-attempted",
  capabilityState: "incomplete",
  implementationComplete: true,
  qualificationApplied: false,
  fetchPolicy: {
    defaultMinimumFreeMemoryGiB: 6,
    authorizedMinimumFreeMemoryGiB: 3,
    buildMinimumFreeMemoryGiB: 6,
    minimumDiskGiB: 30,
    validationBatchRows: 5_000,
    oneChildPerShard: true,
    automaticRetryApplied: false,
  },
  checkpoint: {
    completedShards: progress.completedShards,
    uniqueValidCandidateRows: progress.uniqueValidCandidateRows,
    targetValidRows: progress.targetValidRows,
    nextShard: progress.completedShards,
    nextRandomIndexRange: [progress.completedShards * 100_000, (progress.completedShards + 1) * 100_000],
    shardsCanonicalSha256: canonicalSha(shards),
    shards,
  },
  terminal: {
    seriesStatus: series.status,
    failedShardField: series.failedShard,
    interpretedAs: shardAttempted ? "network-shard-failed-no-retry" : "preflight-blocked-no-network-shard-attempt",
    preflight,
    shardAttempted,
    failureArtifact,
    retryApplied: false,
  },
  build: {
    applied: false,
    reason: "10,000,000 valid candidates are not present",
    manifestPublished: false,
  },
  science: {
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    codeSha256: science.codeSha256,
    screenSha256: science.finiteObserverScreenManifestSha256,
    workerPhysicsMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrMutation: "not-applied",
  },
  release: {
    formalProductPointer: "v263",
    formalProductPointerAdvanced: false,
    localShadowOnly: true,
    liteTenMillionCatalogIncluded: false,
    vercelApplied: false,
  },
};
evidence.evidenceSha256 = canonicalSha(evidence);
await mkdir(resolve(ROOT, "dist/science"), { recursive: true });
await mkdir(resolve(ROOT, "dist/release"), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(evidence, null, 2)}\n`);
const pointer = {
  version: "orbit-atlas-current-local-v272-checkpoint-v1",
  generatedAt,
  status: evidence.status,
  capabilityState: evidence.capabilityState,
  completedShards: progress.completedShards,
  uniqueValidCandidateRows: progress.uniqueValidCandidateRows,
  nextShard: progress.completedShards,
  evidence: outputRelative,
  evidenceSha256: await sha256File(OUTPUT),
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  automaticRetryApplied: false,
};
pointer.pointerSha256 = canonicalSha(pointer);
await writeFile(POINTER, `${JSON.stringify(pointer, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT, pointer: POINTER, completedShards: progress.completedShards, validCandidates: progress.uniqueValidCandidateRows, status: evidence.status }, null, 2));
