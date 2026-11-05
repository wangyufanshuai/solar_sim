import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311,
  KERR_DENSE_SHARD_TRUTH_FILE_SHA256_V311,
  parseKerrDenseShardTruthAuditV311,
} from "./kerrDenseShardTruthV311";

const auditPath = resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/audits/shard-00.truth-audit-v311.json");
const readAudit = () => JSON.parse(readFileSync(auditPath, "utf8"));

describe("v311 dense shard 0 scientific truth audit", () => {
  it("locks the immutable negative evidence and preserves the campaign state", () => {
    const bytes = readFileSync(auditPath);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(KERR_DENSE_SHARD_TRUTH_FILE_SHA256_V311);
    const audit = parseKerrDenseShardTruthAuditV311(JSON.parse(bytes.toString("utf8")));
    expect(audit.truthAuditSha256).toBe(KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311);
    expect(audit).toMatchObject({
      status: "failed-tolerance-ladder-degenerate",
      shard: { rayCount: 64, executionCount: 512, rayClassCounts: { capture: 26, escape: 34, "disk-hit": 4 } },
      campaign: { status: "incomplete-1-of-49", completedShardCount: 1, nextShardIndex: 1, campaignStateMutationApplied: false, nextShardAttempted: false },
      qualification: { structuralShardStatus: "qualified", denseToleranceConvergenceStatus: "withdrawn", aggregateEligible: false },
    });
  });

  it("proves cross-ray diversity but zero effective tolerance separation", () => {
    const audit = parseKerrDenseShardTruthAuditV311(readAudit());
    expect(audit.crossRayNonDegeneracy).toMatchObject({
      uniqueSpinCount: 7,
      uniqueSelectedEventParameterCount: 122,
      uniqueRedshiftCount: 7,
      uniqueWalkerPenroseEvpaCount: 4,
      uniqueGeometryFingerprintCount: 128,
      passed: true,
    });
    expect(audit.toleranceLadder).toMatchObject({
      expectedPairCount: 256,
      strictSolverLadderPairCount: 0,
      geometryDistinctPairCount: 0,
      stepCountDistinctPairCount: 0,
      residualDistinctPairCount: 0,
      allPairsUseSameSolverTolerance: true,
      allGeometryPayloadsDuplicateAcrossTolerance: true,
      passed: false,
    });
    for (const formula of Object.values(audit.toleranceLadder.solverToleranceByFormulaAndClass)) {
      expect(formula).toEqual({ release: [2.3e-14], internal: [2.3e-14] });
    }
  });

  it("pins the source of the degeneracy instead of relabeling thresholds", () => {
    const source = readFileSync(resolve(process.cwd(), "scripts/run-kerr-authority-v296.py"), "utf8");
    expect(source).toContain("solver_tolerance = max(2.3e-14, tolerance * 1e-4)");
    expect(1e-10 * 1e-4).toBeLessThan(2.3e-14);
    expect(1e-12 * 1e-4).toBeLessThan(2.3e-14);
    const auditScript = readFileSync(resolve(process.cwd(), "scripts/audit-kerr-dense-shard-v311.py"), "utf8");
    expect(auditScript).toContain("atomic_json(OUTPUT, output)");
    expect(auditScript).not.toContain("atomic_json(STATE");
  });

  it("fails closed on status, tolerance counts or continuation drift", () => {
    const status = readAudit();
    status.status = "qualified";
    expect(() => parseKerrDenseShardTruthAuditV311(status)).toThrow("v311-audit-identity-invalid");
    const ladder = readAudit();
    ladder.toleranceLadder.strictSolverLadderPairCount = 256;
    expect(() => parseKerrDenseShardTruthAuditV311(ladder)).toThrow("v311-tolerance-ladder-result-invalid");
    const continuation = readAudit();
    continuation.qualification.denseCampaignContinuation = "eligible";
    expect(() => parseKerrDenseShardTruthAuditV311(continuation)).toThrow("v311-qualification-boundary-invalid");
  });
});
