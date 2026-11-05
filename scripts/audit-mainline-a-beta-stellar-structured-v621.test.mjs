import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { artifactAudit, audit, canonicalDigest, classifyFieldQuality, toJsonl, validateCandidate, validateComponentHints } from "./audit-mainline-a-beta-stellar-structured-v621.mjs";

test("R61 audit verifies current four-star structured candidate pack", () => {
  const result = audit(process.cwd());
  assert.equal(result.status, "verified");
  assert.deepEqual(result.counts, { total: 4, artifactsRecomputed: 4, parsedCandidates: 4, componentConfirmed: 0, errors: 0 });
  assert.equal(result.boundary.scientificPayloadWriteback, false);
  assert.match(result.deterministicDigest, /^[a-f0-9]{64}$/);
  assert.equal(result.candidateAudit[0].telemetry.captured, 1);
});

test("canonical digest and JSONL report remain deterministic in shape", () => {
  const result = audit(process.cwd());
  assert.equal(canonicalDigest({ b: 1, a: 2 }), canonicalDigest({ a: 2, b: 1 }));
  assert.equal(toJsonl(result).split("\n").filter(Boolean).length, 10);
  assert.equal(classifyFieldQuality(JSON.parse(fs.readFileSync("app/data/mainlineABetaStellarStructuredCandidateV621.generated.json", "utf8")).records[0]).component, "unresolved");
});

test("artifact audit detects tampered byte/hash metadata", () => {
  const ledger = JSON.parse(fs.readFileSync("app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json", "utf8"));
  const record = structuredClone(ledger.records[0]);
  record.attemptLedger[0].responseBytes += 1;
  const result = artifactAudit(process.cwd(), record);
  assert.equal(result.errors.some((entry) => entry.code === "artifact-byte-mismatch"), true);
});

test("candidate validator blocks component confirmation without source", () => {
  const pack = JSON.parse(fs.readFileSync("app/data/mainlineABetaStellarStructuredCandidateV621.generated.json", "utf8"));
  const ledger = JSON.parse(fs.readFileSync("app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json", "utf8"));
  const candidate = { ...pack.records[0], componentIdentityStatus: "confirmed" };
  assert.equal(validateCandidate(candidate, ledger.records[0]).some((entry) => entry.code === "component-identity-opened"), true);
});

test("component hint ledger remains candidate-only and rejects forged external links", () => {
  const pack = JSON.parse(fs.readFileSync("app/data/mainlineABetaStellarStructuredCandidateV621.generated.json", "utf8"));
  const candidate = structuredClone(pack.records[0]);
  assert.equal(candidate.componentHints.length >= 2, true);
  assert.deepEqual(validateComponentHints(candidate), []);
  candidate.componentHints[0].sourceUrl = "https://example.invalid/forged-component";
  assert.equal(validateComponentHints(candidate).some((entry) => entry.code === "component-hint-source-invalid"), true);
  candidate.componentHints[0].sourceUrl = "https://vizier.cds.unistra.fr/viz-bin/VizieR-S?WDS%20forged";
  candidate.componentHints[0].evidence = "confirmed";
  assert.equal(validateComponentHints(candidate).some((entry) => entry.code === "component-hint-promotion"), true);
});
