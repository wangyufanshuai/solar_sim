import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const receiptPath = path.join(root, "docs/release/v607/mainline-a-stage-a3-image-acquisition.json");
const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));

test("A3 acquisition receipt contains six fetched screen JPEGs without license promotion", () => {
  assert.equal(receipt.schema, "mainline-a3-image-acquisition-receipt-v1");
  assert.equal(receipt.status, "acquired-awaiting-rights-review");
  assert.equal(receipt.rightsPage, "https://esahubble.org/copyright/");
  assert.deepEqual(receipt.localPayload, { acquired: false, licensed: false, storage: "ephemeral-memory-only" });
  assert.equal(receipt.candidates.length, 6);
  for (const candidate of receipt.candidates) {
    assert.equal(candidate.httpStatus, 200);
    assert.equal(candidate.sourcePageStatus, 200);
    assert.equal(candidate.parseMethod, "source-page-html-screen-jpeg-href");
    assert.equal(candidate.contentType, "image/jpeg");
    assert.match(candidate.imageUrl, new RegExp(`/screen/${candidate.imageId}\\.jpg$`));
    assert.equal(candidate.status, "awaiting-rights-review");
    assert.equal(candidate.rightsStatus, "verify-per-image");
    assert.equal(candidate.storage, "ephemeral-memory-only");
    assert.equal(candidate.localPath, undefined);
    assert.equal(candidate.byteSize > 0, true);
    assert.match(candidate.sha256, /^[0-9a-f]{64}$/);
    assert.equal(Number.isInteger(candidate.dimensions.width), true);
    assert.equal(Number.isInteger(candidate.dimensions.height), true);
    assert.equal(candidate.dimensions.width > 0 && candidate.dimensions.height > 0, true);
  }
});
