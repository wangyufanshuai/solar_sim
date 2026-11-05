import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  R74_SOURCES_V661, R74_TARGET_IDS_V661,
  inspectPageR74V661, requestFingerprintR74V661,
  safePageUrlR74V661, sha256R74V661,
} from "./mainline-a-r74-alternative-contract-v661.mjs";
import { requestPageR74V661,
  unexecutedImageRequestsR74V661 } from "./collect-mainline-a-r74-alternatives-v661.mjs";
import { inspectAttemptR74V661, replayLedgerR74V661,
  verifyRunR74V661 } from "./verify-mainline-a-r74-alternatives-v661.mjs";
import { inspectR74HttpV661 } from "./verify-mainline-a-r74-http-v661.mjs";
import { inspectEvidenceR74V661 } from "./audit-mainline-a-r74-evidence-v661.mjs";

const RUN_ID = "20261013v661r74page02";
const LEDGER_PATH = `docs/release/v607/mainline-a-r74-v661-page-ledger-${RUN_ID}.json`;
const ledger = JSON.parse(await readFile(LEDGER_PATH, "utf8"));

function changed(update) {
  const copy = structuredClone(ledger);
  update(copy);
  return copy;
}

test("R74 canonical request allowlist covers six pages for five held targets", () => {
  assert.equal(R74_SOURCES_V661.length, 6);
  assert.equal(R74_TARGET_IDS_V661.length, 5);
  assert.deepEqual(R74_SOURCES_V661.filter((source) =>
    source.targetId === "dumbbell-nebula").map((source) => source.key),
  ["dumbbell-spitzer", "dumbbell-hubble"]);
  for (const source of R74_SOURCES_V661) {
    assert.equal(safePageUrlR74V661(source.url, source), true);
    assert.match(requestFingerprintR74V661(source), /^[a-f0-9]{64}$/);
    assert.equal(safePageUrlR74V661(source.url.replace("https:", "http:"), source), false);
    assert.equal(safePageUrlR74V661(source.url.replace("science.nasa.gov",
      "science.nasa.gov.evil.test"), source), false);
    assert.equal(safePageUrlR74V661(`${source.url}?fake=1`, source), false);
  }
  assert.equal(safePageUrlR74V661(
    "https://science.nasa.gov/photojournal/other/",
    { ...R74_SOURCES_V661[0], url: "https://science.nasa.gov/photojournal/other/" }), false);
});

test("R74 raw NASA pages recompute object, credit and download metadata", async () => {
  for (const [index, source] of R74_SOURCES_V661.entries()) {
    const record = ledger.sources[index];
    const bytes = await readFile(record.rawArtifact.path);
    assert.equal(sha256R74V661(bytes), record.rawArtifact.sha256);
    const inspection = inspectPageR74V661(bytes, source);
    assert.deepEqual(inspection, record.inspection);
    assert.ok(inspection.downloads.length >= 2);
    assert.equal(inspection.imageRequestExecuted, false);
    assert.equal(inspection.imageResponseCaptured, 0);
    assert.equal(inspection.scientificPayloadWriteback, false);
    if (source.key === "dumbbell-spitzer") {
      assert.equal(inspection.target, "Helix Nebula");
      assert.equal(inspection.identityState, "identity-conflict");
      assert.deepEqual(inspection.issues, ["target-identity-conflict"]);
    } else {
      assert.equal(inspection.identityState, "page-identity-confirmed");
      assert.deepEqual(inspection.issues, []);
    }
  }
});

test("R74 transformed raw fixture cannot pass replay as a real captured page", async () => {
  const record = ledger.sources[1];
  const bytes = await readFile(record.rawArtifact.path);
  const altered = Buffer.from(bytes.toString("utf8")
    .replace("photojournal-target-helix-nebula", "photojournal-target-dumbbell-nebula")
    .replace(">Helix Nebula</a>", ">Dumbbell Nebula</a>"));
  assert.notEqual(sha256R74V661(altered), record.rawArtifact.sha256);
  const replay = await replayLedgerR74V661(ledger, {
    readRaw: async (relative) => relative === record.rawArtifact.path
      ? altered : readFile(relative),
  });
  assert.equal(replay.ok, false);
  assert.ok(replay.issues.some((issue) =>
    issue.includes("raw-bytes-or-sha-drift")));
  assert.ok(replay.issues.some((issue) =>
    issue.includes("stored-inspection-drift")));
});

