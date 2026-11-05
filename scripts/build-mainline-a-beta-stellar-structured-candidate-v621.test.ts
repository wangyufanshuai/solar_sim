import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCandidateFromCapturedRecord, buildPack, verifyPackMetadata, type CapturedRecord } from "./build-mainline-a-beta-stellar-structured-candidate-v621";

const records = JSON.parse(fs.readFileSync("app/data/mainlineABetaStellarRawAttemptLedgerV620.generated.json", "utf8")).records as CapturedRecord[];
const copyRecord = () => structuredClone(records[0]);
const attempt = (record: CapturedRecord) => record.attemptLedger![0];

test("replays all four exact archived captures with measured field provenance", () => {
  const pack = buildPack();
  assert.equal(pack.counts.total, 4);
  assert.equal(pack.counts.parsedCandidate, 4);
  assert.equal(pack.counts.componentConfirmed, 0);
  assert.equal(verifyPackMetadata(structuredClone(pack), pack), true);
  assert.deepEqual(pack.records.map((row) => row.properMotionRaMasYr), [-35.4, -42.35, -248.73, 44.48]);
  assert.deepEqual(pack.records.map((row) => row.identifiers.length), [22, 55, 56, 46]);
  for (const row of pack.records) {
    assert.equal(row.scientificPayloadWriteback, false);
    assert.equal(row.componentSourceReference, null);
  }
});

test("recomputes artifact SHA rather than trusting copied ledger hashes", () => {
  const record = copyRecord();
  attempt(record).rawPageSha256 = "a".repeat(64);
  attempt(record).rawArtifactSha256 = "a".repeat(64);
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /SHA-256 mismatch/);
});

test("rejects artifact hash aliases that disagree", () => {
  const record = copyRecord();
  attempt(record).rawArtifactSha256 = "b".repeat(64);
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /SHA-256 mismatch/);
});

test("compares exact file byte count", () => {
  const record = copyRecord();
  attempt(record).responseBytes! += 1;
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /byte count mismatch/);
});

test("fixture metadata cannot be promoted even when the raw page has real SIMBAD markers", () => {
  const record = copyRecord();
  attempt(record).transport = "fixture-replay";
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /HTTPS HTML capture metadata/);
});

test("failed and duplicate captures cannot become the selected response", () => {
  const missing = copyRecord();
  attempt(missing).responseCaptured = 0;
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), missing), /exactly one successful capture/);
  const duplicate = copyRecord();
  duplicate.attemptLedger!.push(structuredClone(attempt(duplicate)));
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), duplicate), /exactly one successful capture/);
});

test("HTTP errors and mismatched content types cannot use an archived success body", () => {
  for (const patch of [{ httpStatus: 404 }, { contentType: "application/json" }]) {
    const record = copyRecord();
    Object.assign(attempt(record), patch);
    assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /HTTPS HTML capture metadata/);
  }
});

test("rejects paths outside the raw capture directory before reading files", () => {
  for (const value of ["../outside.raw", "docs/release/v607/raw-artifacts/r60/../../outside.raw", "C:/outside.raw"]) {
    const record = copyRecord();
    attempt(record).rawArtifactPath = value;
    assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /path outside capture root/);
  }
});

test("requires request final URL and object query identity to agree", () => {
  for (const value of ["https://example.invalid/forged", "https://user@simbad.cds.unistra.fr/simbad/sim-id?Ident=*%20alf01%20Cru", "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=*%20alf%20Vir"]) {
    const record = copyRecord();
    attempt(record).finalUrl = value;
    assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /URL or query binding invalid/);
  }
});

test("rejects relabeling one star's plan as another star", () => {
  const record = copyRecord();
  record.id = "spica";
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /plan identity mismatch/);
});

test("checks timestamp before producing a source citation ledger", () => {
  const record = copyRecord();
  attempt(record).endedAt = "not-a-capture-time";
  assert.throws(() => buildCandidateFromCapturedRecord(process.cwd(), record), /capture time invalid/);
});

test("metadata verification rejects claimed confirmation and incorrect roster counts", () => {
  const rebuilt = buildPack();
  for (const field of ["componentConfirmed", "total", "parsedCandidate", "blocked"] as const) {
    const forged = structuredClone(rebuilt);
    forged.counts[field] += 1;
    assert.deepEqual(forged.records, rebuilt.records);
    assert.throws(() => verifyPackMetadata(forged, rebuilt), /counts changed/);
  }
});

test("metadata verification rejects every opened admission or writeback boundary", () => {
  const rebuilt = buildPack();
  for (const field of Object.keys(rebuilt.boundary) as (keyof typeof rebuilt.boundary)[]) {
    const forged = structuredClone(rebuilt);
    forged.boundary[field] = !forged.boundary[field];
    assert.deepEqual(forged.records, rebuilt.records);
    assert.throws(() => verifyPackMetadata(forged, rebuilt), /boundary changed/);
  }
});

test("metadata verification binds schema and source identity despite unchanged records", () => {
  const rebuilt = buildPack();
  const wrongSchema = { ...rebuilt, schema: "forged-schema" };
  assert.throws(() => verifyPackMetadata(wrongSchema, rebuilt), /schema changed/);
  for (const field of ["path", "schema"] as const) {
    const forged = structuredClone(rebuilt);
    forged.source[field] = "forged-source";
    assert.deepEqual(forged.records, rebuilt.records);
    assert.throws(() => verifyPackMetadata(forged, rebuilt), /source changed/);
  }
});
