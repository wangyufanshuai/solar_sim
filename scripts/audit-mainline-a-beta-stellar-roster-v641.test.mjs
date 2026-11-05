import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT, PACK_PATH, auditRosterPack, canonical, digest, runNegativeProbes, validateRosterPack } from "./audit-mainline-a-beta-stellar-roster-v641.mjs";

const pack = JSON.parse(fs.readFileSync(path.resolve(ROOT, PACK_PATH), "utf8"));

test("V641 audit validates the current 24-row pack", () => {
  assert.deepEqual(validateRosterPack(pack), []);
  const receipt = auditRosterPack(pack);
  assert.equal(receipt.status, "verified-candidate-only");
  assert.equal(receipt.counts.roster, 24);
  assert.equal(receipt.counts.runtimeExisting, 20);
  assert.equal(receipt.counts.candidateHold, 4);
  assert.equal(receipt.validation.negativePassed, 5);
});

test("V641 audit recomputes every captured raw artifact", () => {
  const receipt = auditRosterPack(pack);
  assert.equal(receipt.counts.sourceArtifactBacked, 8);
  assert.equal(receipt.counts.artifactRecomputed, 8);
  assert.ok(receipt.artifacts.every((artifact) => artifact.exists && artifact.sha256 === artifact.declaredSha256));
});

test("V641 negative cases fail closed", () => {
  const cases = runNegativeProbes(pack);
  assert.equal(cases.length, 5);
  assert.ok(cases.every((entry) => entry.rejected));
  assert.deepEqual(cases.map((entry) => entry.name), ["duplicate-id", "admission", "synthetic-source", "fingerprint", "component-promotion"]);
});

test("V641 canonical digest is stable and ignores object insertion order", () => {
  const first = digest({ z: 1, a: { y: 2, x: 3 } });
  const second = digest({ a: { x: 3, y: 2 }, z: 1 });
  assert.equal(first, second);
  assert.equal(typeof canonical({ a: 1 }), "object");
});

test("V641 input cannot be promoted by flipping the boundary or candidate decision", () => {
  const copy = structuredClone(pack);
  copy.boundary.scientificPayloadWriteback = true;
  assert.ok(validateRosterPack(copy).some((entry) => entry.code === "boundary:scientificPayloadWriteback"));
  const candidate = copy.records.find((row) => row.id === "polaris");
  candidate.decision = "existing-reference";
  assert.ok(validateRosterPack(copy).some((entry) => entry.code === "decision"));
});
