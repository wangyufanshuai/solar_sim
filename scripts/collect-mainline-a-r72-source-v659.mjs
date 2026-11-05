import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  R72_EXPANSION_PATH_V659, R72_LICENSE_PATH_V659,
  R72_SCHEMA_V659, R72_TIMEOUT_MS_V659, R72_USER_AGENT_V659,
  acceptForR72V659, artifactPathR72V659, fingerprintR72V659,
  inspectAssetR72V659, inspectJpegR72V659, inspectPageR72V659,
  inspectSearchR72V659, maxBytesR72V659, safeRequestUrlR72V659,
  sha256R72V659, validateInputsR72V659,
} from "./mainline-a-r72-source-contract-v659.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REDIRECT_LIMIT = 4;
const MIME = Object.freeze({ page: /^text\/html(?:\s*;|$)/i,
  search: /^application\/json(?:\s*;|$)/i,
  asset: /^application\/json(?:\s*;|$)/i,
  image: /^image\/jpeg(?:\s*;|$)/i });

function fail(code, properties = {}) {
  const error = new Error(`r72-source-v659:${code}`);
  Object.assign(error, { code, ...properties });
  throw error;
}

function insideRoot(relative) {
  if (typeof relative !== "string" || !relative
    || relative.startsWith("/") || relative.includes("\\")
    || relative.split("/").some((part) => part === ".." || part === "")) {
    fail("path-invalid");
  }
  const absolute = path.resolve(ROOT, relative);
  if (!absolute.startsWith(`${ROOT}${path.sep}`)) fail("path-escaped");
  return absolute;
}

function runIdR72V659(value) {
  if (!/^\d{8}v659r72[a-z0-9-]{1,20}$/.test(value ?? "")) fail("run-id-invalid");
  return value;
}

export function ledgerPathR72V659(runId) {
  return `docs/release/v607/mainline-a-r72-source-ledger-${runIdR72V659(runId)}.json`;
}

export function checkpointPathR72V659(runId, count) {
  if (!Number.isInteger(count) || count < 1 || count > 6) fail("checkpoint-count-invalid");
  return `docs/release/v607/nebula-r72-v659/checkpoints/${runIdR72V659(runId)}-${count}.json`;
}

function classify(error) {
  if (error?.name === "AbortError" || error?.name === "TimeoutError"
    || error?.code === "timeout") return "timeout";
  if (["http-status", "mime-mismatch", "redirect-blocked", "redirect-limit",
    "body-too-large", "body-empty", "final-url-blocked", "jpeg-invalid"].includes(
    error?.code)) return error.code;
  return "network-error";
}

async function boundedBody(response, maximumBytes) {
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > maximumBytes) {
    fail("body-too-large", { response });
  }
  if (!response.body) fail("body-empty", { response });
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.byteLength;
      if (size > maximumBytes) fail("body-too-large", { response });
      chunks.push(item.value);
    }
  } finally {
    reader.releaseLock();
  }
  if (size === 0) fail("body-empty", { response });
  return Buffer.concat(chunks, size);
}

