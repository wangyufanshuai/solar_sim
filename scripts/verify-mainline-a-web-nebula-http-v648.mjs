import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureBuildInputs } from "./build-mainline-a-preserved.mjs";
import { inspectWebAssetHttpV647, loopbackOriginV647 } from "./verify-mainline-a-web-asset-http-v647.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCHEMA = "mainline-a-web-nebula-http-v648";
const CREDITS = "public/textures/mainline-a/CREDITS.md";
const SHA256 = /^[a-f0-9]{64}$/;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const jsonBytes = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");

function fail(code) { throw new Error(`web-nebula-http-v648:${code}`); }
function validReceipt(input, origin) {
  const normalized = loopbackOriginV647(origin);
  const { rights, http, build } = input;
  if (rights?.schema !== "mainline-a-web-nebula-rights-verification-v648"
    || rights.status !== "passed-local-candidate-rights-pending"
    || rights.evidenceClass !== "local-static-byte-verification"
    || !SHA256.test(rights.sourceSha256 ?? "")
    || !SHA256.test(rights.canonicalManifestDigest ?? "")
    || rights.counts?.nebulae !== 12 || rights.counts?.previewAvailable !== 12
    || rights.counts?.currentRuntimeLicensed !== 0 || rights.counts?.humanRightsSigned !== 0
    || rights.counts?.releaseAdmitted !== 0 || rights.creditsEntries !== 12
    || rights.boundary?.candidateOnly !== true || rights.boundary?.hold !== true
    || rights.boundary?.notAdmitted !== true || rights.boundary?.scientificPayloadWriteback !== false
    || rights.boundary?.publicWebRelease !== "blocked"
    || rights.claims?.copyrightApproval !== false || rights.claims?.releaseApproved !== false
    || !Array.isArray(rights.rows) || rights.rows.length !== 12) fail("rights-receipt-invalid");
  if (build?.status !== "passed" || build.sourceStable !== true || build.exitCode !== 0
    || build.round !== 66 || build.profile !== "vercel-lite"
    || build.inputBefore?.sha256 !== rights.sourceSha256
    || build.inputAfterSha256 !== rights.sourceSha256
    || build.runtimeBuildId !== `mainline-a-${rights.sourceSha256.slice(0, 16)}`
    || !build.buildId || build.branch !== "codex/solar-sim-mainline-a") fail("build-binding-invalid");
  if (http?.schema !== "mainline-a-http-evidence-v626" || http.status !== "passed"
    || http.url !== normalized || http.buildId !== build.buildId
    || http.runtimeBuildId !== build.runtimeBuildId || http.branch !== build.branch
    || http.head !== build.head || http.pageStatus !== 200 || http.healthStatus !== 200
    || http.allScriptAssetsOk !== true || !Array.isArray(http.scriptAssets)
    || http.scriptAssets.length < 1 || http.scriptAssets.some((row) => row.matchesBuild !== true)
    || http.scientificPayloadWriteback !== false) fail("page-script-http-binding-invalid");
  const ids = new Set();
  const paths = new Set();
  const rows = rights.rows.map((row) => {
    if (!row?.id || ids.has(row.id) || paths.has(row.localPath)
      || row.issues?.length !== 0 || row.localByteMatch !== true
      || row.local?.status !== "matched" || row.local?.sha256 !== row.expectedSha256
      || row.local?.bytes !== row.expectedBytes || row.local?.jpegEnvelope !== true
      || row.humanRightsSignoff !== "pending" || row.releaseAdmission !== "candidate-only"
      || row.scientificPayloadWriteback !== false
      || !/^public\/textures\/mainline-a\/[a-z0-9-]+\.jpg$/.test(row.localPath ?? "")
      || !SHA256.test(row.expectedSha256 ?? "") || !SHA256.test(row.canonicalRowHash ?? "")
      || !SHA256.test(row.sourceHash ?? "")
      || !Number.isSafeInteger(row.expectedBytes) || row.expectedBytes < 1
      || row.expectedBytes > 8 * 1024 * 1024) fail(`image-row-invalid:${row?.id ?? "unknown"}`);
    ids.add(row.id);
    paths.add(row.localPath);
    return Object.freeze({
      id: row.id, path: row.localPath, bytes: row.expectedBytes,
      sha256: row.expectedSha256, canonicalRowHash: row.canonicalRowHash,
      sourceHash: row.sourceHash, expectedContentType: "image/jpeg",
    });
  });
  return Object.freeze({ origin: normalized, sourceSha256: rights.sourceSha256,
    buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
    canonicalManifestDigest: rights.canonicalManifestDigest, rows: Object.freeze(rows) });
}

