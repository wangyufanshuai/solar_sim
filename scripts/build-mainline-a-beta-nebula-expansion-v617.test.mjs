import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  BASE_PACK_PATH,
  EXPANSION_IDS,
  OUTPUT_PATH,
  buildPack,
  readInputs,
  run,
  validateRecord,
  verifyPack,
} from "./build-mainline-a-beta-nebula-expansion-v617.mjs";

const root = process.cwd();

test("builds six new expansion identities and closes the 18 to 24 candidate gap", () => {
  const pack = buildPack(root);
  assert.equal(pack.schema, "mainline-a-beta-nebula-expansion-v617");
  assert.equal(pack.counts.baseCandidates, 18);
  assert.equal(pack.counts.expansionCandidates, 6);
  assert.equal(pack.counts.candidateTotal, 24);
  assert.deepEqual(pack.records.map((record) => record.candidateId), EXPANSION_IDS);
  assert.equal(pack.counts.runtimeAdmitted, 0);
});

test("keeps California as local payload evidence without granting admission", () => {
  const pack = buildPack(root);
  const california = pack.records.find((record) => record.candidateId === "california-nebula");
  assert.equal(california.payload.state, "local-payload-present");
  assert.ok(california.payload.bytes > 0);
  assert.ok(california.blockers.includes("rights-review-pending"));
  assert.equal(california.runtime.visualAssetAdmitted, false);
  assert.equal(california.runtime.scienceImagePayloadAllowed, false);
});

test("keeps five non-acquired sources metadata-only and explicitly blocked", () => {
  const pack = buildPack(root);
  const pending = pack.records.filter((record) => record.payload.state === "payload-acquisition-pending");
  assert.equal(pending.length, 5);
  assert.ok(pending.every((record) => record.payload.localPath === null));
  assert.ok(pending.every((record) => record.blockers.includes("payload-acquisition-pending")));
  assert.ok(pending.some((record) => record.candidateId === "ring-nebula" && record.blockers.includes("license:restricted-partner-or-copyright-flag")));
});

test("joins metadata and license receipts by NASA ID and HTTPS URL", () => {
  const inputs = readInputs(root);
  const pack = buildPack(root);
  for (const record of pack.records) {
    const review = inputs.license.reviews.find((row) => row.target === record.candidateId);
    const metadata = inputs.metadata.targets.find((row) => row.target === record.candidateId);
    assert.equal(review.nasaId, metadata.nasaId);
    assert.equal(record.source.nasaId, review.nasaId);
    assert.match(record.source.sourceUrl, /^https:\/\//);
    assert.equal(record.metadata.receiptSha256, inputs.metadataReceipt.receiptSha256);
  }
});

test("fails closed for duplicate base identity and stale metadata", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v617-expansion-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.mkdirSync(path.join(temp, "docs/release/v592"), { recursive: true });
  fs.mkdirSync(path.join(temp, "source-cache/v592/nebulae"), { recursive: true });
  fs.cpSync(path.join(root, "source-cache/v592/nebulae"), path.join(temp, "source-cache/v592/nebulae"), { recursive: true });
  for (const relative of [BASE_PACK_PATH, "docs/release/v592/nebula-item-license-review-v592.json", "docs/release/v592/nebula-asset-metadata-admission-v592.json", "docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json", "docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json"]) {
    fs.copyFileSync(path.join(root, relative), path.join(temp, relative));
  }
  const licensePath = path.join(temp, "docs/release/v592/nebula-item-license-review-v592.json");
  const license = JSON.parse(fs.readFileSync(licensePath, "utf8"));
  license.reviews[0].sourceMetadataSha256 = "0".repeat(64);
  fs.writeFileSync(licensePath, JSON.stringify(license));
  assert.throws(() => buildPack(temp), /sealed-document-hash-mismatch|metadata digest mismatch/);
  fs.rmSync(temp, { recursive: true, force: true });
});

test("seals generated JSON and rejects a forged payload state", () => {
  const expected = buildPack(root);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v617-output-"));
  fs.mkdirSync(path.join(temp, "app/data"), { recursive: true });
  fs.mkdirSync(path.join(temp, "docs/release/v592"), { recursive: true });
  fs.mkdirSync(path.join(temp, "source-cache/v592/nebulae"), { recursive: true });
  fs.cpSync(path.join(root, "source-cache/v592/nebulae"), path.join(temp, "source-cache/v592/nebulae"), { recursive: true });
  for (const relative of [BASE_PACK_PATH, "docs/release/v592/nebula-item-license-review-v592.json", "docs/release/v592/nebula-asset-metadata-admission-v592.json", "docs/release/v592/acquisition-receipt-nebula-item-metadata-v592.json", "docs/release/v592/acquisition-receipt-nebula-visual-sources-v592.json"]) fs.copyFileSync(path.join(root, relative), path.join(temp, relative));
  const generated = run({ root: temp });
  assert.equal(generated.status, "generated");
  const actual = JSON.parse(fs.readFileSync(path.join(temp, OUTPUT_PATH), "utf8"));
  assert.equal(verifyPack(actual, expected).status, "verified");
  actual.records[1].payload.state = "local-payload-present";
  assert.throws(() => validateRecord(actual.records[1]), /local payload incomplete/);
  fs.rmSync(temp, { recursive: true, force: true });
});
