import { createHash } from "node:crypto";
import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import canonicalCoverage from "../app/data/mainlineACanonicalCoverageV622.generated.json" with { type: "json" };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-asset-http-v647";
const SHA256 = /^[a-f0-9]{64}$/;
const IMAGE_PATH = /^public\/textures\/mainline-a\/[a-z0-9][a-z0-9_-]*\.(jpg|jpeg|png|webp|avif)$/i;
const MAX_IMAGE_BYTES = 32 * 1024 * 1024;
const CREDITS_PATH = "public/textures/mainline-a/CREDITS.md";
const IMAGE_TYPES = Object.freeze({
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif",
});

function fail(reason) { throw new Error(`web-asset-http-v647:${reason}`); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function jsonBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"); }

export function loopbackOriginV647(input) {
  let url;
  try { url = new URL(input); } catch { fail("origin-invalid"); }
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || !url.port || url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    fail("origin-must-be-local-http-root");
  }
  return url.origin;
}

export function validateAssetHttpInputsV647(audit, http, origin) {
  const normalizedOrigin = loopbackOriginV647(origin);
  if (audit?.schema !== "mainline-a-web-delivery-audit-v647"
    || audit.status !== "candidate-only-web-review-release-blocked"
    || !SHA256.test(audit.sourceSha256 ?? "")
    || audit.decision?.deliveryTarget !== "next-web-only"
    || audit.decision?.publicWebRelease !== "blocked"
    || audit.decision?.scientificAdmission !== "blocked"
    || audit.decision?.candidateOnly !== true || audit.decision?.hold !== true
    || audit.decision?.notAdmitted !== true || audit.decision?.scientificPayloadWriteback !== false
    || audit.claims?.releaseApproved === true || audit.claims?.copyrightApproval === true) {
    fail("web-audit-boundary-invalid");
  }
  const count = audit.rightsCounts;
  if (count?.total !== 12 || count.localPreviewAvailable !== 12
    || count.rightsPending !== 12 || count.rightsApproved !== 0
    || count.releaseAdmitted !== 0 || count.mismatched !== 0) {
    fail("rights-counts-not-pending-twelve");
  }
  if (http?.schema !== "mainline-a-http-evidence-v626" || http.status !== "passed"
    || http.pageStatus !== 200 || http.healthStatus !== 200 || http.allScriptAssetsOk !== true
    || http.scientificPayloadWriteback !== false || typeof http.buildId !== "string"
    || !http.buildId || http.url !== normalizedOrigin
    || http.runtimeBuildId !== `mainline-a-${audit.sourceSha256.slice(0, 16)}`) {
    fail("http-build-binding-invalid");
  }
  if (!Array.isArray(audit.previewAssets) || audit.previewAssets.length !== 12) {
    fail("preview-asset-set-invalid");
  }
  if (canonicalCoverage.schema !== "mainline-a-canonical-coverage-v622"
    || canonicalCoverage.manifestDigest !== audit.canonicalManifestDigest) {
    fail("canonical-manifest-binding-invalid");
  }
  const canonicalRows = canonicalCoverage.records.filter((row) => row.kind === "nebula");
  if (canonicalRows.length !== 12) fail("canonical-nebula-set-invalid");
  const canonicalById = new Map(canonicalRows.map((row) => [row.id, row]));
  const ids = new Set();
  const paths = new Set();
  const rows = audit.previewAssets.map((row) => {
    const match = IMAGE_PATH.exec(row?.path ?? "");
    if (!match || !row.id || ids.has(row.id) || paths.has(row.path)
      || !Number.isSafeInteger(row.bytes) || row.bytes < 1 || row.bytes > MAX_IMAGE_BYTES
      || !SHA256.test(row.sha256 ?? "") || !SHA256.test(row.canonicalRowHash ?? "")
      || !SHA256.test(row.sourceHash ?? "") || !row.sourceLicenseLabel
      || row.rightsState !== "pending" || row.humanRightsSignoff !== "pending"
      || row.releaseAdmission !== "candidate-only") {
      fail(`preview-row-invalid:${row?.id ?? "unknown"}`);
    }
    const canonical = canonicalById.get(row.id);
    if (!canonical || canonical.route.assetPath !== row.path
      || canonical.route.assetHash !== row.sha256
      || canonical.rowHash !== row.canonicalRowHash
      || canonical.sourceHash !== row.sourceHash
      || canonical.source.license !== row.sourceLicenseLabel
      || canonical.status !== "rights-pending" || canonical.runtimeAdmission !== "candidate-only"
      || canonical.scientificPayloadWriteback !== false) {
      fail(`canonical-preview-binding-invalid:${row.id}`);
    }
    ids.add(row.id);
    paths.add(row.path);
    return Object.freeze({
      id: row.id, path: row.path, bytes: row.bytes, sha256: row.sha256,
      canonicalRowHash: row.canonicalRowHash, sourceHash: row.sourceHash,
      sourceLicenseLabel: row.sourceLicenseLabel, expectedContentType: IMAGE_TYPES[match[1].toLowerCase()],
    });
  });
  return Object.freeze({ origin: normalizedOrigin, sourceSha256: audit.sourceSha256,
    buildId: http.buildId, canonicalManifestDigest: canonicalCoverage.manifestDigest,
    canonicalRows: Object.freeze(canonicalRows), rows: Object.freeze(rows) });
}

