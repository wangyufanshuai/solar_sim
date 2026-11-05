import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  extractOfficialJpegUrlV652, fingerprintOfficialJpegRequestV652,
  inspectJpegBytesV652, safeOfficialJpegUrlV652, sha256V652,
  validatePageImageInputsV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";
import {
  collectOfficialJpegV652, fetchOfficialJpegV652,
} from "./collect-mainline-a-nebula-page-image-link-v652.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const [pages, audit, batch] = await Promise.all([
  load("docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json"),
  load("docs/release/v607/mainline-a-r66-nebula-source-page-audit-20261011-v651page01.json"),
  load("app/data/mainlineANebulaBatchV628.generated.json"),
]);
const candidates = validatePageImageInputsV652(pages, audit, batch);
const first = candidates.candidates[0];
const html = await readFile(path.join(root, first.pageArtifact.path), "utf8");
const url = extractOfficialJpegUrlV652(html, first.nasaId);
const fixtureJpeg = Buffer.concat([
  Buffer.from([0xff, 0xd8]), Buffer.alloc(128, 42), Buffer.from([0xff, 0xd9]),
]);

test("captured source pages and six image candidates have an exact ID contract", () => {
  assert.equal(candidates.ok, true);
  assert.equal(candidates.candidates.length, 6);
  assert.deepEqual(candidates.issues, []);
});

test("the raw official HTML supplies exactly one safe PIA JPEG", () => {
  assert.equal(url, "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia13/pia13449/PIA13449.jpg");
  assert.equal(safeOfficialJpegUrlV652(url, first.nasaId), true);
  assert.match(fingerprintOfficialJpegRequestV652(url, first.nasaId), /^[a-f0-9]{64}$/);
});

test("wrong NASA shard, credentials, query and foreign domain fail URL validation", () => {
  assert.equal(safeOfficialJpegUrlV652(url.replace("pia13/", "pia99/"), first.nasaId), false);
  assert.equal(safeOfficialJpegUrlV652(url.replace("https://", "https://x@"), first.nasaId), false);
  assert.equal(safeOfficialJpegUrlV652(`${url}?size=small`, first.nasaId), false);
  assert.equal(safeOfficialJpegUrlV652(url.replace("assets.science.nasa.gov", "nasa.example"), first.nasaId), false);
  assert.equal(safeOfficialJpegUrlV652(url, "PIA13441"), false);
});

test("an injected second canonical JPEG prevents ambiguous page extraction", () => {
  const duplicate = html + url.replace("PIA13449.jpg", "pia13449.jpg");
  assert.equal(extractOfficialJpegUrlV652(duplicate, first.nasaId), null);
  const anotherShard = url.replace("pia13/", "pia99/");
  assert.equal(extractOfficialJpegUrlV652(html + anotherShard, first.nasaId), url);
});

test("candidate source must retain its original raw-image SHA and rights hold", () => {
  const forged = structuredClone(pages);
  forged.rows[0].imageArtifactSha256 = "a".repeat(64);
  assert.equal(validatePageImageInputsV652(forged, audit, batch).ok, false);
  const promoted = structuredClone(batch);
  promoted.rows[0].rights.signoffStatus = "approved";
  assert.equal(validatePageImageInputsV652(pages, audit, promoted).ok, false);
});

test("JPEG inspection checks framing, size and deterministic SHA", () => {
  const checked = inspectJpegBytesV652(fixtureJpeg);
  assert.equal(checked.ok, true);
  assert.equal(checked.sha256, sha256V652(fixtureJpeg));
  assert.equal(inspectJpegBytesV652(fixtureJpeg.subarray(1)).ok, false);
  assert.equal(inspectJpegBytesV652(fixtureJpeg, 100).ok, false);
});

test("fetch records an actual image/jpeg response from the fixed URL", async () => {
  const captured = await fetchOfficialJpegV652(url, first.nasaId, {
    fetchImpl: async (target, options) => {
      assert.equal(target, url);
      assert.equal(options.method, "GET");
      assert.equal(options.redirect, "manual");
      return new Response(fixtureJpeg, { status: 200,
        headers: { "content-type": "image/jpeg" } });
    },
  });
  assert.equal(captured.bytes, fixtureJpeg.length);
  assert.equal(captured.sha256, sha256V652(fixtureJpeg));
});

test("HTML, redirects and failed HTTP do not become raw image responses", async () => {
  await assert.rejects(fetchOfficialJpegV652(url, first.nasaId, {
    fetchImpl: async () => new Response("<html/>", { status: 200,
      headers: { "content-type": "text/html" } }),
  }), /content-type/);
  await assert.rejects(fetchOfficialJpegV652(url, first.nasaId, {
    fetchImpl: async () => new Response(null, { status: 302,
      headers: { location: "https://example.com/fake.jpg" } }),
  }), /redirect-blocked/);
  await assert.rejects(fetchOfficialJpegV652(url, first.nasaId, {
    fetchImpl: async () => new Response("not found", { status: 404 }),
  }), /http-status/);
});

test("invalid JPEG body and declared oversize fail closed", async () => {
  await assert.rejects(fetchOfficialJpegV652(url, first.nasaId, {
    fetchImpl: async () => new Response(Buffer.alloc(140, 0), { status: 200,
      headers: { "content-type": "image/jpeg" } }),
  }), /jpeg-invalid/);
  await assert.rejects(fetchOfficialJpegV652(url, first.nasaId, {
    maxBytes: 100,
    fetchImpl: async () => new Response(fixtureJpeg, { status: 200,
      headers: { "content-type": "image/jpeg",
        "content-length": String(fixtureJpeg.length) } }),
  }), /body-too-large/);
});

test("an HTTP 503 followed by a good fixture records retry and zero-to-one capture", async () => {
  let calls = 0;
  const result = await collectOfficialJpegV652(first, url, {
    retries: 1,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? new Response("busy", { status: 503 })
        : new Response(fixtureJpeg, { status: 200,
          headers: { "content-type": "image/jpeg" } });
    },
  });
  assert.equal(result.responseCaptured, 1);
  assert.deepEqual(result.attempts.map((entry) => entry.responseCaptured), [0, 1]);
  assert.deepEqual(result.attempts.map((entry) => entry.retryCount), [0, 1]);
  assert.equal(result.attempts[0].errorClass, "http-status");
});

test("a nonretryable fake HTML keeps responseCaptured at zero", async () => {
  const result = await collectOfficialJpegV652(first, url, {
    retries: 1,
    fetchImpl: async () => new Response("<html/>", { status: 200,
      headers: { "content-type": "text/html" } }),
  });
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts.length, 1);
  assert.equal(result.attempts[0].errorClass, "content-type");
  assert.equal(result.attempts[0].rawArtifactPath, null);
});
