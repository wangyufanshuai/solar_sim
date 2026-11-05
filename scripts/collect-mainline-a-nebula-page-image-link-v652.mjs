import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditSourcePageLedgerV651 } from "./verify-mainline-a-nebula-source-pages-v651.mjs";
import { verifyBatchFile } from "./verify-mainline-a-nebula-batch-v628.mjs";
import {
  V652_ACCEPT, V652_ARTIFACT_DIR, V652_IMAGE_BATCH,
  V652_MAX_BYTES, V652_PAGE_AUDIT, V652_PAGE_LEDGER,
  V652_RETRIES, V652_TIMEOUT_MS, V652_USER_AGENT,
  extractOfficialJpegUrlV652, fingerprintOfficialJpegRequestV652,
  inspectJpegBytesV652, officialJpegArtifactPathV652,
  safeOfficialJpegUrlV652, sha256V652,
  validatePageImageInputsV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIME = /^image\/jpeg(?:\s*;|$)/i;

function fail(code, extras = {}) {
  const error = new Error(`page-image-link-v652:${code}`);
  Object.assign(error, extras);
  throw error;
}
function runIdValid(runId) {
  if (!/^20261011-v652link0[1-9]$/.test(runId ?? "")) fail("run-id-invalid");
  return runId;
}
function outputPath(runId) {
  return `docs/release/v607/mainline-a-r66-nebula-page-image-link-ledger-${runIdValid(runId)}.json`;
}
function classify(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError") return "timeout";
  if (error?.code === "http-status") return "http-status";
  if (error?.code === "content-type") return "content-type";
  if (error?.code === "body-too-large") return "body-too-large";
  if (error?.code === "jpeg-invalid") return "jpeg-invalid";
  if (error?.code === "redirect-blocked") return "redirect-blocked";
  return "network-error";
}
function retryable(attempt) {
  return attempt.errorClass === "timeout" || attempt.errorClass === "network-error"
    || (attempt.errorClass === "http-status"
      && (attempt.httpStatus === 429 || attempt.httpStatus >= 500));
}
function attemptRecord(url, nasaId, collectionId, attemptNumber, timeoutMs) {
  return {
    attempt: attemptNumber,
    retryCount: attemptNumber - 1,
    collectionId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    timeout: false,
    timeoutMs,
    requestExecuted: false,
    requestUrl: url,
    requestFingerprint: fingerprintOfficialJpegRequestV652(url, nasaId),
    httpStatus: null,
    contentType: null,
    finalUrl: null,
    redirectChain: [],
    errorClass: null,
    errorMessage: null,
    responseCaptured: 0,
    responseBytes: null,
    rawArtifactPath: null,
    rawSha256: null,
  };
}
async function readBounded(response, maximumBytes) {
  const reportedLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(reportedLength) && reportedLength > maximumBytes) {
    fail("body-too-large", { code: "body-too-large", response });
  }
  if (!response.body) fail("empty-body", { code: "network-error", response });
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > maximumBytes) {
        fail("body-too-large", { code: "body-too-large", response });
      }
      chunks.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}

