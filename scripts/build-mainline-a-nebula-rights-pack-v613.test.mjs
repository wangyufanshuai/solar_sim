import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { buildPack, run, verifyPack, PACK_SCHEMA, OUTPUT_PATH } from "./build-mainline-a-nebula-rights-pack-v613.mjs";

const root = process.cwd();

test("builds eighteen pending per-image rights records", () => {
  const pack = buildPack(root);
  assert.equal(pack.schema, PACK_SCHEMA);
  assert.equal(pack.candidateCount, 18);
  assert.equal(pack.rightsDecisionCounts.unreviewed, 18);
  assert.equal(pack.evidenceStatusCounts.pending, 18);
  assert.equal(pack.runtimeAdmissionCount, 0);
  assert.ok(pack.records.every((record) => record.evidence.status === "pending" && record.evidence.decision === "unreviewed"));
});

test("preserves source and manifest identity from the v612 pack", () => {
  const pack = buildPack(root);
  for (const record of pack.records) {
    assert.match(record.sourceSha256, /^[a-f0-9]{64}$/);
    assert.match(record.manifestSha256, /^[a-f0-9]{64}$/);
    assert.match(record.sourceUrl, /^https:\/\//);
    assert.equal(record.evidence.sourceSha256, record.sourceSha256);
    assert.equal(record.runtime.candidateOnly, true);
    assert.ok(Object.keys(record.receiptRefs).length >= 1);
  }
});

test("keeps receipt references descriptive rather than treating them as clearance", () => {
  const pack = buildPack(root);
  assert.equal(pack.receiptLinkage.status, "linked-but-not-a-rights-grant");
  assert.equal(pack.receiptLinkage.validCandidates, 18);
  assert.equal(pack.receiptLinkage.missing, 0);
  assert.equal(pack.receiptLinkage.itemLevelReviewRequired, true);
  assert.equal(pack.records.filter((record) => Object.keys(record.receiptRefs).length > 0).length, 18);
  assert.equal(pack.rightsDecisionCounts.cleared, 0);
});

test("rejects a changed rights evidence decision", () => {
  const expected = buildPack(root);
  const tampered = structuredClone(expected);
  tampered.records[0].evidence.decision = "cleared";
  assert.throws(() => verifyPack(tampered, expected), /differs from sealed/);
});

test("rejects a changed policy requirement", () => {
  const expected = buildPack(root);
  const tampered = structuredClone(expected);
  tampered.rightsPolicy.requiredLicenseUrl = "https://example.test/license";
  assert.throws(() => verifyPack(tampered, expected), /differs from sealed/);
});

test("rejects runtime admission even if rights are marked pending", () => {
  const expected = buildPack(root);
  const tampered = structuredClone(expected);
  tampered.runtimeAdmissionCount = 1;
  assert.throws(() => verifyPack(tampered, expected), /differs from sealed/);
});

test("writes and checks a deterministic temporary rights pack", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-rights-v613-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.copyFileSync(path.join(root, OUTPUT_PATH), path.join(temp, OUTPUT_PATH));
  const first = buildPack(root);
  const target = path.join(temp, OUTPUT_PATH);
  fs.writeFileSync(target, `${JSON.stringify(first, null, 2)}\n`);
  assert.deepEqual(JSON.parse(fs.readFileSync(target, "utf8")), first);
});

test("CLI generation remains available without opening admission", () => {
  const pack = buildPack(root);
  assert.equal(run({ root, check: true }).status, "verified");
  assert.equal(pack.records.filter((record) => record.runtime.candidateOnly).length, 18);
});
