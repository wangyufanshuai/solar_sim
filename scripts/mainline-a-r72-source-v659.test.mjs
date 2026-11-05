import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  R72_TARGETS_V659, artifactPathR72V659,
  fingerprintR72V659, inspectAssetR72V659, inspectJpegR72V659,
  inspectPageR72V659, inspectSearchR72V659,
  safeRequestUrlR72V659, validateInputsR72V659,
} from "./mainline-a-r72-source-contract-v659.mjs";
import {
  collectRequestR72V659, fetchBoundedR72V659,
} from "./collect-mainline-a-r72-source-v659.mjs";
import {
  auditR72V659, inspectAttemptR72V659, overlayR72V659,
  validateSkippedImageR72V659,
} from "./verify-mainline-a-r72-source-v659.mjs";

const LEDGER =
  "docs/release/v607/mainline-a-r72-source-ledger-20261013v659r72b.json";
const AUDIT =
  "docs/release/v607/mainline-a-r72-source-audit-20261013v659r72b.json";
const OVERLAY = "app/data/mainlineANebulaR72SourceV659.generated.json";

async function inputRows() {
  const expansion = JSON.parse(await readFile(
    "app/data/mainlineABetaNebulaExpansionV617.generated.json", "utf8"));
  const license = JSON.parse(await readFile(
    "docs/release/v592/nebula-item-license-review-v592.json", "utf8"));
  return validateInputsR72V659(expansion, license);
}

test("six expansion identities preserve one explicit image request and five policy holds", async () => {
  const checked = await inputRows();
  assert.equal(checked.ok, true, checked.issues.join(","));
  assert.equal(checked.rows.length, 6);
  assert.deepEqual(checked.rows.map((row) => row.id),
    R72_TARGETS_V659.map((target) => target.id));
  assert.deepEqual(checked.rows.filter((row) =>
    row.imageAcquisitionAllowed).map((row) => row.id), ["california-nebula"]);
  assert.equal(checked.rows.every((row) => row.rightsStatus === "pending"
    && row.runtimeAdmission === "candidate-only"
    && !row.scientificPayloadWriteback), true);
});

test("policy, URL allowlist and fingerprints reject foreign, swapped and query URLs", async () => {
  const { rows } = await inputRows();
  const california = rows[2];
  const ring = rows[0];
  assert.equal(safeRequestUrlR72V659("image", california.imageUrl,
    california), true);
  assert.equal(safeRequestUrlR72V659("image", ring.imageUrl, ring), false);
  assert.equal(safeRequestUrlR72V659("search", ring.searchUrl + "&x=1",
    ring), false);
  assert.equal(safeRequestUrlR72V659("search",
    "https://evil.example/search?nasa_id=" + ring.nasaId, ring), false);
  assert.equal(safeRequestUrlR72V659("asset", rows[1].assetUrl,
    ring), false);
  assert.throws(() => fingerprintR72V659("image", ring.imageUrl,
    ring), /unsafe-request/);
  assert.throws(() => artifactPathR72V659("../ring-nebula", "image",
    "a".repeat(64)), /artifact-identity-invalid/);
});

test("saved NASA API and page bytes independently preserve identity and limitations", async () => {
  const { rows } = await inputRows();
  const ledger = JSON.parse(await readFile(LEDGER, "utf8"));
  for (const [index, row] of rows.entries()) {
    const recorded = ledger.rows[index];
    const page = await readFile(recorded.page.artifact.path);
    const search = await readFile(recorded.search.artifact.path);
    const asset = await readFile(recorded.asset.artifact.path);
    const pageResult = inspectPageR72V659(page, row);
    const searchResult = inspectSearchR72V659(search, row);
    const assetResult = inspectAssetR72V659(asset, row);
    assert.equal(pageResult.ok, true, row.id);
    assert.equal(searchResult.ok, true, row.id);
    assert.equal(assetResult.ok, true, row.id);
    assert.equal(pageResult.identityVerified,
      row.pageKind === "photojournal", row.id);
    assert.equal(searchResult.creditVerified,
      row.pageKind === "photojournal", row.id);
    assert.equal(assetResult.originalImageUrl, row.imageUrl);
  }
});

test("synthetic NASA metadata and fake JPEG cannot be promoted", async () => {
  const { rows } = await inputRows();
  const row = rows[2];
  const fabricated = { collection: { version: "1.1", items: [{
    href: `https://images-assets.nasa.gov/image/${row.nasaId}/collection.json`,
    data: [{ nasa_id: row.nasaId, media_type: "image",
      title: row.title, secondary_creator: "Synthetic NASA" }],
    links: [{ href: row.imageUrl, render: "image" }],
  }] } };
  assert.equal(inspectSearchR72V659(Buffer.from(JSON.stringify(fabricated)),
    row).ok, false);
  assert.equal(inspectJpegR72V659(Buffer.from("pretend jpeg")).ok, false);
  const fakePage = Buffer.from("<!doctype html>" + "mock nasa page ".repeat(800));
  assert.equal(inspectPageR72V659(fakePage, row).ok, false);
});