export { validReceipt as validateWebNebulaHttpInputsV648 };

async function boundedBody(response, limit) {
  if (!response.body?.getReader) fail("response-body-unavailable");
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) fail("response-body-over-limit");
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, length);
}

async function inspectCredits(origin, fetchImpl, timeoutMs) {
  const local = await readFile(path.join(ROOT, CREDITS));
  if (local.length < 1 || local.length > 1024 * 1024
    || !local.toString("utf8").includes("individual human rights signoff is pending for all twelve")) {
    fail("local-credits-disclosure-invalid");
  }
  const url = `${origin}/textures/mainline-a/CREDITS.md`;
  const started = performance.now();
  try {
    const response = await fetchImpl(url, { method: "GET", redirect: "manual",
      cache: "no-store", headers: { Accept: "text/markdown" },
      signal: AbortSignal.timeout(timeoutMs) });
    const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? null;
    if (response.status !== 200 || response.redirected || response.url !== url
      || !["text/markdown", "text/plain"].includes(type)) fail("credits-response-invalid");
    const length = response.headers.get("content-length");
    if (length !== null && Number(length) !== local.length) fail("credits-content-length-invalid");
    const bytes = await boundedBody(response, 1024 * 1024);
    if (bytes.length !== local.length || sha(bytes) !== sha(local)) fail("credits-bytes-mismatch");
    return Object.freeze({ status: "matched", requestedUrl: url, finalUrl: response.url,
      httpStatus: response.status, contentType: type, bytes: bytes.length, sha256: sha(bytes),
      elapsedMs: Number((performance.now() - started).toFixed(3)), humanRightsSignoff: "pending" });
  } catch (error) {
    return Object.freeze({ status: "failed", requestedUrl: url, finalUrl: null,
      httpStatus: null, contentType: null, bytes: 0, sha256: null,
      elapsedMs: Number((performance.now() - started).toFixed(3)),
      errorClass: error?.name === "TimeoutError" ? "timeout" : String(error?.message ?? error),
      humanRightsSignoff: "pending" });
  }
}

export async function auditWebNebulaHttpV648({
  rights, http, build, origin, fetchImpl = fetch, localReader,
  timeoutMs = 15_000, source,
}) {
  const input = validReceipt({ rights, http, build }, origin);
  const sourceNow = source ?? await captureBuildInputs();
  if (sourceNow.sha256 !== input.sourceSha256) fail("current-source-differs-from-build");
  const rows = [];
  for (const row of input.rows) rows.push(await inspectWebAssetHttpV647(row, input.origin,
    { fetchImpl, localReader, timeoutMs }));
  const credits = await inspectCredits(input.origin, fetchImpl, timeoutMs);
  const matched = rows.filter((row) => row.status === "matched-local-preview").length;
  const errors = rows.filter((row) => row.status !== "matched-local-preview")
    .map((row) => `${row.id}:${row.errorClass}`);
  if (credits.status !== "matched") errors.push(`credits:${credits.errorClass}`);
  return Object.freeze({
    schema: SCHEMA, observedAt: new Date().toISOString(),
    status: matched === 12 && credits.status === "matched"
      ? "passed-local-http-candidate-release-blocked" : "failed-local-http-candidate-release-blocked",
    evidenceClass: fetchImpl === fetch && localReader === undefined && source === undefined
      ? "local-production-http" : "injected-test-input",
    origin: input.origin, sourceSha256: input.sourceSha256,
    buildId: input.buildId, runtimeBuildId: input.runtimeBuildId,
    canonicalManifestDigest: input.canonicalManifestDigest,
    inputSha256: Object.freeze({ rights: sha(jsonBytes(rights)),
      http: sha(jsonBytes(http)), build: sha(jsonBytes(build)) }),
    assets: Object.freeze(rows), credits,
    counts: Object.freeze({ total: 12, matched, failed: 12 - matched,
      humanRightsSigned: 0, releaseAdmitted: 0 }),
    errors: Object.freeze(errors),
    boundary: Object.freeze({ candidateOnly: true, hold: true, notAdmitted: true,
      scientificPayloadWriteback: false, publicWebRelease: "blocked" }),
    claims: Object.freeze({ copyrightApproval: false, scientificValidity: false,
      releaseApproved: false, realUserValidation: false, productionPerformance: false }),
  });
}

