import test from "node:test";
import assert from "node:assert/strict";
import { replayBatch } from "./replay-mainline-a-nebula-batch-v624.mjs";

test("R64 replay verifies captured artifacts and leaves rights pending", async () => {
  const report = await replayBatch();
  assert.equal(report.status, "verified-with-rights-pending");
  assert.equal(report.counts.recomputed.total, 6);
  assert.equal(report.counts.recomputed.captured, report.counts.recomputed.artifactVerified);
  assert.equal(report.counts.recomputed.rightsPending, 6);
  assert.equal(report.boundary.scientificPayloadWriteback, false);
});

test("R64 replay rejects forged response/artifact linkage", async () => {
  const report = await replayBatch();
  const forged = structuredClone((await import("../app/data/mainlineANebulaBatchV624.generated.json", { with: { type: "json" } })).default);
  forged.rows[0].network.responseCaptured = 0;
  forged.rows[0].network.artifact = { ...forged.rows[0].network.artifact };
  const result = await replayBatch(forged);
  assert.ok(result.blockers.includes("artifact-without-response"));
  assert.equal(report.counts.recomputed.total, 6);
});

test("R64 replay fails closed for non-rights blockers", async () => {
  const source = structuredClone((await import("../app/data/mainlineANebulaBatchV624.generated.json", { with: { type: "json" } })).default);
  const cases = [
    ["request-fingerprint-invalid", (batch) => { batch.rows[0].network.attempts[0].requestFingerprint = "0".repeat(64); }],
    ["offline-telemetry-forged", (batch) => { batch.rows[0].network.attempts[0].requestExecuted = false; }],
    ["roster-heart-nebula", (batch) => { batch.rows[0].id = "forged-nebula"; }],
    ["declared-count-captured", (batch) => { batch.counts.captured = 0; }],
    ["boundary-invalid", (batch) => { batch.boundary.scientificPayloadWriteback = true; }],
    ["historical-sha-mismatch", (batch) => { batch.rows[0].historical.sha256 = "f".repeat(64); }],
  ];
  for (const [expected, mutate] of cases) {
    const forged = structuredClone(source);
    mutate(forged);
    const report = await replayBatch(forged);
    assert.equal(report.status, "invalid", expected);
    assert.ok(report.blockers.includes(expected), `${expected}: ${report.blockers.join(",")}`);
  }
});

test("R64 replay verifies every captured attempt linkage and rejects escaped artifacts", async () => {
  const source = structuredClone((await import("../app/data/mainlineANebulaBatchV624.generated.json", { with: { type: "json" } })).default);
  const captured = source.rows[0].network.attempts.find((attempt) => attempt.responseCaptured === 1);
  assert.ok(captured?.rawArtifactPath);
  const escaped = structuredClone(source);
  escaped.rows[0].network.artifact.path = "docs/release/v607/nebula-image-artifacts/r64/../outside.jpg";
  const escapedReport = await replayBatch(escaped);
  assert.equal(escapedReport.status, "invalid");
  assert.ok(escapedReport.blockers.includes("artifact-path-escape"));
  const notExecuted = structuredClone(source);
  notExecuted.rows[0].network.attempts[1].requestExecuted = false;
  const notExecutedReport = await replayBatch(notExecuted);
  assert.equal(notExecutedReport.status, "invalid");
  assert.ok(notExecutedReport.blockers.includes("offline-telemetry-forged"));
});

test("R64 replay returns a fail-closed report for malformed arrays", async () => {
  const source = structuredClone((await import("../app/data/mainlineANebulaBatchV624.generated.json", { with: { type: "json" } })).default);
  const malformedRows = await replayBatch({ ...source, rows: null });
  assert.equal(malformedRows.status, "invalid");
  assert.ok(malformedRows.blockers.includes("rows-invalid"));
  const malformedAttempts = structuredClone(source);
  malformedAttempts.rows[0].network.attempts = null;
  const attemptsReport = await replayBatch(malformedAttempts);
  assert.equal(attemptsReport.status, "invalid");
  assert.ok(attemptsReport.blockers.includes("row-shape-invalid"));
  const malformedRedirects = structuredClone(source);
  malformedRedirects.rows[0].network.attempts[0].redirectChain = null;
  const redirectsReport = await replayBatch(malformedRedirects);
  assert.equal(redirectsReport.status, "invalid");
  assert.ok(redirectsReport.blockers.includes("redirect-chain-invalid"));
});