export function validateCreditsTextV647(text, canonicalRows) {
  if (typeof text !== "string" || !Array.isArray(canonicalRows) || canonicalRows.length !== 12) {
    fail("credits-input-invalid");
  }
  const lines = text.split(/\r?\n/).filter((line) => line.startsWith("- ["));
  if (lines.length !== 12 || new Set(lines).size !== 12) fail("credits-line-count-or-duplicate");
  for (const row of canonicalRows) {
    const expected = `- [${row.source.sourceId}](${row.source.sourceUrl}) — ${row.source.credit}`;
    if (!lines.includes(expected)) fail(`credits-entry-missing:${row.id}`);
  }
  return Object.freeze({ count: 12, sourceIds: Object.freeze(canonicalRows.map((row) => row.source.sourceId)) });
}

async function pinnedLocalAsset(row) {
  const absolute = path.resolve(ROOT, row.path);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) fail(`path-escape:${row.id}`);
  const canonical = await realpath(absolute);
  if (canonical !== absolute) fail(`path-alias-or-symlink:${row.id}`);
  const metadata = await stat(canonical);
  if (!metadata.isFile() || metadata.size !== row.bytes) fail(`local-size-mismatch:${row.id}`);
  const bytes = await readFile(canonical);
  if (sha256(bytes) !== row.sha256) fail(`local-hash-mismatch:${row.id}`);
  return { bytes: bytes.length, sha256: row.sha256 };
}

async function boundedResponseBytes(response, limit) {
  if (!response.body) fail("http-body-empty");
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) fail("http-body-over-limit");
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, length);
}

async function inspectCreditsHttpV647(input, fetchImpl, timeoutMs) {
  const absolute = path.resolve(ROOT, CREDITS_PATH);
  if (await realpath(absolute) !== absolute) fail("credits-path-alias-or-symlink");
  const local = await readFile(absolute);
  if (local.byteLength < 1 || local.byteLength > 1024 * 1024) fail("credits-size-invalid");
  const canonicalLines = validateCreditsTextV647(local.toString("utf8"), input.canonicalRows);
  const requestedUrl = `${input.origin}/textures/mainline-a/CREDITS.md`;
  const response = await fetchImpl(requestedUrl, {
    method: "GET", redirect: "manual", cache: "no-store",
    headers: { Accept: "text/markdown" }, signal: AbortSignal.timeout(timeoutMs),
  });
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? null;
  if (response.redirected || response.status >= 300 && response.status < 400
    || response.url !== requestedUrl) fail("credits-redirect-or-final-url-mismatch");
  if (response.status !== 200) fail(`credits-http-status-${response.status}`);
  if (contentType !== "text/markdown" && contentType !== "text/plain") fail("credits-content-type-mismatch");
  const received = await boundedResponseBytes(response, 1024 * 1024);
  if (received.length !== local.length || sha256(received) !== sha256(local)) fail("credits-http-body-mismatch");
  validateCreditsTextV647(received.toString("utf8"), input.canonicalRows);
  return Object.freeze({ status: "matched-local-credits", path: CREDITS_PATH,
    requestedUrl, finalUrl: response.url, httpStatus: response.status, contentType,
    bytes: received.length, sha256: sha256(received), creditEntries: canonicalLines.count,
    sourceIds: canonicalLines.sourceIds, humanRightsSignoff: "pending" });
}

