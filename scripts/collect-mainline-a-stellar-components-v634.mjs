import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const COMPONENT_CAPTURE_SCHEMA = "mainline-a-stellar-component-capture-v634";
export const SOURCE_PACK_PATH = "app/data/mainlineABetaStellarStructuredCandidateV621.generated.json";
export const ARTIFACT_ROOT = "docs/release/v607/stellar-component-artifacts/v634";
export const README_URL = "https://cdsarc.cds.unistra.fr/ftp/B/wds/ReadMe";
export const TSV_ENDPOINT = "https://vizier.cds.unistra.fr/viz-bin/asu-tsv";
export const COMPONENT_IDS = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
export const CAPTURE_BOUNDARY = Object.freeze({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  scientificPayloadWriteback: false,
  runtimeWrites: false,
  componentConfirmed: false,
  rightsApproved: false,
});
const RUN_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;
const SHA = /^[a-f0-9]{64}$/;
const MAX_BYTES = 1024 * 1024;
const now = () => new Date().toISOString();
const requireValue = (condition, message) => { if (!condition) throw new Error(`stellar components v634: ${message}`); };
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export const canonicalSha256 = (value) => sha256(JSON.stringify(canonical(value)));

function requestFingerprint(requestUrl, accept) {
  return canonicalSha256({ method: "GET", requestUrl, accept });
}

export function validateRequestUrl(value, kind, wdsSystemId = null) {
  const url = new URL(value);
  requireValue(url.protocol === "https:" && !url.port && !url.username && !url.password && !url.hash, "HTTPS URL without credentials, port or fragment required");
  if (kind === "readme") {
    requireValue(url.toString() === README_URL, "unexpected ReadMe endpoint");
  } else {
    requireValue(kind === "wds" && url.origin + url.pathname === TSV_ENDPOINT, "unexpected WDS endpoint");
    const expected = { "-source": "B/wds/wds", "-out.all": "1", "-out.max": "100", WDS: wdsSystemId };
    requireValue(/^\d{5}[+-]\d{4}$/.test(wdsSystemId ?? ""), "invalid WDS system key");
    requireValue([...url.searchParams].length === 4, "unexpected query arguments");
    for (const [key, entry] of Object.entries(expected)) requireValue(url.searchParams.get(key) === entry, `query constraint mismatch: ${key}`);
  }
  return true;
}

function makePlan(id, kind, requestUrl, timeoutMs, maxAttempts, wdsSystemId = null) {
  const accept = kind === "readme" ? "text/plain" : "text/tab-separated-values";
  validateRequestUrl(requestUrl, kind, wdsSystemId);
  return Object.freeze({ id, kind, method: "GET", requestUrl, accept, timeoutMs, maxAttempts, maxResponseBytes: MAX_BYTES, wdsSystemId, requestFingerprint: requestFingerprint(requestUrl, accept) });
}

