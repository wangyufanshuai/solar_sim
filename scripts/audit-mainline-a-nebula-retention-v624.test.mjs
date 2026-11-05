import test from "node:test";
import assert from "node:assert/strict";
import { containedArtifact, auditRetention, inspectRetainedArtifact } from "./audit-mainline-a-nebula-retention-v624.mjs";
import { ROOT } from "./collect-mainline-a-nebula-batch-v624.mjs";

test("retention path validation rejects escape and alternate Windows syntax", () => {
  for (const value of ["../secret", "docs/release/v607/nebula-image-artifacts/r64/../x", "C:/secret", "docs\\x", "/secret"]) {
    assert.equal(containedArtifact(ROOT, value), null);
  }
  assert.ok(containedArtifact(ROOT, "docs/release/v607/nebula-image-artifacts/r64/example.jpg"));
});

test("current captured bytes recompute while rights and deletion stay closed", async () => {
  const report = await auditRetention();
  assert.equal(report.status, "verified-retention-only");
  assert.equal(report.counts.rightsUncleared, 6);
  assert.ok(report.counts.verified >= 6);
  assert.equal(report.boundary.filesDeleted, 0);
  assert.equal(report.boundary.copyrightApproval, false);
});

test("tampered digest is rejected against actual artifact bytes", async () => {
  const report = await auditRetention();
  const real = report.ledger.retention[0];
  const result = await inspectRetainedArtifact(ROOT, { ...real, sha256: "0".repeat(64) });
  assert.equal(result.status, "mismatch");
  assert.ok(result.issues.includes("sha256-mismatch"));
});
