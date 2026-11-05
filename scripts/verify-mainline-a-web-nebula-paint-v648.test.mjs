import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebNebulaPaintV648,
  inspectWebNebulaPaintV648,
  replayWebNebulaPaintV648,
} from "./verify-mainline-a-web-nebula-paint-v648.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "a".repeat(64);
const BUILD_ID = `mainline-a-${SOURCE.slice(0, 16)}`;
const BRANCH = "codex/solar-sim-mainline-a";
const HEAD = "b".repeat(40);

function browserRaw(viewport, painted) {
  return {
    schema: "mainline-a-browser-raw-dom-v645",
    documentVisibility: "visible",
    viewport,
    dom: {
      build: { runtimeBuildId: BUILD_ID, branch: BRANCH, head: HEAD },
      markers: {
        scientificPayloadWriteback: "false",
        releaseBoundary: "candidate-only-hold-not-admitted",
      },
    },
    webRights: {
      webRelease: "blocked-rights-pending",
      selectedAdmission: "candidate-only",
      selectedRightsReview: "pending",
      clearedClaimVisible: false,
      summaryCounts: [12, 18, 0, 30],
    },
    preview: {
      selectedId: "m42",
      imageComplete: true,
      naturalWidth: 1280,
      naturalHeight: 1378,
      imageSrc: "http://127.0.0.1:3091/textures/mainline-a/opo0205d.jpg",
      sourceHref: "https://esahubble.org/images/opo0205d/",
      ...(painted ? { renderState: "loaded", computedOpacity: 1 } : {}),
    },
  };
}

function validInput() {
  return {
    build: {
      status: "passed", exitCode: 0, sourceStable: true,
      inputBefore: { sha256: SOURCE }, inputAfterSha256: SOURCE,
      buildId: "test-build", runtimeBuildId: BUILD_ID, branch: BRANCH, head: HEAD,
    },
    previousMobile: browserRaw([390, 844], false),
    currentDesktop: browserRaw([1280, 720], true),
    currentMobile: browserRaw([390, 844], true),
    previousShot: { bytes: 100, sha256: "old" },
    currentShot: { bytes: 110, sha256: "new" },
    oldMean: 15,
    newMean: 61,
    sourceSha256: SOURCE,
  };
}

test("paint verifier accepts a separately captured, settled image", () => {
  const report = inspectWebNebulaPaintV648(validInput());
  assert.equal(report.status, "verified-local-visual-capture-correction");
  assert.deepEqual(report.issues, []);
  assert.ok(report.brightnessRatio > 4);
});

test("paint verifier rejects a decoded image before opacity settles", () => {
  const input = validInput();
  input.currentMobile.preview.computedOpacity = 0;
  const report = inspectWebNebulaPaintV648(input);
  assert.equal(report.status, "blocked");
  assert.ok(report.issues.includes("current-mobile:paint-not-stable"));
});

test("paint verifier rejects forged copyright or release promotion", () => {
  const input = validInput();
  input.currentMobile.webRights.selectedRightsReview = "signed";
  input.currentDesktop.webRights.webRelease = "approved";
  const report = inspectWebNebulaPaintV648(input);
  assert.equal(report.status, "blocked");
  assert.ok(report.issues.includes("current-mobile:rights-promotion"));
  assert.ok(report.issues.includes("current-desktop:rights-promotion"));
});

test("paint verifier rejects unrelated or unchanged screenshots", () => {
  const input = validInput();
  input.currentMobile.preview.imageSrc = "http://127.0.0.1:3091/not-m42.jpg";
  input.currentShot.sha256 = input.previousShot.sha256;
  input.newMean = input.oldMean;
  const report = inspectWebNebulaPaintV648(input);
  assert.equal(report.status, "blocked");
  assert.ok(report.issues.includes("current-mobile:source-image-drift"));
  assert.ok(report.issues.includes("screenshot-identical-or-missing"));
  assert.ok(report.issues.includes("screenshot-paint-not-improved"));
});

test("paint verifier rejects changed build identity", () => {
  const input = validInput();
  input.build.inputAfterSha256 = "c".repeat(64);
  input.currentMobile.dom.build.runtimeBuildId = "other-build";
  const report = inspectWebNebulaPaintV648(input);
  assert.equal(report.status, "blocked");
  assert.ok(report.issues.includes("build-source-drift"));
  assert.ok(report.issues.includes("current-mobile:runtime-identity-drift"));
});

test("current screenshot receipt replays and tampered visual metric fails", async () => {
  const fresh = await auditWebNebulaPaintV648();
  assert.equal(fresh.status, "verified-local-visual-capture-correction");
  const saved = JSON.parse(await readFile(path.join(ROOT,
    "docs/release/v607/mainline-a-r66-web-nebula-paint-20261007-v648web03-final.json"), "utf8"));
  assert.equal(replayWebNebulaPaintV648(saved, fresh).status,
    "replayed-local-visual-capture-correction");
  const forged = structuredClone(saved);
  forged.newMean += 1;
  assert.throws(() => replayWebNebulaPaintV648(forged, fresh),
    /paint-v648:saved-replay-mismatch/);
});
