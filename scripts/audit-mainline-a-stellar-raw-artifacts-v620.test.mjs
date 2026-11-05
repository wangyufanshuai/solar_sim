import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { auditLedgerArtifacts, canonicalSha, safeArtifactPath, safeUrl, verifyArtifact } from "./audit-mainline-a-stellar-raw-artifacts-v620.mjs";

const root = process.cwd();
const ledger = JSON.parse(fs.readFileSync(path.join(root, "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json"), "utf8"));

test("audits the live ledger and every captured artifact", () => {
  const audit = auditLedgerArtifacts(root, ledger);
  assert.equal(audit.summary.total, 4);
  assert.equal(audit.summary.valid, 4);
  assert.equal(audit.summary.artifacts, ledger.counts.responseCaptured);
  assert.equal(audit.summary.scientificPayloadWriteback, false);
});
test("canonical ledger digest is deterministic", () => assert.equal(canonicalSha(ledger), canonicalSha(JSON.parse(JSON.stringify(ledger)))));
test("rejects lookalike and insecure source hosts", () => {
  assert.equal(safeUrl("https://simbad.cds.unistra.fr/simbad/sim-id?Ident=x"), true);
  assert.equal(safeUrl("https://simbad.cds.unistra.fr.evil.test/x"), false);
  assert.equal(safeUrl("http://simbad.cds.unistra.fr/x"), false);
});
test("keeps artifact paths inside the R60 root", () => {
  assert.throws(() => safeArtifactPath(root, "docs/release/v607/raw-artifacts/other/x.raw"));
});
test("detects a forged artifact hash", () => {
  const attempt = ledger.records[0].attemptLedger[0];
  const errors = verifyArtifact(root, { ...attempt, rawArtifactSha256: "0".repeat(64) });
  assert.ok(errors.includes("captured-artifact-hash-mismatch"));
});
test("detects a captured byte count mismatch", () => {
  const attempt = ledger.records[0].attemptLedger[0];
  const errors = verifyArtifact(root, { ...attempt, responseBytes: attempt.responseBytes + 1 });
  assert.ok(errors.includes("captured-artifact-byte-mismatch"));
});
test("failed attempts cannot carry artifact metadata", () => {
  const attempt = { ...ledger.records[0].attemptLedger[0], responseCaptured: 0, rawArtifactPath: null, rawArtifactSha256: null, responseBytes: null };
  assert.deepEqual(verifyArtifact(root, attempt), []);
});
test("missing artifact is reported without crashing the audit", () => {
  const attempt = { ...ledger.records[0].attemptLedger[0], rawArtifactPath: "docs/release/v607/raw-artifacts/r60/missing.raw" };
  assert.ok(verifyArtifact(root, attempt).some((entry) => entry.includes("artifact missing")));
});