test("R74 transport logs HTTP, MIME, redirect and timeout failures without raw capture", async () => {
  const source = R74_SOURCES_V661[0];
  const http = await requestPageR74V661(source, {
    fetchImpl: async () => new Response("unavailable", { status: 503,
      headers: { "content-type": "text/html" } }),
  });
  assert.equal(http.attempt.httpStatus, 503);
  assert.equal(http.attempt.errorClass, "http-status");
  assert.equal(http.attempt.responseCaptured, 0);
  assert.equal(http.body, null);
  const mime = await requestPageR74V661(source, {
    fetchImpl: async () => new Response("{}", { status: 200,
      headers: { "content-type": "application/json" } }),
  });
  assert.equal(mime.attempt.errorClass, "content-type");
  assert.equal(mime.attempt.responseCaptured, 0);
  const redirect = await requestPageR74V661(source, {
    fetchImpl: async () => new Response(null, { status: 302,
      headers: { location: "https://example.org/foreign" } }),
  });
  assert.equal(redirect.attempt.errorClass, "redirect-blocked");
  assert.equal(redirect.attempt.redirectChain.length, 2);
  assert.equal(redirect.attempt.responseCaptured, 0);
  const timeout = await requestPageR74V661(source, {
    fetchImpl: async () => {
      const error = new Error("timed out");
      error.name = "AbortError";
      throw error;
    },
  });
  assert.equal(timeout.attempt.errorClass, "timeout");
  assert.equal(timeout.attempt.timeout, true);
  assert.equal(timeout.attempt.responseCaptured, 0);
});

test("R74 five image requests remain explicitly unexecuted", () => {
  const imageRequests = unexecutedImageRequestsR74V661();
  assert.equal(imageRequests.length, 5);
  for (const item of imageRequests) {
    assert.equal(item.requestExecuted, false);
    assert.equal(item.responseCaptured, 0);
    assert.equal(item.rawArtifact, null);
  }
  assert.deepEqual(imageRequests, ledger.unexecutedImageRequests);
});

test("R74 offline replay verifies captured pages and refuses rights promotion", async () => {
  const replay = await replayLedgerR74V661(ledger);
  assert.equal(replay.ok, true, replay.issues.join("\n"));
  assert.equal(replay.checks.length, 6);
  assert.equal(replay.checks.filter((item) => item.responseCaptured === 1).length, 6);
  const run = await verifyRunR74V661(RUN_ID, { check: true });
  assert.equal(run.ok, true, run.issues.join("\n"));
  assert.equal(run.overlay.counts.conflictingPages, 1);
  assert.equal(run.overlay.counts.pageIdentityCandidates, 5);
  assert.equal(run.overlay.counts.imageRequestsExecuted, 0);
  assert.equal(run.overlay.counts.rightsSigned, 0);
  assert.equal(run.overlay.counts.runtimeAdmitted, 0);
});

test("R74 replay rejects fixture label, image promotion and erased conflict", async () => {
  const fixture = changed((copy) => {
    copy.evidenceClass = "fixture-captured-page";
  });
  assert.ok((await replayLedgerR74V661(fixture)).issues.includes(
    "ledger-identity-or-count-invalid"));
  const promoted = changed((copy) => {
    copy.boundary.rightsSigned = 1;
    copy.unexecutedImageRequests[0].requestExecuted = true;
  });
  const promotionReplay = await replayLedgerR74V661(promoted);
  assert.ok(promotionReplay.issues.includes("ledger-boundary-invalid"));
  assert.ok(promotionReplay.issues.includes("five-image-request-holds-drift"));
  const erased = changed((copy) => {
    copy.sources[1].inspection.target = "Dumbbell Nebula";
    copy.sources[1].inspection.identityState = "page-identity-confirmed";
    copy.sources[1].inspection.issues = [];
    copy.sources[1].sourceState = "page-captured-rights-hold";
  });
  assert.ok((await replayLedgerR74V661(erased)).issues.some((issue) =>
    issue.includes("stored-inspection-drift")));
});

