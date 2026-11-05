import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import acceptanceModule from
  "../app/lib/mainlineAWebAcceptanceV662.ts";
import visualModule from
  "../app/lib/mainlineAR79VisualReviewV666.ts";
import { buildR79VisualAuditV666, candidateLocalPathV666,
  inspectR79VisualAuditV666, parseR79VisualOptionsV666,
  pinVisualImageV666, replayR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";
import canonical from
  "../app/data/mainlineACanonicalCoverageV622.generated.json";
import sky from "../app/data/mainlineAWebSkyAtlasV656.generated.json";
import nebula from "../app/data/mainlineANebulaR73CatalogV660.generated.json";
import alternatives from
  "../app/data/mainlineANebulaR74AlternativesV661.generated.json";

const { assembleMainlineAWebAcceptanceV662 } =
  acceptanceModule.default ?? acceptanceModule;
const { assembleVisualReviewIndexV666,
  visualDeliveryByIdV666 } = visualModule.default ?? visualModule;
const RUN_ID = "20261013v666r79visual01";
const audit = buildR79VisualAuditV666(RUN_ID);

function pin(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
function resign(receipt) {
  receipt.fingerprint = pin({
    appSourceSha256: receipt.appSourceSha256,
    inputPins: receipt.inputPins,
    v616Pins: receipt.v616Pins,
    images: receipt.images,
    summary: receipt.summary,
    boundary: receipt.boundary,
  });
  return receipt;
}

test("accepts only explicit audit/replay modes and bounded run IDs", () => {
  assert.deepEqual(parseR79VisualOptionsV666([
    "--mode", "audit", "--run-id", RUN_ID]),
  { mode: "audit", runId: RUN_ID });
  assert.throws(() => parseR79VisualOptionsV666([
    "--mode", "publish", "--run-id", RUN_ID]));
  assert.throws(() => parseR79VisualOptionsV666([
    "--mode", "audit", "--run-id", "../escape"]));
});

test("recomputes 31 real local image files and both immutable V616 pins", async () => {
  const receipt = await audit;
  assert.equal(receipt.images.length, 31);
  assert.deepEqual(receipt.summary, { matrixRows: 96,
    localImages: 31, aImages: 12, betaImages: 19,
    derivedPreviews: 12, officialRaw: 7,
    sourceHolds: 5, identityHolds: 4,
    noLocalImage: 56, rightsSigned: 0, runtimeAdmitted: 0 });
  assert.equal(receipt.v616Pins.length, 2);
  assert.equal(receipt.newHttpsRequests, 0);
  assert.equal(inspectR79VisualAuditV666(receipt).ok, true);
});

test("keeps source-held and identity-held rows off every file path", () => {
  const matrix = assembleMainlineAWebAcceptanceV662(
    canonical, sky, nebula, alternatives);
  const index = assembleVisualReviewIndexV666(matrix, nebula);
  const hold = index.plans.find((item) =>
    item.key === "beta:nebula:ring-nebula");
  assert.equal(hold.requestAllowed, false);
  assert.throws(() => candidateLocalPathV666(hold, null),
    /not-a-requestable-image/);
  const star = index.plans.find((item) =>
    item.key === "beta:star:acrux");
  assert.throws(() => candidateLocalPathV666(star, null),
    /not-a-requestable-image/);
});

test("rejects a forged local path even when route and digest match", () => {
  const matrix = assembleMainlineAWebAcceptanceV662(
    canonical, sky, nebula, alternatives);
  const index = assembleVisualReviewIndexV666(matrix, nebula);
  const plan = index.plans.find((item) =>
    item.key === "beta:nebula:heart-nebula");
  const delivery = visualDeliveryByIdV666(nebula).get("heart-nebula");
  assert.throws(() => candidateLocalPathV666(plan, {
    ...delivery, path: "../outside.webp" }),
  /image-path-outside-allowlist/);
  assert.throws(() => candidateLocalPathV666(plan, {
    ...delivery, path: "docs/release/v607/nebula-review-derivatives/v655/../outside.webp" }),
  /unsafe-path-segment/);
});

test("rejects a forged SHA without treating a decoded image as rights evidence", async () => {
  const matrix = assembleMainlineAWebAcceptanceV662(
    canonical, sky, nebula, alternatives);
  const index = assembleVisualReviewIndexV666(matrix, nebula);
  const plan = index.plans.find((item) =>
    item.key === "a:nebula:m42");
  await assert.rejects(() => pinVisualImageV666({ ...plan,
    expectedSha256: "f".repeat(64) }, null),
  /candidate-image-sha/);
});

test("rejects forged rights and release promotions even after resigning", async () => {
  const original = await audit;
  const forgedRights = structuredClone(original);
  forgedRights.summary.rightsSigned = 12;
  resign(forgedRights);
  assert.equal(inspectR79VisualAuditV666(forgedRights).ok, false);
  assert.ok(inspectR79VisualAuditV666(forgedRights).issues
    .includes("coverage-or-promotion"));
  const forgedRelease = structuredClone(original);
  forgedRelease.boundary.publicWebReleaseApproved = true;
  resign(forgedRelease);
  assert.ok(inspectR79VisualAuditV666(forgedRelease).issues
    .includes("boundary-or-network"));
});

test("rejects a changed image pin and a forged network count", async () => {
  const original = await audit;
  const forgedPin = structuredClone(original);
  forgedPin.images[0].sha256 = "0".repeat(64);
  assert.ok(inspectR79VisualAuditV666(forgedPin).issues
    .includes("fingerprint"));
  const forgedNetwork = structuredClone(original);
  forgedNetwork.newHttpsRequests = 1;
  assert.ok(inspectR79VisualAuditV666(forgedNetwork).issues
    .includes("boundary-or-network"));
});

test("replay compares the saved audit to the current source and files", async () => {
  const original = await audit;
  const replay = await replayR79VisualAuditV666(original, RUN_ID);
  assert.equal(replay.ok, true);
  assert.equal(replay.releaseAllowed, false);
  const drift = structuredClone(original);
  drift.appSourceSha256 = "0".repeat(64);
  resign(drift);
  const failed = await replayR79VisualAuditV666(drift, RUN_ID);
  assert.equal(failed.ok, false);
  assert.ok(failed.issues.includes("current-source-or-file-drift"));
});
