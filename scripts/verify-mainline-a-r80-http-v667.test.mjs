import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseR80HttpOptionsV667, verifyR80HttpV667 } from
  "./verify-mainline-a-r80-http-v667.mjs";

const audit = JSON.parse(await readFile(
  "docs/release/v607/mainline-a-r79-v666-visual-static-"
    + "20261013v666r79visual04.json", "utf8"));
const origin = "http://127.0.0.1:3136";

function observation(mode) {
  const ok = { status: 200 };
  const images = audit.images.map((pin) => {
    const enabled = mode === "enabled"
      || pin.kind === "a-local-image";
    return { route: pin.route,
      finalUrl: origin + pin.route,
      status: enabled ? 200 : 404,
      sha256: enabled ? pin.sha256 : "0".repeat(64),
      bytes: enabled ? pin.bytes : 0,
      contentType: enabled ? pin.mimeType : "text/html",
      artifactSha256: enabled && pin.kind !== "a-local-image"
        ? pin.sha256 : null,
      reviewOnly: enabled && pin.kind !== "a-local-image"
        ? "candidate-hold" : null,
      rights: enabled && pin.kind !== "a-local-image"
        ? "pending" : null,
      writeback: enabled && pin.kind !== "a-local-image"
        ? "false" : null };
  });
  const heldImages = ["ring-nebula", "dumbbell-nebula",
    "bubble-nebula", "cats-eye-nebula", "omega-nebula"]
    .map((id) => ({ id, status: 404,
      artifactSha256: null, reviewOnly: null }));
  return { home: ok, health: ok, images, heldImages,
    invalidRoute: { status: 404 } };
}

test("R80 HTTP parser binds two local modes to current build", () => {
  assert.deepEqual(parseR80HttpOptionsV667([
    "--mode", "enabled", "--run-id", "20261013v667r80http01",
    "--port", "3136", "--build-run-id",
    "20261013v667r80web01",
  ]), {
    mode: "enabled", runId: "20261013v667r80http01",
    port: 3136, buildRunId: "20261013v667r80web01",
    origin,
  });
  assert.throws(() => parseR80HttpOptionsV667([
    "--mode", "enabled", "--run-id", "unsafe",
    "--port", "3136", "--build-run-id",
    "20261013v667r80web01",
  ]), /r80-http:mode-run-id-or-port/);
});

test("R80 HTTP validates 31 enabled image routes and five holds", () => {
  const result = verifyR80HttpV667(audit,
    observation("enabled"), origin, "enabled");
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(result.requestableImageRoutes, 31);
  assert.equal(result.heldImageRoutes, 5);
  assert.equal(result.publicWebReleaseApproved, false);
});

test("R80 HTTP keeps all Beta candidate images default off", () => {
  const result = verifyR80HttpV667(audit,
    observation("default-off"), origin, "default-off");
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

test("R80 HTTP rejects a forged Beta exposure in default-off mode", () => {
  const seen = observation("default-off");
  const beta = seen.images.find((item) =>
    item.route.includes("heart-nebula"));
  beta.status = 200;
  assert.equal(verifyR80HttpV667(audit, seen,
    origin, "default-off").ok, false);
});

test("R80 HTTP rejects changed bytes and a missing candidate header", () => {
  const seen = observation("enabled");
  const beta = seen.images.find((item) =>
    item.route.includes("heart-nebula"));
  beta.sha256 = "0".repeat(64);
  beta.reviewOnly = null;
  const result = verifyR80HttpV667(audit, seen,
    origin, "enabled");
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("image-bytes:")));
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("candidate-headers:")));
});

test("R80 HTTP rejects a held route becoming requestable", () => {
  const seen = observation("enabled");
  seen.heldImages[0].status = 200;
  assert.equal(verifyR80HttpV667(audit, seen,
    origin, "enabled").ok, false);
});
