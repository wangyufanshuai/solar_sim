import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildMatrixSnapshotV662, parseRunIdV662,
  pinFileV662, safeWorkspacePathV662, sha256V662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { replayR75MatrixV662, verifyR75MatrixShapeV662,
  parseReplayOptionsV662 } from
  "./verify-mainline-a-r75-matrix-v662.mjs";
import { parseHttpOptionsV662, verifyHttpMatrixV662 } from
  "./verify-mainline-a-r75-http-v662.mjs";

let snapshot;
async function baseline() {
  snapshot ??= await buildMatrixSnapshotV662();
  return snapshot;
}
const clone = (value) => structuredClone(value);

test("current local files produce 96 rows and replayable asset pins", async () => {
  const current = await baseline();
  assert.equal(current.rows.length, 96);
  assert.equal(current.assetPins.length, 49);
  assert.equal(current.counts.imageHolds, 5);
  assert.equal(current.boundary.scientificPayloadWriteback, false);
  assert.deepEqual(verifyR75MatrixShapeV662(current).issues, []);
  const actual = await pinFileV662(current.assetPins[0].path);
  assert.deepEqual(actual, current.assetPins[0]);
  const replay = await replayR75MatrixV662(current);
  assert.equal(replay.status, "verified-candidate-hold");
  assert.equal(replay.issues.length, 0);
});

test("path parser refuses traversal, absolute paths and drive paths", () => {
  for (const path of ["../outside", "docs/../other", "/absolute",
    "C:/Windows/system.ini", "docs\\release\\wrong", "docs//release",
    "docs/./release", "docs/release\0secret"]) {
    assert.throws(() => safeWorkspacePathV662(path));
  }
  assert.match(safeWorkspacePathV662("app/data/mainlineACanonicalCoverageV622.generated.json"),
    /mainlineACanonicalCoverageV622\.generated\.json$/);
});

test("snapshot shape rejects forged promotion claims", async () => {
  const changed = clone(await baseline());
  changed.boundary.publicWebReleaseApproved = true;
  changed.claims.copyrightApproval = true;
  changed.counts.rightsSigned = 24;
  const verified = verifyR75MatrixShapeV662(changed);
  assert.equal(verified.ok, false);
  assert.ok(verified.issues.includes("candidate-boundary"));
  assert.ok(verified.issues.includes("claim-promotion"));
  assert.ok(verified.issues.includes("coverage-counts"));
});

test("row digest and item guard reject forged candidate image", async () => {
  const changed = clone(await baseline());
  const ring = changed.rows.find((row) => row.key === "beta:nebula:ring-nebula");
  ring.imageRoute = "/api/atlas/mainline-a-nebula-review/ring-nebula/detail";
  ring.imageSha256 = "a".repeat(64);
  let checked = verifyR75MatrixShapeV662(changed);
  assert.ok(checked.issues.includes("row-digest-or-count"));
  assert.ok(checked.issues.includes("held-image-promoted:beta:nebula:ring-nebula"));
  changed.rowDigest = sha256V662(JSON.stringify(changed.rows));
  checked = verifyR75MatrixShapeV662(changed);
  assert.ok(checked.issues.includes("held-image-promoted:beta:nebula:ring-nebula"));
});

test("replay rejects changed source identity and missing pin", async () => {
  const changed = clone(await baseline());
  changed.appSourceSha256 = "0".repeat(64);
  changed.assetPins.pop();
  const replay = await replayR75MatrixV662(changed);
  assert.equal(replay.status, "rejected-candidate");
  assert.ok(replay.issues.includes("current-source-drift"));
  assert.ok(replay.issues.includes("asset-pin-drift"));
});

test("runtime and held routes are distinct in HTTP qualification", async () => {
  const current = await baseline();
  const wrong = {
    home: { status: 200 }, health: { status: 200 },
    webSky: { status: 200, candidateOnly: "true", admission: "hold",
      writeback: "false" },
    aAssets: [], reviewImages: [], heldImages: [],
    foreignOrigin: { status: 200 }, invalidReview: { status: 404 },
  };
  const verified = verifyHttpMatrixV662(current, wrong, "http://127.0.0.1:3126");
  assert.equal(verified.ok, false);
  assert.ok(verified.issues.includes("nebula-http-coverage"));
  assert.ok(verified.issues.includes("a-nebula-http-coverage"));
  assert.ok(verified.issues.includes("negative-routes"));
});

test("saved local HTTP evidence matches the pinned production matrix", async () => {
  const current = await baseline();
  const relative = "docs/release/v607/mainline-a-r75-v662-http-20261013v662r75web02.json";
  const receipt = JSON.parse((await readFile(safeWorkspacePathV662(relative)))
    .toString("utf8"));
  const verified = verifyHttpMatrixV662(current,
    receipt.observations, receipt.origin);
  assert.equal(verified.ok, true);
  assert.equal(verified.aAssets, 12);
  assert.equal(verified.reviewImages, 19);
  assert.equal(verified.heldImages, 5);
  assert.equal(receipt.claims.publicWebReleaseApproved, false);
});

test("CLI identifiers are strict and cannot reuse unrelated rounds", () => {
  assert.equal(parseRunIdV662(["--run-id", "20261013v662r75web02"]),
    "20261013v662r75web02");
  assert.throws(() => parseRunIdV662(["--run-id", "20261013v661r74web02"]));
  assert.equal(parseReplayOptionsV662(["--run-id", "20261013v662r75web02"])
    .buildRunId, null);
  assert.equal(parseHttpOptionsV662(["--run-id", "20261013v662r75web02",
    "--port", "3126"]).origin, "http://127.0.0.1:3126");
  assert.throws(() => parseHttpOptionsV662(["--run-id", "20261013v662r75web02",
    "--port", "80"]));
});

test("stored matrix receipt is only static evidence", async () => {
  const bytes = await readFile(safeWorkspacePathV662(
    "docs/release/v607/mainline-a-r75-v662-matrix-20261013v662r75web01.json"));
  const saved = JSON.parse(bytes.toString("utf8"));
  assert.equal(saved.evidenceClass, "static-local-file-replay");
  assert.equal(saved.claims.browserAccepted, false);
  assert.equal(saved.claims.publicWebReleaseApproved, false);
  assert.equal(saved.claims.productionPerformance, false);
});
