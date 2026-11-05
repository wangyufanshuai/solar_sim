import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// R66 HTTP evidence binds each fetched script to exact bytes in the selected
// build. A 200 response by itself is never treated as build evidence.
const root = path.resolve(process.cwd());
const stage = process.env.MAINLINE_A_R66_STAGE ?? ".next-mainline-a-r66-20260920-002";
const port = Number(process.env.MAINLINE_A_R66_PORT ?? 3040);
const baseUrl = `http://127.0.0.1:${port}`;
const output = path.resolve(root, process.env.MAINLINE_A_R66_HTTP_OUTPUT ?? "docs/release/v607/mainline-a-r66-http-20260920-002.json");
const checkOnly = process.argv.includes("--check");
const buildReportName = process.env.MAINLINE_A_R66_BUILD_REPORT ?? "docs/release/v607/mainline-a-r66-build-20260920-002.json";
const buildReportPath = path.resolve(root, buildReportName);

export function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

export function isSafeStaticPath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  if (!decoded.startsWith("/_next/static/")) return false;
  if (decoded.includes("\\") || decoded.split("/").some((part) => part === "..")) return false;
  return decoded === pathname && !/[?#]/.test(pathname);
}

export function resolveScriptRequest(source, origin) {
  let url;
  try { url = new URL(source, origin); } catch (error) {
    return { ok: false, source, error: `invalid-url:${error instanceof Error ? error.message : String(error)}` };
  }
  if (url.origin !== new URL(origin).origin) return { ok: false, source, url: url.toString(), error: "off-origin-script" };
  if (!isSafeStaticPath(url.pathname)) return { ok: false, source, url: url.toString(), error: "unsafe-static-path" };
  return { ok: true, source, url: url.toString(), pathname: url.pathname };
}

export function extractScripts(html) {
  const sources = [];
  const pattern = /<script[^>]+src=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) if (match[1]) sources.push(match[1]);
  return [...new Set(sources)];
}

function elapsed(started) { return Number((performance.now() - started).toFixed(3)); }

export async function fetchBytes(url, fetchImpl = fetch) {
  const started = performance.now();
  try {
    const response = await fetchImpl(url, { redirect: "follow" });
    const body = Buffer.from(await response.arrayBuffer());
    return { ok: true, response, body, elapsedMs: elapsed(started), finalUrl: response.url || url, redirected: Boolean(response.redirected) || (response.url && response.url !== url) };
  } catch (error) {
    return { ok: false, response: null, body: Buffer.alloc(0), elapsedMs: elapsed(started), finalUrl: null, redirected: false, error: error instanceof Error ? `${error.name}:${error.message}` : String(error) };
  }
}

async function readBuild() {
  try { return { report: JSON.parse(await readFile(buildReportPath, "utf8")), error: null }; }
  catch (error) { return { report: null, error: `build-report:${error instanceof Error ? error.message : String(error)}` }; }
}

function buildStaticRoot(report) {
  if (typeof report?.distDir === "string") return path.resolve(root, report.distDir, "static");
  const configured = path.resolve(root, stage);
  return path.basename(configured) === ".next" ? path.join(configured, "static") : path.join(configured, ".next", "static");
}

async function expectedAsset(staticRoot, pathname) {
  const relative = pathname.slice("/_next/static/".length);
  const candidate = path.resolve(staticRoot, relative);
  const relativeToRoot = path.relative(staticRoot, candidate);
  if (!relativeToRoot || relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) return { error: "unsafe-build-path" };
  try {
    const body = await readFile(candidate);
    return { path: path.relative(root, candidate), bytes: body.byteLength, sha256: sha256(body) };
  } catch (error) {
    return { path: path.relative(root, candidate), error: error?.code === "ENOENT" ? "missing-build-artifact" : `build-artifact:${error?.code ?? "read-failed"}` };
  }
}

function observedRoute(result, route) { return { route, status: result.response?.status ?? null, bytes: result.body.byteLength, elapsedMs: result.elapsedMs, finalUrl: result.finalUrl, redirected: result.redirected, error: result.error ?? null }; }
function identity(report) { return { buildId: report?.buildId ?? "unknown-build", runtimeBuildId: report?.runtimeBuildId ?? "unknown-runtime-build", branch: report?.branch ?? "unknown-branch", head: report?.head ?? "unknown-head" }; }
function buildValid(report) { return Boolean(report && report.status === "passed" && report.sourceStable === true && report.exitCode === 0); }
function sameOriginPath(result, origin, expectedPath) {
  if (!result.finalUrl) return false;
  try { const final = new URL(result.finalUrl); return final.origin === new URL(origin).origin && final.pathname === expectedPath; }
  catch { return false; }
}

