import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  collectRequestR71V658, fetchOfficialR71V658,
} from "./collect-mainline-a-r71-source-v658.mjs";
import {
  R71_TARGETS_V658, fingerprintR71V658, inspectJpegR71V658,
  inspectOfficialPageR71V658, safeImageUrlR71V658,
  safePageUrlR71V658, validateR71InputsV658,
} from "./mainline-a-r71-source-contract-v658.mjs";
import {
  auditR71SourceV658, buildR71SourceOverlayV658,
  replayR71SourceAuditV658, validateAttemptLedgerR71V658,
} from "./verify-mainline-a-r71-source-v658.mjs";

const LEDGER =
  "docs/release/v607/mainline-a-r71-source-ledger-20261012v658r71a.json";
const AUDIT =
  "docs/release/v607/mainline-a-r71-source-audit-20261012v658r71b.json";
const REVIEW = "app/data/mainlineANebulaReviewPackV612.generated.json";
const RIGHTS = "app/data/mainlineANebulaRightsPackV613.generated.json";
const parse = async (file) => JSON.parse(await readFile(file, "utf8"));

test("six current review rows keep exact NASA ID, local pins and rights hold", async () => {
  const [review, rights] = await Promise.all([parse(REVIEW), parse(RIGHTS)]);
  const checked = validateR71InputsV658(review, rights);
  assert.equal(checked.ok, true, checked.issues.join(","));
  assert.equal(checked.rows.length, 6);
  assert.deepEqual(checked.rows.map((row) => row.id),
    R71_TARGETS_V658.map((target) => target.id));
  for (const row of checked.rows) {
    assert.equal(row.rightsStatus, "pending");
    assert.equal(row.runtimeAdmission, "candidate-only");
    assert.equal(row.scientificPayloadWriteback, false);
    assert.equal(safePageUrlR71V658(row.pageUrl, row), true);
    assert.equal(safePageUrlR71V658(row.legacyPageUrl, row), true);
    assert.equal(safeImageUrlR71V658(row.officialImageUrl, row), true);
    assert.match(fingerprintR71V658(row.pageUrl, "page", row), /^[a-f0-9]{64}$/);
  }
  const forged = structuredClone(review);
  forged.records.find((row) => row.id === "w40-nebula").runtime.visualAssetAdmitted = true;
  assert.equal(validateR71InputsV658(forged, rights).ok, false);
});

test("URL contract blocks foreign domains, query additions and swapped NASA IDs", () => {
  const row = R71_TARGETS_V658[0];
  assert.equal(safePageUrlR71V658("https://example.com/photojournal/space-butterfly/", row), false);
  assert.equal(safePageUrlR71V658("https://science.nasa.gov/photojournal/space-butterfly/?fake=1", row), false);
  assert.equal(safeImageUrlR71V658(
    "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia23/pia23121/PIA23122.jpg", row), false);
  assert.throws(() => fingerprintR71V658(
    "https://example.com/PIA23121.jpg", "image", row), /unsafe-request/);
});

test("current raw page parser finds exact official JPEG and rejects fixture promotion", async () => {
  const ledger = await parse(LEDGER);
  const [review, rights] = await Promise.all([parse(REVIEW), parse(RIGHTS)]);
  const sourceRows = validateR71InputsV658(review, rights).rows;
  for (const row of ledger.rows) {
    const bytes = await readFile(row.page.artifact.path);
    const source = sourceRows.find((item) => item.id === row.id);
    const checked = inspectOfficialPageR71V658(bytes, source);
    assert.equal(checked.ok, true, `${row.id}:${checked.issues.join(",")}`);
    assert.equal(checked.officialImageUrl, row.expectedOfficialImageUrl);
  }
  const real = await readFile(ledger.rows[0].page.artifact.path, "utf8");
  const fixture = real.replace("</body>",
    "<p>synthetic response test fixture mock nasa page</p></body>");
  const negative = inspectOfficialPageR71V658(Buffer.from(fixture), sourceRows[0]);
  assert.equal(negative.ok, false);
  assert.ok(negative.issues.includes("fixture-marker-present"));
  const swapped = inspectOfficialPageR71V658(Buffer.from(real), sourceRows[1]);
  assert.equal(swapped.ok, false);
  assert.ok(swapped.issues.includes("title-mismatch"));
});

