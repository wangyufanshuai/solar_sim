import assert from "node:assert/strict";
import test from "node:test";
import { buildR79VisualAuditV666 } from
  "./audit-mainline-a-r79-visual-v666.mjs";
import { parseR79HttpOptionsV666, verifyR79HttpV666 } from
  "./verify-mainline-a-r79-http-v666.mjs";

const ORIGIN = "http://127.0.0.1:3134";
const audit = buildR79VisualAuditV666("20261013v666r79visual01");

function observation(pins, mode) {
  const images = pins.images.map((pin) => {
    const allowed = pin.kind === "a-local-image" || mode === "enabled";
    return { route: pin.route,
      finalUrl: ORIGIN + pin.route,
      status: allowed ? 200 : 404,
      sha256: allowed ? pin.sha256 : "0".repeat(64),
      bytes: allowed ? pin.bytes : 30,
      contentType: allowed ? pin.mimeType : "application/json",
      artifactSha256: allowed && pin.kind !== "a-local-image"
        ? pin.sha256 : null,
      reviewOnly: allowed && pin.kind !== "a-local-image"
        ? "candidate-hold" : null,
      rights: allowed && pin.kind !== "a-local-image"
        ? "pending" : null,
      writeback: allowed && pin.kind !== "a-local-image"
        ? "false" : null };
  });
  const heldImages = ["ring-nebula", "dumbbell-nebula",
    "bubble-nebula", "cats-eye-nebula", "omega-nebula"]
    .map((id) => ({ id, status: 404,
      artifactSha256: null, reviewOnly: null }));
  return { home: { status: 200 }, health: { status: 200 },
    images, heldImages, invalidRoute: { status: 404 } };
}

test("accepts only local ports, modes and bounded run IDs", () => {
  const args = ["--mode", "enabled", "--run-id",
    "20261013v666r79http01", "--port", "3134",
    "--build-run-id", "20261013v666r79web01",
    "--audit-run-id", "20261013v666r79visual01"];
  assert.equal(parseR79HttpOptionsV666(args).origin, ORIGIN);
  assert.throws(() => parseR79HttpOptionsV666([
    ...args.slice(0, 1), "publish", ...args.slice(2)]));
  assert.throws(() => parseR79HttpOptionsV666([
    ...args.slice(0, 5), "80", ...args.slice(6)]));
});

test("validates all 31 current A and Beta routes in enabled mode", async () => {
  const pins = await audit;
  const result = verifyR79HttpV666(pins,
    observation(pins, "enabled"), ORIGIN, "enabled");
  assert.equal(result.ok, true);
  assert.equal(result.expectedImages, 31);
  assert.equal(result.expectedHeldImages, 5);
  assert.equal(result.publicWebReleaseApproved, false);
});

test("validates default-off 404 for Beta while A remains loadable", async () => {
  const pins = await audit;
  const result = verifyR79HttpV666(pins,
    observation(pins, "default-off"), ORIGIN, "default-off");
  assert.equal(result.ok, true);
});

test("rejects a changed A image body or Beta artifact header", async () => {
  const pins = await audit;
  const forgedA = observation(pins, "enabled");
  forgedA.images.find((item) =>
    item.route.includes("opo0205d")).sha256 = "0".repeat(64);
  assert.ok(verifyR79HttpV666(pins,
    forgedA, ORIGIN, "enabled").issues.some((issue) =>
    issue.startsWith("image-bytes:a:nebula:m42")));
  const forgedBeta = observation(pins, "enabled");
  forgedBeta.images.find((item) =>
    item.route.includes("heart-nebula")).artifactSha256 = null;
  assert.ok(verifyR79HttpV666(pins,
    forgedBeta, ORIGIN, "enabled").issues.some((issue) =>
    issue.startsWith("candidate-headers:beta:nebula:heart-nebula")));
});

test("rejects a default-off exposure and a held-route exposure", async () => {
  const pins = await audit;
  const forged = observation(pins, "default-off");
  forged.images.find((item) =>
    item.route.includes("heart-nebula")).status = 200;
  forged.heldImages[0].status = 200;
  const result = verifyR79HttpV666(pins,
    forged, ORIGIN, "default-off");
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) =>
    issue.startsWith("default-off-image-exposed")));
  assert.ok(result.issues.includes("held-images-exposed"));
});

test("rejects duplicated routes, missing health and a foreign origin", async () => {
  const pins = await audit;
  const forged = observation(pins, "enabled");
  forged.images.push({ ...forged.images[0] });
  forged.health.status = 500;
  const result = verifyR79HttpV666(pins,
    forged, "https://example.invalid", "enabled");
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("origin-or-mode"));
  assert.ok(result.issues.includes("home-or-health"));
  assert.ok(result.issues.includes("image-observation-count"));
});
