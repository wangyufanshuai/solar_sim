import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildStellarComponentEvidenceV634,
  runComponentEvidenceV634,
  verifyStellarComponentEvidenceV634,
} from "./build-mainline-a-stellar-component-evidence-v634";

const root = process.cwd();
const ledgerPath = "docs/release/v607/mainline-a-stellar-components-v634-20260927-056.json";
const ledger = JSON.parse(fs.readFileSync(path.join(root, ledgerPath), "utf8"));
const simbadLedgerPath = "app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
const simbadLedger = JSON.parse(fs.readFileSync(path.join(root, simbadLedgerPath), "utf8"));
const clone = <T>(value: T): T => structuredClone(value);

function retainedTestWorkspace() {
  const workspace = fs.mkdtempSync(path.join(root, "tmp", "component-evidence-test-"));
  const paths = [ledgerPath, ledger.sourceCandidatePack.path, ledger.readme.artifact.path, simbadLedgerPath,
    ...simbadLedger.records.flatMap((record: { attempts: { rawArtifactPath: string | null }[] }) => record.attempts.filter((attempt) => attempt.rawArtifactPath).map((attempt) => attempt.rawArtifactPath)),
    ...ledger.records.map((record: { artifact: { path: string } }) => record.artifact.path)];
  for (const relative of paths) {
    const destination = path.join(workspace, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, relative), destination, fs.constants.COPYFILE_EXCL);
  }
  fs.writeFileSync(path.join(workspace, "TEST-ONLY.txt"), "Retained local replay test workspace. Not an external capture or release evidence.\n", { flag: "wx" });
  return workspace;
}

test("rebuilds the four archived real catalogue captures without confirming components", () => {
  const pack = buildStellarComponentEvidenceV634({ root, ledgerPath });
  assert.deepEqual(pack.records.map((record) => record.table?.rows.length), [11, 4, 4, 6]);
  for (const record of pack.records) {
    assert.equal(record.status, "catalogue-candidate");
    assert.equal(record.componentIdentityStatus, "unresolved");
    assert.equal(record.scientificPayloadWriteback, false);
    assert.deepEqual(record.blockers, ["component-identity-review-required", "rights-review-pending"]);
  }
  assert.equal(pack.sourceCandidatePack.sha256, ledger.sourceCandidatePack.sha256);
});

test("recomputes exact source byte slices for all 25 catalogue pairs", () => {
  const pack = buildStellarComponentEvidenceV634({ root, ledgerPath });
  let total = 0;
  for (const record of pack.records) {
    const bytes = fs.readFileSync(path.join(root, record.artifact!.path));
    for (const pair of record.table!.rows) {
      assert.equal(bytes.subarray(pair.source.byteStart, pair.source.byteEnd).toString("utf8"), pair.source.rawText);
      total += 1;
    }
  }
  assert.equal(total, 25);
});

test("rejects a forged normalized catalogue field and a forged summary boundary", () => {
  const pack = buildStellarComponentEvidenceV634({ root, ledgerPath });
  const fieldChange = clone(pack) as unknown as { records: { table: { rows: { separationArcsec: number }[] } }[] };
  fieldChange.records[0].table.rows[0].separationArcsec = 999;
  assert.throws(() => verifyStellarComponentEvidenceV634(fieldChange, pack), /differs from raw replay/);
  const boundary = { ...pack, boundary: { ...pack.boundary, scientificPayloadWriteback: true } };
  assert.throws(() => verifyStellarComponentEvidenceV634(boundary, pack), /differs from raw replay/);
});

test("rejects tampered raw catalogue bytes before semantic parsing", () => {
  const workspace = retainedTestWorkspace();
  fs.appendFileSync(path.join(workspace, ledger.records[0].artifact.path), "\nFAKE ROW\n");
  assert.throws(() => buildStellarComponentEvidenceV634({ root: workspace, ledgerPath }), /artifact bytes differ/);
});

test("rejects a changed ReadMe even while its old digest remains in the ledger", () => {
  const workspace = retainedTestWorkspace();
  fs.appendFileSync(path.join(workspace, ledger.readme.artifact.path), "\nChanged test definition\n");
  assert.throws(() => buildStellarComponentEvidenceV634({ root: workspace, ledgerPath }), /artifact bytes differ/);
});

test("binds candidate source bytes instead of trusting unchanged query names", () => {
  const workspace = retainedTestWorkspace();
  fs.appendFileSync(path.join(workspace, ledger.sourceCandidatePack.path), "\n");
  assert.throws(() => buildStellarComponentEvidenceV634({ root: workspace, ledgerPath }), /source pack digest differs/);
});

test("replays the originating SIMBAD raw instead of trusting a valid WDS capture", () => {
  const workspace = retainedTestWorkspace();
  const origin = simbadLedger.records[0].attempts.find((attempt: { rawArtifactPath: string | null }) => attempt.rawArtifactPath);
  fs.appendFileSync(path.join(workspace, origin.rawArtifactPath), "\nChanged origin\n");
  assert.throws(() => buildStellarComponentEvidenceV634({ root: workspace, ledgerPath }), /SHA-256 mismatch/);
});

test("refuses output overwrite and verifies the complete stored pack", () => {
  const workspace = retainedTestWorkspace();
  const output = "tmp/test-only-component-pack.json";
  const first = runComponentEvidenceV634({ root: workspace, ledgerPath, output });
  assert.equal(first.summary.pairs, 25);
  assert.equal(runComponentEvidenceV634({ root: workspace, ledgerPath, output, check: true }).sha256, first.sha256);
  assert.throws(() => runComponentEvidenceV634({ root: workspace, ledgerPath, output }), /EEXIST/);
  const stored = JSON.parse(fs.readFileSync(path.join(workspace, output), "utf8"));
  stored.records[0].componentIdentityStatus = "confirmed";
  fs.writeFileSync(path.join(workspace, output), JSON.stringify(stored));
  assert.throws(() => runComponentEvidenceV634({ root: workspace, ledgerPath, output, check: true }), /differs from raw replay/);
});

test("rejects an output path outside the test workspace", () => {
  const workspace = retainedTestWorkspace();
  assert.throws(() => runComponentEvidenceV634({ root: workspace, ledgerPath, output: "../escape.json" }), /outside workspace/);
});
