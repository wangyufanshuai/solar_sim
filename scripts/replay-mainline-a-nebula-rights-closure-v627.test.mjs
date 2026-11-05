import assert from "node:assert/strict";
import test from "node:test";
import { ROOT, buildClosure } from "./build-mainline-a-nebula-rights-closure-v627.mjs";
import {
  REPLAY_SCHEMA,
  DEFAULT_REPLAY_OUTPUT,
  eventForRow,
  replayDigest,
  replaySummary,
  createReplay,
  replayProjection,
  verifyReplay,
  replayFromCurrent,
  checkReplay,
} from "./replay-mainline-a-nebula-rights-closure-v627.mjs";

test("replay emits deterministic twelve-row event ledger", async () => {
  const receipt = (await buildClosure({ root: ROOT, runId: "replay-test" })).receipt;
  const replay = createReplay(receipt);
  assert.equal(replay.schema, REPLAY_SCHEMA);
  assert.equal(replay.events.length, 12);
  assert.equal(replay.status, "pending");
  assert.equal(replay.summary.rightsCleared, 0);
  assert.equal(replay.summary.responseCaptured, 6);
  assert.equal(verifyReplay(replay).length, 0);
});

test("event replay classifies fixture rows as blocked", () => {
  const row = { id: "synthetic-nebula", source: "batch", status: "blocked", sourceClosed: false, responseCaptured: false, artifactVerified: false, rightsCleared: false, issues: [{ code: "synthetic-or-fixture-evidence" }] };
  const event = eventForRow(row, 99);
  assert.equal(event.status, "blocked");
  assert.deepEqual(event.issueCodes, ["synthetic-or-fixture-evidence"]);
  const summary = replaySummary([event]);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.issueCodes["synthetic-or-fixture-evidence"], 1);
});

test("replay digest changes when a rights decision changes", async () => {
  const receipt = (await buildClosure({ root: ROOT, runId: "digest-test" })).receipt;
  const first = createReplay(receipt);
  const changed = structuredClone(first);
  changed.events[0].rightsCleared = true;
  assert.notEqual(first.replayDigest, replayDigest(changed.events));
  assert.equal(verifyReplay(changed).includes("replay-digest-mismatch"), true);
});

test("replay projection ignores generated timestamp but not evidence", async () => {
  const receipt = (await buildClosure({ root: ROOT, runId: "projection-test" })).receipt;
  const first = createReplay(receipt);
  const second = structuredClone(first);
  second.generatedAt = "2099-01-01T00:00:00.000Z";
  assert.equal(replayProjection(first), replayProjection(second));
  second.events[0].issueCodes.push("new-issue");
  assert.notEqual(replayProjection(first), replayProjection(second));
});

test("current replay receipt is checkable without mutation", async () => {
  const result = await checkReplay(ROOT, DEFAULT_REPLAY_OUTPUT);
  assert.equal(result.status, "pending");
  assert.equal(result.summary.total, 12);
});

test("replay-from-current retains parent source digest", async () => {
  const replay = await replayFromCurrent({ root: ROOT });
  assert.equal(replay.parent.sourceDigests.batch.length, 64);
  assert.equal(replay.parent.sourceDigests.ledger.length, 64);
  assert.equal(replay.boundary.scientificPayloadWriteback, false);
});
