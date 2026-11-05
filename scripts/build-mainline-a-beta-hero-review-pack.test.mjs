import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  OUTPUT_PATH,
  PACK_SCHEMA,
  PENDING_IDS,
  PROJECTION_PATH,
  SNAPSHOT_PATH,
  buildPack,
  loadProjectionSource,
  loadSealedSnapshot,
  verifyPack,
  verifyProjectionAgainstSnapshot,
} from "./build-mainline-a-beta-hero-review-pack.mjs";

const root = process.cwd();
const script = path.join(root, "scripts/build-mainline-a-beta-hero-review-pack.mjs");
const output = path.join(root, OUTPUT_PATH);

function readOutput() {
  return JSON.parse(fs.readFileSync(output, "utf8"));
}

function withOutputMutation(mutator, assertion) {
  const original = fs.readFileSync(output, "utf8");
  try {
    const value = JSON.parse(original);
    mutator(value);
    fs.writeFileSync(output, JSON.stringify(value));
    assertion();
  } finally {
    fs.writeFileSync(output, original);
  }
}

test("builds a sealed, deterministic review pack for exactly four unresolved heroes", () => {
  execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
  const pack = readOutput();
  assert.equal(pack.schema, PACK_SCHEMA);
  assert.equal(pack.generatedAt, "2026-08-25T11:26:00Z");
  assert.equal(pack.sourceCount, 24);
  assert.equal(pack.pendingCount, 4);
  assert.equal(pack.runtimeClearedCount, 20);
  assert.equal(pack.measurementWriteback, false);
  assert.equal(pack.generatedFromExistingSnapshot, true);
  assert.deepEqual(pack.records.map((row) => row.id), PENDING_IDS);
  assert.ok(pack.records.every((row) => row.state === "evidence-pending"));
  assert.ok(pack.records.every((row) => row.runtimeAdmission === "not-admitted"));
});

test("keeps source identity, digest and review-hold fields for every record", () => {
  const pack = readOutput();
  for (const row of pack.records) {
    assert.match(row.simbadIdentifier, /^\* /);
    assert.match(row.sourceRecordDigest, /^[a-f0-9]{64}$/);
    assert.ok(["exact-component", "system-only-component-ambiguous"].includes(row.resolutionClass));
    assert.ok(Array.isArray(row.blockingReasons));
    assert.ok(row.blockingReasons.length > 0);
    assert.equal(row.review.identity, "pending");
    assert.equal(row.review.parallax, "pending");
    assert.equal(row.review.upstreamReference, "pending");
    assert.equal(row.review.reviewer, null);
    assert.equal(row.review.reviewedAt, null);
    assert.equal(row.review.decision, "hold");
    assert.equal(row.measurementAdmission, "not-admitted");
  }
});

test("check mode compares the entire pack, not only a projection hash", () => {
  const fields = [
    ["schema", "tampered-schema"],
    ["sourceCount", 25],
    ["pendingCount", 3],
    ["runtimeClearedCount", 21],
    ["measurementWriteback", true],
  ];
  for (const [field, value] of fields) {
    withOutputMutation((pack) => { pack[field] = value; }, () => {
      assert.throws(() => execFileSync(process.execPath, [script, "--check"], { cwd: root, encoding: "utf8", stdio: "pipe" }), /hero review pack/);
    });
  }
});

test("check mode rejects a tampered nested record and restores the file", () => {
  const mutations = [
    (pack) => { pack.records[0].state = "presentation-ready"; },
    (pack) => { pack.records[1].sourceRecordDigest = "0".repeat(64); },
    (pack) => { pack.records[2].review.decision = "accept"; },
    (pack) => { pack.records[3].blockingReasons = []; },
    (pack) => { pack.sourceSnapshot.sha256 = "0".repeat(64); },
  ];
  for (const mutate of mutations) {
    withOutputMutation(mutate, () => {
      assert.throws(() => execFileSync(process.execPath, [script, "--check"], { cwd: root, encoding: "utf8", stdio: "pipe" }), /hero review pack/);
    });
  }
  execFileSync(process.execPath, [script, "--check"], { cwd: root, encoding: "utf8" });
});

test("projection verification rejects a source row edit even when the module parses", () => {
  const snapshot = loadSealedSnapshot(root);
  const { projection } = loadProjectionSource(root);
  const edited = structuredClone(projection);
  edited.rows.find((row) => row.id === "spica").simbadIdentifier = "* alf Vir A";
  assert.throws(() => verifyProjectionAgainstSnapshot(root, edited, snapshot), /does not match/);
});

test("projection verification rejects a forged source seal", () => {
  const snapshot = loadSealedSnapshot(root);
  const { projection } = loadProjectionSource(root);
  const forged = { ...projection, snapshotSha256: "0".repeat(64) };
  assert.throws(() => verifyProjectionAgainstSnapshot(root, forged, snapshot), /does not match/);
});

test("buildPack recomputes the content hash from the current sealed snapshot", () => {
  const pack = buildPack({ root });
  const snapshotBytes = fs.readFileSync(path.join(root, SNAPSHOT_PATH));
  const projectionBytes = fs.readFileSync(path.join(root, PROJECTION_PATH));
  const rebuilt = buildPack({ root });
  assert.equal(pack.sourceSnapshot.contentSha256, rebuilt.sourceSnapshot.contentSha256);
  assert.equal(pack.projection.sha256, rebuilt.projection.sha256);
  assert.equal(pack.sourceSnapshot.contentSha256.length, 64);
  assert.equal(pack.projection.sha256.length, 64);
  assert.ok(snapshotBytes.length > 1000);
  assert.ok(projectionBytes.length > 1000);
});

test("verifyPack accepts only the canonical generated shape", () => {
  const expected = buildPack({ root });
  assert.deepEqual(verifyPack(expected, expected), { status: "verified", pendingCount: 4, output: OUTPUT_PATH });
  const reordered = structuredClone(expected);
  reordered.records.reverse();
  assert.throws(() => verifyPack(reordered, expected), /differs/);
  const extra = structuredClone(expected);
  extra.records[0].extra = "unexpected";
  assert.throws(() => verifyPack(extra, expected), /differs/);
});

test("the CLI check remains green after all mutations are restored", () => {
  execFileSync(process.execPath, [script, "--check"], { cwd: root, encoding: "utf8" });
  assert.equal(readOutput().records.length, PENDING_IDS.length);
});
