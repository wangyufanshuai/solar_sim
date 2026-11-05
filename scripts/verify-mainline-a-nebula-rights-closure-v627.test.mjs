import assert from "node:assert/strict";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ROOT, DEFAULT_OUTPUT, buildClosure } from "./build-mainline-a-nebula-rights-closure-v627.mjs";
import {
  VERIFY_SCHEMA,
  verifyBoundary,
  verifyRows,
  verifySidecars,
  verifyRecomputedClosure,
  verifyClosure,
  parseVerifyArgs,
} from "./verify-mainline-a-nebula-rights-closure-v627.mjs";

test("verifier accepts the current pending receipt as valid evidence", async () => {
  const result = await verifyClosure({ root: ROOT });
  assert.equal(result.schema, VERIFY_SCHEMA);
  assert.equal(result.valid, true);
  assert.equal(result.status, "pending");
  assert.equal(result.receiptStatus, "pending");
  assert.equal(result.issueCount, 0);
  assert.equal(result.boundary.scientificPayloadWriteback, false);
});

test("verifier replays source digests and projection", async () => {
  const receipt = (await buildClosure({ root: ROOT, runId: "verify-test" })).receipt;
  const issues = await verifyRecomputedClosure(ROOT, receipt);
  assert.deepEqual(issues, []);
});

test("verifier rejects open scientific or copyright boundary", async () => {
  const receipt = (await buildClosure({ root: ROOT, runId: "boundary-test" })).receipt;
  receipt.boundary.scientificPayloadWriteback = true;
  receipt.claims.copyrightApproval = true;
  const issues = verifyBoundary(receipt);
  assert.equal(issues.some((issue) => issue.code === "boundary-scientificPayloadWriteback-invalid"), true);
  assert.equal(issues.some((issue) => issue.code === "copyright-approval-open"), true);
});

test("verifier rejects duplicate, unknown, and synthetic rows", async () => {
  const receipt = (await buildClosure({ root: ROOT, runId: "row-test" })).receipt;
  receipt.rows[0].id = "fixture-nebula";
  receipt.rows[1].id = receipt.rows[2].id;
  receipt.rows[3].issues.push({ code: "synthetic-or-fixture-evidence", detail: "fixture" });
  const issues = verifyRows(receipt);
  assert.equal(issues.some((issue) => issue.code === "row-duplicate-id"), true);
  assert.equal(issues.some((issue) => issue.code === "row-missing-id"), true);
  assert.equal(issues.some((issue) => issue.code === "receipt-synthetic-marker"), true);
});

test("sidecar verification detects drift", async () => {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), "nebula-verify-v627-"));
  try {
    const root = path.join(temp, "root");
    await fsp.mkdir(path.join(root, "docs/release/v607"), { recursive: true });
    const source = await fsp.readFile(path.join(ROOT, DEFAULT_OUTPUT), "utf8");
    await fsp.writeFile(path.join(root, DEFAULT_OUTPUT), source);
    const receipt = JSON.parse(source);
    for (const relative of [receipt.replay.jsonl, receipt.replay.csv, receipt.replay.markdown]) await fsp.copyFile(path.join(ROOT, relative), path.join(root, relative));
    const before = await verifySidecars(root, receipt);
    assert.deepEqual(before, []);
    await fsp.appendFile(path.join(root, receipt.replay.csv), "drift\n");
    const after = await verifySidecars(root, receipt);
    assert.equal(after.some((issue) => issue.code === "sidecar-stale"), true);
  } finally {
    await fsp.rm(temp, { recursive: true, force: true });
  }
});

test("argument parser supports explicit receipt paths and no recompute", () => {
  const args = parseVerifyArgs(["--root", "E:/workspace", "--output", "docs/release/v607/x.json", "--no-recompute"]);
  assert.equal(args.root, path.resolve("E:/workspace"));
  assert.equal(args.output, "docs/release/v607/x.json");
  assert.equal(args.noRecompute, true);
});
