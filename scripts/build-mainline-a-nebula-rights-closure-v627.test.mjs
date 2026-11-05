import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  ROOT,
  BATCH_PATH,
  LEDGER_PATH,
  CLOSURE_SCHEMA,
  ROSTER,
  buildClosure,
  batchRowAssessment,
  ledgerRecordAssessment,
  sourceIdentityIssues,
  artifactIssues,
  rightsEvidenceAssessment,
  verifyReceiptShape,
  scanTokens,
  makeCsv,
  makeJsonl,
  makeMarkdown,
  parseArgs,
  writeClosureOutputs,
} from "./build-mainline-a-nebula-rights-closure-v627.mjs";

const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const sourceBatch = read(BATCH_PATH);
const sourceLedger = read(LEDGER_PATH);

test("build closure reports twelve candidates and keeps rights hold", async () => {
  const built = await buildClosure({ root: ROOT, runId: "test-build" });
  assert.equal(built.receipt.schema, CLOSURE_SCHEMA);
  assert.equal(built.receipt.status, "pending");
  assert.equal(built.receipt.counts.rows, 12);
  assert.equal(built.receipt.counts.responseCaptured, 6);
  assert.equal(built.receipt.counts.responsePending, 6);
  assert.equal(built.receipt.counts.rightsCleared, 0);
  assert.equal(built.receipt.gates.rightsClosure.status, "hold");
  assert.equal(built.receipt.boundary.scientificPayloadWriteback, false);
  assert.equal(built.receipt.boundary.candidateOnly, true);
});

test("source identity rejects non-HTTPS and missing credits", () => {
  const issues = sourceIdentityIssues({ source: { url: "http://example.invalid", licenseUrl: "javascript:bad", credit: "" } }, "fixture");
  assert.deepEqual(issues.map((issue) => issue.code), ["source-url-invalid", "license-url-invalid", "credit-missing", "source-page-evidence-pending"]);
});