test("collector records timeout/network failures with responseCaptured=0", async () => {
  const [review, rights] = await Promise.all([parse(REVIEW), parse(RIGHTS)]);
  const row = validateR71InputsV658(review, rights).rows[0];
  const capture = await collectRequestR71V658(row, "page", row.legacyPageUrl, {
    retries: 1, timeoutMs: 20,
    fetchImpl: async () => { throw new Error("synthetic network outage"); },
  });
  assert.equal(capture.responseCaptured, 0);
  assert.equal(capture.attempts.length, 2);
  assert.deepEqual(capture.attempts.map((item) => item.retryCount), [0, 1]);
  for (const attempt of capture.attempts) {
    assert.equal(attempt.responseCaptured, 0);
    assert.equal(attempt.rawArtifactPath, null);
    assert.equal(attempt.rawSha256, null);
    assert.equal(attempt.errorClass, "network-error");
    assert.ok(Date.parse(attempt.endedAt) >= Date.parse(attempt.startedAt));
  }
  assert.equal(validateAttemptLedgerR71V658({ kind: "page",
    requestUrl: capture.requestUrl,
    requestFingerprint: capture.requestFingerprint,
    responseCaptured: capture.responseCaptured,
    attempts: capture.attempts, artifact: null, persistenceError: null,
  }, row, "page").ok, true);
});

test("collector stops a redirected request before contacting a foreign URL", async () => {
  const [review, rights] = await Promise.all([parse(REVIEW), parse(RIGHTS)]);
  const row = validateR71InputsV658(review, rights).rows[0];
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return new Response(null, { status: 301,
      headers: { location: "https://example.com/borrowed-page" } });
  };
  await assert.rejects(fetchOfficialR71V658(row, "page",
    row.legacyPageUrl, { fetchImpl }), /redirect-blocked/);
  assert.equal(calls, 1);
  const capture = await collectRequestR71V658(row, "page",
    row.legacyPageUrl, { retries: 0, fetchImpl });
  assert.equal(capture.responseCaptured, 0);
  assert.equal(capture.attempts[0].errorClass, "redirect-blocked");
  assert.equal(capture.attempts[0].httpStatus, 301);
});

test("JPEG signature and attempt ledger reject fabricated capture", async () => {
  const ledger = await parse(LEDGER);
  const row = ledger.rows[0];
  const image = await readFile(row.image.artifact.path);
  assert.equal(inspectJpegR71V658(image).ok, true);
  assert.equal(inspectJpegR71V658(Buffer.from("fake jpeg")).ok, false);
  const forged = structuredClone(row.page);
  forged.attempts[0].requestFingerprint = "0".repeat(64);
  assert.equal(validateAttemptLedgerR71V658(forged,
    { ...R71_TARGETS_V658[0], pageUrl: row.sourcePageUrl,
      legacyPageUrl: row.legacyPageUrl,
      officialImageUrl: row.expectedOfficialImageUrl }, "page").ok, false);
});

test("independent replay pins six pages/images and refuses forged approvals", async () => {
  const fresh = await auditR71SourceV658(LEDGER);
  const saved = await parse(AUDIT);
  assert.equal(fresh.status,
    "verified-six-official-page-image-pixel-links-candidate");
  assert.equal(fresh.counts.officialPages, 6);
  assert.equal(fresh.counts.officialImages, 6);
  assert.equal(fresh.counts.pixelMatches, 6);
  assert.equal(fresh.counts.rawByteMatches, 2);
  assert.equal(fresh.counts.rightsSigned, 0);
  assert.equal(replayR71SourceAuditV658(saved, fresh).copyrightApproval,
    false);
  const overlay = buildR71SourceOverlayV658(fresh);
  assert.equal(overlay.rows.length, 6);
  assert.ok(overlay.rows.every((row) => row.scientificPayloadWriteback === false));
  const forged = structuredClone(saved);
  forged.claims.copyrightApproval = true;
  assert.throws(() => replayR71SourceAuditV658(forged, fresh),
    /saved-audit-replay-mismatch/);
});
