import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  V651_ACCEPT, V651_ARTIFACT_DIR, V651_BATCH_PATH, V651_EVIDENCE_DIR,
  V651_MAX_BYTES, V651_RETRIES, V651_SOURCE_PAGES, V651_TIMEOUT_MS,
  V651_USER_AGENT, artifactPathV651, fingerprintSourcePageRequestV651,
  inspectOfficialSourcePageV651, sha256V651, validateBatchRowsV651,
  validateSourcePageUrlV651,
} from "./mainline-a-nebula-source-page-v651.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REDIRECTS_MAX = 5;
const HTML_TYPE = /^text\/html(?:\s*;|$)/i;

function fail(code, details = {}) {
  const error = new Error(`nebula-source-page-v651:${code}`);
  Object.assign(error, details);
  throw error;
}
function safeRunId(runId) {
  if (!/^20261011-v651page0[1-9]$/.test(runId ?? "")) fail("run-id-invalid");
  return runId;
}
function ledgerPath(runId) {
  return `${V651_EVIDENCE_DIR}/mainline-a-r66-nebula-source-page-ledger-${safeRunId(runId)}.json`;
}
function responseType(response) {
  return response?.headers?.get?.("content-type") ?? null;
}
function classifyError(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError"
    || error?.code === "timeout") return "timeout";
  if (error?.code === "http-status") return "http-status";
  if (error?.code === "content-type") return "content-type";
  if (error?.code === "body-too-large") return "body-too-large";
  if (error?.code === "redirect-blocked") return "redirect-blocked";
  if (error?.code === "redirect-limit") return "redirect-limit";
  return "network-error";
}
function retryable(attempt) {
  return attempt.errorClass === "timeout" || attempt.errorClass === "network-error"
    || (attempt.errorClass === "http-status"
      && (attempt.httpStatus === 429 || attempt.httpStatus >= 500));
}
function newAttempt(source, collectionId, number, timeoutMs) {
  return {
    attempt: number,
    retryCount: number - 1,
    collectionId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    requestExecuted: false,
    timeout: false,
    timeoutMs,
    httpStatus: null,
    contentType: null,
    requestUrl: source.url,
    finalUrl: null,
    redirectChain: [],
    errorClass: null,
    errorMessage: null,
    requestFingerprint: fingerprintSourcePageRequestV651(source),
    responseCaptured: 0,
    responseBytes: null,
    rawArtifactPath: null,
    rawPageSha256: null,
  };
}
async function readBounded(response, maximumBytes) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    fail("body-too-large", { code: "body-too-large", response });
  }
  if (!response.body) fail("empty-body", { code: "network-error", response });
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximumBytes) {
        fail("body-too-large", { code: "body-too-large", response });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, length);
}

