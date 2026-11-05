import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebNebulaRightsV648,
} from "./verify-mainline-a-web-nebula-rights-v648.mjs";
import {
  auditWebNebulaHttpV648, replayWebNebulaHttpV648,
  validateWebNebulaHttpInputsV648,
} from "./verify-mainline-a-web-nebula-http-v648.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "http://127.0.0.1:3091";
const rights = await auditWebNebulaRightsV648();
const historicalBuild = JSON.parse(await readFile(path.join(ROOT,
  "docs/release/v607/mainline-a-r66-build-20261007-v647web02.json"), "utf8"));
const historicalHttp = JSON.parse(await readFile(path.join(ROOT,
  "docs/release/v607/mainline-a-r66-http-20261007-v647web02.json"), "utf8"));
const build = { ...historicalBuild, inputBefore: { sha256: rights.sourceSha256 },
  inputAfterSha256: rights.sourceSha256,
  runtimeBuildId: `mainline-a-${rights.sourceSha256.slice(0, 16)}`,
  buildId: "v648-test-only" };
const http = { ...historicalHttp, url: ORIGIN, buildId: build.buildId,
  runtimeBuildId: build.runtimeBuildId, branch: build.branch, head: build.head };
const inputs = () => ({ rights, http, build, origin: ORIGIN });
const response = (bytes, url, type = "image/jpeg", status = 200) => {
  const result = new Response(bytes, { status,
    headers: { "content-type": type, "content-length": String(bytes.length) } });
  Object.defineProperty(result, "url", { value: url });
  return result;
};
async function fileFetch(url) {
  const route = new URL(url).pathname.slice(1);
  const bytes = await readFile(path.join(ROOT, "public", route));
  return response(bytes, url, route.endsWith(".md") ? "text/markdown" : "image/jpeg");
}

test("current static, build and page-script identity must agree before image requests", () => {
  const validated = validateWebNebulaHttpInputsV648(inputs(), ORIGIN);
  assert.equal(validated.rows.length, 12);
  assert.equal(validated.sourceSha256, rights.sourceSha256);
  assert.equal(validated.buildId, build.buildId);
  const signed = structuredClone(rights);
  signed.rows[0].humanRightsSignoff = "signed";
  assert.throws(() => validateWebNebulaHttpInputsV648({ rights: signed, http, build }, ORIGIN),
    /image-row-invalid/);
  assert.throws(() => validateWebNebulaHttpInputsV648({
    rights, http, build: { ...build, inputBefore: { sha256: "f".repeat(64) } },
  }, ORIGIN), /build-binding-invalid/);
  assert.throws(() => validateWebNebulaHttpInputsV648({
    rights, http: { ...http, allScriptAssetsOk: false }, build,
  }, ORIGIN), /page-script-http-binding-invalid/);
  assert.throws(() => validateWebNebulaHttpInputsV648({ rights, http, build },
    "http://example.org:3091"), /origin-must-be-local-http-root/);
});

test("injected HTTP responses can exercise twelve byte matches without becoming release evidence", async () => {
  const report = await auditWebNebulaHttpV648({
    ...inputs(), fetchImpl: fileFetch, source: { sha256: rights.sourceSha256 },
  });
  assert.equal(report.status, "passed-local-http-candidate-release-blocked");
  assert.equal(report.evidenceClass, "injected-test-input");
  assert.equal(report.counts.matched, 12);
  assert.equal(report.counts.humanRightsSigned, 0);
  assert.equal(report.credits.status, "matched");
  assert.ok(report.assets.every((row) => row.observedSha256 === row.expectedSha256));
  assert.throws(() => replayWebNebulaHttpV648(report, report), /saved-http-replay-mismatch/);
});

test("HTML, redirect, missing image, altered bytes and altered credits do not pass", async () => {
  const firstPath = `/textures/mainline-a/${rights.rows[0].imageId}.jpg`;
  const cases = [
    async (url) => url.endsWith(firstPath)
      ? response(Buffer.from("<html>fake</html>"), url, "text/html") : fileFetch(url),
    async (url) => url.endsWith(firstPath)
      ? response(Buffer.from("redirect"), url, "text/plain", 302) : fileFetch(url),
    async (url) => url.endsWith(firstPath)
      ? response(Buffer.from("missing"), url, "image/jpeg", 404) : fileFetch(url),
    async (url) => url.endsWith(firstPath)
      ? response(Buffer.from("same length is not enough"), url) : fileFetch(url),
    async (url) => url.endsWith("CREDITS.md")
      ? response(Buffer.from("<html>fake</html>"), url, "text/html") : fileFetch(url),
  ];
  for (const fetchImpl of cases) {
    const report = await auditWebNebulaHttpV648({
      ...inputs(), fetchImpl, source: { sha256: rights.sourceSha256 },
    });
    assert.equal(report.status, "failed-local-http-candidate-release-blocked");
    assert.equal(report.evidenceClass, "injected-test-input");
    assert.ok(report.errors.length > 0);
    assert.equal(report.counts.humanRightsSigned, 0);
    assert.equal(report.claims.copyrightApproval, false);
  }
});

test("a stale source identity blocks even otherwise matching image bytes", async () => {
  await assert.rejects(auditWebNebulaHttpV648({
    ...inputs(), fetchImpl: fileFetch, source: { sha256: "f".repeat(64) },
  }), /current-source-differs-from-build/);
});
