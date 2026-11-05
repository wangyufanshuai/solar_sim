import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const script = path.join(root, "scripts/audit-mainline-a-r65-lifecycle-v626.mjs");
const sourcePath = path.join(root, "docs/release/v607/mainline-a-r65-performance-v625-20260922-048.json");

async function sourceReceipt() {
  return JSON.parse(await readFile(sourcePath, "utf8"));
}

async function runCase(mutator = () => {}, options = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "mainline-a-r65-lifecycle-"));
  const receiptPath = path.join(directory, "receipt.json");
  const outputPath = path.join(directory, "audit.json");
  const receipt = await sourceReceipt();
  await mutator(receipt);
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const args = [script, "--receipt", receiptPath, "--output", outputPath, "--json"];
  if (options.check) args.push("--check");
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  let audit = null;
  try { audit = JSON.parse(await readFile(outputPath, "utf8")); } catch { /* blocked writes are expected for --check */ }
  return { directory, receiptPath, outputPath, result, audit, receipt };
}

async function cleanup(caseResult) {
  await rm(caseResult.directory, { recursive: true, force: true });
}

test("current R65 receipt is audited as blocked without promoting digest-only lifecycle evidence", async () => {
  const result = await runCase();
  try {
    assert.equal(result.result.status, 0, result.result.stderr || result.result.stdout);
    assert.equal(result.audit.status, "blocked");
    assert.equal(result.audit.coverage.digestOnlyRuns, result.audit.coverage.runCount);
    assert.equal(result.audit.coverage.fullRegistryRuns, 0);
    assert.equal(result.audit.physicalMobile.status, "not-run");
    assert.equal(result.audit.longRun.status, "not-run");
    assert.ok(result.audit.blockers.includes("resource-lifecycle-digest-only"));
    assert.ok(result.audit.blockers.includes("physical-device-not-run"));
    assert.ok(result.audit.blockers.includes("long-run-observation-required"));
  } finally { await cleanup(result); }
});

test("audit preserves candidate-only and writeback boundary", async () => {
  const result = await runCase();
  try {
    assert.equal(result.audit.boundary.candidateOnly, true);
    assert.equal(result.audit.boundary.hold, true);
    assert.equal(result.audit.boundary.notAdmitted, true);
    assert.equal(result.audit.boundary.scientificPayloadWriteback, false);
    assert.ok(!result.audit.blockers.includes("scientific-payload-writeback"));
    assert.equal(result.audit.boundary.runtimePromotion, "closed");
    assert.equal(result.audit.claims.realUserValidation, false);
    assert.equal(result.audit.claims.productionPerformance, false);
    assert.equal(result.audit.claims.scientificValidity, false);
  } finally { await cleanup(result); }
});

test("digest-only baseline is a blocker even when all run rows are complete", async () => {
  const result = await runCase((receipt) => {
    for (const run of receipt.runs) {
      run.status = "complete";
      run.resources.status = "baseline";
    }
  });
  try {
    assert.equal(result.result.status, 0, result.result.stderr || result.result.stdout);
    assert.ok(result.audit.blockers.includes("resource-lifecycle-digest-only"));
    assert.equal(result.audit.claims.resourceRelease, false);
  } finally { await cleanup(result); }
});

test("forged registry maps in an unavailable digest snapshot fail closed", async () => {
  const result = await runCase((receipt) => {
    receipt.runs[0].resources.before.byOwner = { forged: { count: 0, estimatedBytes: 0 } };
  });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("digest-only-registry-claim")));
    assert.equal(result.audit.runAudits[0].status, "blocked");
  } finally { await cleanup(result); }
});

test("forged evidenceAvailable flag cannot turn digest snapshots into registry evidence", async () => {
  const result = await runCase((receipt) => {
    receipt.runs[0].resources.diff.evidenceAvailable = true;
  });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("resource-diff-overclaim")));
    assert.equal(result.audit.coverage.fullRegistryRuns, 0);
  } finally { await cleanup(result); }
});

test("baseline with different resource digests is contradictory", async () => {
  const result = await runCase((receipt) => {
    receipt.runs[0].resources.status = "baseline";
    receipt.runs[0].resources.after.identityDigest = "different-digest";
  });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("baseline-digest-mismatch")));
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("baseline-not-equal")));
  } finally { await cleanup(result); }
});

