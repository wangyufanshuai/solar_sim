import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { assertReceiptLinkage, buildReceiptFileIndex, extractReceiptRows, linkReceiptReferences, readAllManifestSeals, receiptLinkageCompletion, receiptLinkageFingerprint, receiptRowIdentityMatches, receiptRowMatches, summarizeReceiptLinkage } from "./mainline-a-nebula-receipt-linker-v614.mjs";
import { buildPack as buildRightsPack } from "./build-mainline-a-nebula-rights-pack-v613.mjs";

const root = process.cwd();
const rightsPack = buildRightsPack(root);

function recordFor(id = "heart-nebula") {
  const record = rightsPack.records.find((entry) => entry.candidateId === id);
  return { id, target: id, nasaId: record.nasaId, sourceUrl: record.sourceUrl, localPath: record.sourceLocalPath, bytes: record.sourceBytes, sha256: record.sourceSha256 };
}

test("indexes the v592 receipt directory and links the heart payload receipt", () => {
  const index = buildReceiptFileIndex(root);
  const record = recordFor();
  const linkage = linkReceiptReferences(root, record, rightsPack.records.find((entry) => entry.candidateId === record.id).receiptRefs, index);
  assert.ok(index.length > 20);
  assert.equal(linkage.valid, true);
  assert.ok(linkage.links.some((link) => link.key === "acquisitionReceiptSha256" && link.status === "payload-linked"));
  assertReceiptLinkage(linkage);
});

test("links extended metadata by identity while keeping payload proof separate", () => {
  const record = recordFor("jellyfish-nebula");
  const entry = rightsPack.records.find((item) => item.candidateId === record.id);
  const linkage = linkReceiptReferences(root, record, entry.receiptRefs);
  assert.equal(linkage.valid, true);
  assert.ok(linkage.links.some((link) => link.key === "metadataReceiptSha256" && link.status === "identity-linked"));
  assert.ok(linkage.links.some((link) => link.key === "acquisitionReceiptSha256" && link.status === "payload-linked"));
});

test("fails closed when a declared receipt hash is missing", () => {
  const record = recordFor();
  const linkage = linkReceiptReferences(root, record, { acquisitionReceiptSha256: "f".repeat(64) });
  assert.equal(linkage.valid, false);
  assert.equal(linkage.missing, 1);
  assert.throws(() => assertReceiptLinkage(linkage), /receipt-linkage-failed/);
});

test("fails payload linkage when URL, bytes, or digest no longer match", () => {
  const record = { ...recordFor(), bytes: 1 };
  const entry = rightsPack.records.find((item) => item.candidateId === "heart-nebula");
  const linkage = linkReceiptReferences(root, record, entry.receiptRefs);
  assert.equal(linkage.valid, false);
  assert.ok(linkage.links.some((link) => link.key === "acquisitionReceiptSha256" && !link.payloadLinked));
});

test("does not confuse a receipt reference with legal clearance", () => {
  const record = recordFor();
  const entry = rightsPack.records.find((item) => item.candidateId === record.id);
  const linkage = linkReceiptReferences(root, record, entry.receiptRefs);
  assert.equal(linkage.valid, true);
  assert.equal(summarizeReceiptLinkage([linkage]).validCandidates, 1);
  assert.equal(entry.evidence.decision, "unreviewed");
  assert.equal(entry.runtime.candidateOnly, true);
});

test("summarizes payload, identity, reference-only, and missing levels", () => {
  const records = rightsPack.records.slice(0, 3).map((entry) => recordFor(entry.candidateId));
  const links = records.map((record) => linkReceiptReferences(root, record, rightsPack.records.find((entry) => entry.candidateId === record.id).receiptRefs));
  const summary = summarizeReceiptLinkage(links);
  assert.equal(summary.candidates, 3);
  assert.ok(summary.receiptReferences >= 6);
  assert.equal(summary.missing, 0);
  assert.ok(summary.identityLinked >= summary.validCandidates);
});

test("verifies all three canonical manifest seals and their build receipts", () => {
  const seals = readAllManifestSeals(root);
  assert.equal(seals.length, 3);
  assert.ok(seals.every((seal) => seal.manifestSealSha256 === seal.receiptManifestSha256));
  assert.ok(seals.every((seal) => /^[a-f0-9]{64}$/.test(seal.manifestRawSha256)));
  assert.ok(seals.every((seal) => /^[a-f0-9]{64}$/.test(seal.receiptSha256)));
});

test("proves every candidate has a valid receipt linkage without changing its rights decision", () => {
  const index = buildReceiptFileIndex(root);
  const linkages = rightsPack.records.map((entry) => linkReceiptReferences(root, {
    id: entry.candidateId,
    target: entry.candidateId,
    nasaId: entry.nasaId,
    sourceUrl: entry.sourceUrl,
    localPath: entry.sourceLocalPath,
    bytes: entry.sourceBytes,
    sha256: entry.sourceSha256,
  }, entry.receiptRefs, index));
  assert.equal(linkages.length, 18);
  assert.equal(receiptLinkageCompletion(linkages), 100);
  assert.equal(linkages.filter((linkage) => linkage.valid).length, 18);
  assert.ok(linkages.every((linkage) => linkage.links.every((link) => link.candidates.every((candidate) => candidate.sealValid))));
});

test("connects the closure tarantula alias by NASA ID and keeps the alias visible", () => {
  const entry = rightsPack.records.find((item) => item.nasaId === "PIA23646");
  const record = { id: entry.candidateId, target: entry.candidateId, nasaId: entry.nasaId, sourceUrl: entry.sourceUrl, localPath: entry.sourceLocalPath, bytes: entry.sourceBytes, sha256: entry.sourceSha256 };
  const linkage = linkReceiptReferences(root, record, entry.receiptRefs);
  assert.equal(linkage.valid, true);
  assert.ok(linkage.links.flatMap((link) => link.candidates).some((candidate) => candidate.alias));
  const rows = extractReceiptRows(JSON.parse(fs.readFileSync("docs/release/v592/nebula-closure-visual-acquisition-v592.json", "utf8")));
  const alias = rows.find((row) => row.nasaId === "PIA23646");
  assert.equal(receiptRowIdentityMatches(record, alias), true);
  assert.equal(receiptRowMatches(record, alias), true);
});

test("rejects source path and payload tampering even when NASA ID is unchanged", () => {
  const entry = rightsPack.records[0];
  const record = { id: entry.candidateId, target: entry.candidateId, nasaId: entry.nasaId, sourceUrl: entry.sourceUrl, localPath: `${entry.sourceLocalPath}.tampered`, bytes: entry.sourceBytes, sha256: entry.sourceSha256 };
  const linkage = linkReceiptReferences(root, record, entry.receiptRefs);
  assert.equal(linkage.valid, false);
  assert.ok(linkage.links.some((link) => link.requiredLevel === "payload" && !link.payloadLinked));
});

test("keeps linkage fingerprints deterministic and sensitive to receipt status", () => {
  const entry = rightsPack.records[0];
  const record = { id: entry.candidateId, target: entry.candidateId, nasaId: entry.nasaId, sourceUrl: entry.sourceUrl, localPath: entry.sourceLocalPath, bytes: entry.sourceBytes, sha256: entry.sourceSha256 };
  const linkage = linkReceiptReferences(root, record, entry.receiptRefs);
  assert.equal(receiptLinkageFingerprint(linkage), receiptLinkageFingerprint(structuredClone(linkage)));
  const changed = structuredClone(linkage);
  changed.links[0].status = "reference-only";
  assert.notEqual(receiptLinkageFingerprint(linkage), receiptLinkageFingerprint(changed));
});