test("a source page URL alone never closes external-source evidence", () => {
  const issues = sourceIdentityIssues({ source: { url: "https://images-assets.nasa.gov/image/PIA13112/PIA13112~orig.jpg", licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/", credit: "NASA" } }, "url-only");
  assert.equal(issues.some((issue) => issue.code === "source-page-evidence-pending"), true);
});

test("synthetic and fixture markers are never silently ignored", () => {
  const matches = scanTokens({ payload: { synthetic: true }, source: { fixture: "fixture-cache" } });
  assert.equal(matches.length >= 2, true);
  const row = structuredClone(sourceBatch.rows[0]);
  row.payload = { synthetic: true };
  const assessment = batchRowAssessment(ROOT, row, 0);
  assert.equal(assessment.status, "blocked");
  assert.equal(assessment.issues.some((issue) => issue.code === "synthetic-or-fixture-evidence"), true);
});

test("rights clearance requires human signoff fields and HTTPS evidence", () => {
  const row = structuredClone(sourceBatch.rows[0]);
  row.rights.status = "cleared";
  row.rights.blockers = [];
  let assessment = rightsEvidenceAssessment(row, "cleared-without-signoff");
  assert.equal(assessment.claimedCleared, true);
  assert.equal(assessment.issues.some((issue) => issue.code === "rights-signoff-unverifiable"), true);
  row.rights.signoff = { reviewer: "reviewer", signedAt: "2026-09-20T00:00:00Z", evidenceUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/" };
  assessment = rightsEvidenceAssessment(row, "cleared-with-signoff");
  assert.equal(assessment.issues.some((issue) => issue.code === "rights-signoff-pending"), true);
  assert.equal(assessment.issues.some((issue) => issue.code === "rights-claim-unverified"), true);
  assert.equal(assessment.rightsCleared, false);
});

test("placeholder rights signoff cannot impersonate external evidence", () => {
  const row = structuredClone(sourceBatch.rows[0]);
  row.rights.status = "cleared";
  row.rights.blockers = [];
  row.rights.signoff = { reviewer: "fixture-reviewer", signedAt: "2026-09-20T00:00:00Z", evidenceUrl: "https://example.invalid/fixture-evidence" };
  const assessment = rightsEvidenceAssessment(row, "placeholder-signoff");
  assert.equal(assessment.issues.some((issue) => issue.code === "rights-signoff-placeholder"), true);
});

test("ledger record cannot claim captured payload", () => {
  const record = structuredClone(sourceLedger.records[0]);
  record.responseCaptured = 1;
  record.payload.bytes = 22;
  const assessment = ledgerRecordAssessment(record, 0);
  assert.equal(assessment.status, "blocked");
  assert.equal(assessment.issues.some((issue) => issue.code === "ledger-response-captured"), true);
  assert.equal(assessment.issues.some((issue) => issue.code === "ledger-payload-present"), true);
});

test("captured attempts bind to a recomputed request fingerprint", () => {
  const row = structuredClone(sourceBatch.rows[0]);
  row.network.attempts[0].requestFingerprint = "0".repeat(64);
  const assessment = batchRowAssessment(ROOT, row, 0);
  assert.equal(assessment.status, "blocked");
  assert.equal(assessment.issues.some((issue) => issue.code === "request-binding-mismatch"), true);
});

test("explicit row writeback cannot override the inherited candidate boundary", () => {
  const row = structuredClone(sourceBatch.rows[0]);
  row.scientificPayloadWriteback = true;
  const assessment = batchRowAssessment(ROOT, row, 0);
  assert.equal(assessment.status, "blocked");
  assert.equal(assessment.issues.some((issue) => issue.code === "boundary-scientificPayloadWriteback-invalid"), true);
});

test("artifact path traversal and byte mismatch fail closed", () => {
  const row = structuredClone(sourceBatch.rows[0]);
  row.network.artifact.path = "docs/release/v607/nebula-image-artifacts/../../package.json";
  assert.equal(artifactIssues(ROOT, row, "traversal").some((issue) => issue.code === "artifact-path-outside-root"), true);
  const original = structuredClone(sourceBatch.rows[0]);
  original.network.artifact.bytes += 1;
  assert.equal(artifactIssues(ROOT, original, "bytes").some((issue) => issue.code === "artifact-bytes-mismatch"), true);
});

test("receipt shape remains blocked by open boundary or wrong roster", async () => {
  const built = await buildClosure({ root: ROOT, runId: "shape-test" });
  const malformed = structuredClone(built.receipt);
  malformed.rows[0].id = "fixture-nebula";
  malformed.boundary.scientificPayloadWriteback = true;
  const issues = verifyReceiptShape(malformed);
  assert.equal(issues.some((issue) => issue.code === "receipt-row-id-invalid"), true);
  assert.equal(issues.some((issue) => issue.code === "boundary-scientificPayloadWriteback-invalid"), true);
});

test("sidecar projections are deterministic and include each roster row", async () => {
  const built = await buildClosure({ root: ROOT, runId: "sidecar-test" });
  const jsonl = makeJsonl(built.receipt.rows);
  const csv = makeCsv(built.receipt.rows);
  const markdown = makeMarkdown(built.receipt);
  assert.equal(jsonl.trim().split("\n").length, ROSTER.length);
  assert.equal(csv.trim().split("\n").length, ROSTER.length + 1);
  assert.equal(markdown.includes("rights-signoff-pending"), true);
  for (const id of ROSTER) assert.equal(jsonl.includes(id), true);
});

test("output path safety refuses parent escape and preserves existing receipt", async () => {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), "nebula-v627-"));
  try {
    const built = await buildClosure({ root: ROOT, runId: "path-test" });
    await assert.rejects(() => writeClosureOutputs({ root: temp, output: "../escape.json", receipt: built.receipt }), /outside next-web release area/);
    const out = "docs/release/v607/test-nebula-v627.json";
    await writeClosureOutputs({ root: temp, output: out, jsonl: "docs/release/v607/test-nebula-v627.jsonl", csv: "docs/release/v607/test-nebula-v627.csv", markdown: "docs/release/v607/test-nebula-v627.md", receipt: built.receipt });
    await assert.rejects(() => writeClosureOutputs({ root: temp, output: out, jsonl: "docs/release/v607/test-nebula-v627.jsonl", csv: "docs/release/v607/test-nebula-v627.csv", markdown: "docs/release/v607/test-nebula-v627.md", receipt: built.receipt }), /refusing to overwrite/);
  } finally {
    await fsp.rm(temp, { recursive: true, force: true });
  }
});

test("argument parser defaults to read-only-friendly paths", () => {
  const args = parseArgs(["--no-write"]);
  assert.equal(args.root, ROOT);
  assert.equal(args.batch, BATCH_PATH);
  assert.equal(args.ledger, LEDGER_PATH);
});
