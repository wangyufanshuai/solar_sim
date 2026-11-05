import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebAssetHttpV647, inspectWebAssetHttpV647, loopbackOriginV647,
  validateAssetHttpInputsV647, validateCreditsTextV647, verifySavedAssetHttpV647,
} from "./verify-mainline-a-web-asset-http-v647.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3090";
async function json(relative) { return JSON.parse(await readFile(path.join(ROOT, relative), "utf8")); }
async function inputs() {
  return {
    audit: await json("docs/release/v607/mainline-a-r66-web-delivery-audit-20261007-v647web02.json"),
    http: await json("docs/release/v607/mainline-a-r66-http-20261007-v647web02.json"),
  };
}
function response(bytes, url, type = "image/jpeg", status = 200, extra = {}) {
  const value = new Response(bytes, { status, headers: {
    "content-type": type, "content-length": String(bytes.byteLength), ...extra,
  } });
  Object.defineProperty(value, "url", { value: url });
  return value;
}
async function fileFetch(url) {
  const pathname = new URL(url).pathname;
  const bytes = await readFile(path.join(ROOT, "public", pathname));
  return response(bytes, url, pathname.endsWith(".md") ? "text/markdown" : "image/jpeg");
}

test("only an explicit loopback HTTP preview root is accepted", () => {
  assert.equal(loopbackOriginV647(ORIGIN), ORIGIN);
  assert.equal(loopbackOriginV647("http://localhost:3090"), "http://localhost:3090");
  for (const candidate of ["https://127.0.0.1:3090", "http://example.com:3090",
    "http://127.0.0.1:3090/other", "http://127.0.0.1:3090/?q=1",
    "http://admin:secret@127.0.0.1:3090", "http://127.0.0.1", "garbage"]) {
    assert.throws(() => loopbackOriginV647(candidate), /web-asset-http-v647:origin/);
  }
});

test("twelve pending preview records bind to the exact local build and source", async () => {
  const { audit, http } = await inputs();
  const validated = validateAssetHttpInputsV647(audit, http, ORIGIN);
  assert.equal(validated.rows.length, 12);
  assert.equal(validated.rows[0].expectedContentType, "image/jpeg");
  assert.equal(validated.buildId, http.buildId);
  assert.equal(validated.sourceSha256, audit.sourceSha256);
  assert.equal(new Set(validated.rows.map((row) => row.path)).size, 12);
  assert.equal(validated.canonicalRows.length, 12);
});

test("a forged rights signoff, duplicate image or stale build is rejected", async () => {
  const { audit, http } = await inputs();
  const changedRights = structuredClone(audit);
  changedRights.previewAssets[0].humanRightsSignoff = "approved";
  assert.throws(() => validateAssetHttpInputsV647(changedRights, http, ORIGIN), /preview-row-invalid/);
  const duplicate = structuredClone(audit);
  duplicate.previewAssets[1].path = duplicate.previewAssets[0].path;
  assert.throws(() => validateAssetHttpInputsV647(duplicate, http, ORIGIN), /preview-row-invalid/);
  const escaped = structuredClone(audit);
  escaped.previewAssets[0].path = "public/textures/mainline-a/../../secret.jpg";
  assert.throws(() => validateAssetHttpInputsV647(escaped, http, ORIGIN), /preview-row-invalid/);
  const promoted = structuredClone(audit);
  promoted.decision.publicWebRelease = "approved";
  assert.throws(() => validateAssetHttpInputsV647(promoted, http, ORIGIN), /web-audit-boundary-invalid/);
  const replacedCanonical = structuredClone(audit);
  replacedCanonical.previewAssets[0].sourceHash = "f".repeat(64);
  assert.throws(() => validateAssetHttpInputsV647(replacedCanonical, http, ORIGIN), /canonical-preview-binding-invalid/);
  assert.throws(() => validateAssetHttpInputsV647(audit, { ...http, runtimeBuildId: "mainline-a-stale" }, ORIGIN), /http-build-binding-invalid/);
});

test("the historical V647 audit rejects the changed V648 source instead of reusing old HTTP evidence", async () => {
  const { audit, http } = await inputs();
  await assert.rejects(auditWebAssetHttpV647({ audit, http, origin: ORIGIN, fetchImpl: fileFetch }),
    /current-source-differs-from-web-audit/);
  const rows = validateAssetHttpInputsV647(audit, http, ORIGIN).rows;
  const checks = await Promise.all(rows.map((row) => inspectWebAssetHttpV647(row, ORIGIN, { fetchImpl: fileFetch })));
  assert.equal(checks.filter((row) => row.status === "matched-local-preview").length, 12);
  assert.ok(checks.every((row) => row.humanRightsSignoff === "pending"
    && row.releaseAdmission === "candidate-only"));
});

