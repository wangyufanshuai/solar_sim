import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCatalogV660, verifyCatalogMediaV660 } from
  "./build-mainline-a-r73-catalog-v660.mjs";
import { verifyR73HttpBoundaryV660 } from
  "./verify-mainline-a-r73-http-v660.mjs";
import { validateR73BrowserV660 } from
  "./capture-mainline-a-r73-browser-v660.mjs";
import { pinR73FileV660 } from
  "./build-mainline-a-r73-candidate-v660.mjs";

const catalog = JSON.parse(await readFile(
  "app/data/mainlineANebulaR73CatalogV660.generated.json", "utf8"));
const origin = "http://127.0.0.1:3121";
const disabled = "http://127.0.0.1:3122";

function httpObservations() {
  return {
    home: { status: 200 }, health: { status: 200 },
    images: catalog.rows.filter((row) => row.delivery).map((row) => ({
      id: row.id, status: 200, bytes: row.delivery.bytes,
      sha256: row.delivery.sha256, contentType: row.delivery.mimeType,
      finalUrl: `${origin}${row.delivery.route}`,
      boundary: "candidate-hold", rights: "pending",
      scientificPayloadWriteback: "false",
    })),
    held: catalog.rows.filter((row) => !row.delivery).map((row) => ({
      id: row.id, status: 404,
    })),
    disabled: { status: 404, origin: disabled },
    invalid: { status: 404 }, foreignOrigin: { status: 404 },
  };
}

function browserDevice(device) {
  return { device,
    rows: catalog.rows.map((row) => ({ id: row.id,
      imageState: row.delivery ? "loaded" : "policy-hold",
      decodedSize: row.delivery
        ? [row.delivery.width, row.delivery.height] : null,
      sourceLinkMatched: true, parentDetailMatched: true })),
    objectUrlsAfterClose: 0, pageErrors: [], consoleErrors: [],
    layout: { searchWidth: 240, viewportWidth: 1280,
      documentWidth: 1280, panelWidth: 700,
      panelScrollWidth: 700 },
    screenshots: { overview: { sha256: "a".repeat(64) },
      imageDetail: { sha256: "b".repeat(64) },
      heldDetail: { sha256: "c".repeat(64) } },
  };
}

test("R73 catalog independently replays all 24 inputs and 85 raw pins", async () => {
  const result = await buildCatalogV660("check");
  assert.equal(result.status,
    "verified-24-candidates-19-review-images-5-policy-holds");
  assert.deepEqual([result.counts.checkedFiles,
    result.counts.reviewImages, result.counts.policyHolds],
  [85, 19, 5]);
});

test("candidate packaging pins real bytes and rejects drift or traversal", async () => {
  const path = "app/data/mainlineANebulaR73CatalogV660.generated.json";
  const pin = await pinR73FileV660(path, "static");
  assert.equal(pin.bytes, 62598);
  assert.equal(pin.sha256,
    "3ab8bf639f8241cdfe042a4ac143031f76d6fe1f9ca0bdf133158b24d8f3b8db");
  await assert.rejects(pinR73FileV660(path, "static",
    "0".repeat(64)), /pin-hash-invalid/);
  await assert.rejects(pinR73FileV660("../outside.json", "static"),
    /evidence-path-outside-workspace/);
});

test("R73 offline pin verification fails on forged raw SHA", async () => {
  const clone = structuredClone(catalog);
  clone.rows[0].rawEvidence[0].sha256 = "0".repeat(64);
  const result = await verifyCatalogMediaV660(clone);
  assert.equal(result.ok, false);
  assert.match(result.issues.map((issue) => issue.code).join(" "),
    /media-sha-mismatch/);
});

test("R73 offline pin verification fails on forged delivery dimensions", async () => {
  const clone = structuredClone(catalog);
  clone.rows[0].delivery.width += 1;
  const result = await verifyCatalogMediaV660(clone);
  assert.equal(result.ok, false);
  assert.match(result.issues.map((issue) => issue.code).join(" "),
    /delivery-dimensions-or-format-mismatch/);
});

test("HTTP matrix requires 19 exact pinned responses and five unserved holds", () => {
  const valid = httpObservations();
  assert.equal(verifyR73HttpBoundaryV660(catalog, valid,
    origin, disabled).ok, true);
  const promoted = structuredClone(valid);
  promoted.held[0].status = 200;
  assert.deepEqual(verifyR73HttpBoundaryV660(catalog, promoted,
    origin, disabled).issues, ["policy-holds-served-or-missing"]);
  const substituted = structuredClone(valid);
  substituted.images[0].sha256 = "0".repeat(64);
  assert.deepEqual(verifyR73HttpBoundaryV660(catalog, substituted,
    origin, disabled).issues, ["review-images-incomplete-or-incorrect"]);
});

test("HTTP matrix refuses a foreign final URL and open disabled route", () => {
  const changed = httpObservations();
  changed.images[3].finalUrl = "https://example.invalid/foreign.webp";
  changed.disabled.status = 200;
  const verified = verifyR73HttpBoundaryV660(catalog, changed,
    origin, disabled);
  assert.equal(verified.ok, false);
  assert.deepEqual(verified.issues, [
    "review-images-incomplete-or-incorrect",
    "local-route-negative-check-invalid",
  ]);
});

test("browser matrix demands both viewports and all 24 distinct selections", () => {
  const build = { buildId: "build-1", inputAfterSha256: "a".repeat(64) };
  const receipt = { schema: "mainline-a-r73-nebula-browser-v660",
    status: "passed-local-desktop-and-mobile-viewport",
    buildId: build.buildId, sourceSha256: build.inputAfterSha256,
    totals: { selections: 48, loadedImages: 38,
      policyHeldDetails: 10 },
    claims: { copyrightApproval: false, productionPerformance: false,
      publicWebReleaseApproved: false,
      scientificPayloadWriteback: false },
    desktop: browserDevice("desktop"),
    mobileViewport: browserDevice("mobile-viewport") };
  assert.equal(validateR73BrowserV660(receipt, catalog, build).ok, true);
  const missing = structuredClone(receipt);
  missing.mobileViewport.rows.pop();
  assert.deepEqual(validateR73BrowserV660(missing, catalog, build).issues,
    ["mobileViewport-coverage-or-release-invalid"]);
});

test("browser matrix refuses leaked object URLs and false release status", () => {
  const build = { buildId: "build-1", inputAfterSha256: "a".repeat(64) };
  const receipt = { schema: "mainline-a-r73-nebula-browser-v660",
    status: "passed-local-desktop-and-mobile-viewport",
    buildId: build.buildId, sourceSha256: build.inputAfterSha256,
    totals: { selections: 48, loadedImages: 38,
      policyHeldDetails: 10 },
    claims: { copyrightApproval: true, productionPerformance: false,
      publicWebReleaseApproved: false,
      scientificPayloadWriteback: false },
    desktop: browserDevice("desktop"),
    mobileViewport: browserDevice("mobile-viewport") };
  receipt.desktop.objectUrlsAfterClose = 1;
  assert.deepEqual(validateR73BrowserV660(receipt, catalog, build).issues,
    ["browser-identity-or-boundary-invalid",
      "desktop-coverage-or-release-invalid"]);
});