function classifyFailure(error) {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") return "timeout";
  const message = String(error?.message ?? error);
  if (message.includes("web-asset-http-v647:")) return message.split("web-asset-http-v647:").at(-1);
  return "transport-or-local-io";
}

export async function inspectWebAssetHttpV647(row, origin, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const localReader = options.localReader ?? pinnedLocalAsset;
  const timeoutMs = options.timeoutMs ?? 15_000;
  const requestedUrl = `${origin}/${row.path.slice("public/".length)}`;
  const started = performance.now();
  const base = {
    id: row.id, path: row.path, requestedUrl, expectedBytes: row.bytes,
    expectedSha256: row.sha256, expectedContentType: row.expectedContentType,
    canonicalRowHash: row.canonicalRowHash, sourceHash: row.sourceHash,
    rightsState: "pending", humanRightsSignoff: "pending", releaseAdmission: "candidate-only",
  };
  try {
    const local = await localReader(row);
    if (local.bytes !== row.bytes || local.sha256 !== row.sha256) fail(`local-pin-mismatch:${row.id}`);
    const response = await fetchImpl(requestedUrl, {
      method: "GET", redirect: "manual", cache: "no-store",
      headers: { Accept: row.expectedContentType }, signal: AbortSignal.timeout(timeoutMs),
    });
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? null;
    const contentLength = response.headers.get("content-length");
    const redirected = response.redirected === true || response.status >= 300 && response.status < 400;
    if (redirected || response.url !== requestedUrl) fail(`redirect-or-final-url-mismatch:${row.id}`);
    if (response.status !== 200) fail(`http-status-${response.status}:${row.id}`);
    if (contentType !== row.expectedContentType) fail(`content-type-mismatch:${row.id}`);
    if (contentLength !== null && Number(contentLength) !== row.bytes) fail(`content-length-mismatch:${row.id}`);
    const bytes = await boundedResponseBytes(response, MAX_IMAGE_BYTES);
    const actualSha256 = sha256(bytes);
    if (bytes.length !== row.bytes || actualSha256 !== row.sha256) fail(`http-body-mismatch:${row.id}`);
    return Object.freeze({ ...base, status: "matched-local-preview", httpStatus: response.status,
      finalUrl: response.url, redirected: false, contentType, contentLength: bytes.length,
      observedBytes: bytes.length, observedSha256: actualSha256,
      elapsedMs: Math.round((performance.now() - started) * 1000) / 1000, errorClass: null });
  } catch (error) {
    return Object.freeze({ ...base, status: "failed", httpStatus: null, finalUrl: null,
      redirected: null, contentType: null, contentLength: null, observedBytes: 0,
      observedSha256: null, elapsedMs: Math.round((performance.now() - started) * 1000) / 1000,
      errorClass: classifyFailure(error) });
  }
}

export async function auditWebAssetHttpV647({ audit, http, origin, fetchImpl, localReader, timeoutMs }) {
  const input = validateAssetHttpInputsV647(audit, http, origin);
  const sourceNow = await captureBuildInputs();
  if (sourceNow.sha256 !== input.sourceSha256) fail("current-source-differs-from-web-audit");
  const assets = [];
  for (const row of input.rows) {
    assets.push(await inspectWebAssetHttpV647(row, input.origin, { fetchImpl, localReader, timeoutMs }));
  }
  let credits;
  try { credits = await inspectCreditsHttpV647(input, fetchImpl ?? fetch, timeoutMs ?? 15_000); }
  catch (error) { credits = Object.freeze({ status: "failed", path: CREDITS_PATH,
    errorClass: classifyFailure(error), humanRightsSignoff: "pending" }); }
  const matched = assets.filter((row) => row.status === "matched-local-preview").length;
  return Object.freeze({
    schema: SCHEMA, observedAt: new Date().toISOString(),
    status: matched === 12 && credits.status === "matched-local-credits"
      ? "passed-local-preview-release-blocked" : "failed-local-preview-release-blocked",
    evidenceClass: "HTTP", origin: input.origin, sourceSha256: input.sourceSha256,
    buildId: input.buildId, canonicalManifestDigest: input.canonicalManifestDigest,
    inputSha256: { webAudit: sha256(jsonBytes(audit)), httpBuild: sha256(jsonBytes(http)) },
    assets, credits, counts: { total: 12, matched, failed: 12 - matched,
      rightsPending: 12, rightsSigned: 0, releaseAdmitted: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false },
    claims: { publicWebReleaseApproved: false, copyrightApproval: false,
      scientificValidity: false, realUserValidation: false, productionPerformance: false },
    note: "Local HTTP access proves preview delivery and byte integrity only; item rights remain pending.",
  });
}