export function buildComponentPlans(pack, { timeoutMs = 15000, maxAttempts = 2 } = {}) {
  requireValue(Number.isInteger(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 60000, "timeout outside 1000..60000 ms");
  requireValue(Number.isInteger(maxAttempts) && maxAttempts >= 1 && maxAttempts <= 3, "attempt count outside 1..3");
  requireValue(pack.schema === "mainline-a-beta-stellar-structured-candidate-pack-v621", "V621 source schema required");
  requireValue(Array.isArray(pack.records) && pack.records.length === 4, "exact four-star source pack required");
  requireValue(COMPONENT_IDS.every((id) => pack.records.filter((row) => row.id === id).length === 1), "source roster differs");
  requireValue(pack.boundary?.candidateOnly === true && pack.boundary?.hold === true && pack.boundary?.notAdmitted === true && pack.boundary?.scientificPayloadWriteback === false, "source boundary is open");
  const records = COMPONENT_IDS.map((id) => {
    const candidate = pack.records.find((row) => row.id === id);
    requireValue(candidate.decision === "hold" && candidate.runtimeAdmission === "candidate-only" && candidate.measurementAdmission === "not-admitted" && candidate.scientificPayloadWriteback === false, `${id}: source admission is open`);
    requireValue(SHA.test(candidate.rawPageSha256), `${id}: source raw digest missing`);
    const hints = (candidate.componentHints ?? []).filter((hint) => hint.catalog === "WDS");
    requireValue(hints.length > 0, `${id}: no recorded WDS hints`);
    const keys = hints.map((hint) => {
      requireValue(hint.evidence === "identifier-only" && candidate.identifiers.includes(hint.identifier), `${id}: hint is not bound to source identifiers`);
      const match = hint.identifier.match(/^WDS J(\d{5}[+-]\d{4})([A-Za-z0-9,]+)$/);
      requireValue(match, `${id}: malformed WDS identifier`);
      const source = new URL(hint.sourceUrl);
      requireValue(source.protocol === "https:" && source.hostname === "vizier.cds.unistra.fr" && !source.username && !source.password && !source.port, `${id}: hint source host invalid`);
      requireValue(source.pathname === "/viz-bin/VizieR-S" && decodeURIComponent(source.search.slice(1)) === hint.identifier, `${id}: hint link does not match identifier`);
      return match[1];
    });
    requireValue(new Set(keys).size === 1, `${id}: conflicting WDS system hints`);
    const wdsSystemId = keys[0];
    const requestUrl = `${TSV_ENDPOINT}?${new URLSearchParams({ "-source": "B/wds/wds", "-out.all": "1", "-out.max": "100", WDS: wdsSystemId })}`;
    return {
      id, sourceCandidateId: candidate.id, sourceQueryIdentifier: candidate.queryTitle,
      sourceRawPageSha256: candidate.rawPageSha256, wdsSystemId,
      sourceHintIdentifiers: hints.map((hint) => hint.identifier),
      plan: makePlan(id, "wds", requestUrl, timeoutMs, maxAttempts, wdsSystemId),
    };
  });
  return { records, readme: { id: "wds-readme", plan: makePlan("wds-readme", "readme", README_URL, timeoutMs, maxAttempts) } };
}

export function classifyCaptureError(error) {
  const code = error?.code ?? error?.cause?.code;
  if (error?.name === "AbortError" || error?.name === "TimeoutError" || code === "DEADLINE") return "timeout";
  if (code === "UNSAFE_REDIRECT" || code === "REDIRECT_LIMIT") return "redirect";
  if (code === "HTTP_STATUS") return "http-status";
  if (code === "CONTENT_TYPE") return "content-type";
  if (code === "BODY_LIMIT" || code === "EMPTY_BODY") return "invalid-response";
  if (["ENOTFOUND", "EAI_AGAIN"].includes(code)) return "dns";
  if (["CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "DEPTH_ZERO_SELF_SIGNED_CERT"].includes(code)) return "tls";
  if (["ECONNRESET", "ECONNREFUSED", "UND_ERR_SOCKET"].includes(code)) return "connection";
  return "network";
}

function captureError(message, code) { return Object.assign(new Error(message), { code }); }

async function readBody(response, maxBytes) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw captureError("declared body exceeds limit", "BODY_LIMIT");
  requireValue(response.body, "response body stream missing");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > maxBytes) throw captureError("streamed body exceeds limit", "BODY_LIMIT");
      chunks.push(Buffer.from(result.value));
    }
    if (!bytes) throw captureError("empty response body", "EMPTY_BODY");
    return Buffer.concat(chunks, bytes);
  } finally {
    try { await reader.cancel(); } catch { /* Cancellation is best effort after transport failure. */ }
  }
}

