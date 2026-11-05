import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { R76_OUTPUT_V663, safePathR76V663 } from
  "./build-mainline-a-r76-readiness-v663.mjs";
import { parseR76BrowserOptionsV663 } from
  "./capture-mainline-a-r76-browser-v663.mjs";
import { parseR76HttpOptionsV663, verifyR76HttpV663 } from
  "./verify-mainline-a-r76-http-v663.mjs";

const snapshot = JSON.parse(await readFile(
  safePathR76V663(R76_OUTPUT_V663), "utf8"));
const previousMatrix = JSON.parse(await readFile(safePathR76V663(
  "docs/release/v607/mainline-a-r75-v662-matrix-20261013v662r75web02.json"),
"utf8"));
const reviewRoutes = previousMatrix.rows.filter((row) =>
  row.group === "beta-nebula" && row.imageRoute)
  .map((row) => ({ id: row.id, route: row.imageRoute }));
const origin = "http://127.0.0.1:3128";
function observation() {
  return {
    home: { status: 200 },
    health: { status: 200 },
    readiness: { status: 200,
      finalUrl: origin + "/api/atlas/mainline-a-web-readiness",
      contentType: "application/json; charset=utf-8",
      candidateOnly: "true", admission: "hold",
      writeback: "false", json: {
        schema: "mainline-a-r76-web-readiness-http-v663",
        status: "candidate-hold",
        sourceFingerprint: snapshot.fingerprint,
        publicWebReleaseAllowed: false,
        scientificPayloadWriteback: false,
        gates: Array.from({ length: 6 }, (_, index) =>
          ({ key: `gate-${index}` })),
        items: [
          ...snapshot.stars.map((row) => row.id),
          ...snapshot.nebulae.map((row) => row.id),
        ].map((id) => ({ id, runtimeAdmission: "candidate-only",
          rightsSigned: false, requestExecuted: false })),
        claims: { publicWebReleaseApproved: false },
      } },
    heldImages: snapshot.nebulae.map((row) => ({
      id: row.id, status: 404,
      finalUrl: origin
        + `/api/atlas/mainline-a-nebula-review/${row.id}/detail`,
    })),
    reviewDefaultOff: reviewRoutes.map((row) => ({
      id: row.id, status: 404,
      finalUrl: origin + row.route,
    })),
  };
}
test("accepts correctly scoped local HTTP hold evidence", () => {
  assert.equal(verifyR76HttpV663(snapshot,
    observation(), origin, reviewRoutes).ok, true);
});
test("rejects leaked raw artifact and response promotion", () => {
  const bad = observation();
  bad.readiness.json.items[0].rawArtifact = "secret-raw.csv";
  bad.readiness.json.items[1].rightsSigned = true;
  assert.ok(verifyR76HttpV663(snapshot, bad, origin, reviewRoutes)
    .issues.includes("http-payload-promoted-or-leaked"));
});
test("rejects scientific writeback header and false release claim", () => {
  const bad = observation();
  bad.readiness.writeback = "true";
  bad.readiness.json.claims.publicWebReleaseApproved = true;
  const issues = verifyR76HttpV663(snapshot, bad, origin,
    reviewRoutes).issues;
  assert.ok(issues.includes("http-route-or-boundary-invalid"));
  assert.ok(issues.includes("http-payload-promoted-or-leaked"));
});
test("rejects an exposed held image and stale fingerprint", () => {
  const bad = observation();
  bad.heldImages[0].status = 200;
  bad.readiness.json.sourceFingerprint = "0".repeat(64);
  const issues = verifyR76HttpV663(snapshot, bad, origin,
    reviewRoutes).issues;
  assert.ok(issues.includes("held-image-routes-exposed"));
  assert.ok(issues.includes("http-payload-promoted-or-leaked"));
});
test("rejects default-off candidate review images becoming public", () => {
  const bad = observation();
  bad.reviewDefaultOff[0].status = 200;
  assert.ok(verifyR76HttpV663(snapshot, bad, origin, reviewRoutes)
    .issues.includes("review-default-off-routes-exposed"));
});
test("requires run identity and local port for HTTP and browser", () => {
  const valid = ["--run-id", "20261013v663r76web01",
    "--port", "3128"];
  assert.equal(parseR76HttpOptionsV663(valid).origin, origin);
  assert.equal(parseR76BrowserOptionsV663(valid).buildRunId,
    "20261013v663r76web01");
  assert.throws(() => parseR76HttpOptionsV663(
    ["--run-id", "wrong", "--port", "3128"]));
  assert.throws(() => parseR76BrowserOptionsV663(
    ["--run-id", "20261013v663r76web01", "--port", "0"]));
});