test("drift with equal digests is rejected as contradictory", async () => {
  const result = await runCase((receipt) => {
    receipt.runs[1].resources.status = "drift";
    receipt.runs[1].resources.diff.status = "drift";
    receipt.runs[1].resources.diff.evidenceAvailable = true;
    receipt.runs[1].resources.after.identityDigest = receipt.runs[1].resources.before.identityDigest;
  });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("drift-digest-contradiction")));
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("resource-diff-overclaim")));
  } finally { await cleanup(result); }
});

test("physical mobile requires an explicit signed physical-device declaration", async () => {
  const result = await runCase((receipt) => {
    receipt.observationSource.physicalMobileDevice = { kind: "physical-device", status: "passed", deviceId: "pixel", signedEvidence: false };
  });
  try {
    assert.equal(result.audit.physicalMobile.status, "blocked");
    assert.ok(result.audit.blockers.includes("physical-device-not-run"));
  } finally { await cleanup(result); }
});

test("physical mobile cannot be inferred from a mobile viewport row", async () => {
  const result = await runCase((receipt) => {
    receipt.observationSource.physicalMobileDevice = "mobile viewport 390x844";
  });
  try {
    assert.equal(result.audit.physicalMobile.status, "not-run");
    assert.ok(result.audit.blockers.includes("physical-device-not-run"));
  } finally { await cleanup(result); }
});

test("long-run metadata alone cannot satisfy the signed observation gate", async () => {
  const result = await runCase((receipt) => {
    receipt.longRunObservedMs = receipt.longRunRequestedMs;
  });
  try {
    assert.equal(result.audit.longRun.status, "not-run");
    assert.ok(result.audit.blockers.includes("long-run-observation-required"));
  } finally { await cleanup(result); }
});

test("long-run declaration requires signed evidence and requested duration", async () => {
  const result = await runCase((receipt) => {
    receipt.longRunObservedMs = receipt.longRunRequestedMs;
    receipt.longRunObservation = { status: "passed", observedMs: receipt.longRunRequestedMs, signedEvidence: false };
  });
  try {
    assert.equal(result.audit.longRun.status, "not-run");
    assert.ok(result.audit.blockers.includes("long-run-observation-required"));
  } finally { await cleanup(result); }
});

test("receipt boundary mutation is reported", async () => {
  const result = await runCase((receipt) => { receipt.boundary.scientificPayloadWriteback = true; });
  try {
    assert.ok(result.audit.blockers.includes("scientific-payload-writeback"));
    assert.equal(result.audit.boundary.scientificPayloadWriteback, true);
    assert.equal(result.audit.status, "blocked");
    assert.equal(result.audit.claims.resourceRelease, false);
  } finally { await cleanup(result); }
});

test("absent writeback declaration remains unknown and blocks qualification", async () => {
  const result = await runCase((receipt) => { delete receipt.boundary.scientificPayloadWriteback; });
  try {
    assert.equal(result.audit.boundary.scientificPayloadWriteback, null);
    assert.equal(result.audit.status, "blocked");
    assert.ok(result.audit.blockers.includes("scientific-payload-writeback"));
  } finally { await cleanup(result); }
});

test("non-boolean writeback declarations cannot masquerade as disabled", async () => {
  for (const declaration of ["false", 0, null, {}, []]) {
    const result = await runCase((receipt) => { receipt.boundary.scientificPayloadWriteback = declaration; });
    try {
      assert.equal(result.audit.boundary.scientificPayloadWriteback, null);
      assert.equal(result.audit.status, "blocked");
      assert.ok(result.audit.blockers.includes("scientific-payload-writeback"));
    } finally { await cleanup(result); }
  }
});

test("missing boundary does not invent observed safe booleans", async () => {
  const result = await runCase((receipt) => { delete receipt.boundary; });
  try {
    assert.deepEqual(result.audit.boundary, {
      candidateOnly: null,
      hold: null,
      notAdmitted: null,
      scientificPayloadWriteback: null,
      runtimePromotion: null,
    });
    assert.ok(result.audit.blockers.includes("boundary-missing"));
    assert.equal(result.audit.status, "blocked");
  } finally { await cleanup(result); }
});

