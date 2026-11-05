import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v628.mjs";
import { run, OUTPUT, OFFLINE_OUTPUT } from "./collect-mainline-a-nebula-batch-v628.mjs";

async function makeRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solar-v628-replay-"));
  await fs.mkdir(path.join(root, "app", "data"), { recursive: true });
  await fs.copyFile(path.join(process.cwd(), "app/data/mainlineANebulaRightsPackV613.generated.json"), path.join(root, "app/data/mainlineANebulaRightsPackV613.generated.json"));
  return root;
}

test("replay recomputes six rows and keeps the writeback flag false", async () => {
  const root = await makeRoot();
  await run({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  const report = replayBatch(batch, root);
  assert.equal(report.status, "passed");
  assert.deepEqual(report.recomputed, { total: 6, captured: 0, sourcePagePending: 6 });
  assert.deepEqual(report.boundary, { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
});

test("replay blocks responseCaptured without a linked artifact and blocks promoted rights", async () => {
  const root = await makeRoot();
  await run({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  batch.rows[0].network.responseCaptured = 1;
  batch.rows[0].network.status = "captured";
  batch.rows[0].rights.status = "cleared";
  batch.rows[0].rights.signoffStatus = "cleared";
  const report = replayBatch(batch, root);
  assert.equal(report.status, "blocked");
  assert.ok(report.integrityIssues.some((issue) => issue.includes("captured-artifact-missing")));
  assert.ok(report.integrityIssues.some((issue) => issue.includes("rights-promoted")));
});

test("replay blocks unknown roster rows and fixture URLs", async () => {
  const root = await makeRoot();
  await run({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  batch.rows[0].id = "fixture-row";
  batch.rows[0].source.url = "https://example.invalid/fixture.jpg";
  const report = replayBatch(batch, root);
  assert.equal(report.status, "blocked");
  assert.ok(report.shapeIssues.some((issue) => issue.includes("roster-jellyfish-nebula")));
  assert.ok(report.integrityIssues.some((issue) => issue.includes("synthetic-marker")));
});

test("replay count mismatch cannot be hidden by a valid row shape", async () => {
  const root = await makeRoot();
  await run({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  batch.counts.captured = 6;
  const report = replayBatch(batch, root);
  assert.equal(report.status, "blocked");
  assert.ok(report.countIssues.includes("count-captured-mismatch"));
});