export function replayWebNebulaHttpV648(saved, fresh) {
  if (saved?.schema !== SCHEMA || saved.status !== "passed-local-http-candidate-release-blocked"
    || saved.evidenceClass !== "local-production-http"
    || fresh?.status !== "passed-local-http-candidate-release-blocked"
    || fresh.evidenceClass !== "local-production-http"
    || saved.sourceSha256 !== fresh.sourceSha256 || saved.buildId !== fresh.buildId
    || saved.runtimeBuildId !== fresh.runtimeBuildId
    || saved.canonicalManifestDigest !== fresh.canonicalManifestDigest
    || JSON.stringify(saved.inputSha256) !== JSON.stringify(fresh.inputSha256)
    || JSON.stringify(saved.assets.map((row) => [
      row.id, row.path, row.requestedUrl, row.expectedBytes, row.expectedSha256,
      row.status, row.httpStatus, row.finalUrl, row.contentType, row.observedBytes,
      row.observedSha256, row.humanRightsSignoff, row.releaseAdmission,
    ])) !== JSON.stringify(fresh.assets.map((row) => [
      row.id, row.path, row.requestedUrl, row.expectedBytes, row.expectedSha256,
      row.status, row.httpStatus, row.finalUrl, row.contentType, row.observedBytes,
      row.observedSha256, row.humanRightsSignoff, row.releaseAdmission,
    ]))
    || saved.credits.sha256 !== fresh.credits.sha256
    || saved.credits.status !== "matched" || saved.counts?.matched !== 12
    || saved.counts?.humanRightsSigned !== 0 || saved.counts?.releaseAdmitted !== 0
    || saved.claims?.releaseApproved !== false || saved.claims?.copyrightApproval !== false
    || saved.boundary?.scientificPayloadWriteback !== false) fail("saved-http-replay-mismatch");
  return Object.freeze({ schema: `${SCHEMA}-replay`,
    status: "verified-local-http-candidate-release-blocked", buildId: fresh.buildId,
    sourceSha256: fresh.sourceSha256, matchedImages: 12,
    humanRightsSigned: 0, publicWebRelease: "blocked", scientificPayloadWriteback: false });
}

function arg(name) {
  const at = process.argv.indexOf(name);
  return at < 0 ? null : process.argv[at + 1] ?? null;
}
function receiptPath(relative) {
  if (!/^docs\/release\/v607\/[a-z0-9-]+\.json$/i.test(relative ?? "")) fail("receipt-path-invalid");
  return path.join(ROOT, relative);
}
async function json(relative) { return JSON.parse(await readFile(receiptPath(relative), "utf8")); }
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rights = await json(arg("--rights"));
  const http = await json(arg("--http"));
  const build = await json(arg("--build"));
  const origin = arg("--origin");
  const report = await auditWebNebulaHttpV648({ rights, http, build, origin });
  const output = arg("--output");
  if (output) await writeFile(receiptPath(output), jsonBytes(report), { flag: "wx" });
  const check = arg("--check");
  if (check) console.log(JSON.stringify(replayWebNebulaHttpV648(await json(check), report), null, 2));
  else console.log(JSON.stringify({ status: report.status, buildId: report.buildId,
    matched: report.counts.matched, credits: report.credits.status, errors: report.errors, output }, null, 2));
  if (report.status !== "passed-local-http-candidate-release-blocked") process.exitCode = 1;
}
