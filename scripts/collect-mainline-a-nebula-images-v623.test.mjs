import test from "node:test";
import assert from "node:assert/strict";
import { buildOfflineLedger, collectImage, run, safeImageUrl, validateLedger } from "./collect-mainline-a-nebula-images-v623.mjs";

test("offline V623 ledger covers six candidates and keeps payload zero", () => {
  const ledger = buildOfflineLedger(process.cwd());
  assert.equal(validateLedger(ledger), true);
  assert.deepEqual(ledger.counts, { total: 6, attempted: 6, responseCaptured: 0, payloadPresent: 0, rightsCleared: 0 });
  assert.equal(ledger.records.every((row) => row.payload.bytes === null && row.responseCaptured === 0), true);
});
test("safe image URL policy rejects credentials, ports and foreign hosts", () => {
  assert.equal(safeImageUrl("https://images-assets.nasa.gov/image/x.jpg"), true);
  assert.equal(safeImageUrl("http://images-assets.nasa.gov/image/x.jpg"), false);
  assert.equal(safeImageUrl("https://user:pass@images-assets.nasa.gov/image/x.jpg"), false);
  assert.equal(safeImageUrl("https://example.com/x.jpg"), false);
});
test("HTTP failure records status and leaves payload uncaptured", async () => {
  const candidate = { candidateId: "ring-nebula", source: { sourceUrl: "https://images-assets.nasa.gov/image/x.jpg" } };
  const result = await collectImage(candidate, { fetchImpl: async () => ({ status: 404, headers: new Headers({ "content-type": "text/html" }) }) });
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts[0].httpStatus, 404);
  assert.equal(result.attempts[0].errorClass, "http-4xx");
});
test("run check is read-only and validates generated ledger", () => {
  assert.equal(run({ root: process.cwd(), check: true }).status, "verified");
});
