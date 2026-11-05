import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { auditBatch, run, AUDIT_OUTPUT } from "./audit-mainline-a-nebula-batch-v628.mjs";
import { OFFLINE_OUTPUT, OUTPUT, run as collect } from "./collect-mainline-a-nebula-batch-v628.mjs";

async function makeRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "solar-v628-audit-"));
  await fs.mkdir(path.join(root, "app", "data"), { recursive: true });
  await fs.copyFile(path.join(process.cwd(), "app/data/mainlineANebulaRightsPackV613.generated.json"), path.join(root, "app/data/mainlineANebulaRightsPackV613.generated.json"));
  return root;
}

test("audit distinguishes clean telemetry from pending source and rights gates", async () => {
  const root = await makeRoot();
  await collect({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  const report = await auditBatch(batch, root);
  assert.equal(report.status, "pending-gates");
  assert.equal(report.counts.findings, 0);
  assert.deepEqual(report.boundary, { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
  assert.equal(report.gates.sourcePage.observed, 0);
  assert.equal(report.gates.rightsSignoff.observed, 0);
});

test("audit verifies successful artifact bytes, dimensions and attempt linkage", async () => {
  const root = await makeRoot();
  await collect({ root, maxRetries: 0, fetchImpl: async () => new Response(Buffer.from("not-an-image"), { status: 200, headers: { "content-type": "image/jpeg" } }) }).catch(() => {});
  await collect({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  const report = await auditBatch(batch, root);
  assert.equal(report.counts.rows, 6);
  assert.equal(report.counts.hardFindings, 0);
});

test("audit catches a forged artifact link and keeps the batch blocked", async () => {
  const root = await makeRoot();
  await collect({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  batch.rows[0].network.responseCaptured = 1;
  batch.rows[0].network.status = "captured";
  batch.rows[0].network.artifact = { path: "docs/release/v607/nebula-image-artifacts/r68/fake.jpg", sha256: "a".repeat(64), bytes: 1, width: 1, height: 1, format: "jpg" };
  const report = await auditBatch(batch, root);
  assert.equal(report.status, "blocked");
  assert.ok(report.findings.some((finding) => finding.code === "capture-not-linked-to-attempt"));
});

test("audit run writes a durable report and check mode is read-only", async () => {
  const root = await makeRoot();
  await collect({ root, offline: true });
  const generated = await run({ root, input: OFFLINE_OUTPUT, output: AUDIT_OUTPUT });
  assert.equal(generated.status, "pending-gates");
  assert.equal(generated.output, AUDIT_OUTPUT);
  const before = await fs.readFile(path.join(root, AUDIT_OUTPUT), "utf8");
  const checked = await run({ root, input: OFFLINE_OUTPUT, output: AUDIT_OUTPUT, check: true });
  assert.equal(checked.status, "pending-gates");
  assert.equal(await fs.readFile(path.join(root, AUDIT_OUTPUT), "utf8"), before);
});

test("audit input identity mismatches cannot be hidden by valid row telemetry", async () => {
  const root = await makeRoot();
  await collect({ root, offline: true });
  const batch = JSON.parse(await fs.readFile(path.join(root, OFFLINE_OUTPUT), "utf8"));
  batch.sourceIdentity.inputs[0].sha256 = "b".repeat(64);
  const report = await auditBatch(batch, root);
  assert.equal(report.status, "blocked");
  assert.ok(report.findings.some((finding) => finding.code === "input-sha-mismatch"));
});