async function inspectSavedReceipt() {
  try {
    const saved = JSON.parse(await readFile(output, "utf8"));
    return { present: true, valid: saved?.schema === "mainline-a-http-evidence-v626", status: saved?.status ?? null, error: null };
  } catch (error) {
    if (error?.code === "ENOENT") return { present: false, valid: false, status: null, error: "saved-receipt-not-present" };
    return { present: true, valid: false, status: null, error: `saved-receipt:${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function collectHttpEvidence({ origin = baseUrl, build = null, fetchImpl = fetch, staticRoot = null, html = null } = {}) {
  const buildReportOkay = buildValid(build);
  const staticDirectory = staticRoot ?? buildStaticRoot(build);
  const page = html === null ? await fetchBytes(`${origin}/`, fetchImpl) : { ok: true, response: { status: 200, url: `${origin}/`, redirected: false }, body: Buffer.from(html), elapsedMs: 0, finalUrl: `${origin}/`, redirected: false };
  const health = await fetchBytes(`${origin}/api/health`, fetchImpl);
  const scriptSources = page.ok ? extractScripts(page.body.toString("utf8")) : [];
  const assets = [];
  const errors = [];
  for (const source of scriptSources) {
    const request = resolveScriptRequest(source, origin);
    if (!request.ok) {
      assets.push({ src: source, status: null, bytes: 0, sha256: null, expectedSha256: null, expectedBytes: null, matchesBuild: false, redirected: false, finalUrl: request.url ?? null, error: request.error, elapsedMs: 0 });
      errors.push(`${source}:${request.error}`);
      continue;
    }
    const expected = await expectedAsset(staticDirectory, request.pathname);
    const fetched = await fetchBytes(request.url, fetchImpl);
    let finalOrigin = null;
    let finalPath = null;
    try { if (fetched.finalUrl) { const final = new URL(fetched.finalUrl); finalOrigin = final.origin; finalPath = final.pathname; } } catch { /* represented below as a mismatch */ }
    const finalSafe = finalOrigin === new URL(origin).origin && finalPath === new URL(request.url).pathname;
    const matchesBuild = Boolean(buildReportOkay && fetched.ok && fetched.response?.status === 200 && !fetched.redirected && finalSafe && !expected.error && expected.sha256 === sha256(fetched.body) && expected.bytes === fetched.body.byteLength);
    const error = !fetched.ok ? `fetch:${fetched.error}` : fetched.redirected || !finalSafe ? "redirect-or-off-origin-final-url" : expected.error ?? (!matchesBuild ? "script-bytes-do-not-match-selected-build" : null);
    if (error) errors.push(`${source}:${error}`);
    assets.push({ src: source, status: fetched.response?.status ?? null, bytes: fetched.body.byteLength, sha256: fetched.ok ? sha256(fetched.body) : null, expectedSha256: expected.sha256 ?? null, expectedBytes: expected.bytes ?? null, expectedPath: expected.path ?? null, matchesBuild, elapsedMs: fetched.elapsedMs, finalUrl: fetched.finalUrl, redirected: fetched.redirected, error });
  }
  if (!buildReportOkay) errors.push(build ? "build-report-not-passed-or-source-unstable" : "build-report-unavailable");
  if (!page.ok || page.response?.status !== 200 || page.redirected || !sameOriginPath(page, origin, "/")) errors.push("page-request-failed-or-redirected");
  if (!health.ok || health.response?.status !== 200 || health.redirected || !sameOriginPath(health, origin, "/api/health")) errors.push("health-request-failed-or-redirected");
  let healthBody = null;
  if (health.ok) { try { healthBody = JSON.parse(health.body.toString("utf8")); } catch { errors.push("health-invalid-json"); } }
  const allScriptAssetsOk = scriptSources.length > 0 && assets.length === scriptSources.length && assets.every((asset) => asset.matchesBuild === true);
  const passed = buildReportOkay && page.response?.status === 200 && health.response?.status === 200 && allScriptAssetsOk && errors.length === 0;
  return {
    schema: "mainline-a-http-evidence-v626", status: passed ? "passed" : "blocked", observedAt: new Date().toISOString(), url: origin, stagePath: stage, ...identity(build), buildReportValid: buildReportOkay,
    pageStatus: page.response?.status ?? null, pageFinalUrl: page.finalUrl, pageRedirected: page.redirected, htmlBytes: page.body.byteLength,
    healthStatus: health.response?.status ?? null, healthFinalUrl: health.finalUrl, healthRedirected: health.redirected, health: healthBody,
    scriptAssets: assets, allScriptAssetsOk, errors, timings: [observedRoute(page, "/"), observedRoute(health, "/api/health")],
    evidenceClass: "local-production-http-build-binding-not-performance", performanceClaim: false, realUserValidation: false, scientificPayloadWriteback: false,
    boundary: { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false }, sourceReport: buildReportName,
  };
}

async function writeImmutable(receipt) {
  try { await writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, { encoding: "utf8", flag: "wx" }); return null; }
  catch (error) { return `receipt-write:${error instanceof Error ? error.message : String(error)}`; }
}

export async function main() {
  const loaded = await readBuild();
  const receipt = await collectHttpEvidence({ build: loaded.report });
  receipt.buildReportError = loaded.error;
  if (loaded.error) receipt.errors.push(loaded.error);
  receipt.savedReceipt = await inspectSavedReceipt();
  if (!checkOnly) {
    const writeError = await writeImmutable(receipt);
    if (writeError) { receipt.errors.push(writeError); receipt.status = "blocked"; }
  }
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.status !== "passed" || (!checkOnly && receipt.errors.length > 0)) process.exitCode = 1;
  return receipt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
