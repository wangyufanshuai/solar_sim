import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { BETA_IDS, EXPECTED_SEAL, digest, projectSnapshot, renderProjection, run } from "./project-mainline-a-beta-stellar.mjs";

const snapshot = JSON.parse(readFileSync(new URL("../docs/release/post-v593/source-snapshots/simbad-stellar-24-2026-08-25.json", import.meta.url), "utf8"));
function reseal(value) {
  const unsigned = { ...value };
  delete unsigned.snapshotSha256;
  return { ...unsigned, snapshotSha256: digest(unsigned) };
}
function changedRow(id, mutate) {
  const copy = structuredClone(snapshot);
  mutate(copy.records.find((row) => row.id === id));
  return reseal(copy);
}

test("existing source seal yields eight references and four explicit gaps", () => {
  const projected = projectSnapshot(snapshot);
  assert.equal(projected.snapshotSha256, EXPECTED_SEAL);
  assert.equal(projected.rows.length, BETA_IDS.length);
  assert.equal(projected.rows.filter((row) => row.presentationReferenceReady).length, 8);
  assert.deepEqual(projected.rows.filter((row) => !row.presentationReferenceReady).map((row) => row.id), ["acrux", "spica", "regulus", "polaris"]);
  assert.equal(projected.generatedFromExistingSnapshot, true);
  assert.ok(projected.rows.every((row) => row.measurementAdmission === "not-admitted"));
});

test("changed source bytes cannot pass the pinned canonical seal", () => {
  const corrupted = structuredClone(snapshot);
  corrupted.records[0].parallax.valueMas += 1;
  assert.throws(() => projectSnapshot(corrupted), /seal mismatch/);
  const resealed = reseal(corrupted);
  assert.throws(() => projectSnapshot(resealed), /seal mismatch/);
});

test("record digests and values bind to the precise source row", () => {
  for (const row of projectSnapshot(snapshot).rows) {
    const original = snapshot.records.find((candidate) => candidate.id === row.id);
    assert.equal(row.sourceRecordDigest, digest(original));
    assert.equal(row.simbadIdentifier, original.mainId);
    assert.equal(row.parallaxMas, original.parallax.valueMas);
    assert.equal(row.errorMas, original.parallax.errorMas);
    assert.equal(row.bibcode, original.parallax.bibcode);
  }
});

test("missing and non-positive parallax are never filled from another field", () => {
  for (const value of [null, 0, -3]) {
    const modified = changedRow("altair", (row) => { row.parallax.valueMas = value; });
    const row = projectSnapshot(modified, modified.snapshotSha256).rows.find((item) => item.id === "altair");
    assert.equal(row.presentationReferenceReady, false);
    assert.ok(row.blockingReasons.includes("positive-parallax-missing"));
    assert.equal(row.parallaxMas, value);
  }
});

test("unresolved identities, missing uncertainty and absent bibliography stay blocked", () => {
  const modified = changedRow("altair", (row) => {
    row.queryStatus = "unresolved";
    row.parallax.errorMas = null;
    row.parallax.bibcode = "";
  });
  const row = projectSnapshot(modified, modified.snapshotSha256).rows.find((item) => item.id === "altair");
  assert.deepEqual(row.blockingReasons, ["source-unresolved", "parallax-error-missing", "upstream-reference-missing"]);
});

test("a valid seal cannot hide duplicate or missing requested objects", () => {
  const duplicate = structuredClone(snapshot);
  duplicate.records.push(duplicate.records[0]);
  const sealedDuplicate = reseal(duplicate);
  assert.throws(() => projectSnapshot(sealedDuplicate, sealedDuplicate.snapshotSha256), /Duplicate/);
  const missing = structuredClone(snapshot);
  missing.records = missing.records.filter((row) => row.id !== "altair");
  const sealedMissing = reseal(missing);
  assert.throws(() => projectSnapshot(sealedMissing, sealedMissing.snapshotSha256), /Missing Beta/);
});

test("projection output is deterministic and the checked-in projection is current", () => {
  assert.equal(renderProjection(projectSnapshot(snapshot)), renderProjection(projectSnapshot(snapshot)));
  const root = new URL("../", import.meta.url);
  assert.equal(run({ root: decodeURIComponent(root.pathname).replace(/^\/(\w:)/, "$1"), check: true }).check, true);
});
