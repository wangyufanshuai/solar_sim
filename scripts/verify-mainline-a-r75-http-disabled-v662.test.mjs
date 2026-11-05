import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { parseDisabledOptionsV662, verifyDisabledHttpV662 } from
  "./verify-mainline-a-r75-http-disabled-v662.mjs";

const clone = (value) => structuredClone(value);
let evidence;
async function baseline() {
  evidence ??= Promise.all([
    "mainline-a-r75-v662-matrix-20261013v662r75web02.json",
    "mainline-a-r75-v662-http-disabled-20261013v662r75web02.json",
  ].map(async (name) => JSON.parse(await readFile(safeWorkspacePathV662(
    `docs/release/v607/${name}`), "utf8"))));
  return evidence;
}

test("default-off production server denies all 24 candidate review routes", async () => {
  const [matrix, receipt] = await baseline();
  const checked = verifyDisabledHttpV662(matrix,
    receipt.observations, receipt.origin);
  assert.equal(receipt.status, "passed-default-off-local-production-build");
  assert.deepEqual(checked.issues, []);
  assert.equal(checked.reviewImagesDenied, 19);
  assert.equal(checked.heldImagesDenied, 5);
  assert.equal(receipt.scientificPayloadWriteback, false);
  assert.equal(receipt.claims.publicWebReleaseApproved, false);
});

test("one exposed image invalidates the default-off qualification", async () => {
  const [matrix, receipt] = await baseline();
  const forged = clone(receipt.observations);
  forged.review[0].status = 200;
  const checked = verifyDisabledHttpV662(matrix, forged, receipt.origin);
  assert.equal(checked.ok, false);
  assert.ok(checked.issues.includes(`review-image-exposed:${forged.review[0].id}`));
});

test("one missing held route cannot be hidden by successful non-image routes", async () => {
  const [matrix, receipt] = await baseline();
  const forged = clone(receipt.observations);
  const removed = forged.held.pop();
  const checked = verifyDisabledHttpV662(matrix, forged, receipt.origin);
  assert.equal(checked.ok, false);
  assert.ok(checked.issues.includes("image-route-coverage"));
  assert.ok(checked.issues.includes(`held-image-exposed:${removed.id}`));
});

test("a held response from another route cannot satisfy the expected denial", async () => {
  const [matrix, receipt] = await baseline();
  const forged = clone(receipt.observations);
  forged.held[0].finalUrl = `${receipt.origin}/api/health`;
  const checked = verifyDisabledHttpV662(matrix, forged, receipt.origin);
  assert.equal(checked.ok, false);
  assert.ok(checked.issues.includes(`held-image-exposed:${forged.held[0].id}`));
});

test("disabled HTTP runner rejects unrelated identities and privileged ports", () => {
  assert.equal(parseDisabledOptionsV662(["--run-id",
    "20261013v662r75web02", "--port", "3127"]).origin,
  "http://127.0.0.1:3127");
  assert.throws(() => parseDisabledOptionsV662(["--run-id",
    "20261013v661r74web02", "--port", "3127"]));
  assert.throws(() => parseDisabledOptionsV662(["--run-id",
    "20261013v662r75web02", "--port", "80"]));
});