async function oneAttempt(plan, number, fetchImpl, testOnly) {
  const attempt = {
    attempt: number, startedAt: now(), endedAt: null, timeoutMs: plan.timeoutMs,
    timeout: false, retryCount: number - 1, httpStatus: null, contentType: null,
    requestUrl: plan.requestUrl, finalUrl: null, redirectChain: [],
    requestFingerprint: plan.requestFingerprint, errorCategory: null, errorClass: null,
    errorMessage: null, responseCaptured: 0, responseBytes: null, rawArtifact: null,
    transport: testOnly ? "fixture-replay" : "https",
  };
  const controller = new AbortController();
  let timer;
  let raw = null;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(captureError("request deadline exceeded", "DEADLINE"));
    }, plan.timeoutMs);
  });
  const request = async () => {
    let current = plan.requestUrl;
    for (let hop = 0; hop <= 4; hop += 1) {
      validateRequestUrl(current, plan.kind, plan.wdsSystemId);
      const response = await fetchImpl(current, { method: "GET", redirect: "manual", signal: controller.signal, headers: { accept: plan.accept, "user-agent": "SolarSim-MainlineA-ComponentCapture/634" } });
      attempt.httpStatus = response.status;
      attempt.contentType = response.headers.get("content-type");
      attempt.finalUrl = current;
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw captureError("redirect location missing", "UNSAFE_REDIRECT");
        const target = new URL(location, current).toString();
        attempt.redirectChain.push({ from: current, to: target, status: response.status });
        try { validateRequestUrl(target, plan.kind, plan.wdsSystemId); }
        catch { throw captureError("redirect leaves allowed request identity", "UNSAFE_REDIRECT"); }
        await response.body?.cancel();
        current = target;
        continue;
      }
      if (response.status !== 200) throw captureError(`HTTP ${response.status}`, "HTTP_STATUS");
      const expected = plan.kind === "readme" ? /^text\/plain(?:;|$)/i : /^text\/tab-separated-values(?:;|$)/i;
      if (!expected.test(attempt.contentType ?? "")) throw captureError("unexpected response content type", "CONTENT_TYPE");
      return readBody(response, plan.maxResponseBytes);
    }
    throw captureError("redirect limit exceeded", "REDIRECT_LIMIT");
  };
  try {
    raw = await Promise.race([request(), deadline]);
    attempt.responseBytes = raw.length;
    attempt.responseCaptured = testOnly ? 0 : 1;
  } catch (error) {
    attempt.errorCategory = classifyCaptureError(error);
    attempt.errorClass = error?.code ?? error?.name ?? "Error";
    attempt.errorMessage = String(error?.message ?? error).slice(0, 500);
    attempt.timeout = attempt.errorCategory === "timeout";
    raw = null;
  } finally {
    clearTimeout(timer);
    controller.abort();
    attempt.endedAt = now();
  }
  return { attempt, raw };
}

