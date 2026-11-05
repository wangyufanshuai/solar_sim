import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  R74_LICENSE_PATH_V661, R74_MAX_HTML_BYTES_V661,
  R74_OVERLAY_PATH_V661, R74_PRIOR_OVERLAY_PATH_V661,
  R74_SCHEMA_V661, R74_SOURCES_V661,
  R74_TARGET_IDS_V661, R74_TIMEOUT_MS_V661, R74_USER_AGENT_V661,
  inspectPageR74V661, rawPathR74V661, requestFingerprintR74V661,
  safePageUrlR74V661, sha256R74V661, validatePriorPolicyR74V661,
} from "./mainline-a-r74-alternative-contract-v661.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 3;

function localPath(relative) {
  if (typeof relative !== "string" || !relative
    || relative.includes("\\") || relative.startsWith("/")
    || relative.split("/").some((part) => !part || part === "..")) {
    throw new Error("r74-source-v661:unsafe-local-path");
  }
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) {
    throw new Error("r74-source-v661:local-path-escaped-root");
  }
  return absolute;
}

export function runIdR74V661(value) {
  if (!/^\d{8}v661r74[a-z0-9-]{1,24}$/.test(value ?? "")) {
    throw new Error("r74-source-v661:run-id-invalid");
  }
  return value;
}

export function ledgerPathR74V661(runId) {
  return `docs/release/v607/mainline-a-r74-v661-page-ledger-${runIdR74V661(runId)}.json`;
}

function fail(code, properties = {}) {
  const error = new Error(`r74-source-v661:${code}`);
  Object.assign(error, { code, ...properties });
  throw error;
}

function errorClass(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError"
    || error?.code === "timeout") return "timeout";
  if (["http-status", "content-type", "redirect-blocked", "redirect-limit",
    "body-too-large", "body-empty", "final-url-blocked", "response-stream"].includes(
    error?.code)) return error.code;
  return "network-error";
}

async function readBounded(response) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > R74_MAX_HTML_BYTES_V661) {
    fail("body-too-large", { response });
  }
  if (!response.body) fail("body-empty", { response });
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      total += item.value.byteLength;
      if (total > R74_MAX_HTML_BYTES_V661) {
        fail("body-too-large", { response });
      }
      chunks.push(item.value);
    }
  } catch (error) {
    if (error?.code) throw error;
    fail("response-stream", { response, cause: error });
  } finally {
    reader.releaseLock();
  }
  if (total === 0) fail("body-empty", { response });
  return Buffer.concat(chunks, total);
}

export async function requestPageR74V661(source, options = {}) {
  if (!safePageUrlR74V661(source?.url, source)) fail("request-not-allowlisted");
  const timeoutMs = options.timeoutMs ?? R74_TIMEOUT_MS_V661;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    fail("timeout-policy-invalid");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = new Date().toISOString();
  const redirectChain = [source.url];
  const redirects = [];
  let currentUrl = source.url;
  let response = null;
  let contentType = null;
  let status = null;
  let finalUrl = null;
  let body = null;
  try {
    for (let count = 0; count <= MAX_REDIRECTS; count += 1) {
      response = await fetchImpl(currentUrl, {
        method: "GET", redirect: "manual", signal: controller.signal,
        headers: { accept: "text/html,application/xhtml+xml;q=0.9",
          "user-agent": R74_USER_AGENT_V661 },
      });
      status = response.status;
      contentType = response.headers.get("content-type");
      finalUrl = response.url || currentUrl;
      if (REDIRECT_CODES.has(status)) {
        const location = response.headers.get("location");
        let destination = null;
        try { destination = location ? new URL(location, currentUrl).href : null; }
        catch { /* Preserve invalid redirect in the attempt record. */ }
        redirects.push({ from: currentUrl, to: destination,
          status, location });
        redirectChain.push(destination);
        if (count >= MAX_REDIRECTS) {
          fail("redirect-limit", { response, finalUrl: destination });
        }
        if (!safePageUrlR74V661(destination, source)) {
          fail("redirect-blocked", { response, finalUrl: destination });
        }
        currentUrl = destination;
        continue;
      }
      if (!safePageUrlR74V661(finalUrl, source)) {
        fail("final-url-blocked", { response, finalUrl });
      }
      if (status !== 200) fail("http-status", { response, finalUrl });
      if (!/^text\/html(?:\s*;|$)/i.test(contentType ?? "")) {
        fail("content-type", { response, finalUrl });
      }
      body = await readBounded(response);
      break;
    }
    if (!body) fail("redirect-limit", { response, finalUrl });
    return { attempt: {
      sourceKey: source.key, targetId: source.targetId, requestUrl: source.url,
      requestFingerprint: requestFingerprintR74V661(source),
      requestExecuted: true, retryCount: 0, timeoutMs,
      startedAt, endedAt: new Date().toISOString(),
      timeout: false, httpStatus: status, contentType,
      finalUrl, redirectChain, redirects, errorClass: null,
      errorMessage: null, responseCaptured: 1,
      responseBytes: body.length, responseSha256: sha256R74V661(body),
    }, body };
  } catch (error) {
    return { attempt: {
      sourceKey: source.key, targetId: source.targetId, requestUrl: source.url,
      requestFingerprint: requestFingerprintR74V661(source),
      requestExecuted: true, retryCount: 0, timeoutMs,
      startedAt, endedAt: new Date().toISOString(),
      timeout: errorClass(error) === "timeout",
      httpStatus: error?.response?.status ?? status,
      contentType: error?.response?.headers?.get?.("content-type") ?? contentType,
      finalUrl: error?.finalUrl ?? finalUrl,
      redirectChain, redirects, errorClass: errorClass(error),
      errorMessage: String(error?.message ?? error).slice(0, 600),
      responseCaptured: 0, responseBytes: null, responseSha256: null,
    }, body: null };
  } finally {
    clearTimeout(timer);
  }
}

