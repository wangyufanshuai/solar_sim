import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { buildR77WebFreezeV664, parseR77FreezeOptionsV664,
  sha256R77V664 } from
  "./build-mainline-a-r77-web-freeze-v664.mjs";
import { inspectR77FreezeV664, parseR77ReplayOptionsV664,
  replayR77FreezeV664 } from
  "./verify-mainline-a-r77-web-freeze-v664.mjs";

const stored = JSON.parse(await readFile(safeWorkspacePathV662(
  "docs/release/v607/mainline-a-r77-v664-freeze-20261013v664r77freeze01.json"),
"utf8"));
const clone = () => structuredClone(stored);
function resign(value) {
  const payload = { ...value };
  delete payload.fingerprint;
  delete payload.generatedAt;
  value.fingerprint = sha256R77V664(JSON.stringify(payload));
  return value;
}
test("recomputes current 96-row and 36-scene candidate freeze", async () => {
  const fresh = await buildR77WebFreezeV664();
  assert.equal(fresh.appSourceSha256, stored.appSourceSha256);
  assert.equal(fresh.fingerprint, stored.fingerprint);
  assert.equal(fresh.matrixRows.length, 96);
  assert.equal(fresh.scenes.length, 36);
  assert.equal(fresh.assetPins.length, 49);
  assert.equal(inspectR77FreezeV664(fresh).ok, true);
});
test("replays every source and asset byte without network", async () => {
  const result = await replayR77FreezeV664(stored);
  assert.equal(result.status, "verified-candidate-hold",
    result.issues.join(","));
  assert.equal(result.pinChecks, 57);
});
test("rejects row deletion even with a recomputed envelope", () => {
  const bad = clone();
  bad.matrixRows.pop();
  resign(bad);
  const issues = inspectR77FreezeV664(bad).issues;
  assert.ok(issues.includes("matrix-row-digest-or-coverage"));
  assert.ok(issues.includes("group-count:beta-nebula"));
});
test("rejects forged stellar component promotion", () => {
  const bad = clone();
  bad.matrixRows.find((row) =>
    row.group === "beta-star" && row.id === "acrux").state =
      "reviewable";
  bad.matrixRowDigest = sha256R77V664(
    JSON.stringify(bad.matrixRows));
  resign(bad);
  assert.ok(inspectR77FreezeV664(bad).issues
    .includes("stellar-hold-promoted-or-missing"));
});
test("rejects a held nebula gaining a candidate image route", () => {
  const bad = clone();
  const held = bad.matrixRows.find((row) =>
    row.group === "beta-nebula" && row.id === "ring-nebula");
  held.imageRoute =
    "/api/atlas/mainline-a-nebula-review/ring-nebula/detail";
  held.imageSha256 = "f".repeat(64);
  bad.matrixRowDigest = sha256R77V664(
    JSON.stringify(bad.matrixRows));
  resign(bad);
  assert.ok(inspectR77FreezeV664(bad).issues
    .includes("nebula-hold-promoted-or-missing"));
});
test("rejects changed V616 pin and path traversal", () => {
  const bad = clone();
  bad.v616Pins[0].sha256 = "a".repeat(64);
  bad.assetPins[0].path = "../outside";
  resign(bad);
  const issues = inspectR77FreezeV664(bad).issues;
  assert.ok(issues.includes("gate-or-boundary-promotion"));
  assert.ok(issues.includes("unsafe-or-missing-pin:../outside"));
});
test("rejects fake release and missing canonical route mapping", () => {
  const bad = clone();
  bad.claims.publicWebReleaseApproved = true;
  bad.scenes[0].catalogId = "forged";
  resign(bad);
  const issues = inspectR77FreezeV664(bad).issues;
  assert.ok(issues.includes("gate-or-boundary-promotion"));
  assert.ok(issues.includes(
    "canonical-scene-coverage-or-admission"));
});
test("CLI identifiers are bounded to this batch", () => {
  const valid = ["--run-id", "20261013v664r77freeze01"];
  assert.equal(parseR77FreezeOptionsV664(valid),
    "20261013v664r77freeze01");
  assert.equal(parseR77ReplayOptionsV664(valid),
    "20261013v664r77freeze01");
  assert.throws(() => parseR77FreezeOptionsV664(
    ["--run-id", "../escape"]));
});