export async function executeComponentPlan(plan, options = {}) {
  const testOnly = options.testOnly === true;
  requireValue(!options.fetchImpl || testOnly, "injected transport requires testOnly");
  requireValue(Number.isInteger(plan.maxAttempts) && plan.maxAttempts >= 1 && plan.maxAttempts <= 3, "invalid plan attempt limit");
  requireValue(Number.isInteger(plan.timeoutMs) && plan.timeoutMs >= (testOnly ? 1 : 1000) && plan.timeoutMs <= 60000, "invalid plan timeout");
  requireValue(Number.isInteger(plan.maxResponseBytes) && plan.maxResponseBytes > 0 && plan.maxResponseBytes <= MAX_BYTES, "invalid plan byte limit");
  requireValue(plan.method === "GET", "unsupported plan method");
  validateRequestUrl(plan.requestUrl, plan.kind, plan.wdsSystemId);
  requireValue(plan.requestFingerprint === requestFingerprint(plan.requestUrl, plan.accept), "plan fingerprint differs");
  const attempts = [];
  for (let number = 1; number <= plan.maxAttempts; number += 1) {
    const result = await oneAttempt(plan, number, options.fetchImpl ?? globalThis.fetch, testOnly);
    attempts.push(result.attempt);
    if (result.raw) return { responseCaptured: testOnly ? 0 : 1, attempts, raw: result.raw, evidenceClass: testOnly ? "fixture-replay" : "https-capture" };
    if (number < plan.maxAttempts && !testOnly) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return { responseCaptured: 0, attempts, raw: null, evidenceClass: testOnly ? "fixture-replay" : "https-capture" };
}

function assertRunId(runId) { requireValue(RUN_ID.test(runId ?? ""), "run-id must be 3..64 lowercase letters, digits or hyphens"); }

function writeArtifact(root, runId, plan, result) {
  requireValue(result.evidenceClass === "https-capture" && result.responseCaptured === 1 && Buffer.isBuffer(result.raw), "only real HTTPS capture may be written");
  const digest = sha256(result.raw);
  const extension = plan.kind === "readme" ? "txt" : "tsv";
  const relative = `${ARTIFACT_ROOT}/${runId}/${digest}.${extension}`;
  const target = path.join(root, relative);
  try { fs.writeFileSync(target, result.raw, { flag: "wx" }); }
  catch (error) {
    if (error.code !== "EEXIST") throw error;
    requireValue(fs.readFileSync(target).equals(result.raw), "existing content-addressed artifact differs");
  }
  requireValue(sha256(fs.readFileSync(target)) === digest, "artifact write verification failed");
  const success = result.attempts.find((row) => row.responseCaptured === 1);
  const artifact = { path: relative, sha256: digest, bytes: result.raw.length, contentType: success.contentType, finalUrl: success.finalUrl };
  success.rawArtifact = artifact;
  return artifact;
}

async function collectRecord(root, runId, input) {
  const result = await executeComponentPlan(input.plan);
  const artifact = result.responseCaptured === 1 ? writeArtifact(root, runId, input.plan, result) : null;
  return { ...input, evidenceClass: result.evidenceClass, attempts: result.attempts, responseCaptured: result.responseCaptured, artifact };
}

export async function collectStellarComponents({ root = process.cwd(), runId, timeoutMs = 15000, maxAttempts = 2 } = {}) {
  assertRunId(runId);
  const ledgerPath = `docs/release/v607/mainline-a-stellar-components-v634-${runId}.json`;
  requireValue(!fs.existsSync(path.join(root, ledgerPath)), "run ledger already exists");
  const sourceRaw = fs.readFileSync(path.join(root, SOURCE_PACK_PATH));
  const sourcePack = JSON.parse(sourceRaw.toString("utf8"));
  const plans = buildComponentPlans(sourcePack, { timeoutMs, maxAttempts });
  fs.mkdirSync(path.join(root, ARTIFACT_ROOT), { recursive: true });
  fs.mkdirSync(path.join(root, ARTIFACT_ROOT, runId));
  const startedAt = now();
  const readme = await collectRecord(root, runId, plans.readme);
  const records = [];
  for (const plan of plans.records) records.push(await collectRecord(root, runId, plan));
  const ledger = {
    schema: COMPONENT_CAPTURE_SCHEMA, runId, startedAt, endedAt: now(),
    sourceCandidatePack: { path: SOURCE_PACK_PATH, sha256: sha256(sourceRaw) },
    collector: { transport: "https", fixture: false, version: 634 },
    counts: { total: records.length, responseCaptured: records.filter((row) => row.responseCaptured === 1).length, failed: records.filter((row) => row.responseCaptured === 0).length, readmeCaptured: readme.responseCaptured },
    boundary: CAPTURE_BOUNDARY, readme, records,
    semanticStatus: "unparsed-candidate-only", rightsStatus: "pending", componentIdentityStatus: "unresolved",
  };
  requireValue(sha256(fs.readFileSync(path.join(root, SOURCE_PACK_PATH))) === ledger.sourceCandidatePack.sha256, "source pack changed during collection");
  ledger.ledgerDigest = canonicalSha256(ledger);
  fs.writeFileSync(path.join(root, ledgerPath), `${JSON.stringify(ledger, null, 2)}\n`, { flag: "wx" });
  return { ledgerPath, ...replayStellarComponents({ root, ledgerPath }) };
}

function readConfinedArtifact(root, runId, artifact) {
  requireValue(artifact && SHA.test(artifact.sha256), "artifact digest invalid");
  const relative = artifact.path?.replaceAll("\\", "/");
  requireValue(relative?.startsWith(`${ARTIFACT_ROOT}/${runId}/`) && !relative.split("/").includes(".."), "artifact path escapes run");
  const base = fs.realpathSync(path.join(root, ARTIFACT_ROOT, runId));
  const resolved = fs.realpathSync(path.join(root, relative));
  const within = path.relative(base, resolved);
  requireValue(within && !within.startsWith("..") && !path.isAbsolute(within), "artifact real path escapes run");
  const raw = fs.readFileSync(resolved);
  requireValue(raw.length === artifact.bytes && raw.length > 0 && raw.length <= MAX_BYTES, "artifact bytes differ");
  requireValue(sha256(raw) === artifact.sha256, "artifact SHA-256 differs");
  requireValue(path.basename(relative).startsWith(`${artifact.sha256}.`), "artifact filename differs from digest");
  return raw;
}

function verifyRecord(root, runId, record, expected) {
  for (const key of Object.keys(expected)) requireValue(canonicalSha256(record[key]) === canonicalSha256(expected[key]), `${record.id}: ${key} binding differs`);
  requireValue(record.evidenceClass === "https-capture", `${record.id}: fixture evidence rejected`);
  requireValue(record.responseCaptured === 0 || record.responseCaptured === 1, `${record.id}: capture flag invalid`);
  requireValue(Array.isArray(record.attempts) && record.attempts.length > 0 && record.attempts.length <= record.plan.maxAttempts, `${record.id}: attempt count invalid`);
  let successes = 0;
  for (const [index, attempt] of record.attempts.entries()) {
    requireValue(attempt.attempt === index + 1 && attempt.retryCount === index, `${record.id}: attempt sequence invalid`);
    requireValue(Number.isFinite(Date.parse(attempt.startedAt)) && Number.isFinite(Date.parse(attempt.endedAt)) && Date.parse(attempt.endedAt) >= Date.parse(attempt.startedAt), `${record.id}: attempt timestamps invalid`);
    requireValue(attempt.timeoutMs === record.plan.timeoutMs && attempt.timeout === (attempt.errorCategory === "timeout"), `${record.id}: timeout metadata invalid`);
    requireValue(attempt.requestFingerprint === record.plan.requestFingerprint && attempt.requestUrl === record.plan.requestUrl && attempt.transport === "https", `${record.id}: request fingerprint or transport invalid`);
    requireValue(Array.isArray(attempt.redirectChain) && attempt.redirectChain.length <= 5, `${record.id}: redirects invalid`);
    let previous = record.plan.requestUrl;
    for (const redirect of attempt.redirectChain) {
      requireValue(redirect.from === previous && redirect.status >= 300 && redirect.status < 400, `${record.id}: redirect chain discontinuity`);
      try { validateRequestUrl(redirect.to, record.plan.kind, record.plan.wdsSystemId); }
      catch { requireValue(attempt.errorCategory === "redirect" && attempt.responseCaptured === 0, `${record.id}: unsafe redirect captured`); }
      previous = redirect.to;
    }
    if (attempt.responseCaptured === 1) {
      successes += 1;
      requireValue(index === record.attempts.length - 1 && attempt.httpStatus === 200 && attempt.errorCategory === null && attempt.errorClass === null && attempt.errorMessage === null, `${record.id}: successful attempt is inconsistent`);
      validateRequestUrl(attempt.finalUrl, record.plan.kind, record.plan.wdsSystemId);
      const expectedType = record.plan.kind === "readme" ? /^text\/plain(?:;|$)/i : /^text\/tab-separated-values(?:;|$)/i;
      requireValue(expectedType.test(attempt.contentType ?? ""), `${record.id}: successful content type invalid`);
      requireValue(canonicalSha256(attempt.rawArtifact) === canonicalSha256(record.artifact), `${record.id}: artifact link differs`);
      requireValue(attempt.responseBytes === record.artifact.bytes && attempt.finalUrl === record.artifact.finalUrl && attempt.contentType === record.artifact.contentType, `${record.id}: artifact response metadata differs`);
    } else {
      requireValue(attempt.responseCaptured === 0 && attempt.rawArtifact === null && attempt.responseBytes === null && typeof attempt.errorCategory === "string", `${record.id}: failed attempt claims bytes or artifact`);
    }
  }
  requireValue(successes === record.responseCaptured, `${record.id}: capture count inconsistent`);
  if (record.responseCaptured === 0) requireValue(record.artifact === null, `${record.id}: failed record contains artifact`);
  else readConfinedArtifact(root, runId, record.artifact);
  return { id: record.id, responseCaptured: record.responseCaptured, attempts: record.attempts.length, sha256: record.artifact?.sha256 ?? null, bytes: record.artifact?.bytes ?? null, artifactVerified: record.responseCaptured === 1 };
}

export function replayStellarComponents({ root = process.cwd(), ledgerPath } = {}) {
  const normalized = String(ledgerPath ?? "").replaceAll("\\", "/");
  requireValue(/^docs\/release\/v607\/mainline-a-stellar-components-v634-[a-z0-9-]+\.json$/.test(normalized), "unexpected ledger path");
  const ledger = JSON.parse(fs.readFileSync(path.join(root, normalized), "utf8"));
  return verifyCaptureLedger({ root, ledger, ledgerPath: normalized });
}

export function verifyCaptureLedger({ root = process.cwd(), ledger, ledgerPath } = {}) {
  requireValue(ledger.schema === COMPONENT_CAPTURE_SCHEMA, "ledger schema differs");
  assertRunId(ledger.runId);
  requireValue(ledgerPath === `docs/release/v607/mainline-a-stellar-components-v634-${ledger.runId}.json`, "ledger run-id mismatch");
  requireValue(Number.isFinite(Date.parse(ledger.startedAt)) && Number.isFinite(Date.parse(ledger.endedAt)) && Date.parse(ledger.endedAt) >= Date.parse(ledger.startedAt), "ledger timestamps invalid");
  const { ledgerDigest, ...content } = ledger;
  requireValue(SHA.test(ledgerDigest) && canonicalSha256(content) === ledgerDigest, "ledger digest mismatch");
  requireValue(canonicalSha256(ledger.boundary) === canonicalSha256(CAPTURE_BOUNDARY), "admission boundary changed");
  requireValue(ledger.collector?.transport === "https" && ledger.collector?.fixture === false && ledger.collector?.version === 634, "fixture collector rejected");
  requireValue(ledger.semanticStatus === "unparsed-candidate-only" && ledger.rightsStatus === "pending" && ledger.componentIdentityStatus === "unresolved", "semantic promotion rejected");
  requireValue(ledger.sourceCandidatePack?.path === SOURCE_PACK_PATH, "source pack path differs");
  const sourceRaw = fs.readFileSync(path.join(root, SOURCE_PACK_PATH));
  requireValue(sha256(sourceRaw) === ledger.sourceCandidatePack.sha256, "source pack digest differs");
  const plans = buildComponentPlans(JSON.parse(sourceRaw.toString("utf8")), { timeoutMs: ledger.readme?.plan?.timeoutMs, maxAttempts: ledger.readme?.plan?.maxAttempts });
  requireValue(Array.isArray(ledger.records) && ledger.records.length === 4, "record count differs");
  const readme = verifyRecord(root, ledger.runId, ledger.readme, plans.readme);
  const records = plans.records.map((expected, index) => verifyRecord(root, ledger.runId, ledger.records[index], expected));
  for (const record of [ledger.readme, ...ledger.records]) {
    let previousEnd = Date.parse(ledger.startedAt);
    for (const attempt of record.attempts) {
      requireValue(Date.parse(attempt.startedAt) >= previousEnd && Date.parse(attempt.endedAt) <= Date.parse(ledger.endedAt), `${record.id}: attempt lies outside capture interval`);
      previousEnd = Date.parse(attempt.endedAt);
    }
  }
  const counts = { total: 4, responseCaptured: records.filter((row) => row.responseCaptured === 1).length, failed: records.filter((row) => row.responseCaptured === 0).length, readmeCaptured: readme.responseCaptured };
  requireValue(canonicalSha256(counts) === canonicalSha256(ledger.counts), "summary counts differ");
  return { schema: "mainline-a-stellar-component-replay-v634", status: "verified-capture-only", ledgerDigest, sourceCandidatePack: ledger.sourceCandidatePack, counts, readme, records, boundary: CAPTURE_BOUNDARY, semanticParsed: false, componentIdentityStatus: "unresolved", rightsStatus: "pending" };
}

export async function run(args = process.argv.slice(2)) {
  const value = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
  const allowed = new Set(["--run-id", "--timeout-ms", "--max-attempts", "--replay", "--ledger"]);
  for (const arg of args.filter((part) => part.startsWith("--"))) requireValue(allowed.has(arg), `unknown option ${arg}`);
  if (args.includes("--replay")) return replayStellarComponents({ ledgerPath: value("--ledger") });
  return collectStellarComponents({ runId: value("--run-id"), timeoutMs: value("--timeout-ms") ? Number(value("--timeout-ms")) : 15000, maxAttempts: value("--max-attempts") ? Number(value("--max-attempts")) : 2 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
