import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { V651_SOURCE_PAGES } from "./mainline-a-nebula-source-page-v651.mjs";
import {
  auditSourcePageLedgerV651, inspectCapturedSourcePageV651,
  inspectSourcePageLedgerContractV651, replaySourcePageAuditV651,
} from "./verify-mainline-a-nebula-source-pages-v651.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledgerPath = "docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json";
const auditPath = "docs/release/v607/mainline-a-r66-nebula-source-page-audit-20261011-v651page01.json";
const batchPath = "app/data/mainlineANebulaBatchV628.generated.json";
const load = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const [ledger, audit, batch] = await Promise.all([
  load(ledgerPath), load(auditPath), load(batchPath),
]);
const clone = (value) => structuredClone(value);
const row = ledger.rows[0];
const source = V651_SOURCE_PAGES[0];
const raw = await readFile(path.join(root, row.artifact.path));

test("six live HTTPS page attempts satisfy the offline ledger contract", () => {
  const result = inspectSourcePageLedgerContractV651(ledger, batch);
  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
  assert.equal(ledger.counts.rightsSigned, 0);
});

test("all six raw pages are recomputed from disk", async () => {
  const fresh = await auditSourcePageLedgerV651(ledgerPath);
  assert.equal(fresh.status, "verified-six-official-pages-candidate");
  assert.equal(fresh.artifacts.length, 6);
  assert.deepEqual(fresh.issues, []);
});

test("the first captured page binds its raw SHA, PIA ID and credit", () => {
  const result = inspectCapturedSourcePageV651(raw, row, source);
  assert.equal(result.ok, true);
  assert.equal(result.inspection.nasaId, "PIA13449");
  assert.equal(result.inspection.officialCredit, "NASA/JPL-Caltech/UCLA");
});

test("editing the official raw HTML fails digest and parser replay", () => {
  const changed = Buffer.from(raw.toString("utf8").replace(
    "NASA/JPL-Caltech/UCLA", "test fixture"), "utf8");
  const result = inspectCapturedSourcePageV651(changed, row, source);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("raw-artifact-sha-or-size-invalid"));
  assert.ok(result.issues.includes("raw-official-page-contract-invalid"));
});

test("a forged item credit fails the source-to-image link", () => {
  const forged = clone(ledger);
  forged.rows[0].expectedCredit = "Unknown";
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:source-or-image-link-invalid`));
});

test("a different NASA image hash cannot inherit this source page", () => {
  const forged = clone(ledger);
  forged.rows[0].imageArtifactSha256 = "a".repeat(64);
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:source-or-image-link-invalid`));
});

test("a fabricated HTTP 200 cannot hide a failed request", () => {
  const forged = clone(ledger);
  forged.rows[0].attempts[0].httpStatus = 503;
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:attempt-1:response-contract-invalid`));
});

test("a responseCaptured zero row cannot retain a promoted page", () => {
  const forged = clone(ledger);
  forged.rows[0].responseCaptured = 0;
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:response-count-invalid`));
});

test("a substituted source URL and request fingerprint fail", () => {
  const forged = clone(ledger);
  forged.rows[0].sourcePageUrl = "https://example.com/official";
  forged.rows[0].attempts[0].requestFingerprint = "0".repeat(64);
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:source-or-image-link-invalid`));
  assert.ok(result.issues.includes(`${source.id}:attempt-1:request-metadata-invalid`));
});

test("adding a seventh page invalidates exact batch coverage", () => {
  const forged = clone(ledger);
  forged.rows.push(clone(forged.rows[0]));
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("exact-six-source-pages-missing"));
});

test("rights signoff or scientific writeback cannot be inferred from pages", () => {
  const forged = clone(ledger);
  forged.rows[0].rightsSignoff = "approved";
  forged.boundary.scientificPayloadWriteback = true;
  const result = inspectSourcePageLedgerContractV651(forged, batch);
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(`${source.id}:admission-or-rights-promoted`));
  assert.ok(result.issues.includes("release-boundary-promoted"));
});

test("saved audit replay rejects a forged copyright approval", async () => {
  const fresh = await auditSourcePageLedgerV651(ledgerPath);
  const forged = clone(audit);
  forged.claims.copyrightApproval = true;
  assert.throws(() => replaySourcePageAuditV651(forged, fresh),
    /saved-audit-replay-mismatch/);
});

test("saved audit replay retains candidate-only status", async () => {
  const fresh = await auditSourcePageLedgerV651(ledgerPath);
  const result = replaySourcePageAuditV651(audit, fresh);
  assert.equal(result.status, "replayed-six-official-pages-candidate");
  assert.equal(result.rightsSigned, 0);
  assert.equal(result.publicWebRelease, "blocked");
});
