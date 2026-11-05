import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  verifyLongRunCheckpointV650,
  verifyLongRunLaunchV650,
  verifyLongRunRawV650,
} from "./capture-mainline-a-web-r65-longrun-v650.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const build = await load("docs/release/v607/mainline-a-r66-build-20261011-v649web02.json");
const historicalBuild = await load("docs/release/v607/mainline-a-r66-build-20261007-v648web01.json");
const historicalRaw = await load(
  "docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261007-v648long01.json",
);
const clone = (value) => structuredClone(value);
const runtime = {
  buildId: build.runtimeBuildId,
  branch: build.branch,
  head: build.head,
  releaseBoundary: "candidate-only-hold-not-admitted",
  visibility: "visible",
  resourceTotal: 27,
};

test("current build and live runtime identity pass without claiming release", () => {
  const result = verifyLongRunLaunchV650(build, build.inputBefore.sha256, runtime);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("a changed source SHA cannot inherit the preserved build", () => {
  const result = verifyLongRunLaunchV650(build, "0".repeat(64), runtime);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("source-drift"));
});

test("runtime build and boundary substitutions are rejected", () => {
  const forged = { ...runtime, buildId: historicalBuild.runtimeBuildId,
    releaseBoundary: "released" };
  const result = verifyLongRunLaunchV650(build, build.inputBefore.sha256, forged);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("runtime-build-drift"));
  assert.ok(result.issues.includes("runtime-boundary-or-resource-invalid"));
});

function checkpoints() {
  const resources = historicalRaw.observations[0].resources;
  return [
    { visibility: "visible", guidedSelected: "none",
      resourceTotal: resources.baseline.total,
      resourceIdentityDigest: resources.baseline.identityDigest },
    { visibility: "visible", guidedSelected: "nebula:m42", guidedRegistry: "ready",
      imageStatus: "ready", resourceTotal: resources.active.total,
      resourceIdentityDigest: resources.active.identityDigest },
    { visibility: "visible", guidedSelected: "none", guidedReturn: "baseline",
      resourceTotal: resources.final.total,
      resourceIdentityDigest: resources.final.identityDigest },
  ];
}

test("a measured 27 to 31 to 27 resource cycle passes", () => {
  const result = verifyLongRunCheckpointV650(...checkpoints());
  assert.equal(result.ok, true);
  assert.deepEqual(result.totals, [27, 31, 27]);
});

test("an unchanged active registry cannot masquerade as a resource cycle", () => {
  const [baseline, active, restored] = checkpoints();
  const forged = { ...active, resourceTotal: baseline.resourceTotal,
    resourceIdentityDigest: baseline.resourceIdentityDigest };
  const result = verifyLongRunCheckpointV650(baseline, forged, restored);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("active-resource-not-observed"));
});

test("a leaked final resource cannot be called restored", () => {
  const [baseline, active, restored] = checkpoints();
  const result = verifyLongRunCheckpointV650(baseline, active,
    { ...restored, resourceTotal: active.resourceTotal });
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("baseline-not-restored"));
});

test("historical two-run raw satisfies the structural contract for its own build", () => {
  const result = verifyLongRunRawV650(historicalRaw, 2, "mobile", historicalBuild);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("a 29 minute observation fails the duration floor", () => {
  const forged = clone(historicalRaw);
  forged.observations[1].observedDurationMs = 29 * 60 * 1000;
  const result = verifyLongRunRawV650(forged, 2, "mobile", historicalBuild);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("observation-invalid"));
});

test("a viewport substitution fails even with valid frame samples", () => {
  const forged = clone(historicalRaw);
  forged.observations[1].endedViewport.width = 1280;
  const result = verifyLongRunRawV650(forged, 2, "mobile", historicalBuild);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("observation-invalid"));
});

test("browser console errors cannot be hidden by a qualified aggregate status", () => {
  const forged = clone(historicalRaw);
  forged.observations[0].consoleErrors = 1;
  const result = verifyLongRunRawV650(forged, 1, "desktop", historicalBuild);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("observation-invalid"));
});

test("an active resource that survives final cleanup fails the lifecycle gate", () => {
  const forged = clone(historicalRaw);
  forged.observations[1].resources.final.total =
    forged.observations[1].resources.active.total;
  const result = verifyLongRunRawV650(forged, 2, "mobile", historicalBuild);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("resource-cycle-invalid"));
});

test("a second observation with a duplicated independence key fails", () => {
  const forged = clone(historicalRaw);
  forged.observations[1].independenceKey = forged.observations[0].independenceKey;
  const result = verifyLongRunRawV650(forged, 2, "mobile", historicalBuild);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("independence-invalid"));
});

test("scientific writeback promotion in the receipt fails before capture", () => {
  const forged = clone(historicalRaw);
  forged.boundary.scientificPayloadWriteback = true;
  const result = verifyLongRunRawV650(forged, 2, "mobile", historicalBuild);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("raw-contract-invalid"));
});
