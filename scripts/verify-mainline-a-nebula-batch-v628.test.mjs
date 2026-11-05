import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { verifyBatchFile } from "./verify-mainline-a-nebula-batch-v628.mjs";
import { run, OUTPUT, OFFLINE_OUTPUT } from "./collect-mainline-a-nebula-batch-v628.mjs";

async function makeRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solar-v628-verify-"));
  await fs.mkdir(path.join(root, "app", "data"), { recursive: true });
  await fs.copyFile(path.join(process.cwd(), "app/data/mainlineANebulaRightsPackV613.generated.json"), path.join(root, "app/data/mainlineANebulaRightsPackV613.generated.json"));
  return root;
}

test("verifier returns a recomputable SHA for the offline ledger", async () => {
  const root = await makeRoot();
  await run({ root, offline: true });
  const report = verifyBatchFile(root, OFFLINE_OUTPUT);
  assert.equal(report.status, "passed");
  assert.match(report.fileSha256, /^[a-f0-9]{64}$/);
  assert.equal(report.recomputed.captured, 0);
  assert.equal(report.boundary.scientificPayloadWriteback, false);
});

test("verifier fails closed when the requested batch file is absent", async () => {
  const root = await makeRoot();
  const report = verifyBatchFile(root, OUTPUT);
  assert.equal(report.status, "blocked");
  assert.deepEqual(report.errors, ["batch-file-missing"]);
});

test("verifier reports tampering after the JSON remains parseable", async () => {
  const root = await makeRoot();
  await run({ root, offline: true });
  const absolute = path.join(root, OFFLINE_OUTPUT);
  const batch = JSON.parse(await fs.readFile(absolute, "utf8"));
  batch.rows[0].network.artifact = { path: "docs/release/v607/nebula-image-artifacts/r68/ghost.jpg", sha256: "a".repeat(64), bytes: 1, width: 1, height: 1, format: "jpg" };
  await fs.writeFile(absolute, `${JSON.stringify(batch)}\n`, "utf8");
  const report = verifyBatchFile(root, OFFLINE_OUTPUT);
  assert.equal(report.status, "blocked");
  assert.ok(report.shapeIssues.some((issue) => issue.includes("artifact-without-capture")));
});
