import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  validateWebLongRunCandidateInputsV648,
  replayWebLongRunCandidateSupplementV648,
} from "./build-mainline-a-web-longrun-candidate-v648.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
let control;
async function historicalControl() {
  if (control) return control;
  const [build, raw, replay] = await Promise.all([
    readJson("docs/release/v607/mainline-a-r66-build-20261007-v647web02.json"),
    readJson("docs/release/v607/mainline-a-r66-web-r65-browser-final-raw-20261007-v647web02.json"),
    readJson("docs/release/v607/mainline-a-r66-web-r65-longrun-replay-20261007-v647web02.json"),
  ]);
  const sourceSha = build.inputBefore.sha256;
  control = { sourceSha,
    values: {
      base: { schema: "mainline-a-web-candidate-package-v648",
        status: "candidate-blocked-current-source", sourceSha256: sourceSha,
        buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
        branch: build.branch, head: build.head,
        counts: { humanRightsSigned: 0, stellarPhysicalComponentConfirmed: 0 },
        gates: { publicWebRelease: "blocked", nebulaRightsSignoff: "pending-0-of-12",
          stellarPhysicalComponentIdentity: "pending-0-of-4" },
        claims: { releaseApproved: false, copyrightApproval: false,
          scientificValidity: false } },
      build, raw, formal: raw, replay,
      binding: { schema: "mainline-a-web-r65-current-longrun-v648",
        status: "verified-current-source-local-longrun", sourceSha256: sourceSha,
        buildId: build.buildId, runtimeBuildId: build.runtimeBuildId,
        currentSourceLongRuns: 2, issues: [],
        observations: raw.observations.map((row) => ({ sessionId: row.sessionId, digest: row.digest })),
        claims: { productionPerformance: false, physicalMobile: false } },
    } };
  return control;
}

test("historical run is a positive contract control only for its own source", async () => {
  const { values, sourceSha } = await historicalControl();
  const result = validateWebLongRunCandidateInputsV648(values, sourceSha);
  assert.equal(result.longRuns, 2);
  assert.equal(result.rightsSigned, 0);
  assert.equal(result.publicWebRelease, "blocked");
});
test("rights promotion and a stale current-source binding reject the supplement", async () => {
  const { values, sourceSha } = await historicalControl();
  assert.throws(() => validateWebLongRunCandidateInputsV648(
    { ...values, base: { ...values.base, counts: { humanRightsSigned: 12 } } }, sourceSha),
  /base-candidate-invalid/);
  assert.throws(() => validateWebLongRunCandidateInputsV648(
    { ...values, base: { ...values.base,
      gates: { ...values.base.gates, stellarPhysicalComponentIdentity: "confirmed-4-of-4" } } },
  sourceSha), /base-candidate-invalid/);
  assert.throws(() => validateWebLongRunCandidateInputsV648(
    { ...values, binding: { ...values.binding, sourceSha256: "0".repeat(64) } }, sourceSha),
  /current-longrun-binding-invalid/);
});
test("fabricated raw status and swapped formal observation cannot pass", async () => {
  const { values, sourceSha } = await historicalControl();
  assert.throws(() => validateWebLongRunCandidateInputsV648(
    { ...values, raw: { ...values.raw, status: "blocked" } }, sourceSha), /raw-longrun-invalid/);
  assert.throws(() => validateWebLongRunCandidateInputsV648(
    { ...values, formal: { ...values.formal, observations: [
      { ...values.formal.observations[0], digest: "forged" }, values.formal.observations[1]] } },
  sourceSha), /formal-longrun-drift/);
});
test("saved supplement replay rejects a claimed release approval or changed evidence pin", () => {
  const fresh = { schema: "mainline-a-web-candidate-longrun-supplement-v648",
    status: "candidate-blocked-current-source-longrun-qualified",
    sourceSha256: "a".repeat(64), buildId: "build", runtimeBuildId: "runtime",
    evidence: [{ sha256: "b".repeat(64) }],
    buildArtifactPins: [{ sha256: "c".repeat(64) }],
    observations: [{ sessionId: "one" }, { sessionId: "two" }],
    counts: { currentSourceLongRuns: 2, humanRightsSigned: 0 },
    gates: { publicWebRelease: "blocked" },
    claims: { releaseApproved: false, productionPerformance: false },
    boundary: { scientificPayloadWriteback: false } };
  assert.equal(replayWebLongRunCandidateSupplementV648(fresh, fresh).currentSourceLongRuns, 2);
  assert.throws(() => replayWebLongRunCandidateSupplementV648(
    { ...fresh, claims: { ...fresh.claims, releaseApproved: true } }, fresh),
  /saved-supplement-replay-mismatch/);
  assert.throws(() => replayWebLongRunCandidateSupplementV648(
    { ...fresh, evidence: [{ sha256: "0".repeat(64) }] }, fresh),
  /saved-supplement-replay-mismatch/);
  assert.throws(() => replayWebLongRunCandidateSupplementV648(
    { ...fresh, counts: { ...fresh.counts, stellarPhysicalComponentConfirmed: 4 } }, fresh),
  /saved-supplement-replay-mismatch/);
});