test("R74 replay rejects altered SHA, forged attempt metadata and traversal", async () => {
  const sha = changed((copy) => {
    copy.sources[0].rawArtifact.sha256 = "0".repeat(64);
  });
  assert.equal((await replayLedgerR74V661(sha)).ok, false);
  const forged = changed((copy) => {
    copy.sources[2].attempt.retryCount = 4;
    copy.sources[2].attempt.requestFingerprint = "0".repeat(64);
    copy.sources[2].attempt.finalUrl = "https://example.org";
  });
  const result = await replayLedgerR74V661(forged);
  assert.ok(result.issues.some((issue) =>
    issue.includes("request-fingerprint-time-or-source-invalid")));
  assert.ok(result.issues.some((issue) =>
    issue.includes("captured-attempt-shape-invalid")));
  const traversal = changed((copy) => {
    copy.sources[3].rawArtifact.path = "../outside.html";
  });
  assert.equal((await replayLedgerR74V661(traversal)).ok, false);
});

test("R74 captured attempt contract detects source and timing corruption", () => {
  const valid = ledger.sources[0];
  const source = R74_SOURCES_V661[0];
  assert.deepEqual(inspectAttemptR74V661(valid, source, ledger.collectionId), []);
  const bad = structuredClone(valid);
  bad.attempt.startedAt = "2030-01-01T00:00:00.000Z";
  bad.attempt.endedAt = "2020-01-01T00:00:00.000Z";
  bad.attempt.requestUrl = "https://example.org/";
  assert.ok(inspectAttemptR74V661(bad, source, ledger.collectionId).includes(
    "request-fingerprint-time-or-source-invalid"));
});

test("R74 local HTTP receipt distinguishes allowed review assets from five holds", async () => {
  const receipt = JSON.parse(await readFile(
    "docs/release/v607/mainline-a-r74-v661-http-20261013v661r74web03.json",
    "utf8"));
  assert.deepEqual(inspectR74HttpV661(receipt), { ok: true, issues: [] });
  const promoted = structuredClone(receipt);
  promoted.heldImages[0].response.status = 200;
  promoted.allowedSample.rights = "approved";
  const inspected = inspectR74HttpV661(promoted);
  assert.equal(inspected.ok, false);
  assert.ok(inspected.issues.includes("held-images-incorrectly-served"));
  assert.ok(inspected.issues.includes("allowed-review-sample-not-guarded"));
});

test("R74 layered audit refuses browser, rights and performance overclaims", async () => {
  const base = "docs/release/v607/";
  const names = {
    build: "mainline-a-r74-build-20261013v661r74web02.json",
    sourceAudit: "mainline-a-r74-v661-page-audit-20261013v661r74page02.json",
    http: "mainline-a-r74-v661-http-20261013v661r74web03.json",
    browser: "mainline-a-r74-v661-browser-20261013v661r74web03.json",
    visual: "mainline-a-r74-v661-visual-20261013v661r74web03.json",
    performance: "mainline-a-r74-v661-performance-20261013v661r74web03.json",
  };
  const data = {};
  for (const [role, name] of Object.entries(names)) {
    data[role] = JSON.parse(await readFile(base + name, "utf8"));
  }
  data.sourceOverlay = JSON.parse(await readFile(
    "app/data/mainlineANebulaR74AlternativesV661.generated.json", "utf8"));
  assert.deepEqual(inspectEvidenceR74V661(data), { ok: true, issues: [] });
  const overclaim = structuredClone(data);
  overclaim.browser.totals.remoteImageRequests = 1;
  overclaim.sourceAudit.counts.rightsSigned = 5;
  overclaim.performance.productionPerformanceClaimed = true;
  const result = inspectEvidenceR74V661(overclaim);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("browser-evidence-invalid"));
  assert.ok(result.issues.includes("external-source-boundary-invalid"));
  assert.ok(result.issues.includes("performance-class-invalid"));
});