async function pinInput(relative) {
  const body = await readFile(localPath(relative));
  return { path: relative, bytes: body.length,
    sha256: sha256R74V661(body), parsed: JSON.parse(body.toString("utf8")) };
}

async function saveRaw(source, bytes) {
  const sha256 = sha256R74V661(bytes);
  const relative = rawPathR74V661(source, sha256);
  const absolute = localPath(relative);
  await mkdir(path.dirname(absolute), { recursive: true });
  try { await writeFile(absolute, bytes, { flag: "wx" }); }
  catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const existing = await readFile(absolute);
    if (existing.length !== bytes.length || sha256R74V661(existing) !== sha256) {
      fail("existing-raw-artifact-drift");
    }
  }
  return { path: relative, bytes: bytes.length, sha256 };
}

export function unexecutedImageRequestsR74V661() {
  return R74_TARGET_IDS_V661.map((id) => ({ targetId: id,
    requestExecuted: false, responseCaptured: 0, attemptCount: 0,
    rawArtifact: null, reason: "item-license-and-suitability-hold" }));
}

async function sourceRecord(source, options) {
  const result = await requestPageR74V661(source, options);
  const inspection = result.body ? inspectPageR74V661(result.body, source) : null;
  const rawArtifact = result.body ? await saveRaw(source, result.body) : null;
  return { sourceKey: source.key, targetId: source.targetId,
    sourceUrl: source.url, sourceKind: source.kind,
    attempt: { ...result.attempt,
      collectionId: options.collectionId,
      rawArtifactPath: rawArtifact?.path ?? null },
    rawArtifact, inspection,
    sourceState: result.body
      ? inspection.identityState === "identity-conflict"
        ? "identity-conflict-hold"
        : inspection.ok ? "page-captured-rights-hold"
          : "page-captured-inspection-hold"
      : "request-failed-hold",
    imageRequestExecuted: false, imageResponseCaptured: 0,
    rightsStatus: "pending", runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false };
}

export async function collectR74V661(options) {
  const runId = runIdR74V661(options?.runId);
  const license = await pinInput(R74_LICENSE_PATH_V661);
  const prior = await pinInput(R74_PRIOR_OVERLAY_PATH_V661);
  const policy = validatePriorPolicyR74V661(license.parsed, prior.parsed);
  if (!policy.ok) fail(`prior-policy-invalid:${policy.issues.join(",")}`);
  const ledgerRelative = ledgerPathR74V661(runId);
  const ledgerAbsolute = localPath(ledgerRelative);
  const createdAt = new Date().toISOString();
  const collectionId = randomUUID();
  const sources = [];
  for (const source of R74_SOURCES_V661) {
    sources.push(await sourceRecord(source, { ...options, collectionId }));
  }
  const ledger = {
    schema: R74_SCHEMA_V661, runId, collectionId, createdAt,
    completedAt: new Date().toISOString(),
    evidenceClass: "real-https-page-attempts-local-candidate",
    inputs: [{ role: "v592-item-policy", path: license.path,
      bytes: license.bytes, sha256: license.sha256 },
    { role: "r72-five-image-holds", path: prior.path,
      bytes: prior.bytes, sha256: prior.sha256 }],
    sourceCount: sources.length, sources,
    unexecutedImageRequests: unexecutedImageRequestsR74V661(),
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      rightsSigned: 0, runtimeAdmitted: 0,
      scientificPayloadWriteback: false, imageRequestsExecuted: 0,
      imageResponsesCaptured: 0 },
  };
  await mkdir(path.dirname(ledgerAbsolute), { recursive: true });
  await writeFile(ledgerAbsolute, `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  return { ledgerPath: ledgerRelative, ledger,
    captured: sources.filter((item) => item.attempt.responseCaptured === 1).length,
    failed: sources.filter((item) => item.attempt.responseCaptured === 0).length,
    conflicts: sources.filter((item) => item.inspection?.identityState === "identity-conflict").length,
    overlayPath: R74_OVERLAY_PATH_V661 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const at = process.argv.indexOf("--run-id");
  const runId = at >= 0 ? process.argv[at + 1] : null;
  collectR74V661({ runId }).then((result) => {
    console.log(JSON.stringify({ ledgerPath: result.ledgerPath,
      captured: result.captured, failed: result.failed,
      conflicts: result.conflicts, imageRequestsExecuted: 0 }, null, 2));
  }).catch((error) => {
    console.error(String(error?.message ?? error));
    process.exitCode = 1;
  });
}
