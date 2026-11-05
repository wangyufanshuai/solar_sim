import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  R71_ACCEPT_HTML_V658, R71_ACCEPT_JPEG_V658, R71_LEDGER_DIR_V658,
  R71_MAX_HTML_BYTES_V658, R71_MAX_JPEG_BYTES_V658,
  R71_RETRIES_V658, R71_SCHEMA_V658, R71_TIMEOUT_MS_V658,
  R71_USER_AGENT_V658, fingerprintR71V658, inspectJpegR71V658,
  inspectOfficialPageR71V658, safeArtifactPathR71V658,
  safeImageUrlR71V658, safePageUrlR71V658, sha256R71V658,
  validateR71InputsV658,
} from "./mainline-a-r71-source-contract-v658.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW_PATH = "app/data/mainlineANebulaReviewPackV612.generated.json";
const RIGHTS_PATH = "app/data/mainlineANebulaRightsPackV613.generated.json";
const REDIRECT_LIMIT = 5;
const MIME = Object.freeze({ page: /^text\/html(?:\s*;|$)/i,
  image: /^image\/jpeg(?:\s*;|$)/i });

function fail(code, details = {}) {
  const error = new Error(`r71-source-v658:${code}`);
  Object.assign(error, details);
  throw error;
}

function runIdV658(value) {
  if (!/^\d{8}v658r71[a-z0-9-]{1,24}$/.test(value ?? "")) {
    fail("run-id-invalid");
  }
  return value;
}

export function ledgerPathR71V658(runId) {
  return `${R71_LEDGER_DIR_V658}/mainline-a-r71-source-ledger-${runIdV658(runId)}.json`;
}

function withinRoot(relative) {
  if (typeof relative !== "string" || relative.startsWith("/")
    || relative.includes("\\") || relative.split("/").includes("..")) {
    fail("path-invalid");
  }
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) fail("path-escaped");
  return absolute;
}

function responseType(response) {
  return response?.headers?.get?.("content-type") ?? null;
}

function responseStatus(response) {
  return Number.isInteger(response?.status) ? response.status : null;
}

function classify(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError"
    || error?.code === "timeout") return "timeout";
  if (["http-status", "content-type", "body-too-large", "body-empty",
    "redirect-blocked", "redirect-limit", "final-url-blocked",
    "jpeg-invalid"].includes(error?.code)) return error.code;
  return "network-error";
}

function retryable(attempt) {
  return attempt.errorClass === "timeout" || attempt.errorClass === "network-error"
    || attempt.errorClass === "http-status"
      && (attempt.httpStatus === 429 || attempt.httpStatus >= 500);
}

async function readBounded(response, maximumBytes) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    fail("body-too-large", { code: "body-too-large", response });
  }
  if (!response.body) fail("body-empty", { code: "body-empty", response });
  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximumBytes) {
        fail("body-too-large", { code: "body-too-large", response });
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size === 0) fail("body-empty", { code: "body-empty", response });
  return Buffer.concat(chunks, size);
}

function safeUrl(kind, url, row) {
  return kind === "page" ? safePageUrlR71V658(url, row)
    : safeImageUrlR71V658(url, row);
}