export async function fetchBoundedR72V659(row, kind, requestUrl, options = {}) {
  if (!safeRequestUrlR72V659(kind, requestUrl, row)) fail("unsafe-request");
  const timeoutMs = options.timeoutMs ?? R72_TIMEOUT_MS_V659;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) {
    fail("timeout-policy-invalid");
  }
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const redirectChain = [requestUrl];
  const redirects = [];
  let currentUrl = requestUrl;
  let response = null;
  try {
    for (let count = 0; count <= REDIRECT_LIMIT; count += 1) {
      response = await fetchImpl(currentUrl, { method: "GET", redirect: "manual",
        headers: { accept: acceptForR72V659(kind),
          "user-agent": R72_USER_AGENT_V659 }, signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (count >= REDIRECT_LIMIT) fail("redirect-limit", { response,
          finalUrl: currentUrl, redirectChain, redirects });
        const location = response.headers.get("location");
        let destination = null;
        try { destination = location ? new URL(location, currentUrl).href : null; }
        catch { /* Retain the invalid target in the attempt ledger. */ }
        redirects.push({ from: currentUrl, status: response.status,
          location, to: destination });
        if (!safeRequestUrlR72V659(kind, destination, row)) {
          fail("redirect-blocked", { response, finalUrl: destination,
            redirectChain: [...redirectChain, destination], redirects });
        }
        currentUrl = destination;
        redirectChain.push(currentUrl);
        continue;
      }
      const finalUrl = response.url || currentUrl;
      if (!safeRequestUrlR72V659(kind, finalUrl, row)
        || kind !== "page" && finalUrl !== requestUrl
        || kind === "page" && finalUrl !== row.pageUrl) {
        fail("final-url-blocked", { response, finalUrl,
          redirectChain, redirects });
      }
      if (response.status !== 200) fail("http-status", { response,
        finalUrl, redirectChain, redirects });
      const contentType = response.headers.get("content-type");
      if (!MIME[kind].test(contentType ?? "")) {
        fail("mime-mismatch", { response, finalUrl, redirectChain, redirects });
      }
      const body = await boundedBody(response, maxBytesR72V659(kind));
      if (kind === "image" && !inspectJpegR72V659(body).ok) {
        fail("jpeg-invalid", { response, finalUrl, redirectChain, redirects });
      }
      return Object.freeze({ status: response.status, contentType,
        finalUrl, redirectChain: Object.freeze([...redirectChain]),
        redirects: Object.freeze([...redirects]), body,
        bytes: body.length, sha256: sha256R72V659(body) });
    }
    fail("redirect-limit", { response, finalUrl: currentUrl,
      redirectChain, redirects });
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

function requestUrlFor(row, kind) {
  if (kind === "page") return row.initialPageUrl;
  if (kind === "search") return row.searchUrl;
  if (kind === "asset") return row.assetUrl;
  if (kind === "image") return row.imageUrl;
  fail("kind-invalid");
}

function plannedStage(row, kind, reason) {
  const requestUrl = requestUrlFor(row, kind);
  const fingerprint = kind === "image" && row.imageAcquisitionAllowed === false
    ? sha256R72V659(JSON.stringify({ method: "GET", url: requestUrl,
      headers: { accept: acceptForR72V659(kind),
        "user-agent": R72_USER_AGENT_V659 } }))
    : fingerprintR72V659(kind, requestUrl, row);
  return { kind, requestUrl, requestFingerprint: fingerprint,
    requestExecuted: false, responseCaptured: 0, attempts: [],
    artifact: null, inspection: null, skipReason: reason,
    persistenceError: null };
}

export async function collectRequestR72V659(row, kind, options = {}) {
  const requestUrl = requestUrlFor(row, kind);
  if (kind === "image" && !row.imageAcquisitionAllowed) {
    return { ...plannedStage(row, kind, "item-license-or-suitability-review-blocked"),
      captured: null };
  }
  if (!safeRequestUrlR72V659(kind, requestUrl, row)) fail("unsafe-request");
  const startedAt = new Date().toISOString();
  const attempt = { number: 1, retryCount: 0,
    collectionId: options.collectionId ?? randomUUID(),
    startedAt, endedAt: null, timeout: false,
    timeoutMs: options.timeoutMs ?? R72_TIMEOUT_MS_V659,
    requestExecuted: true, kind, requestUrl,
    requestFingerprint: fingerprintR72V659(kind, requestUrl, row),
    httpStatus: null, contentType: null, finalUrl: null,
    redirectChain: [requestUrl], redirects: [], errorClass: null,
    errorMessage: null, responseCaptured: 0, responseBytes: null,
    rawArtifactPath: null, rawSha256: null };
  let captured = null;
  try {
    captured = await fetchBoundedR72V659(row, kind, requestUrl, options);
    attempt.httpStatus = captured.status;
    attempt.contentType = captured.contentType;
    attempt.finalUrl = captured.finalUrl;
    attempt.redirectChain = [...captured.redirectChain];
    attempt.redirects = [...captured.redirects];
    attempt.responseCaptured = 1;
    attempt.responseBytes = captured.bytes;
    attempt.rawSha256 = captured.sha256;
  } catch (error) {
    attempt.httpStatus = Number.isInteger(error?.response?.status)
      ? error.response.status : null;
    attempt.contentType = error?.response?.headers?.get?.("content-type") ?? null;
    attempt.finalUrl = error?.finalUrl ?? requestUrl;
    attempt.redirectChain = error?.redirectChain ?? [requestUrl];
    attempt.redirects = error?.redirects ?? [];
    attempt.errorClass = classify(error);
    attempt.errorMessage = String(error?.message ?? error).slice(0, 500);
    attempt.timeout = attempt.errorClass === "timeout";
  } finally {
    attempt.endedAt = new Date().toISOString();
  }
  return { kind, requestUrl, requestFingerprint: attempt.requestFingerprint,
    requestExecuted: true, responseCaptured: captured ? 1 : 0,
    attempts: [attempt], artifact: null, inspection: null,
    skipReason: null, persistenceError: null, captured };
}

async function persistCapture(row, stage) {
  if (!stage.captured) return stage;
  const relative = artifactPathR72V659(row.id, stage.kind,
    stage.captured.sha256);
  const absolute = insideRoot(relative);
  try {
    await mkdir(path.dirname(absolute), { recursive: true });
    try { await writeFile(absolute, stage.captured.body, { flag: "wx" }); }
    catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const existing = await readFile(absolute);
      if (sha256R72V659(existing) !== stage.captured.sha256) {
        fail("raw-artifact-content-conflict");
      }
    }
    stage.artifact = { path: relative, sha256: stage.captured.sha256,
      bytes: stage.captured.bytes, contentType: stage.captured.contentType,
      finalUrl: stage.captured.finalUrl };
    stage.attempts[0].rawArtifactPath = relative;
  } catch (error) {
    stage.persistenceError = String(error?.message ?? error).slice(0, 500);
  }
  return stage;
}

function inspectStage(row, stage) {
  if (!stage?.artifact || !stage?.captured) return stage;
  if (stage.kind === "page") {
    stage.inspection = inspectPageR72V659(stage.captured.body, row);
  } else if (stage.kind === "search") {
    stage.inspection = inspectSearchR72V659(stage.captured.body, row);
  } else if (stage.kind === "asset") {
    stage.inspection = inspectAssetR72V659(stage.captured.body, row);
  } else if (stage.kind === "image") {
    stage.inspection = inspectJpegR72V659(stage.captured.body);
  }
  return stage;
}

function serializableStage(stage) {
  if (!stage) return null;
  const clean = { ...stage };
  delete clean.captured;
  return clean;
}

export async function collectOneR72V659(row, options = {}) {
  const page = inspectStage(row, await persistCapture(row,
    await collectRequestR72V659(row, "page", options)));
  const search = inspectStage(row, await persistCapture(row,
    await collectRequestR72V659(row, "search", options)));
  const asset = inspectStage(row, await persistCapture(row,
    await collectRequestR72V659(row, "asset", options)));
  const linked = search.inspection?.ok && asset.inspection?.ok
    && page.inspection?.ok && (row.pageKind !== "photojournal"
      || page.inspection.identityVerified);
  const image = row.imageAcquisitionAllowed && linked
    ? inspectStage(row, await persistCapture(row,
      await collectRequestR72V659(row, "image", options)))
    : plannedStage(row, "image", row.imageAcquisitionAllowed
      ? "source-chain-incomplete" : "item-license-or-suitability-review-blocked");
  const status = image.artifact && image.inspection?.ok
    ? "source-and-image-captured-candidate"
    : linked ? "structured-source-captured-image-hold"
      : "partial-source-attempt-ledger";
  return { id: row.id, nasaId: row.nasaId, title: row.title,
    rank: row.rank, expectedCredit: row.expectedCredit,
    pageKind: row.pageKind, pageUrl: row.pageUrl,
    sourceImageUrl: row.imageUrl,
    historicalLocal: row.historicalLocal,
    sourceMetadata: row.metadata,
    blockers: row.blockers,
    imageAcquisitionAllowed: row.imageAcquisitionAllowed,
    acquisitionDecision: row.acquisitionDecision,
    page: serializableStage(page), search: serializableStage(search),
    asset: serializableStage(asset), image: serializableStage(image),
    status, rightsStatus: "pending", runtimeAdmission: "candidate-only",
    hold: true, notAdmitted: true, scientificPayloadWriteback: false };
}

function countsFor(rows) {
  return { targets: rows.length,
    pagesCaptured: rows.filter((row) => row.page.artifact).length,
    pageIdentityVerified: rows.filter((row) =>
      row.page.inspection?.identityVerified).length,
    structuredSearchCaptured: rows.filter((row) => row.search.artifact).length,
    structuredSearchVerified: rows.filter((row) => row.search.inspection?.ok).length,
    assetManifestsCaptured: rows.filter((row) => row.asset.artifact).length,
    assetManifestsVerified: rows.filter((row) => row.asset.inspection?.ok).length,
    imageRequestsExecuted: rows.filter((row) => row.image.requestExecuted).length,
    imagesCaptured: rows.filter((row) => row.image.artifact).length,
    policyBlockedImageRequests: rows.filter((row) =>
      row.image.skipReason === "item-license-or-suitability-review-blocked").length,
    rightsSigned: 0, runtimeAdmitted: 0 };
}

async function pinExisting(relative, expectedSha = null) {
  const bytes = await readFile(insideRoot(relative));
  const sha256 = sha256R72V659(bytes);
  if (expectedSha && sha256 !== expectedSha) fail("historical-pin-mismatch",
    { path: relative });
  return { path: relative, bytes: bytes.length, sha256 };
}

export async function collectSixR72V659(runId, options = {}) {
  const output = ledgerPathR72V659(runId);
  const [expansionPin, licensePin] = await Promise.all([
    pinExisting(R72_EXPANSION_PATH_V659), pinExisting(R72_LICENSE_PATH_V659)]);
  const expansion = JSON.parse((await readFile(insideRoot(
    R72_EXPANSION_PATH_V659))).toString("utf8"));
  const license = JSON.parse((await readFile(insideRoot(
    R72_LICENSE_PATH_V659))).toString("utf8"));
  const validation = validateInputsR72V659(expansion, license);
  if (!validation.ok) fail("input-manifests-invalid", { issues: validation.issues });
  const sourceMetadata = [];
  for (const row of validation.rows) {
    sourceMetadata.push(await pinExisting(row.metadata.path, row.metadata.sha256));
    if (row.historicalLocal) {
      await pinExisting(row.historicalLocal.path, row.historicalLocal.sha256);
    }
  }
  const startedAt = new Date().toISOString();
  const rows = [];
  for (const row of validation.rows) {
    rows.push(await collectOneR72V659(row, options));
    const checkpoint = { schema: `${R72_SCHEMA_V659}-checkpoint`,
      runId, startedAt, checkpointAt: new Date().toISOString(),
      rows: [...rows], counts: countsFor(rows),
      boundary: { candidateOnly: true, hold: true,
        notAdmitted: true, scientificPayloadWriteback: false } };
    const checkpointRelative = checkpointPathR72V659(runId, rows.length);
    const checkpointAbsolute = insideRoot(checkpointRelative);
    await mkdir(path.dirname(checkpointAbsolute), { recursive: true });
    await writeFile(checkpointAbsolute, `${JSON.stringify(checkpoint, null, 2)}\n`,
      { flag: "wx" });
    options.onProgress?.({ id: row.id, count: rows.length,
      status: rows.at(-1).status, checkpoint: checkpointRelative });
  }
  const counts = countsFor(rows);
  const ledger = { schema: R72_SCHEMA_V659, runId, startedAt,
    endedAt: new Date().toISOString(),
    status: counts.structuredSearchVerified === 6
      && counts.assetManifestsVerified === 6 && counts.imagesCaptured === 1
      && counts.policyBlockedImageRequests === 5
      ? "structured-six-one-image-five-policy-holds-candidate"
      : "partial-attempt-ledger-candidate",
    inputs: { expansion: expansionPin, license: licensePin,
      sourceMetadata }, counts, rows,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, rightsSignoff: "pending",
      publicWebRelease: "blocked", physicalMobile: "not-run" } };
  await writeFile(insideRoot(output), `${JSON.stringify(ledger, null, 2)}\n`,
    { flag: "wx" });
  return { output, ledger };
}

function cliRunId(args) {
  const index = args.indexOf("--run-id");
  if (index === -1 || !args[index + 1]) fail("run-id-required");
  return runIdR72V659(args[index + 1]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  collectSixR72V659(cliRunId(process.argv.slice(2)), { onProgress: (progress) =>
    process.stdout.write(`${JSON.stringify(progress)}\n`) })
    .then(({ output, ledger }) => process.stdout.write(`${JSON.stringify({ output,
      status: ledger.status, counts: ledger.counts })}\n`))
    .catch((error) => {
      process.stderr.write(`${error?.stack ?? error}\n`);
      process.exitCode = 1;
    });
}
