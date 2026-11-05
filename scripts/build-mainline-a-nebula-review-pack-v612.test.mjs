import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  OUTPUT_PATH,
  PACK_SCHEMA,
  PROJECTION_PATH,
  buildPack,
  inspectLocalAsset,
  loadProjectionSource,
  readManifestMetadata,
  run,
  verifyPack,
  verifyProjectionAgainstManifests,
} from "./build-mainline-a-nebula-review-pack-v612.mjs";

const root = process.cwd();
const script = path.join(root, "scripts/build-mainline-a-nebula-review-pack-v612.mjs");
const output = path.join(root, OUTPUT_PATH);

function readOutput() {
  return JSON.parse(fs.readFileSync(output, "utf8"));
}

function mutateOutput(mutator, assertion) {
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

test("builds all 18 candidates with verified local payload evidence", () => {
  execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
  const pack = readOutput();
  assert.equal(pack.schema, PACK_SCHEMA);
  assert.equal(pack.candidateCount, 18);
  assert.equal(pack.generatedAt, "2026-08-20T00:00:00Z");
  assert.equal(pack.localEvidenceVerifiedCount, 18);
  assert.equal(pack.runtimeAdmissionCount, 0);
  assert.equal(pack.scienceImagePayloadAllowed, false);
  assert.equal(pack.counts["rights-review"], 18);
  assert.ok(pack.records.every((record) => record.state === "rights-review"));
  assert.ok(pack.records.every((record) => record.localEvidence.status === "verified"));
});

test("records preserve source, manifest and local evidence identity", () => {
  const pack = readOutput();
  const ids = new Set();
  for (const record of pack.records) {
    assert.ok(!ids.has(record.id));
    ids.add(record.id);
    assert.match(record.source.url, /^https:\/\//);
    assert.match(record.source.sha256, /^[a-f0-9]{64}$/);
    assert.match(record.provenance.manifestSha256, /^[a-f0-9]{64}$/);
    assert.equal(record.localEvidence.path, record.source.localPath);
    assert.equal(record.localEvidence.bytes, record.source.bytes);
    assert.equal(record.localEvidence.sha256, record.source.sha256);
    assert.deepEqual(record.localEvidence.dimensions, { width: record.source.width, height: record.source.height });
    assert.deepEqual(record.blockers, ["rights-policy-review", "visual-crop-signoff", "runtime-admission"]);
    assert.equal(record.runtime.candidateOnly, true);
    assert.equal(record.runtime.visualAssetAdmitted, false);
    assert.equal(record.reviewer.decision, "pending");
  }
  assert.equal(ids.size, 18);
});

test("projection verification rejects a generated-row edit", () => {
  const projection = loadProjectionSource(root);
  const edited = structuredClone(projection);
  edited.rows[0].source.sha256 = "0".repeat(64);
  assert.throws(() => verifyProjectionAgainstManifests(root, edited), /differs from sealed manifests/);
});

test("projection verification rejects a duplicate candidate identity", () => {
  const projection = loadProjectionSource(root);
  const edited = structuredClone(projection);
  edited.rows[1].id = edited.rows[0].id;
  assert.throws(() => verifyProjectionAgainstManifests(root, edited), /differs from sealed manifests|duplicate/);
});

test("local evidence inspection detects byte and digest tampering", () => {
  const pack = buildPack({ root });
  const source = pack.records[0].source;
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "nebula-v612-"));
  const target = path.join(temp, path.basename(source.localPath));
  fs.copyFileSync(path.join(root, source.localPath), target);
  const row = { source: { ...source, localPath: target } };
  const clean = inspectLocalAsset(root, { source: { ...source, localPath: source.localPath } });
  assert.equal(clean.status, "verified");
  const before = fs.readFileSync(target);
  const mutated = Buffer.from(before);
  mutated[mutated.length - 1] ^= 0xff;
  fs.writeFileSync(target, Buffer.concat([mutated, Buffer.from([0])]));
  const tampered = inspectLocalAsset(root, row);
  assert.equal(tampered.status, "mismatch");
  assert.ok(tampered.risks.includes("local-digest-mismatch"));
  assert.ok(tampered.risks.includes("local-bytes-mismatch"));
  fs.rmSync(temp, { recursive: true, force: true });
});

test("local evidence inspection fails closed for a missing payload", () => {
  const pack = buildPack({ root });
  const source = pack.records[0].source;
  const result = inspectLocalAsset(root, { source: { ...source, localPath: "source-cache/does-not-exist.jpg" } });
  assert.equal(result.status, "missing");
  assert.deepEqual(result.risks, ["local-payload-missing"]);
});

test("manifest metadata captures content hashes and the latest generation", () => {
  const metadata = readManifestMetadata(root);
  assert.equal(metadata.length, 3);
  assert.ok(metadata.every((item) => /^[a-f0-9]{64}$/.test(item.contentSha256)));
  assert.ok(metadata.every((item) => typeof item.generatedAt === "string"));
  assert.deepEqual(metadata.map((item) => item.path), [
    "public/data/living-universe-v592/nebula-visual-assets.json",
    "public/data/living-universe-v592/nebula-extended-visual-assets.json",
    "public/data/living-universe-v592/nebula-closure-visual-assets.json",
  ]);
});

test("check mode compares the complete nested pack", () => {
  const fields = [
    (pack) => { pack.schema = "tampered"; },
    (pack) => { pack.localEvidenceVerifiedCount = 17; },
    (pack) => { pack.sourceManifests[0].contentSha256 = "0".repeat(64); },
    (pack) => { pack.records[0].state = "admission-ready"; },
    (pack) => { pack.records[1].localEvidence.status = "missing"; },
    (pack) => { pack.records[2].runtime.candidateOnly = false; },
    (pack) => { pack.records[3].reviewer.decision = "accept"; },
  ];
  for (const mutate of fields) mutateOutput(mutate, () => {
    assert.throws(() => execFileSync(process.execPath, [script, "--check"], { cwd: root, encoding: "utf8", stdio: "pipe" }), /nebula review pack v612/);
  });
  execFileSync(process.execPath, [script, "--check"], { cwd: root, encoding: "utf8" });
});

test("verifyPack accepts the generated pack and rejects reordered records", () => {
  const expected = buildPack({ root });
  assert.deepEqual(verifyPack(expected, expected), { status: "verified", candidateCount: 18, localEvidenceVerifiedCount: 18, output: OUTPUT_PATH });
  const reordered = structuredClone(expected);
  reordered.records.reverse();
  assert.throws(() => verifyPack(reordered, expected), /differs from verified local evidence/);
});

test("run check remains deterministic after generation", () => {
  const first = run({ root, check: true });
  const second = run({ root, check: true });
  assert.deepEqual(first, second);
  assert.equal(fs.existsSync(path.join(root, PROJECTION_PATH)), true);
});
