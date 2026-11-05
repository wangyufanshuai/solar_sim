import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  buildWebCandidatePackageV648, replaySavedWebCandidateV648,
  validateWebCandidateV648,
} from "./build-mainline-a-web-candidate-v648.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceSha = "4f5a5614bacd1e7ebf7111a3f575083691cfdad4c40fcda8ce1044dd8cc95ab9";
const paths = {
  build: "mainline-a-r66-build-20261007-v648web01.json",
  rights: "mainline-a-r66-web-nebula-rights-20261007-v648web01.json",
  pageHttp: "mainline-a-r66-http-20261007-v648web01.json",
  assetHttp: "mainline-a-r66-web-nebula-http-20261007-v648web01.json",
  browser: "mainline-a-r66-web-nebula-browser-20261007-v648web02.json",
  visual: "mainline-a-r66-web-visual-20261007-v648web02.json",
  performance: "mainline-a-r66-web-performance-20261007-v648perf01.json",
  round: "mainline-a-r66-web-v648-round-20261007.json",
  codeChange: "mainline-a-r66-web-v648-code-change-20261007.json",
  externalSource: "mainline-a-r66-v646-evidence-supplement-20261007.json",
};
async function values() {
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, file]) =>
    [key, JSON.parse(await readFile(path.join(root, "docs/release/v607", file), "utf8"))])));
}

test("current V648 candidate inputs remain blocked with ten current evidence records", async () => {
  const result = validateWebCandidateV648(await values(), sourceSha);
  assert.equal(result.publicWebRelease, "blocked");
  assert.equal(result.rightsSigned, 0);
  assert.equal(result.longRunQualified, false);
  const packageReceipt = await buildWebCandidatePackageV648();
  assert.equal(packageReceipt.status, "candidate-blocked-current-source");
  assert.equal(packageReceipt.evidence.length, 10);
  assert.equal(packageReceipt.buildArtifactPins.length, 7);
});
test("a forged approval in rights, browser or round cannot promote the package", async () => {
  for (const mutate of [
    (value) => { value.rights.counts.humanRightsSigned = 12; },
    (value) => { value.browser.signedRights = 12; },
    (value) => { value.round.status.publicWebRelease = "approved"; },
  ]) {
    const input = await values();
    mutate(input);
    assert.throws(() => validateWebCandidateV648(input, sourceSha));
  }
});
test("stale HTTP bytes, false long-run qualification or source promotion are rejected", async () => {
  for (const mutate of [
    (value) => { value.assetHttp.counts.matched = 11; },
    (value) => { value.performance.longRunStatus = "qualified"; },
    (value) => { value.externalSource.sourceSha256 = sourceSha; },
  ]) {
    const input = await values();
    mutate(input);
    assert.throws(() => validateWebCandidateV648(input, sourceSha));
  }
});
test("saved packet replays only with unchanged build and evidence pins", async () => {
  const fresh = await buildWebCandidatePackageV648();
  const saved = JSON.parse(await readFile(path.join(root,
    "docs/release/v607/mainline-a-r66-web-candidate-20261007-v648web02.json"), "utf8"));
  assert.equal(replaySavedWebCandidateV648(saved, fresh).status,
    "replayed-candidate-blocked-current-source");
  assert.throws(() => replaySavedWebCandidateV648(
    { ...saved, evidence: [{ ...saved.evidence[0], sha256: "0".repeat(64) },
      ...saved.evidence.slice(1)] }, fresh), /saved-replay-mismatch/);
  assert.throws(() => replaySavedWebCandidateV648(
    { ...saved, claims: { ...saved.claims, releaseApproved: true } }, fresh),
  /saved-replay-mismatch/);
  assert.throws(() => replaySavedWebCandidateV648(
    { ...saved, counts: { ...saved.counts, stellarPhysicalComponentConfirmed: 4 } }, fresh),
  /saved-replay-mismatch/);
});