export function verifySavedAssetHttpV647(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "passed-local-preview-release-blocked"
    || saved.origin !== fresh.origin || saved.sourceSha256 !== fresh.sourceSha256
    || saved.buildId !== fresh.buildId
    || saved.canonicalManifestDigest !== fresh.canonicalManifestDigest
    || saved.inputSha256?.webAudit !== fresh.inputSha256?.webAudit
    || saved.inputSha256?.httpBuild !== fresh.inputSha256?.httpBuild
    || saved.counts?.total !== 12 || saved.counts?.matched !== 12
    || saved.counts?.failed !== 0 || saved.counts?.rightsPending !== 12
    || saved.counts?.rightsSigned !== 0 || saved.counts?.releaseAdmitted !== 0
    || saved.credits?.status !== "matched-local-credits"
    || fresh.credits?.status !== "matched-local-credits"
    || JSON.stringify(saved.credits) !== JSON.stringify(fresh.credits)
    || saved.boundary?.candidateOnly !== true || saved.boundary?.hold !== true
    || saved.boundary?.notAdmitted !== true || saved.boundary?.scientificPayloadWriteback !== false
    || saved.claims?.publicWebReleaseApproved !== false
    || saved.claims?.copyrightApproval !== false
    || saved.claims?.scientificValidity !== false
    || saved.claims?.realUserValidation !== false
    || saved.claims?.productionPerformance !== false
    || fresh.status !== "passed-local-preview-release-blocked") {
    fail("saved-receipt-boundary-or-binding-invalid");
  }
  const stable = (row) => [row.id, row.path, row.requestedUrl, row.expectedBytes,
    row.expectedSha256, row.expectedContentType, row.canonicalRowHash, row.sourceHash,
    row.rightsState, row.humanRightsSignoff, row.releaseAdmission, row.status,
    row.httpStatus, row.finalUrl, row.redirected, row.contentType, row.contentLength,
    row.observedBytes, row.observedSha256, row.errorClass];
  if (!Array.isArray(saved.assets) || saved.assets.length !== 12
    || JSON.stringify(saved.assets.map(stable)) !== JSON.stringify(fresh.assets.map(stable))) {
    fail("saved-receipt-http-replay-mismatch");
  }
  return Object.freeze({ schema: `${SCHEMA}-replay`, status: "verified-local-release-blocked",
    receiptSha256: sha256(jsonBytes(saved)), sourceSha256: fresh.sourceSha256,
    buildId: fresh.buildId, matched: 12, rightsSigned: 0, publicWebReleaseApproved: false });
}

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!["--audit", "--http", "--origin", "--output", "--check"].includes(key)
      || !argv[index + 1] || Object.hasOwn(out, key)) fail(`argument-invalid:${key}`);
    out[key] = argv[index + 1];
  }
  if (!out["--audit"] || !out["--http"] || !out["--origin"]
    || Boolean(out["--output"]) === Boolean(out["--check"])) fail("required-arguments-invalid");
  return out;
}

function insideWorkspace(relative) {
  if (typeof relative !== "string" || !/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative)) {
    fail(`receipt-path-invalid:${relative}`);
  }
  return path.join(ROOT, relative);
}

async function readPinnedJson(relative) {
  const absolute = insideWorkspace(relative);
  if (await realpath(absolute) !== absolute) fail(`receipt-path-alias:${relative}`);
  return JSON.parse(await readFile(absolute, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const audit = await readPinnedJson(args["--audit"]);
  const http = await readPinnedJson(args["--http"]);
  const report = await auditWebAssetHttpV647({ audit, http, origin: args["--origin"] });
  if (args["--output"]) {
    await writeFile(insideWorkspace(args["--output"]), jsonBytes(report), { flag: "wx" });
    console.log(JSON.stringify({ schema: SCHEMA, status: report.status, matched: report.counts.matched,
      sourceSha256: report.sourceSha256, publicWebReleaseApproved: false }));
  } else {
    const saved = await readPinnedJson(args["--check"]);
    console.log(JSON.stringify(verifySavedAssetHttpV647(saved, report)));
  }
  if (report.status !== "passed-local-preview-release-blocked") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await main(); } catch (error) { console.error(String(error)); process.exitCode = 1; }
}
