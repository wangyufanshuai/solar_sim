import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v624.mjs";
import {
  B1_ACCEPT, B1_BATCH, B1_DISCOVERY, B1_MAX_PAGE_BYTES,
  B1_PAGE_DIR, B1_RETRIES, B1_TIMEOUT_MS, B1_USER_AGENT,
  b1PageArtifactPathV654, bindB1DiscoveryToBatchV654,
  fingerprintB1PageRequestV654, inspectB1OfficialPageV654,
  safeOfficialPageUrlB1V654, sha256B1V654,
} from "./mainline-a-nebula-b1-source-v654.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEDGER_SCHEMA = "mainline-a-r67-b1-source-page-ledger-v654";
const HTML_MIME = /^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

function fail(code, extras = {}) {
  const error = new Error(`b1-source-v654:${code}`);
  Object.assign(error, extras);
  throw error;
}
function runPath(runId) {
  if (!/^20261012-v654b1page0[1-9]$/.test(runId ?? "")) fail("run-id-invalid");
  return `docs/release/v607/mainline-a-r67-b1-source-page-ledger-${runId}.json`;
}
function classify(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError") return "timeout";
  if (["redirect-blocked", "http-status", "content-type",
    "body-too-large", "empty-body"].includes(error?.code)) return error.code;
  return "network-error";
}
function mayRetry(record) {
  return record.errorClass === "timeout" || record.errorClass === "network-error"
    || (record.errorClass === "http-status"
      && (record.httpStatus === 429 || record.httpStatus >= 500));
}
function newAttempt(candidate, collectionId, number, timeoutMs) {
  return { attempt: number, retryCount: number - 1,
    collectionId, startedAt: new Date().toISOString(), endedAt: null,
    timeout: false, timeoutMs, requestExecuted: false,
    requestUrl: candidate.pageUrl,
    requestFingerprint: fingerprintB1PageRequestV654(candidate),
    httpStatus: null, contentType: null, finalUrl: null,
    redirectChain: [], errorClass: null, errorMessage: null,
    responseCaptured: 0, responseBytes: null, rawArtifactPath: null,
    rawSha256: null };
}
async function boundedBody(response, maximumBytes) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maximumBytes) {
    fail("body-too-large", { code: "body-too-large", response });
  }
  if (!response.body) fail("empty-body", { code: "empty-body", response });
  const reader = response.body.getReader();
  const parts = [];
  let total = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      total += item.value.byteLength;
      if (total > maximumBytes) {
        fail("body-too-large", { code: "body-too-large", response });
      }
      parts.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(parts, total);
}

export async function fetchB1OfficialPageV654(candidate, options = {}) {
  if (!safeOfficialPageUrlB1V654(candidate?.pageUrl, candidate?.pageUrl)) {
    fail("unsafe-page-url", { code: "redirect-blocked" });
  }
  const timeoutMs = options.timeoutMs ?? B1_TIMEOUT_MS;
  const maximumBytes = options.maxBytes ?? B1_MAX_PAGE_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response = null;
  try {
    response = await fetchImpl(candidate.pageUrl, {
      method: "GET", redirect: "manual", signal: controller.signal,
      headers: { accept: B1_ACCEPT, "user-agent": B1_USER_AGENT },
    });
    const finalUrl = response.url || candidate.pageUrl;
    if (REDIRECTS.has(response.status)) {
      const destination = response.headers.get("location");
      fail("redirect-blocked", { code: "redirect-blocked", response,
        finalUrl: destination ? new URL(destination, candidate.pageUrl).href : null,
        redirectChain: [candidate.pageUrl, destination] });
    }
    if (finalUrl !== candidate.pageUrl) {
      fail("final-url-blocked", { code: "redirect-blocked", response,
        finalUrl, redirectChain: [candidate.pageUrl, finalUrl] });
    }
    if (response.status !== 200) {
      fail("http-status", { code: "http-status", response,
        finalUrl, redirectChain: [candidate.pageUrl] });
    }
    const contentType = response.headers.get("content-type");
    if (!HTML_MIME.test(contentType ?? "")) {
      fail("content-type", { code: "content-type", response,
        finalUrl, redirectChain: [candidate.pageUrl] });
    }
    const body = await boundedBody(response, maximumBytes);
    return Object.freeze({ status: 200, contentType, finalUrl,
      redirectChain: Object.freeze([candidate.pageUrl]),
      body, bytes: body.byteLength, sha256: sha256B1V654(body) });
  } catch (error) {
    if (!error.response && response) error.response = response;
    if (!error.finalUrl) error.finalUrl = candidate.pageUrl;
    if (!error.redirectChain) error.redirectChain = [candidate.pageUrl];
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function attemptB1PageCaptureV654(candidate, options = {}) {
  const collectionId = options.collectionId ?? randomUUID();
  const retries = options.retries ?? B1_RETRIES;
  const attempts = [];
  let capture = null;
  for (let number = 1; number <= retries + 1; number += 1) {
    const attempt = newAttempt(candidate, collectionId,
      number, options.timeoutMs ?? B1_TIMEOUT_MS);
    try {
      attempt.requestExecuted = true;
      capture = await fetchB1OfficialPageV654(candidate, options);
      attempt.httpStatus = capture.status;
      attempt.contentType = capture.contentType;
      attempt.finalUrl = capture.finalUrl;
      attempt.redirectChain = [...capture.redirectChain];
      attempt.responseCaptured = 1;
      attempt.responseBytes = capture.bytes;
      attempt.rawSha256 = capture.sha256;
    } catch (error) {
      attempt.httpStatus = error?.response?.status ?? null;
      attempt.contentType = error?.response?.headers?.get?.("content-type") ?? null;
      attempt.finalUrl = error?.finalUrl ?? candidate.pageUrl;
      attempt.redirectChain = error?.redirectChain ?? [candidate.pageUrl];
      attempt.errorClass = classify(error);
      attempt.errorMessage = String(error?.message ?? error).slice(0, 500);
      attempt.timeout = attempt.errorClass === "timeout";
    } finally {
      attempt.endedAt = new Date().toISOString();
      attempts.push(attempt);
    }
    if (capture || number > retries || !mayRetry(attempt)) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * number));
  }
  return Object.freeze({ candidate, collectionId, attempts, capture });
}