export async function fetchOfficialSourcePageV651(source, options = {}) {
  if (!validateSourcePageUrlV651(source?.url, source)) {
    fail("unsafe-url", { code: "redirect-blocked" });
  }
  const timeoutMs = options.timeoutMs ?? V651_TIMEOUT_MS;
  const maximumBytes = options.maxBytes ?? V651_MAX_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const redirects = [source.url];
  let currentUrl = source.url;
  let response = null;
  try {
    for (let count = 0; count <= REDIRECTS_MAX; count += 1) {
      response = await fetchImpl(currentUrl, {
        method: "GET",
        headers: { accept: V651_ACCEPT, "user-agent": V651_USER_AGENT },
        redirect: "manual",
        signal: controller.signal,
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (count >= REDIRECTS_MAX) fail("redirect-limit", { code: "redirect-limit",
          response, finalUrl: currentUrl, redirectChain: redirects });
        const location = response.headers.get("location");
        const next = location ? new URL(location, currentUrl).href : null;
        if (!validateSourcePageUrlV651(next, source)) {
          fail("redirect-blocked", { code: "redirect-blocked",
            response, finalUrl: next, redirectChain: [...redirects, next] });
        }
        currentUrl = next;
        redirects.push(currentUrl);
        continue;
      }
      const finalUrl = response.url || currentUrl;
      if (!validateSourcePageUrlV651(finalUrl, source)) {
        fail("final-url-blocked", { code: "redirect-blocked", response,
          finalUrl, redirectChain: [...redirects, finalUrl] });
      }
      if (response.status !== 200) {
        fail("http-status", { code: "http-status", response,
          finalUrl, redirectChain: redirects });
      }
      const contentType = responseType(response);
      if (!HTML_TYPE.test(contentType ?? "")) {
        fail("content-type", { code: "content-type", response,
          finalUrl, redirectChain: redirects });
      }
      const body = await readBounded(response, maximumBytes);
      if (body.byteLength < 1_000) {
        fail("short-html", { code: "content-type", response,
          finalUrl, redirectChain: redirects });
      }
      return Object.freeze({ status: response.status, contentType,
        finalUrl, redirectChain: Object.freeze(redirects),
        body, sha256: sha256V651(body) });
    }
    fail("redirect-limit", { code: "redirect-limit", response,
      finalUrl: currentUrl, redirectChain: redirects });
  } catch (error) {
    if (!error.response && response) error.response = response;
    if (!error.finalUrl) error.finalUrl = currentUrl;
    if (!error.redirectChain) error.redirectChain = redirects;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function collectOfficialSourcePageV651(source, candidate, options = {}) {
  const collectionId = options.collectionId ?? randomUUID();
  const retries = options.retries ?? V651_RETRIES;
  const attempts = [];
  let captured = null;
  for (let number = 1; number <= retries + 1; number += 1) {
    const attempt = newAttempt(source, collectionId, number,
      options.timeoutMs ?? V651_TIMEOUT_MS);
    try {
      attempt.requestExecuted = true;
      captured = await fetchOfficialSourcePageV651(source, options);
      attempt.httpStatus = captured.status;
      attempt.contentType = captured.contentType;
      attempt.finalUrl = captured.finalUrl;
      attempt.redirectChain = [...captured.redirectChain];
      attempt.responseCaptured = 1;
      attempt.responseBytes = captured.body.byteLength;
      attempt.rawPageSha256 = captured.sha256;
    } catch (error) {
      attempt.httpStatus = error?.response?.status ?? null;
      attempt.contentType = responseType(error?.response);
      attempt.finalUrl = error?.finalUrl ?? source.url;
      attempt.redirectChain = error?.redirectChain ?? [source.url];
      attempt.errorClass = classifyError(error);
      attempt.errorMessage = String(error?.message ?? error).slice(0, 500);
      attempt.timeout = attempt.errorClass === "timeout";
    } finally {
      attempt.endedAt = new Date().toISOString();
      attempts.push(attempt);
    }
    if (captured || number > retries || !retryable(attempt)) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * number));
  }
  const inspection = captured
    ? inspectOfficialSourcePageV651(captured.body.toString("utf8"), source,
      candidate.source.credit)
    : null;
  return { id: source.id, nasaId: source.nasaId, sourcePageUrl: source.url,
    imageArtifactSha256: candidate.network.artifact.sha256,
    expectedCredit: candidate.source.credit,
    requestFingerprint: fingerprintSourcePageRequestV651(source),
    responseCaptured: captured ? 1 : 0, attempts,
    inspection, captured };
}

async function persistRawPage(capture) {
  if (!capture.captured) return null;
  const relative = artifactPathV651(capture, capture.captured.sha256);
  const absolute = path.resolve(ROOT, relative);
  const base = path.resolve(ROOT, V651_ARTIFACT_DIR);
  if (!absolute.startsWith(`${base}${path.sep}`)) fail("artifact-path-escaped");
  await mkdir(base, { recursive: true });
  try {
    await writeFile(absolute, capture.captured.body, { flag: "wx" });
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const prior = await readFile(absolute);
    if (sha256V651(prior) !== capture.captured.sha256) fail("artifact-content-conflict");
  }
  return { path: relative, bytes: capture.captured.body.byteLength,
    sha256: capture.captured.sha256, contentType: capture.captured.contentType,
    finalUrl: capture.captured.finalUrl };
}

export async function collectSixOfficialPagesV651(runId, options = {}) {
  const relative = ledgerPath(runId);
  try {
    await access(path.join(ROOT, relative));
    fail("ledger-exists", { path: relative });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const batchBytes = await readFile(path.join(ROOT, V651_BATCH_PATH));
  const batch = JSON.parse(batchBytes.toString("utf8"));
  const batchCheck = validateBatchRowsV651(batch);
  if (!batchCheck.ok) fail("input-batch-invalid", { issues: batchCheck.issues });
  const startedAt = new Date().toISOString();
  const rows = [];
  for (const source of V651_SOURCE_PAGES) {
    const candidate = batch.rows.find((row) => row.id === source.id);
    const capture = await collectOfficialSourcePageV651(source, candidate, options);
    let artifact = null;
    let persistError = null;
    try {
      artifact = await persistRawPage(capture);
      if (artifact) {
        const success = capture.attempts.findLast((attempt) => attempt.responseCaptured === 1);
        if (success) success.rawArtifactPath = artifact.path;
      }
    } catch (error) {
      persistError = String(error?.message ?? error).slice(0, 500);
    }
    const row = { id: source.id, nasaId: source.nasaId, sourcePageUrl: source.url,
      imageArtifactSha256: capture.imageArtifactSha256,
      expectedCredit: capture.expectedCredit,
      requestFingerprint: capture.requestFingerprint,
      responseCaptured: capture.responseCaptured,
      attempts: capture.attempts, artifact,
      inspection: capture.inspection,
      persistError,
      sourcePageStatus: artifact && capture.inspection?.status === "verified-official-source-page-candidate"
        ? "verified-official-source-page-candidate" : "pending",
      rightsSignoff: "pending", runtimeAdmission: "candidate-only",
      scientificPayloadWriteback: false };
    rows.push(row);
    console.log(JSON.stringify({ stage: "source-page-attempt", id: row.id,
      responseCaptured: row.responseCaptured, sourcePageStatus: row.sourcePageStatus,
      attempts: row.attempts.length, persistError }));
  }
  const ledger = { schema: "mainline-a-r66-nebula-source-page-ledger-v651",
    evidenceClass: "external-source", runId, startedAt,
    endedAt: new Date().toISOString(),
    inputBatch: { path: V651_BATCH_PATH, bytes: batchBytes.byteLength,
      sha256: sha256V651(batchBytes) },
    rows,
    counts: { total: rows.length,
      responseCaptured: rows.filter((row) => row.responseCaptured === 1).length,
      officialPageCandidateVerified: rows.filter((row) => row.sourcePageStatus ===
        "verified-official-source-page-candidate").length,
      rightsSigned: 0 },
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, runtimePromotion: "closed" },
    claims: { copyrightApproval: false, scientificValidity: false,
      publicWebReleaseApproved: false, realUserValidation: false },
  };
  await writeFile(path.join(ROOT, relative), `${JSON.stringify(ledger, null, 2)}\n`,
    { flag: "wx" });
  return { path: relative, status: "attempt-ledger-preserved", counts: ledger.counts };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4 || process.argv[2] !== "--run") fail("usage-invalid");
  console.log(JSON.stringify(await collectSixOfficialPagesV651(process.argv[3]), null, 2));
}
