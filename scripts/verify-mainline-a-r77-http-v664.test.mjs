import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { parseR77HttpOptionsV664,
  verifyR77HttpV664 } from
  "./verify-mainline-a-r77-http-v664.mjs";

const freeze = JSON.parse(await readFile(safeWorkspacePathV662(
  "docs/release/v607/mainline-a-r77-v664-freeze-20261013v664r77freeze01.json"),
"utf8"));
const origin = "http://127.0.0.1:3130";
function observation(mode) {
  const aAssets = freeze.matrixRows.filter((row) =>
    row.group === "a-nebula");
  const beta = freeze.matrixRows.filter((row) =>
    row.group === "beta-nebula");
  return { home: { status: 200 },
    health: { status: 200 },
    webSky: { status: 200, candidateOnly: "true",
      admission: "hold", writeback: "false" },
    readiness: { status: 200, candidateOnly: "true",
      releaseAdmission: "hold", writeback: "false",
      json: { items: Array.from({ length: 9 }),
        gates: Array.from({ length: 6 }),
        publicWebReleaseAllowed: false,
        scientificPayloadWriteback: false } },
    aAssets: aAssets.map((row) => ({
      id: row.id, status: 200,
      sha256: row.imageSha256 })),
    reviewImages: beta.filter((row) => row.imageRoute)
      .map((row) => ({ id: row.id,
        status: mode === "enabled" ? 200 : 404,
        finalUrl: origin + row.imageRoute,
        sha256: mode === "enabled" ? row.imageSha256 : null,
        artifactSha256: mode === "enabled"
          ? row.imageSha256 : null,
        reviewBoundary: mode === "enabled"
          ? "candidate-hold" : null,
        rights: mode === "enabled" ? "pending" : null,
        writeback: mode === "enabled" ? "false" : null })),
    heldImages: beta.filter((row) => !row.imageRoute)
      .map((row) => ({ id: row.id, status: 404,
        finalUrl: origin
          + "/api/atlas/mainline-a-nebula-review/"
          + row.id + "/detail" })),
    invalidReview: { status: 404 },
    foreignOrigin: mode === "enabled"
      ? { status: 404 } : null };
}
test("accepts local candidate HTTP routes when preview is enabled", () => {
  const result = verifyR77HttpV664(freeze,
    observation("enabled"), origin, "enabled");
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.aAssets, 12);
  assert.equal(result.reviewImages, 19);
  assert.equal(result.heldImages, 5);
});
test("accepts default-off denial of every candidate image route", () => {
  const result = verifyR77HttpV664(freeze,
    observation("default-off"), origin, "default-off");
  assert.equal(result.ok, true, result.issues.join(","));
});
test("rejects rights promotion and image byte drift", () => {
  const bad = observation("enabled");
  bad.reviewImages[0].rights = "signed";
  bad.reviewImages[1].sha256 = "0".repeat(64);
  assert.ok(verifyR77HttpV664(freeze, bad, origin, "enabled")
    .issues.includes("candidate-review-image-http"));
});
test("rejects held image exposure and a missing A asset", () => {
  const bad = observation("enabled");
  bad.heldImages[0].status = 200;
  bad.aAssets.pop();
  const issues = verifyR77HttpV664(freeze, bad,
    origin, "enabled").issues;
  assert.ok(issues.includes("held-nebula-route-exposed"));
  assert.ok(issues.includes("canonical-a-image-http"));
});
test("rejects false release and scientific writeback", () => {
  const bad = observation("enabled");
  bad.readiness.json.publicWebReleaseAllowed = true;
  bad.webSky.writeback = "true";
  assert.ok(verifyR77HttpV664(freeze, bad,
    origin, "enabled").issues.includes(
    "home-health-or-gate-route"));
});
test("rejects external origin acceptance and invalid mode", () => {
  const bad = observation("enabled");
  bad.foreignOrigin.status = 200;
  assert.ok(verifyR77HttpV664(freeze, bad,
    origin, "enabled").issues.includes(
    "negative-route-exposed"));
  assert.ok(verifyR77HttpV664(freeze, bad,
    origin, "unknown").issues.includes("mode-invalid"));
});
test("CLI rejects unsafe or unbound run arguments", () => {
  const args = ["--run-id", "20261013v664r77web01",
    "--port", "3130",
    "--build-run-id", "20261013v664r77web01",
    "--freeze-run-id", "20261013v664r77freeze01",
    "--mode", "enabled"];
  assert.equal(parseR77HttpOptionsV664(args).origin, origin);
  assert.throws(() => parseR77HttpOptionsV664(
    [...args.slice(0, 9), "public"]));
});
