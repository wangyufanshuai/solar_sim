import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { attemptB1PageCaptureV654 } from "./collect-mainline-a-nebula-b1-v654.mjs";
import {
  B1_BATCH, B1_DISCOVERY, bindB1DiscoveryToBatchV654,
  inspectB1OfficialPageV654,
} from "./mainline-a-nebula-b1-source-v654.mjs";
import {
  auditB1SourcePagesV654, inspectB1CapturedPageV654,
  inspectB1PageLedgerContractV654, replayB1SourceAuditV654,
} from "./verify-mainline-a-nebula-b1-v654.mjs";
import { collectOfficialJpegV652 } from "./collect-mainline-a-nebula-page-image-link-v652.mjs";
import {
  B1_PAGE_AUDIT_V654, B1_PAGE_LEDGER_V654,
  validateB1ImageCandidateV654,
} from "./collect-mainline-a-nebula-b1-image-v654.mjs";
import {
  auditB1ImageLinksV654, compareB1PixelsV654,
  inspectB1ImageLedgerContractV654, replayB1ImageAuditV654,
} from "./verify-mainline-a-nebula-b1-image-v654.mjs";
import { createB1WebOverlayV654 } from "./build-mainline-a-nebula-b1-web-v654.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGE_LEDGER = B1_PAGE_LEDGER_V654;
const PAGE_AUDIT = B1_PAGE_AUDIT_V654;
const IMAGE_LEDGER =
  "docs/release/v607/mainline-a-r67-b1-page-image-ledger-20261012-v654b1image01.json";
const IMAGE_AUDIT =
  "docs/release/v607/mainline-a-r67-b1-page-image-audit-20261012-v654b1image01.json";
const load = async (relative) => JSON.parse(await readFile(path.join(ROOT, relative), "utf8"));
const clone = (value) => structuredClone(value);

test("six B1 discoveries bind to six actual captured candidate images", async () => {
  const bound = bindB1DiscoveryToBatchV654(await load(B1_DISCOVERY),
    await load(B1_BATCH));
  assert.equal(bound.ok, true);
  assert.equal(bound.candidates.length, 6);
  assert.equal(new Set(bound.candidates.map((item) => item.nasaId)).size, 6);
});

test("wrong PIA, wrong source credit, fixture marker and missing JPEG block page parsing", async () => {
  const batch = await load(B1_BATCH);
  const discovered = await load(B1_DISCOVERY);
  const candidate = bindB1DiscoveryToBatchV654(discovered, batch).candidates[0];
  const saved = await load(PAGE_LEDGER);
  const html = await readFile(path.join(ROOT,
    saved.rows[0].artifact.path), "utf8");
  assert.equal(inspectB1OfficialPageV654(html,
    candidate).status, "verified-official-page-candidate");
  const wrongId = inspectB1OfficialPageV654(
    html.replaceAll(candidate.nasaId, "PIA99999"), candidate);
  assert.equal(wrongId.status, "blocked");
  assert.ok(wrongId.issues.includes("nasa-id-not-visible"));
  const wrongCredit = inspectB1OfficialPageV654(html,
    { ...candidate, expectedCredit: "Unknown photographer" });
  assert.ok(wrongCredit.issues.includes("official-item-credit-mismatch"));
  const fixture = inspectB1OfficialPageV654(`${html}<p>synthetic response</p>`, candidate);
  assert.ok(fixture.issues.includes("fixture-marker-present"));
  const noLink = inspectB1OfficialPageV654(
    html.replaceAll("https://assets.science.nasa.gov", "https://example.invalid"),
    candidate);
  assert.ok(noLink.issues.includes("official-direct-jpeg-missing"));
});

test("mock HTTPS response is only an attempt, never a persisted official-page audit", async () => {
  const discovered = await load(B1_DISCOVERY);
  const batch = await load(B1_BATCH);
  const candidate = bindB1DiscoveryToBatchV654(discovered, batch).candidates[0];
  const mocked = await attemptB1PageCaptureV654(candidate, {
    retries: 0, fetchImpl: async () => new Response("mock nasa page", {
      status: 200, headers: { "content-type": "text/html" },
    }),
  });
  assert.equal(mocked.capture?.body.toString("utf8"), "mock nasa page");
  assert.equal(inspectB1OfficialPageV654(
    mocked.capture.body.toString("utf8"), candidate).status, "blocked");
  const fresh = await auditB1SourcePagesV654(PAGE_LEDGER);
  assert.equal(fresh.status, "verified-six-b1-official-pages-candidate");
  assert.notEqual(mocked.capture.sha256, fresh.artifacts[0].sha256);
});

test("failed page HTTPS attempt records no captured response", async () => {
  const bound = bindB1DiscoveryToBatchV654(
    await load(B1_DISCOVERY), await load(B1_BATCH));
  const attempted = await attemptB1PageCaptureV654(bound.candidates[0], {
    retries: 0, fetchImpl: async () => {
      throw new Error("network unavailable");
    },
  });
  assert.equal(attempted.capture, null);
  assert.equal(attempted.attempts[0].responseCaptured, 0);
  assert.equal(attempted.attempts[0].errorClass, "network-error");
  assert.equal(attempted.attempts[0].rawSha256, null);
});