async function saveRawPage(candidate, capture) {
  if (!capture) return null;
  const relative = b1PageArtifactPathV654(candidate, capture.sha256);
  const base = path.resolve(ROOT, B1_PAGE_DIR);
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${base}${path.sep}`)) fail("artifact-path-escaped");
  await mkdir(base, { recursive: true });
  try {
    await writeFile(absolute, capture.body, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const old = await readFile(absolute);
    if (sha256B1V654(old) !== capture.sha256) fail("existing-artifact-conflict");
  }
  return { path: relative, bytes: capture.bytes,
    sha256: capture.sha256, contentType: capture.contentType,
    finalUrl: capture.finalUrl };
}

export async function collectB1OfficialPagesV654(runId, options = {}) {
  const ledgerPath = runPath(runId);
  try {
    await access(path.join(ROOT, ledgerPath));
    fail("ledger-already-exists");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const [batchBytes, discoveryBytes] = await Promise.all([
    readFile(path.join(ROOT, B1_BATCH)),
    readFile(path.join(ROOT, B1_DISCOVERY)),
  ]);
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const discovery = JSON.parse(discoveryBytes.toString("utf8"));
  const prior = await replayBatch(batch);
  if (prior.status !== "verified-with-rights-pending"
    || prior.counts.recomputed.artifactVerified !== 6) {
    fail("existing-image-batch-not-replayed");
  }
  const linked = bindB1DiscoveryToBatchV654(discovery, batch);
  if (!linked.ok) fail("source-discovery-invalid", { issues: linked.issues });
  const startedAt = new Date().toISOString();
  const rows = [];
  for (const candidate of linked.candidates) {
    const attempted = await attemptB1PageCaptureV654(candidate, options);
    let artifact = null;
    let persistError = null;
    try {
      artifact = await saveRawPage(candidate, attempted.capture);
      if (artifact) attempted.attempts.at(-1).rawArtifactPath = artifact.path;
    } catch (error) {
      persistError = String(error?.message ?? error).slice(0, 500);
    }
    const inspection = attempted.capture && artifact
      ? inspectB1OfficialPageV654(attempted.capture.body.toString("utf8"), candidate)
      : null;
    const pageStatus = inspection?.status === "verified-official-page-candidate"
      ? "verified-official-page-candidate" : "pending";
    rows.push({ id: candidate.id, nasaId: candidate.nasaId,
      pageUrl: candidate.pageUrl, pageTitle: candidate.pageTitle,
      expectedCredit: candidate.expectedCredit,
      candidateImageArtifact: candidate.candidateImageArtifact,
      requestFingerprint: fingerprintB1PageRequestV654(candidate),
      responseCaptured: attempted.capture ? 1 : 0,
      attempts: attempted.attempts,
      artifact, persistError, inspection, pageStatus,
      rightsSignoff: "pending", runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false });
    console.log(JSON.stringify({ stage: "b1-official-page-attempt",
      id: candidate.id, responseCaptured: rows.at(-1).responseCaptured,
      pageStatus }));
  }
  const ledger = { schema: LEDGER_SCHEMA, runId,
    evidenceClass: "external-source", startedAt,
    endedAt: new Date().toISOString(),
    inputPins: { batch: { path: B1_BATCH, bytes: batchBytes.byteLength,
      sha256: sha256B1V654(batchBytes) },
    discovery: { path: B1_DISCOVERY, bytes: discoveryBytes.byteLength,
      sha256: sha256B1V654(discoveryBytes) } },
    rows,
    counts: { total: rows.length,
      responseCaptured: rows.filter((row) => row.responseCaptured === 1).length,
      officialPageCandidateVerified: rows.filter((row) =>
        row.pageStatus === "verified-official-page-candidate").length,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false } };
  await writeFile(path.join(ROOT, ledgerPath),
    `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  return { status: "b1-source-page-attempt-ledger-preserved",
    path: ledgerPath, counts: ledger.counts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4 || process.argv[2] !== "--run") fail("usage-invalid");
  console.log(JSON.stringify(await collectB1OfficialPagesV654(process.argv[3]), null, 2));
}