export async function fetchOfficialR71V658(row, kind, startUrl, options = {}) {
  if (!["page", "image"].includes(kind) || !safeUrl(kind, startUrl, row)) {
    fail("unsafe-request", { code: "redirect-blocked" });
  }
  const timeoutMs = options.timeoutMs ?? R71_TIMEOUT_MS_V658;
  const maxBytes = options.maxBytes ?? (kind === "page"
    ? R71_MAX_HTML_BYTES_V658 : R71_MAX_JPEG_BYTES_V658);
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const redirectChain = [startUrl];
  const redirects = [];
  let currentUrl = startUrl;
  let response = null;
  try {
    for (let count = 0; count <= REDIRECT_LIMIT; count += 1) {
      response = await fetchImpl(currentUrl, { method: "GET",
        headers: { accept: kind === "page" ? R71_ACCEPT_HTML_V658
          : R71_ACCEPT_JPEG_V658, "user-agent": R71_USER_AGENT_V658 },
        redirect: "manual", signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (count >= REDIRECT_LIMIT) {
          fail("redirect-limit", { code: "redirect-limit", response,
            finalUrl: currentUrl, redirectChain, redirects });
        }
        const location = response.headers.get("location");
        let destination = null;
        try { destination = location ? new URL(location, currentUrl).href : null; }
        catch { /* retained as blocked redirect */ }
        redirects.push({ from: currentUrl, status: response.status,
          location, to: destination });
        if (!safeUrl(kind, destination, row)) {
          fail("redirect-blocked", { code: "redirect-blocked", response,
            finalUrl: destination, redirectChain: [...redirectChain, destination],
            redirects });
        }
        currentUrl = destination;
        redirectChain.push(currentUrl);
        continue;
      }
      const finalUrl = response.url || currentUrl;
      if (!safeUrl(kind, finalUrl, row)
        || kind === "page" && finalUrl !== row.pageUrl
        || kind === "image" && finalUrl !== row.officialImageUrl) {
        fail("final-url-blocked", { code: "final-url-blocked", response,
          finalUrl, redirectChain, redirects });
      }
      if (response.status !== 200) {
        fail("http-status", { code: "http-status", response,
          finalUrl, redirectChain, redirects });
      }
      const contentType = responseType(response);
      if (!MIME[kind].test(contentType ?? "")) {
        fail("content-type", { code: "content-type", response,
          finalUrl, redirectChain, redirects });
      }
      const body = await readBounded(response, maxBytes);
      if (kind === "image" && !inspectJpegR71V658(body).ok) {
        fail("jpeg-invalid", { code: "jpeg-invalid", response,
          finalUrl, redirectChain, redirects });
      }
      return Object.freeze({ status: response.status, contentType, finalUrl,
        redirectChain: Object.freeze(redirectChain),
        redirects: Object.freeze(redirects), body,
        bytes: body.length, sha256: sha256R71V658(body) });
    }
    fail("redirect-limit", { code: "redirect-limit", response,
      finalUrl: currentUrl, redirectChain, redirects });
  } catch (error) {
    if (!error.response && response) error.response = response;
    if (!error.finalUrl) error.finalUrl = currentUrl;
    if (!error.redirectChain) error.redirectChain = redirectChain;
    if (!error.redirects) error.redirects = redirects;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function attemptRecord(row, kind, url, number, collectionId, timeoutMs) {
  return { number, retryCount: number - 1, collectionId,
    startedAt: new Date().toISOString(), endedAt: null,
    requestExecuted: false, requestUrl: url, kind, timeout: false,
    timeoutMs, requestFingerprint: fingerprintR71V658(url, kind, row),
    httpStatus: null, contentType: null, finalUrl: null,
    redirectChain: [], redirects: [], errorClass: null,
    errorMessage: null, responseCaptured: 0, responseBytes: null,
    rawArtifactPath: null, rawSha256: null };
}

export async function collectRequestR71V658(row, kind, url, options = {}) {
  const collectionId = options.collectionId ?? randomUUID();
  const retries = options.retries ?? R71_RETRIES_V658;
  const attempts = [];
  let captured = null;
  for (let number = 1; number <= retries + 1; number += 1) {
    const attempt = attemptRecord(row, kind, url, number, collectionId,
      options.timeoutMs ?? R71_TIMEOUT_MS_V658);
    try {
      attempt.requestExecuted = true;
      captured = await fetchOfficialR71V658(row, kind, url, options);
      attempt.httpStatus = captured.status;
      attempt.contentType = captured.contentType;
      attempt.finalUrl = captured.finalUrl;
      attempt.redirectChain = [...captured.redirectChain];
      attempt.redirects = [...captured.redirects];
      attempt.responseCaptured = 1;
      attempt.responseBytes = captured.bytes;
      attempt.rawSha256 = captured.sha256;
    } catch (error) {
      attempt.httpStatus = responseStatus(error?.response);
      attempt.contentType = responseType(error?.response);
      attempt.finalUrl = error?.finalUrl ?? url;
      attempt.redirectChain = error?.redirectChain ?? [url];
      attempt.redirects = error?.redirects ?? [];
      attempt.errorClass = classify(error);
      attempt.errorMessage = String(error?.message ?? error).slice(0, 500);
      attempt.timeout = attempt.errorClass === "timeout";
    } finally {
      attempt.endedAt = new Date().toISOString();
      attempts.push(attempt);
    }
    if (captured || number > retries || !retryable(attempt)) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * number));
  }
  return { collectionId, kind, requestUrl: url,
    requestFingerprint: fingerprintR71V658(url, kind, row),
    responseCaptured: captured ? 1 : 0, attempts, captured };
}

async function persistCapture(row, kind, capture) {
  if (!capture.captured) return null;
  const relative = safeArtifactPathR71V658(row.id, kind,
    capture.captured.sha256);
  const absolute = withinRoot(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  try {
    await writeFile(absolute, capture.captured.body, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const existing = await readFile(absolute);
    if (sha256R71V658(existing) !== capture.captured.sha256) {
      fail("raw-artifact-content-conflict");
    }
  }
  capture.attempts.at(-1).rawArtifactPath = relative;
  return { path: relative, sha256: capture.captured.sha256,
    bytes: capture.captured.bytes, contentType: capture.captured.contentType,
    finalUrl: capture.captured.finalUrl };
}

async function captureStage(row, kind, url, options) {
  const result = await collectRequestR71V658(row, kind, url, options);
  let artifact = null;
  let persistenceError = null;
  try { artifact = await persistCapture(row, kind, result); }
  catch (error) { persistenceError = String(error?.message ?? error).slice(0, 500); }
  return { kind, requestUrl: url,
    requestFingerprint: result.requestFingerprint,
    responseCaptured: result.responseCaptured,
    attempts: result.attempts, artifact, persistenceError,
    captured: result.captured };
}

export async function collectOneR71V658(row, options = {}) {
  const page = await captureStage(row, "page", row.legacyPageUrl, options);
  const inspection = page.captured && page.artifact
    ? inspectOfficialPageR71V658(page.captured.body, row) : null;
  const image = inspection?.ok && inspection.officialImageUrl
    ? await captureStage(row, "image", inspection.officialImageUrl, options)
    : null;
  const status = image?.artifact ? "raw-page-and-jpeg-captured-candidate"
    : page?.artifact ? "raw-page-only-candidate" : "attempt-only";
  return { id: row.id, nasaId: row.nasaId, catalog: row.catalog,
    title: row.title, expectedCredit: row.credit,
    sourcePageUrl: row.pageUrl, legacyPageUrl: row.legacyPageUrl,
    expectedOfficialImageUrl: row.officialImageUrl,
    historicalLocalCandidate: row.original,
    page: { kind: page.kind, requestUrl: page.requestUrl,
      requestFingerprint: page.requestFingerprint,
      responseCaptured: page.responseCaptured, attempts: page.attempts,
      artifact: page.artifact, persistenceError: page.persistenceError,
      inspection },
    image: image && { kind: image.kind, requestUrl: image.requestUrl,
      requestFingerprint: image.requestFingerprint,
      responseCaptured: image.responseCaptured, attempts: image.attempts,
      artifact: image.artifact, persistenceError: image.persistenceError },
    status, rightsStatus: "pending", runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false };
}

export async function collectSixR71V658(runId, options = {}) {
  const relative = ledgerPathR71V658(runId);
  const absolute = withinRoot(relative);
  const [reviewBytes, rightsBytes] = await Promise.all([
    readFile(withinRoot(REVIEW_PATH)), readFile(withinRoot(RIGHTS_PATH))]);
  const review = JSON.parse(reviewBytes.toString("utf8"));
  const rights = JSON.parse(rightsBytes.toString("utf8"));
  const inputs = validateR71InputsV658(review, rights);
  if (!inputs.ok) fail("input-manifests-invalid", { issues: inputs.issues });
  const startedAt = new Date().toISOString();
  const rows = [];
  for (const row of inputs.rows) {
    rows.push(await collectOneR71V658(row, options));
  }
  const endedAt = new Date().toISOString();
  const counts = { targets: rows.length,
    pageResponses: rows.filter((row) => row.page.responseCaptured === 1).length,
    pageArtifacts: rows.filter((row) => row.page.artifact).length,
    pageInspections: rows.filter((row) => row.page.inspection?.ok).length,
    imageResponses: rows.filter((row) => row.image?.responseCaptured === 1).length,
    imageArtifacts: rows.filter((row) => row.image?.artifact).length,
    rightsSigned: 0, runtimeAdmitted: 0 };
  const ledger = { schema: R71_SCHEMA_V658, runId, startedAt, endedAt,
    status: counts.imageArtifacts === 6 && counts.pageInspections === 6
      ? "six-raw-page-image-captures-candidate" : "partial-attempt-ledger-candidate",
    inputs: { review: { path: REVIEW_PATH, sha256: sha256R71V658(reviewBytes) },
      rights: { path: RIGHTS_PATH, sha256: sha256R71V658(rightsBytes) } },
    counts, rows,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, rightsSignoff: "pending",
      physicalMobile: "not-run", publicWebRelease: "blocked" } };
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  return { path: relative, ledger };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runId = process.argv[2];
  const output = await collectSixR71V658(runId);
  console.log(JSON.stringify({ path: output.path,
    status: output.ledger.status, counts: output.ledger.counts }, null, 2));
}
