import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  V651_SOURCE_PAGES, artifactPathV651, fingerprintSourcePageRequestV651,
  inspectOfficialSourcePageV651, validateBatchRowsV651,
  validateSourcePageUrlV651,
} from "./mainline-a-nebula-source-page-v651.mjs";
import {
  collectOfficialSourcePageV651, fetchOfficialSourcePageV651,
} from "./collect-mainline-a-nebula-source-pages-v651.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const batch = JSON.parse(await readFile(path.join(root,
  "app/data/mainlineANebulaBatchV628.generated.json"), "utf8"));
const source = V651_SOURCE_PAGES[0];
const candidate = batch.rows.find((row) => row.id === source.id);
const clone = (value) => structuredClone(value);

function unitHtml(changes = {}) {
  const values = { title: source.title, nasaId: source.nasaId,
    credit: candidate.source.credit,
    assetId: source.nasaId, extra: "", ...changes };
  return `<!doctype html><html><head><title>${values.title} - NASA Science</title>`
    + `<meta property="og:image" content="https://assets.science.nasa.gov/`
    + `content/dam/science/photojournal/${values.assetId}.jpg"></head>`
    + `<body><main><h1>${values.title}</h1><p>${values.nasaId}</p>`
    + `<div>Credits: ${values.credit}</div><p>${"Description for parser unit test. ".repeat(50)}`
    + `${values.extra}</p></main></body></html>`;
}

test("the six source pages map to the captured image candidate IDs", () => {
  assert.equal(validateBatchRowsV651(batch).ok, true);
  assert.deepEqual(V651_SOURCE_PAGES.map((entry) => entry.id),
    batch.rows.map((row) => row.id));
});

test("an image candidate with a forged NASA ID fails the batch link", () => {
  const forged = clone(batch);
  forged.rows[0].source.nasaId = "PIA00000";
  const result = validateBatchRowsV651(forged);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:batch-link-invalid`));
});

test("only the pinned official HTTPS page URL is accepted", () => {
  assert.equal(validateSourcePageUrlV651(source.url, source), true);
  assert.equal(validateSourcePageUrlV651(source.url.replace("https:", "http:"), source), false);
  assert.equal(validateSourcePageUrlV651(`${source.url}?fixture=true`, source), false);
  assert.equal(validateSourcePageUrlV651(source.url.replace("science.nasa.gov",
    "science.nasa.gov.evil.example"), source), false);
  assert.equal(validateSourcePageUrlV651(source.url,
    { ...source, nasaId: "PIA00000" }), false);
});

test("a unit HTML structure can exercise the candidate parser without becoming evidence", () => {
  const result = inspectOfficialSourcePageV651(unitHtml(), source,
    candidate.source.credit);
  assert.equal(result.status, "verified-official-source-page-candidate");
  assert.deepEqual(result.issues, []);
  assert.equal(result.rightsSignoff, "pending");
  assert.equal(result.scientificPayloadWriteback, false);
});

test("wrong item title fails even when NASA branding is present", () => {
  const result = inspectOfficialSourcePageV651(unitHtml({ title: "Different Nebula" }),
    source, candidate.source.credit);
  assert.ok(result.issues.includes("official-title-mismatch"));
});

test("wrong PIA ID fails despite an otherwise matching title", () => {
  const result = inspectOfficialSourcePageV651(unitHtml({ nasaId: "PIA00000" }),
    source, candidate.source.credit);
  assert.ok(result.issues.includes("nasa-id-not-visible"));
});

test("missing item credit fails a NASA-like HTML page", () => {
  const result = inspectOfficialSourcePageV651(unitHtml({ credit: "Unknown" }),
    source, candidate.source.credit);
  assert.ok(result.issues.includes("official-credit-mismatch"));
});

test("an unrelated NASA image link cannot stand in for the candidate image", () => {
  const result = inspectOfficialSourcePageV651(unitHtml({ assetId: "PIA00000" }),
    source, candidate.source.credit);
  assert.ok(result.issues.includes("official-image-link-missing"));
});

test("fixture markers fail candidate inspection", () => {
  const result = inspectOfficialSourcePageV651(unitHtml({ extra: "test fixture" }),
    source, candidate.source.credit);
  assert.ok(result.issues.includes("fixture-marker-present"));
});

test("artifact paths bind both PIA ID and a SHA-256 digest", () => {
  const digest = "a".repeat(64);
  assert.ok(artifactPathV651(source, digest).includes(`${source.nasaId.toLowerCase()}-${digest}`));
  assert.throws(() => artifactPathV651(source, "not-a-digest"));
  assert.throws(() => artifactPathV651({ ...source, nasaId: "PIA00000" }, digest));
});

test("a redirect outside the exact official URL is rejected", async () => {
  const fetchImpl = async () => new Response(null, { status: 302,
    headers: { location: "https://example.com/fixture" } });
  await assert.rejects(fetchOfficialSourcePageV651(source, { fetchImpl }),
    /nebula-source-page-v651:redirect-blocked/);
});

test("non-HTML 200 response cannot be captured as a source page", async () => {
  const fetchImpl = async () => new Response(Buffer.from("not html"), {
    status: 200, headers: { "content-type": "image/jpeg" },
  });
  await assert.rejects(fetchOfficialSourcePageV651(source, { fetchImpl }),
    /nebula-source-page-v651:content-type/);
});

test("a timeout leaves responseCaptured at zero and records its attempt", async () => {
  const error = Object.assign(new Error("aborted"), { name: "AbortError" });
  const capture = await collectOfficialSourcePageV651(source, candidate, {
    fetchImpl: async () => { throw error; }, retries: 0,
    collectionId: "unit-timeout", timeoutMs: 1_000,
  });
  assert.equal(capture.responseCaptured, 0);
  assert.equal(capture.captured, null);
  assert.equal(capture.attempts[0].timeout, true);
  assert.equal(capture.attempts[0].errorClass, "timeout");
  assert.equal(capture.attempts[0].requestFingerprint,
    fingerprintSourcePageRequestV651(source));
});

test("a captured fake HTML response stays parser-blocked", async () => {
  const body = unitHtml({ extra: "mock nasa page" });
  const capture = await collectOfficialSourcePageV651(source, candidate, {
    fetchImpl: async () => new Response(body, {
      status: 200, headers: { "content-type": "text/html; charset=UTF-8" },
    }), retries: 0, collectionId: "unit-fake-page",
  });
  assert.equal(capture.responseCaptured, 1);
  assert.equal(capture.attempts[0].httpStatus, 200);
  assert.equal(capture.inspection.status, "blocked");
  assert.ok(capture.inspection.issues.includes("fixture-marker-present"));
});
