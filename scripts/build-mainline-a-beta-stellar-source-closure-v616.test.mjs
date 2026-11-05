import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildClosureRecord, buildPack, closureManifestFingerprint, loadInputs, readPack, requiredEvidenceFor, run, validateClosureRecord, verifyPack, writePack, OUTPUT_PATH, PENDING_IDS } from "./build-mainline-a-beta-stellar-source-closure-v616.mjs";

const root = process.cwd();

test("builds four source-closure records without admitting them", () => {
  const pack = buildPack({ root });
  assert.equal(pack.schema, "mainline-a-beta-stellar-source-closure-v616");
  assert.deepEqual(pack.counts, { total: 4, freshCaptureRequired: 4, missingEvidence: 8, candidateOnly: 4 });
  assert.equal(pack.boundary.legalDecision, "not-granted");
  assert.deepEqual(pack.records.map((record) => record.id), PENDING_IDS);
  assert.ok(pack.records.every((record) => record.freshCapture.capturedAt === null));
  assert.ok(pack.records.every(validateClosureRecord));
  assert.equal(closureManifestFingerprint(pack).length, 64);
});

test("keeps candidate-specific missing evidence explicit", () => {
  const pack = buildPack({ root });
  const acrux = pack.records.find((record) => record.id === "acrux");
  const spica = pack.records.find((record) => record.id === "spica");
  assert.deepEqual(acrux?.missingEvidence, ["positive-parallax", "upstream-reference"]);
  assert.deepEqual(spica?.missingEvidence, ["component-identity", "component-source-reference"]);
  assert.match(acrux?.sourcePageUrl ?? "", /simbad\.cds\.unistra\.fr/);
});

test("rejects unknown candidates and mismatched source identities", () => {
  const { snapshot, projection } = loadInputs(root);
  assert.throws(() => requiredEvidenceFor("vega"), /unknown pending hero/);
  assert.throws(() => buildClosureRecord("acrux", projection.rows.find((row) => row.id === "spica"), snapshot.records.find((row) => row.id === "acrux"), snapshot.snapshotSha256), /projection row missing/);
});

test("fails closed when snapshot or projection input is stale", () => {
  const pack = buildPack({ root });
  assert.throws(() => verifyPack({ ...pack, source: { ...pack.source, snapshotSha256: "f".repeat(64) } }, pack), /sealed input/);
  const changed = structuredClone(pack);
  changed.records[0].reviewDecision = "cleared";
  assert.throws(() => verifyPack(changed, pack), /sealed input/);
});

test("rejects fake fresh capture and opened runtime admission", () => {
  const pack = buildPack({ root });
  const fakeCapture = structuredClone(pack);
  fakeCapture.records[0].freshCapture.capturedAt = "2026-09-14T00:00:00Z";
  assert.throws(() => verifyPack(fakeCapture, pack), /sealed input/);
  const admitted = structuredClone(pack);
  admitted.records[0].runtimeAdmission = "admitted";
  assert.throws(() => verifyPack(admitted, pack), /sealed input/);
});

test("CLI generation and check mode are deterministic in a clean temporary root", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mainline-a-v616-"));
  for (const relative of ["docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json", "app/data/mainlineABetaStellarProjectionV607.generated.ts", "scripts/project-mainline-a-beta-stellar.mjs"]) {
    const target = path.join(tempRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relative), target);
  }
  assert.equal(writePack(tempRoot).total, 4);
  const checked = run({ root: tempRoot, check: true });
  assert.equal(checked.status, "verified");
  assert.equal(checked.total, 4);
  assert.equal(checked.missingEvidence, 8);
  assert.equal(checked.fingerprint.length, 64);
  const changed = readPack(tempRoot);
  changed.records.reverse();
  fs.writeFileSync(path.join(tempRoot, OUTPUT_PATH), JSON.stringify(changed));
  assert.throws(() => run({ root: tempRoot, check: true }), /sealed input/);
});
