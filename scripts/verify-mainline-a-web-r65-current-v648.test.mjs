import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  inspectWebCurrentLongRunV648, replayWebCurrentLongRunV648,
} from "./verify-mainline-a-web-r65-current-v648.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previousBuildPath = "docs/release/v607/mainline-a-r66-build-20261007-v647web02.json";
const previousRawPath = "docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261007-v647web02.json";
const currentBuildPath = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
let oldBuild;
let oldRaw;
let currentBuild;
async function inputs() {
  oldBuild ??= await readJson(previousBuildPath);
  oldRaw ??= await readJson(previousRawPath);
  currentBuild ??= await readJson(currentBuildPath);
  return { oldBuild, oldRaw, currentBuild };
}

test("historical V647 raw is a valid algorithm control only for its own build", async () => {
  const { oldBuild, oldRaw } = await inputs();
  const result = inspectWebCurrentLongRunV648(oldBuild, oldRaw, oldBuild.inputBefore.sha256);
  assert.equal(result.status, "verified-current-source-local-longrun");
  assert.equal(result.currentSourceLongRuns, 2);
  assert.deepEqual(result.observations.map((row) => row.resourceTotal),
    [[27, 31, 27], [27, 31, 27]]);
});
test("V647 browser observations cannot be rebound to the changed V648 build", async () => {
  const { oldRaw, currentBuild } = await inputs();
  const result = inspectWebCurrentLongRunV648(currentBuild, oldRaw, currentBuild.inputBefore.sha256);
  assert.equal(result.status, "blocked");
  assert(result.issues.includes("browser-build-identity-drift"));
  assert(result.issues.some((issue) => issue.endsWith(":source-or-build-drift")));
});
test("fixture provenance, fake resource growth and incomplete duration are rejected", async () => {
  const { oldBuild, oldRaw } = await inputs();
  const original = oldRaw.observations[0];
  const forged = { ...oldRaw, observations: [{ ...original,
    source: "fixture", observedDurationMs: 60_000,
    resources: { ...original.resources,
      active: { ...original.resources.active,
        total: original.resources.baseline.total,
        estimatedGpuBytes: original.resources.baseline.estimatedGpuBytes } } },
  oldRaw.observations[1]] };
  const result = inspectWebCurrentLongRunV648(oldBuild, forged, oldBuild.inputBefore.sha256);
  assert.equal(result.status, "blocked");
  assert(result.issues.includes("desktop:duration-invalid"));
  assert(result.issues.includes("desktop:source-or-build-drift"));
  assert(result.issues.includes("desktop:resource-lifecycle-invalid"));
});
test("saved-receipt replay rejects source pins and promotion claims", () => {
  const fresh = { schema: "mainline-a-web-r65-current-longrun-v648",
    status: "verified-current-source-local-longrun", sourceSha256: "a".repeat(64),
    buildId: "build", buildReceipt: { sha256: "b".repeat(64) },
    rawBrowserReceipt: { sha256: "c".repeat(64) }, observations: [{ sessionId: "one" }, { sessionId: "two" }],
    currentSourceLongRuns: 2, claims: { productionPerformance: false, physicalMobile: false },
    boundary: { scientificPayloadWriteback: false } };
  assert.equal(replayWebCurrentLongRunV648(fresh, fresh).observations, 2);
  assert.throws(() => replayWebCurrentLongRunV648(
    { ...fresh, rawBrowserReceipt: { sha256: "0".repeat(64) } }, fresh),
  /saved-replay-mismatch/);
  assert.throws(() => replayWebCurrentLongRunV648(
    { ...fresh, claims: { productionPerformance: true, physicalMobile: false } }, fresh),
  /saved-replay-mismatch/);
});
