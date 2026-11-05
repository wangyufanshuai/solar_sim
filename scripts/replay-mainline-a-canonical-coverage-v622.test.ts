import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildReplay,
  buildFreezeReceipt,
  COVERAGE_PATH,
  emitFreezeConsoleSummary,
  freezeDecision,
  freezeDecisionReason,
  freezeReplayStable,
  lifecycleHealth,
  REPORT_PATH,
  routeHealth,
  verifyReplay,
  writeReplay,
} from "./replay-mainline-a-canonical-coverage-v622";

const root = process.cwd();
const digest = (file: string) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
function isolatedOutputRoot() {
  const directory = fs.mkdtempSync(path.join(root, "tmp", "v622-replay-contract-test-"));
  fs.mkdirSync(path.join(directory, "app/data"), { recursive: true });
  fs.copyFileSync(path.join(root, COVERAGE_PATH), path.join(directory, COVERAGE_PATH));
  return directory;
}

describe("V622 canonical replay evidence boundary", () => {
  it("keeps the current manifest read-only and does not invent observations", () => {
    const manifestPath = path.join(root, COVERAGE_PATH);
    const historicalReceipt = path.join(root, REPORT_PATH);
    const before = [digest(manifestPath), digest(historicalReceipt)];
    const report = buildReplay(root);
    assert.equal(report.coverage.counts.stars, 12);
    assert.equal(report.coverage.counts.nebulae, 12);
    assert.equal(report.coverage.counts.constellations, 12);
    assert.equal(report.evidenceClass, "static");
    assert.equal(report.evidenceScope, "static-only");
    assert.equal(report.runtimeObserved, false);
    assert.deepEqual(report.observedEvidence, { routes: 0, lifecycle: 0, source: "not-run" });
    assert.equal(report.freeze.passed, false);
    assert.equal(report.freeze.issues.filter((issue) => issue.code === "route-evidence-missing").length, 36);
    assert.equal(report.freeze.issues.filter((issue) => issue.code === "lifecycle-evidence-missing").length, 36);
    assert.deepEqual([digest(manifestPath), digest(historicalReceipt)], before);
  });

  it("reports unknown leaks and unreachable-to-this-check routes explicitly", () => {
    const report = buildReplay(root);
    const lifecycle = lifecycleHealth(report);
    assert.equal(lifecycle.leakCount, null);
    assert.equal(lifecycle.status, "not-run");
    assert.equal(lifecycle.runtimeObserved, false);
    assert.equal(lifecycle.observedLifecycleEntries, 0);
    const route = routeHealth(report);
    assert.equal(route.valid, false);
    assert.equal(route.staticCoverageValid, true);
    assert.equal(route.runtimeObserved, false);
    assert.equal(route.observedRoutes, 0);
    assert.equal(freezeDecision(report), "hold");
    assert.match(freezeDecisionReason(report), /runtime route and resource lifecycle observations missing/);
  });

  it("does not turn candidate eligibility or forged pass booleans into observed readiness", () => {
    const report = buildReplay(root);
    const forged = { ...report, candidate: { ...report.candidate, eligible: true, reasons: [] }, freeze: { ...report.freeze, passed: true, issues: [] } };
    assert.equal(freezeDecision(forged), "hold");
  });

  it("carries static-only scope into the compact receipt and console output", () => {
    const receipt = buildFreezeReceipt(root);
    assert.equal(receipt.runtimeObserved, false);
    assert.equal(receipt.evidenceScope, "static-only");
    assert.equal(receipt.gate.passed, false);
    assert.equal(receipt.lifecycleHealth.leakCount, null);
    assert.match(emitFreezeConsoleSummary(buildReplay(root)), /runtimeObserved=false/);
    assert.equal(freezeReplayStable(root), true);
  });

  it("writes a distinct immutable receipt and verifies only that new receipt", () => {
    const temporaryRoot = isolatedOutputRoot();
    const output = "docs/release/v607/fixture-static-replay.json";
    const result = writeReplay(temporaryRoot, buildReplay(temporaryRoot), output);
    assert.equal(result.status, "generated");
    assert.equal(result.freezePassed, false);
    assert.equal(result.runtimeObserved, false);
    assert.equal(result.evidenceScope, "static-only");
    const verified = verifyReplay(temporaryRoot, output);
    assert.equal(verified.status, "verified");
    assert.equal(verified.freezePassed, false);
    assert.equal(verified.runtimeObserved, false);
    const originalHash = digest(path.join(temporaryRoot, output));
    assert.throws(() => writeReplay(temporaryRoot, buildReplay(temporaryRoot), output), /already exists/);
    assert.equal(digest(path.join(temporaryRoot, output)), originalHash);
  });

  it("rejects the old synthetic freeze report without changing it", () => {
    const receipt = path.join(root, REPORT_PATH);
    const before = digest(receipt);
    assert.throws(() => verifyReplay(root), /historical receipt cannot establish runtime observation/);
    assert.equal(digest(receipt), before);
  });

  it("rejects a forged lifecycle-health replay classification", () => {
    const temporaryRoot = isolatedOutputRoot();
    const output = "docs/release/v607/forged-replay.json";
    fs.mkdirSync(path.dirname(path.join(temporaryRoot, output)), { recursive: true });
    fs.writeFileSync(path.join(temporaryRoot, output), JSON.stringify({ ...buildReplay(temporaryRoot), runtimeObserved: true }), { flag: "wx" });
    assert.throws(() => verifyReplay(temporaryRoot, output), /unsupported replay evidence classification/);
  });

  it("does not write an output outside the release directory", () => {
    const report = buildReplay(root);
    assert.throws(() => writeReplay(root, report, "app/data/forbidden-freeze.json"), /within docs\/release\/v607/);
    assert.throws(() => writeReplay(root, report, "docs/release/v607/../forbidden-freeze.json"), /within docs\/release\/v607/);
  });
});