test("blocked image request records a policy skip without network I/O", async () => {
  const { rows } = await inputRows();
  let fetches = 0;
  const stage = await collectRequestR72V659(rows[0], "image", {
    fetchImpl: () => { fetches += 1; throw new Error("should not run"); },
  });
  assert.equal(fetches, 0);
  assert.equal(stage.requestExecuted, false);
  assert.equal(stage.responseCaptured, 0);
  assert.deepEqual(stage.attempts, []);
  assert.equal(stage.skipReason,
    "item-license-or-suitability-review-blocked");
  assert.deepEqual(validateSkippedImageR72V659(stage, rows[0]), []);
  assert.notDeepEqual(validateSkippedImageR72V659({ ...stage,
    responseCaptured: 1 }, rows[0]), []);
});

test("redirect escape is stopped before a foreign host is contacted", async () => {
  const { rows } = await inputRows();
  const contacted = [];
  const fetchImpl = async (url) => {
    contacted.push(url);
    return new Response(null, { status: 302,
      headers: { location: "https://evil.example/steal" } });
  };
  const stage = await collectRequestR72V659(rows[2], "search", { fetchImpl });
  assert.deepEqual(contacted, [rows[2].searchUrl]);
  assert.equal(stage.responseCaptured, 0);
  assert.equal(stage.attempts[0].errorClass, "redirect-blocked");
  assert.equal(stage.attempts[0].httpStatus, 302);
  assert.equal(stage.attempts[0].retryCount, 0);
});

test("timeout and invalid MIME retain attempts with responseCaptured zero", async () => {
  const { rows } = await inputRows();
  const aborting = (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => {
      const error = new Error("deadline");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });
  const timed = await collectRequestR72V659(rows[2], "asset", {
    fetchImpl: aborting, timeoutMs: 15,
  });
  assert.equal(timed.responseCaptured, 0);
  assert.equal(timed.attempts[0].timeout, true);
  assert.equal(timed.attempts[0].errorClass, "timeout");
  assert.ok(Date.parse(timed.attempts[0].endedAt)
    >= Date.parse(timed.attempts[0].startedAt));
  const invalid = await collectRequestR72V659(rows[2], "image", {
    fetchImpl: async () => new Response("<html>not a jpeg</html>",
      { status: 200, headers: { "content-type": "text/html" } }),
  });
  assert.equal(invalid.responseCaptured, 0);
  assert.equal(invalid.attempts[0].errorClass, "mime-mismatch");
  assert.equal(invalid.attempts[0].httpStatus, 200);
});

test("live bounded fetch refuses a blocked row before an HTTP request", async () => {
  const { rows } = await inputRows();
  let called = false;
  await assert.rejects(fetchBoundedR72V659(rows[0], "image",
    rows[0].imageUrl, { fetchImpl: () => { called = true; } }),
  /unsafe-request/);
  assert.equal(called, false);
});

test("offline replay rejects forged approval, fabricated image and timing", async () => {
  const audit = await auditR72V659(LEDGER);
  assert.deepEqual(audit.issues, []);
  assert.equal(audit.status,
    "verified-six-structured-one-image-five-policy-holds-candidate");
  assert.equal(audit.counts.structuredSearchVerified, 6);
  assert.equal(audit.counts.imagesCaptured, 1);
  assert.equal(audit.counts.blockedImageRequestsUnexecuted, 5);
  assert.equal(audit.counts.decodedPixelMatches, 1);
  const stored = JSON.parse(await readFile(AUDIT, "utf8"));
  assert.deepEqual(audit, stored);
  const overlay = JSON.parse(await readFile(OVERLAY, "utf8"));
  assert.equal(overlay.rows.filter((row) => row.imageRaw).length, 1);
  assert.throws(() => overlayR72V659({ ...audit,
    status: "rights-signed" }, overlay.audit), /audit-not-admissible/);
  const ledger = JSON.parse(await readFile(LEDGER, "utf8"));
  const { rows } = await inputRows();
  const stage = ledger.rows[0].image;
  assert.notDeepEqual(validateSkippedImageR72V659({ ...stage,
    requestExecuted: true, responseCaptured: 1,
    artifact: ledger.rows[2].image.artifact }, rows[0]), []);
  const success = ledger.rows[2].image;
  assert.deepEqual(inspectAttemptR72V659(success, rows[2], "image"), []);
  assert.notDeepEqual(inspectAttemptR72V659({ ...success,
    attempts: [{ ...success.attempts[0], retryCount: 2 }] },
  rows[2], "image"), []);
});
