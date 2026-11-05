import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  extractOfficialJpegUrlV652, validatePageImageInputsV652,
} from "./mainline-a-nebula-page-image-link-v652.mjs";
import {
  auditPageImageLinkLedgerV652, inspectCapturedImageRowV652,
  inspectLinkLedgerContractV652, replayPageImageLinkAuditV652,
} from "./verify-mainline-a-nebula-page-image-link-v652.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = "docs/release/v607/mainline-a-r66-nebula-page-image-link-ledger-20261011-v652link01.json";
const auditPath = "docs/release/v607/mainline-a-r66-nebula-page-image-link-audit-20261011-v652link01-fixed.json";
const load = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const [ledger, audit, pages, pageAudit, batch] = await Promise.all([
  load(ledgerPath), load(auditPath),
  load("docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json"),
  load("docs/release/v607/mainline-a-r66-nebula-source-page-audit-20261011-v651page01.json"),
  load("app/data/mainlineANebulaBatchV628.generated.json"),
]);
const candidates = validatePageImageInputsV652(pages, pageAudit, batch).candidates;
const urls = await Promise.all(candidates.map(async (candidate) =>
  extractOfficialJpegUrlV652(await readFile(path.join(root,
    candidate.pageArtifact.path), "utf8"), candidate.nasaId)));
const clone = structuredClone;
const firstOfficial = await readFile(path.join(root, ledger.rows[0].artifact.path));
const firstCandidate = await readFile(path.join(root, candidates[0].imageArtifact.path));
const fourthOfficial = await readFile(path.join(root, ledger.rows[3].artifact.path));
const fourthCandidate = await readFile(path.join(root, candidates[3].imageArtifact.path));

test("six real HTTPS JPEG attempts retain candidate-only provenance", () => {
  const result = inspectLinkLedgerContractV652(ledger, candidates, urls);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(ledger.counts.responseCaptured, 6);
  assert.equal(ledger.counts.rightsSigned, 0);
});

test("offline verifier recomputes every source page, candidate image and official JPEG", async () => {
  const fresh = await auditPageImageLinkLedgerV652(ledgerPath);
  assert.equal(fresh.status, "verified-six-official-jpegs-candidate-with-variant-counts");
  assert.deepEqual(fresh.issues, []);
  assert.equal(fresh.artifacts.length, 6);
  assert.equal(fresh.counts.byteIdentical, 1);
  assert.equal(fresh.counts.variantPending, 5);
});

test("five official downloads have different exact bytes from image-API originals", () => {
  const result = inspectCapturedImageRowV652(ledger.rows[0], candidates[0],
    firstOfficial, firstCandidate);
  assert.equal(result.ok, true);
  assert.equal(result.evidence.byteIdentical, false);
  assert.equal(result.evidence.relationship, "variant-pending");
});

test("Cepheus C official-page JPEG is exactly byte-identical to the original", () => {
  const result = inspectCapturedImageRowV652(ledger.rows[3], candidates[3],
    fourthOfficial, fourthCandidate);
  assert.equal(result.ok, true);
  assert.equal(result.evidence.byteIdentical, true);
  assert.equal(result.evidence.relationship, "exact-byte-link-candidate");
});

test("changing official raw bytes breaks recomputed SHA and JPEG framing", () => {
  const tampered = Buffer.from(firstOfficial);
  tampered[100] ^= 0x01;
  const result = inspectCapturedImageRowV652(ledger.rows[0], candidates[0],
    tampered, firstCandidate);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("official-artifact-mismatch"));
});

test("forging a byte-identical declaration fails the exact-byte comparison", () => {
  const forged = clone(ledger.rows[0]);
  forged.byteIdentical = true;
  forged.sourceLinkStatus = "byte-identical-candidate";
  const result = inspectCapturedImageRowV652(forged, candidates[0],
    firstOfficial, firstCandidate);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("byte-comparison-forged"));
});

test("substituting the expected candidate image hash fails source identity", () => {
  const forged = clone(ledger);
  forged.rows[0].candidateImageArtifact.sha256 = "a".repeat(64);
  const result = inspectLinkLedgerContractV652(forged, candidates, urls);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${candidates[0].id}:cross-source-identity-invalid`));
});

test("a fabricated responseCaptured zero cannot inherit a saved JPEG artifact", () => {
  const forged = clone(ledger);
  forged.rows[0].responseCaptured = 0;
  const result = inspectLinkLedgerContractV652(forged, candidates, urls);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${candidates[0].id}:captured-attempt-invalid`));
});

test("HTTP status and request fingerprint are part of the replay contract", () => {
  const forged = clone(ledger);
  forged.rows[0].attempts[0].httpStatus = 503;
  forged.rows[0].attempts[0].requestFingerprint = "0".repeat(64);
  const result = inspectLinkLedgerContractV652(forged, candidates, urls);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${candidates[0].id}:captured-attempt-invalid`));
  assert.ok(result.issues.includes(`${candidates[0].id}:request-fingerprint-invalid`));
});

test("a seventh copied row cannot pad exact source coverage", () => {
  const forged = clone(ledger);
  forged.rows.push(clone(forged.rows[0]));
  const result = inspectLinkLedgerContractV652(forged, candidates, urls);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("six-row-coverage-invalid"));
});

test("copyright or science promotion inside the ledger fails closed", () => {
  const forged = clone(ledger);
  forged.rows[0].rightsSignoff = "approved";
  forged.boundary.scientificPayloadWriteback = true;
  forged.claims.copyrightApproval = true;
  const result = inspectLinkLedgerContractV652(forged, candidates, urls);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("admission-or-rights-forgery"));
  assert.ok(result.issues.includes(`${candidates[0].id}:rights-or-persist-invalid`));
});

test("saved audit replay retains one exact byte match and five pending variants", async () => {
  const fresh = await auditPageImageLinkLedgerV652(ledgerPath);
  const result = replayPageImageLinkAuditV652(audit, fresh);
  assert.equal(result.byteIdentical, 1);
  assert.equal(result.variantPending, 5);
  assert.equal(result.publicWebRelease, "blocked");
});

test("saved audit replay rejects forged signoff and forged extra byte match", async () => {
  const fresh = await auditPageImageLinkLedgerV652(ledgerPath);
  const rights = clone(audit);
  rights.claims.copyrightApproval = true;
  assert.throws(() => replayPageImageLinkAuditV652(rights, fresh),
    /saved-audit-replay-mismatch/);
  const extraMatch = clone(audit);
  extraMatch.counts.byteIdentical = 2;
  assert.throws(() => replayPageImageLinkAuditV652(extraMatch, fresh),
    /saved-audit-replay-mismatch/);
});
