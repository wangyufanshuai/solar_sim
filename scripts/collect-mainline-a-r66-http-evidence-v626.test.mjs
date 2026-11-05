import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { collectHttpEvidence, extractScripts, resolveScriptRequest, sha256 } from "./collect-mainline-a-r66-http-evidence-v626.mjs";

function response(url, status, body, { redirected = false } = {}) {
  const bytes = Buffer.from(body);
  return { status, url, redirected, async arrayBuffer() { return bytes; } };
}

function fixtureFetch({ origin, html, assets = {}, health = "{\"status\":\"ok\"}" } = {}) {
  return async (url) => {
    if (url === `${origin}/`) return response(url, 200, html);
    if (url === `${origin}/api/health`) return response(url, 200, health);
    if (Object.hasOwn(assets, url)) return assets[url];
    return response(url, 404, "missing");
  };
}

async function fixture({ scriptPath = "/_next/static/chunks/app.js", script = "const exact = true;", build = {}, htmlOverride, fetchOverride } = {}) {
  const temp = await mkdtemp(path.join(os.tmpdir(), "mainline-a-r66-http-"));
  const file = path.join(temp, scriptPath.slice("/_next/static/".length));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, script);
  const origin = "http://127.0.0.1:3999";
  const html = htmlOverride ?? `<script src="${scriptPath}"></script>`;
  const buildReport = { status: "passed", sourceStable: true, exitCode: 0, buildId: "fixture-build", runtimeBuildId: "fixture-runtime", branch: "fixture-branch", head: "fixture-head", ...build };
  const fetchImpl = fetchOverride ?? fixtureFetch({ origin, html, assets: { [`${origin}${scriptPath}`]: response(`${origin}${scriptPath}`, 200, script) } });
  return { temp, origin, html, script, scriptPath, buildReport, fetchImpl, staticRoot: temp };
}

test("passes only when script bytes equal the selected build bytes", async () => {
  const f = await fixture();
  try {
    const receipt = await collectHttpEvidence({ origin: f.origin, build: f.buildReport, staticRoot: f.staticRoot, fetchImpl: f.fetchImpl });
    assert.equal(receipt.status, "passed");
    assert.equal(receipt.allScriptAssetsOk, true);
    assert.equal(receipt.scriptAssets[0].sha256, sha256(Buffer.from(f.script)));
    assert.deepEqual(extractScripts(f.html), [f.scriptPath]);
  } finally { await rm(f.temp, { recursive: true, force: true }); }
});

test("rejects changed JavaScript even when the server returns 200", async () => {
  const f = await fixture({ script: "const selected = true;" });
  try {
    const changedFetch = fixtureFetch({ origin: f.origin, html: f.html, assets: { [`${f.origin}${f.scriptPath}`]: response(`${f.origin}${f.scriptPath}`, 200, "const changed = true;") } });
    const receipt = await collectHttpEvidence({ origin: f.origin, build: f.buildReport, staticRoot: f.staticRoot, fetchImpl: changedFetch });
    assert.equal(receipt.status, "blocked");
    assert.equal(receipt.scriptAssets[0].matchesBuild, false);
    assert.match(receipt.errors.join(" "), /script-bytes-do-not-match-selected-build/);
  } finally { await rm(f.temp, { recursive: true, force: true }); }
});

test("rejects redirect and off-origin script responses", async () => {
  const f = await fixture({ htmlOverride: '<script src="/_next/static/chunks/app.js"></script><script src="https://cdn.example.invalid/x.js"></script>' });
  try {
    const fetchImpl = fixtureFetch({ origin: f.origin, html: f.html, assets: { [`${f.origin}${f.scriptPath}`]: response("https://evil.example.invalid/x.js", 200, f.script, { redirected: true }) } });
    const receipt = await collectHttpEvidence({ origin: f.origin, build: f.buildReport, staticRoot: f.staticRoot, fetchImpl });
    assert.equal(receipt.status, "blocked");
    assert.equal(receipt.scriptAssets[0].matchesBuild, false);
    assert.equal(receipt.scriptAssets[1].error, "off-origin-script");
    assert.match(receipt.errors.join(" "), /redirect-or-off-origin-final-url/);
  } finally { await rm(f.temp, { recursive: true, force: true }); }
});

test("rejects traversal and missing chunks instead of reading outside static root", async () => {
  const f = await fixture({ htmlOverride: '<script src="/_next/static/../secret.js"></script><script src="/_next/static/chunks/missing.js"></script>' });
  try {
    const fetchImpl = fixtureFetch({ origin: f.origin, html: f.html });
    const receipt = await collectHttpEvidence({ origin: f.origin, build: f.buildReport, staticRoot: f.staticRoot, fetchImpl });
    assert.equal(receipt.status, "blocked");
    assert.equal(receipt.scriptAssets[0].error, "unsafe-static-path");
    assert.equal(receipt.scriptAssets[1].error, "missing-build-artifact");
  } finally { await rm(f.temp, { recursive: true, force: true }); }
});

test("failed or unstable build reports fail closed", async () => {
  const f = await fixture({ build: { status: "failed", sourceStable: false, exitCode: 1 } });
  try {
    const receipt = await collectHttpEvidence({ origin: f.origin, build: f.buildReport, staticRoot: f.staticRoot, fetchImpl: f.fetchImpl });
    assert.equal(receipt.status, "blocked");
    assert.equal(receipt.buildReportValid, false);
    assert.equal(receipt.scriptAssets[0].matchesBuild, false);
    assert.match(receipt.errors.join(" "), /build-report-not-passed-or-source-unstable/);
  } finally { await rm(f.temp, { recursive: true, force: true }); }
});

test("request resolver refuses encoded path traversal and accepts same-origin static paths", () => {
  const origin = "http://127.0.0.1:3999";
  assert.equal(resolveScriptRequest("/_next/static/chunks/app.js", origin).ok, true);
  assert.equal(resolveScriptRequest("/_next/static/%2e%2e/secret.js", origin).ok, false);
  assert.equal(resolveScriptRequest("https://cdn.example.invalid/app.js", origin).error, "off-origin-script");
});