test("page ledger rejects forged copyright and request identity", async () => {
  const ledger = await load(PAGE_LEDGER);
  const bound = bindB1DiscoveryToBatchV654(
    await load(B1_DISCOVERY), await load(B1_BATCH));
  assert.equal(inspectB1PageLedgerContractV654(ledger,
    bound.candidates).ok, true);
  const forged = clone(ledger);
  forged.rows[0].rightsSignoff = "approved";
  forged.rows[0].attempts[0].requestFingerprint = "a".repeat(64);
  const check = inspectB1PageLedgerContractV654(forged, bound.candidates);
  assert.equal(check.ok, false);
  assert.ok(check.issues.some((item) => item.includes("rights-or-persist-invalid")));
  assert.ok(check.issues.some((item) => item.includes("request-fingerprint-invalid")));
});

test("raw HTML mutation breaks recomputed SHA and saved page replay", async () => {
  const ledger = await load(PAGE_LEDGER);
  const bound = bindB1DiscoveryToBatchV654(
    await load(B1_DISCOVERY), await load(B1_BATCH));
  const bytes = await readFile(path.join(ROOT, ledger.rows[0].artifact.path));
  const changed = Buffer.from(bytes);
  changed[100] ^= 1;
  assert.ok(inspectB1CapturedPageV654(changed, ledger.rows[0],
    bound.candidates[0]).issues.includes("raw-artifact-sha-or-size-invalid"));
  const fresh = await auditB1SourcePagesV654(PAGE_LEDGER);
  const forged = clone(await load(PAGE_AUDIT));
  forged.artifacts[0].sha256 = "f".repeat(64);
  assert.throws(() => replayB1SourceAuditV654(forged, fresh));
});

test("B1 official JPEG HTTP failure keeps responseCaptured zero", async () => {
  const imageLedger = await load(IMAGE_LEDGER);
  const row = imageLedger.rows[0];
  const result = await collectOfficialJpegV652({ id: row.id,
    nasaId: row.nasaId }, row.officialDownloadUrl, {
    retries: 0, fetchImpl: async () => new Response("<html>not image</html>", {
      status: 200, headers: { "content-type": "text/html" },
    }),
  });
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts[0].errorClass, "content-type");
  assert.equal(result.attempts[0].rawArtifactPath, null);
});

test("image-page binding and attempt ledger reject forged source and release", async () => {
  const imageLedger = await load(IMAGE_LEDGER);
  const pageLedger = await load(PAGE_LEDGER);
  const pageAudit = await load(PAGE_AUDIT);
  const batch = await load(B1_BATCH);
  const candidate = { id: batch.rows[0].id,
    nasaId: pageLedger.rows[0].nasaId,
    pageUrl: pageLedger.rows[0].pageUrl,
    expectedCredit: batch.rows[0].source.credit,
    candidateImageArtifact: batch.rows[0].network.artifact };
  assert.equal(validateB1ImageCandidateV654(candidate,
    pageAudit.artifacts[0], pageLedger.rows[0]).ok, true);
  assert.equal(inspectB1ImageLedgerContractV654(imageLedger,
    pageLedger, pageAudit, batch).ok, true);
  const forged = clone(imageLedger);
  forged.boundary.scientificPayloadWriteback = true;
  forged.rows[0].officialDownloadUrl = "https://example.invalid/test.jpg";
  forged.rows[0].attempts[0].responseCaptured = 0;
  const check = inspectB1ImageLedgerContractV654(forged,
    pageLedger, pageAudit, batch);
  assert.equal(check.ok, false);
  assert.ok(check.issues.includes("release-boundary-promoted"));
  assert.ok(check.issues.some((item) => item.includes("cross-source-link-invalid")));
});

test("six JPEGs are pixel-equivalent while all six raw byte streams differ", async () => {
  const fresh = await auditB1ImageLinksV654();
  assert.equal(fresh.status,
    "verified-six-b1-official-jpegs-pixel-equivalent-candidate");
  assert.equal(fresh.counts.rawByteIdentical, 0);
  assert.equal(fresh.counts.decodedPixelIdentical, 6);
  assert.equal(fresh.counts.rightsSigned, 0);
  const replayed = replayB1ImageAuditV654(await load(IMAGE_AUDIT), fresh);
  assert.equal(replayed.publicWebRelease, "blocked");
  const candidate = clone(fresh.rows[0].candidatePixels);
  candidate.pixelSha256 = "0".repeat(64);
  assert.ok(compareB1PixelsV654(fresh.rows[0].officialPixels,
    candidate, false).issues.includes("decoded-pixels-differ"));
});

test("web overlay rejects altered audited source or forged rights signoff", async () => {
  const [sourceAuditBytes, imageAuditBytes, batch] = await Promise.all([
    readFile(path.join(ROOT, PAGE_AUDIT)),
    readFile(path.join(ROOT, IMAGE_AUDIT)), load(B1_BATCH),
  ]);
  const source = JSON.parse(sourceAuditBytes.toString("utf8"));
  const image = JSON.parse(imageAuditBytes.toString("utf8"));
  const actual = createB1WebOverlayV654(batch, source, image,
    sourceAuditBytes, imageAuditBytes);
  assert.equal(actual.counts.rightsSigned, 0);
  assert.equal(actual.rows.length, 6);
  const wrong = clone(image);
  wrong.rows[0].rightsSignoff = "approved";
  assert.throws(() => createB1WebOverlayV654(batch, source, wrong,
    sourceAuditBytes, imageAuditBytes));
  const wrongPage = clone(source);
  wrongPage.artifacts[0].officialCredit = "Unknown";
  assert.throws(() => createB1WebOverlayV654(batch, wrongPage, image,
    sourceAuditBytes, imageAuditBytes));
});