export async function fetchOfficialJpegV652(url, nasaId, options = {}) {
  if (!safeOfficialJpegUrlV652(url, nasaId)) fail("unsafe-url", { code: "redirect-blocked" });
  const timeoutMs = options.timeoutMs ?? V652_TIMEOUT_MS;
  const maximumBytes = options.maxBytes ?? V652_MAX_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response = null;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { accept: V652_ACCEPT, "user-agent": V652_USER_AGENT },
      redirect: "manual", signal: controller.signal,
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const destination = response.headers.get("location");
      fail("redirect-blocked", { code: "redirect-blocked", response,
        finalUrl: destination ? new URL(destination, url).href : null,
        redirectChain: [url, destination] });
    }
    const finalUrl = response.url || url;
    if (finalUrl !== url || !safeOfficialJpegUrlV652(finalUrl, nasaId)) {
      fail("final-url-blocked", { code: "redirect-blocked", response,
        finalUrl, redirectChain: [url, finalUrl] });
    }
    if (response.status !== 200) {
      fail("http-status", { code: "http-status", response,
        finalUrl, redirectChain: [url] });
    }
    const contentType = response.headers.get("content-type");
    if (!MIME.test(contentType ?? "")) {
      fail("content-type", { code: "content-type", response,
        finalUrl, redirectChain: [url] });
    }
    const body = await readBounded(response, maximumBytes);
    const inspected = inspectJpegBytesV652(body, maximumBytes);
    if (!inspected.ok) fail("jpeg-invalid", { code: "jpeg-invalid", response,
      finalUrl, redirectChain: [url], issues: inspected.issues });
    return Object.freeze({ status: response.status, contentType,
      finalUrl, redirectChain: Object.freeze([url]), body,
      sha256: inspected.sha256, bytes: inspected.bytes });
  } catch (error) {
    if (!error.response && response) error.response = response;
    if (!error.finalUrl) error.finalUrl = url;
    if (!error.redirectChain) error.redirectChain = [url];
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function collectOfficialJpegV652(candidate, url, options = {}) {
  const collectionId = options.collectionId ?? randomUUID();
  const retries = options.retries ?? V652_RETRIES;
  const attempts = [];
  let captured = null;
  for (let number = 1; number <= retries + 1; number += 1) {
    const attempt = attemptRecord(url, candidate.nasaId,
      collectionId, number, options.timeoutMs ?? V652_TIMEOUT_MS);
    try {
      attempt.requestExecuted = true;
      captured = await fetchOfficialJpegV652(url, candidate.nasaId, options);
      attempt.httpStatus = captured.status;
      attempt.contentType = captured.contentType;
      attempt.finalUrl = captured.finalUrl;
      attempt.redirectChain = [...captured.redirectChain];
      attempt.responseCaptured = 1;
      attempt.responseBytes = captured.bytes;
      attempt.rawSha256 = captured.sha256;
    } catch (error) {
      attempt.httpStatus = error?.response?.status ?? null;
      attempt.contentType = error?.response?.headers?.get?.("content-type") ?? null;
      attempt.finalUrl = error?.finalUrl ?? url;
      attempt.redirectChain = error?.redirectChain ?? [url];
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
  return { id: candidate.id, nasaId: candidate.nasaId, url,
    requestFingerprint: fingerprintOfficialJpegRequestV652(url, candidate.nasaId),
    responseCaptured: captured ? 1 : 0, attempts, captured };
}

async function persistOfficialJpeg(candidate, capture) {
  if (!capture.captured) return null;
  const relative = officialJpegArtifactPathV652(candidate.id,
    candidate.nasaId, capture.captured.sha256);
  const absolute = path.resolve(ROOT, relative);
  const base = path.resolve(ROOT, V652_ARTIFACT_DIR);
  if (!absolute.startsWith(`${base}${path.sep}`)) fail("artifact-path-escaped");
  await mkdir(base, { recursive: true });
  try {
    await writeFile(absolute, capture.captured.body, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const prior = await readFile(absolute);
    if (sha256V652(prior) !== capture.captured.sha256) fail("artifact-content-conflict");
  }
  return { path: relative, sha256: capture.captured.sha256,
    bytes: capture.captured.bytes,
    finalUrl: capture.captured.finalUrl,
    contentType: capture.captured.contentType };
}

export async function collectSixPageImageLinksV652(runId, options = {}) {
  const relative = outputPath(runId);
  try {
    await access(path.join(ROOT, relative));
    fail("ledger-exists");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const [pageLedgerBytes, pageAuditBytes, batchBytes] = await Promise.all([
    readFile(path.join(ROOT, V652_PAGE_LEDGER)),
    readFile(path.join(ROOT, V652_PAGE_AUDIT)),
    readFile(path.join(ROOT, V652_IMAGE_BATCH)),
  ]);
  const pageLedger = JSON.parse(pageLedgerBytes.toString("utf8"));
  const pageAudit = JSON.parse(pageAuditBytes.toString("utf8"));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const verifiedPages = await auditSourcePageLedgerV651(V652_PAGE_LEDGER);
  if (verifiedPages.status !== "verified-six-official-pages-candidate"
    || JSON.stringify(verifiedPages) !== JSON.stringify(pageAudit)) {
    fail("source-pages-no-longer-replay");
  }
  const imageCheck = verifyBatchFile(ROOT);
  if (imageCheck.status !== "passed"
    || imageCheck.fileSha256 !== sha256V652(batchBytes)) {
    fail("candidate-image-artifacts-no-longer-replay");
  }
  const inputs = validatePageImageInputsV652(pageLedger, pageAudit, batch);
  if (!inputs.ok) fail("candidate-input-invalid", { issues: inputs.issues });
  const startedAt = new Date().toISOString();
  const rows = [];
  for (const candidate of inputs.candidates) {
    const htmlBytes = await readFile(path.join(ROOT, candidate.pageArtifact.path));
    if (sha256V652(htmlBytes) !== candidate.pageArtifact.sha256) {
      fail("source-page-artifact-changed", { id: candidate.id });
    }
    const url = extractOfficialJpegUrlV652(htmlBytes.toString("utf8"), candidate.nasaId);
    if (!url) fail("official-download-link-missing", { id: candidate.id });
    const capture = await collectOfficialJpegV652(candidate, url, options);
    let artifact = null;
    let persistError = null;
    try {
      artifact = await persistOfficialJpeg(candidate, capture);
      if (artifact) capture.attempts.at(-1).rawArtifactPath = artifact.path;
    } catch (error) {
      persistError = String(error?.message ?? error).slice(0, 500);
    }
    const byteIdentical = Boolean(artifact
      && artifact.sha256 === candidate.imageArtifact.sha256
      && artifact.bytes === candidate.imageArtifact.bytes);
    const row = { id: candidate.id, nasaId: candidate.nasaId,
      sourcePageUrl: candidate.sourcePageUrl,
      sourcePageRawSha256: candidate.pageArtifact.sha256,
      officialDownloadUrl: url,
      candidateImageArtifact: candidate.imageArtifact,
      requestFingerprint: capture.requestFingerprint,
      responseCaptured: capture.responseCaptured,
      attempts: capture.attempts,
      artifact, persistError, byteIdentical,
      sourceLinkStatus: byteIdentical ? "byte-identical-candidate"
        : "pending",
      rightsSignoff: "pending", runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false };
    rows.push(row);
    console.log(JSON.stringify({ stage: "official-image-link-attempt",
      id: row.id, responseCaptured: row.responseCaptured,
      byteIdentical, sourceLinkStatus: row.sourceLinkStatus }));
  }
  const ledger = { schema: "mainline-a-r66-nebula-page-image-link-ledger-v652",
    evidenceClass: "external-source", runId,
    startedAt, endedAt: new Date().toISOString(),
    inputPins: { pageLedger: { path: V652_PAGE_LEDGER,
      sha256: sha256V652(pageLedgerBytes), bytes: pageLedgerBytes.byteLength },
    pageAudit: { path: V652_PAGE_AUDIT,
      sha256: sha256V652(pageAuditBytes), bytes: pageAuditBytes.byteLength },
    imageBatch: { path: V652_IMAGE_BATCH,
      sha256: sha256V652(batchBytes), bytes: batchBytes.byteLength } },
    rows,
    counts: { total: rows.length,
      responseCaptured: rows.filter((row) => row.responseCaptured === 1).length,
      byteIdentical: rows.filter((row) => row.byteIdentical).length,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } };
  await writeFile(path.join(ROOT, relative), `${JSON.stringify(ledger, null, 2)}\n`,
    { flag: "wx" });
  return { status: "official-image-link-attempt-ledger-preserved",
    path: relative, counts: ledger.counts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4 || process.argv[2] !== "--run") fail("usage-invalid");
  console.log(JSON.stringify(await collectSixPageImageLinksV652(process.argv[3]), null, 2));
}