test("other boundary booleans preserve unsafe false and unknown values separately", async () => {
  const result = await runCase((receipt) => {
    receipt.boundary.candidateOnly = false;
    receipt.boundary.hold = "true";
    delete receipt.boundary.notAdmitted;
  });
  try {
    assert.equal(result.audit.boundary.candidateOnly, false);
    assert.equal(result.audit.boundary.hold, null);
    assert.equal(result.audit.boundary.notAdmitted, null);
    assert.ok(result.audit.blockers.includes("candidate-only-boundary"));
    assert.ok(result.audit.blockers.includes("hold-boundary"));
    assert.ok(result.audit.blockers.includes("not-admitted-boundary"));
  } finally { await cleanup(result); }
});

test("run build identity mismatch is reported independently of receipt identity", async () => {
  const result = await runCase((receipt) => { receipt.runs[0].build.head = "forged-head"; });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("run-build-mismatch")));
    assert.equal(result.audit.runAudits[0].status, "blocked");
  } finally { await cleanup(result); }
});

test("duplicate run ids do not count as independent observations", async () => {
  const result = await runCase((receipt) => { receipt.runs[1].runId = receipt.runs[0].runId; });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("duplicate-run-id")));
    assert.equal(result.audit.coverage.runCount, receiptRunCount(result.receipt));
  } finally { await cleanup(result); }
});

function receiptRunCount(receipt) {
  return Array.isArray(receipt.runs) ? receipt.runs.length : 0;
}

test("invalid mobile viewport classification is blocked", async () => {
  const result = await runCase((receipt) => { receipt.runs[3].device = "desktop"; });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("device-viewport-mismatch")));
  } finally { await cleanup(result); }
});

test("missing timestamps and frames remain blocked", async () => {
  const result = await runCase((receipt) => {
    delete receipt.runs[0].startedAt;
    receipt.runs[0].frame.sampleCount = 0;
  });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("started-at-invalid")));
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("frame-samples-missing")));
  } finally { await cleanup(result); }
});

test("missing resource snapshots are never interpreted as release", async () => {
  const result = await runCase((receipt) => { delete receipt.runs[0].resources.after; });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("resource-snapshot-missing")));
    assert.equal(result.audit.claims.resourceRelease, false);
  } finally { await cleanup(result); }
});

test("unsupported scenario is rejected", async () => {
  const result = await runCase((receipt) => { receipt.runs[0].scenario = "long-run"; });
  try {
    assert.ok(result.audit.blockers.some((entry) => entry.startsWith("scenario-invalid")));
  } finally { await cleanup(result); }
});

test("saved audit check passes for unchanged source and output", async () => {
  const generated = await runCase();
  try {
    assert.equal(generated.result.status, 0, generated.result.stderr || generated.result.stdout);
    const checked = spawnSync(process.execPath, [script, "--receipt", generated.receiptPath, "--output", generated.outputPath, "--json", "--check"], { cwd: root, encoding: "utf8" });
    assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  } finally { await cleanup(generated); }
});

test("saved audit check rejects tampered report contents", async () => {
  const generated = await runCase();
  try {
    generated.audit.coverage.runCount += 1;
    await writeFile(generated.outputPath, `${JSON.stringify(generated.audit, null, 2)}\n`, "utf8");
    const checked = spawnSync(process.execPath, [script, "--receipt", generated.receiptPath, "--output", generated.outputPath, "--json", "--check"], { cwd: root, encoding: "utf8" });
    assert.notEqual(checked.status, 0);
    assert.match(checked.stdout, /saved-audit-digest|saved-audit-content/);
  } finally { await cleanup(generated); }
});

test("saved audit check rejects a source receipt mutation", async () => {
  const generated = await runCase();
  try {
    const changed = { ...generated.receipt, notes: [...generated.receipt.notes, "tampered"] };
    await writeFile(generated.receiptPath, `${JSON.stringify(changed, null, 2)}\n`, "utf8");
    const checked = spawnSync(process.execPath, [script, "--receipt", generated.receiptPath, "--output", generated.outputPath, "--json", "--check"], { cwd: root, encoding: "utf8" });
    assert.notEqual(checked.status, 0);
    assert.match(checked.stdout, /source-receipt-sha256|saved-audit-content/);
  } finally { await cleanup(generated); }
});