test("credits require all twelve exact canonical source links and names", async () => {
  const { audit, http } = await inputs();
  const rows = validateAssetHttpInputsV647(audit, http, ORIGIN).canonicalRows;
  const credits = await readFile(path.join(ROOT, "public/textures/mainline-a/CREDITS.md"), "utf8");
  assert.equal(validateCreditsTextV647(credits, rows).count, 12);
  assert.throws(() => validateCreditsTextV647(credits.replace(rows[0].source.credit, "anonymous"), rows), /credits-entry-missing/);
  assert.throws(() => validateCreditsTextV647(`${credits}\n- [fake](https://example.org/) — fake`, rows), /credits-line-count-or-duplicate/);
  await assert.rejects(auditWebAssetHttpV647({ audit, http, origin: ORIGIN,
    fetchImpl: async (url) => url.endsWith("CREDITS.md")
      ? response(Buffer.from("<html>not credits</html>"), url, "text/html") : fileFetch(url) }),
  /current-source-differs-from-web-audit/);
});

test("HTML, redirect, 404 and mismatched bytes cannot be counted as an image match", async () => {
  const { audit, http } = await inputs();
  const row = validateAssetHttpInputsV647(audit, http, ORIGIN).rows[0];
  const localReader = async () => ({ bytes: row.bytes, sha256: row.sha256 });
  const cases = [
    { fetchImpl: async (url) => response(Buffer.from("<html>fake</html>"), url, "text/html"), expected: "content-type-mismatch" },
    { fetchImpl: async (url) => response(Buffer.from("redirect"), url, "text/plain", 302), expected: "redirect-or-final-url-mismatch" },
    { fetchImpl: async (url) => response(Buffer.from("missing"), url, "image/jpeg", 404), expected: "http-status-404" },
    { fetchImpl: async (url) => response(Buffer.alloc(row.bytes), url), expected: "http-body-mismatch" },
    { fetchImpl: async (url) => response(Buffer.from("fake"), `${url}?redirected=true`), expected: "redirect-or-final-url-mismatch" },
  ];
  for (const item of cases) {
    const observed = await inspectWebAssetHttpV647(row, ORIGIN, { localReader, fetchImpl: item.fetchImpl });
    assert.equal(observed.status, "failed");
    assert.match(observed.errorClass, new RegExp(item.expected));
    assert.equal(observed.observedSha256, null);
  }
});

test("transport errors, local pin mismatches and tampered replay remain failed", async () => {
  const { audit, http } = await inputs();
  const row = validateAssetHttpInputsV647(audit, http, ORIGIN).rows[0];
  const transport = await inspectWebAssetHttpV647(row, ORIGIN, {
    localReader: async () => ({ bytes: row.bytes, sha256: row.sha256 }),
    fetchImpl: async () => { throw new Error("connection refused"); },
  });
  assert.equal(transport.status, "failed");
  assert.equal(transport.errorClass, "transport-or-local-io");
  const localMismatch = await inspectWebAssetHttpV647(row, ORIGIN, {
    localReader: async () => ({ bytes: row.bytes, sha256: "f".repeat(64) }),
    fetchImpl: async () => { throw new Error("must not fetch after local pin failure"); },
  });
  assert.equal(localMismatch.status, "failed");
  assert.match(localMismatch.errorClass, /local-pin-mismatch/);
  const report = await json("docs/release/v607/mainline-a-r66-web-asset-http-20261007-v647web02-credits-pinned.json");
  assert.equal(verifySavedAssetHttpV647(report, { ...report, observedAt: "later" }).status,
    "verified-local-release-blocked");
  const forged = structuredClone(report);
  forged.assets[0].observedSha256 = "f".repeat(64);
  assert.throws(() => verifySavedAssetHttpV647(forged, report), /saved-receipt-http-replay-mismatch/);
  const admitted = structuredClone(report);
  admitted.counts.rightsSigned = 12;
  assert.throws(() => verifySavedAssetHttpV647(admitted, report), /saved-receipt-boundary-or-binding-invalid/);
  const relinked = structuredClone(report);
  relinked.inputSha256.webAudit = "f".repeat(64);
  assert.throws(() => verifySavedAssetHttpV647(relinked, report), /saved-receipt-boundary-or-binding-invalid/);
});
