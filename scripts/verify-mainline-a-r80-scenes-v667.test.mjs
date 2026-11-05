import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

process.env.MAINLINE_A_R80_PROFILE = "1";
process.env.MAINLINE_A_R80_ORIGIN = "http://127.0.0.1:3136/";
process.env.MAINLINE_A_R80_BUILD_RUN_ID =
  "20261013v667r80web01";
const { auditWebCanonicalSceneV648,
  inspectWebCanonicalSceneV648,
  replayWebCanonicalSceneV648 } = await import(
  "./verify-mainline-a-web-canonical-scene-v648.mjs");

const runId = "20261013-v667scene01";
const base = "docs/release/v607/";
const [desktop, mobile, build, manifestBytes] = await Promise.all([
  readFile(base + "mainline-a-r80-web-canonical-scene-desktop-raw-"
    + runId + ".json", "utf8").then(JSON.parse),
  readFile(base + "mainline-a-r80-web-canonical-scene-mobile-raw-"
    + runId + ".json", "utf8").then(JSON.parse),
  readFile(base + "mainline-a-r80-build-"
    + "20261013v667r80web01.json", "utf8").then(JSON.parse),
  readFile("app/data/mainlineACanonicalCoverageV622.generated.json"),
]);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const screenshots = Object.fromEntries(await Promise.all(
  [desktop, mobile].flatMap((raw) => raw.items.map((item) =>
    item.screenshot.path)).map(async (relative) =>
    [relative, await readFile(relative)])));

function input() {
  return { raws: { desktop: structuredClone(desktop),
    mobile: structuredClone(mobile) },
  build, manifest, manifestBytes,
  sourceSha256: build.inputAfterSha256,
  runId, screenshots };
}

test("R80 scene verifier accepts 36 A-line scenes in each viewport", () => {
  const result = inspectWebCanonicalSceneV648(input());
  assert.equal(result.status,
    "verified-local-browser-scenes-candidate");
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.counts, {
    desktopSelectedReady: 36,
    mobileViewportSelectedReady: 36,
    screenshotsHashed: 72,
    humanRightsSigned: 0,
  });
});

test("R80 scene verifier rejects a substituted selected object", () => {
  const evidence = input();
  evidence.raws.desktop.items[0].observed.selectedCatalogId =
    "stellar-hero:unrelated";
  const result = inspectWebCanonicalSceneV648(evidence);
  assert.equal(result.status, "failed");
  assert.ok(result.issues.some((issue) =>
    issue.includes("selection-or-passport-invalid")));
});

test("R80 scene verifier rejects promoted nebula rights and writeback", () => {
  const evidence = input();
  const nebula = evidence.raws.mobile.items.find((item) =>
    item.key === "nebula:m42");
  nebula.observed.nebula.rights = "approved";
  nebula.observed.boundary.scientificPayloadWriteback = "true";
  const result = inspectWebCanonicalSceneV648(evidence);
  assert.equal(result.status, "failed");
  assert.ok(result.issues.some((issue) =>
    issue.includes("scene-image-or-rights-invalid")));
  assert.ok(result.issues.some((issue) =>
    issue.includes("build-or-boundary-drift")));
});

test("R80 scene verifier rejects a changed screenshot pin", () => {
  const evidence = input();
  evidence.raws.desktop.items[0].screenshot.sha256 = "0".repeat(64);
  const result = inspectWebCanonicalSceneV648(evidence);
  assert.equal(result.status, "failed");
  assert.ok(result.issues.some((issue) =>
    issue.includes("screenshot-digest-invalid")));
});

test("R80 scene verifier replays only an identical current report", async () => {
  const report = await auditWebCanonicalSceneV648(runId);
  assert.equal(report.status,
    "verified-local-browser-scenes-candidate");
  assert.equal(replayWebCanonicalSceneV648(report, report).status,
    "replayed-local-browser-scenes-candidate");
  assert.throws(() => replayWebCanonicalSceneV648({ ...report,
    sourceSha256: "0".repeat(64) }, report),
  /saved-replay-mismatch/);
});
