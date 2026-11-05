import { describe, expect, it } from "vitest";
import data from "../data/mainlineANebulaBatchV624.generated.json";
import type { NebulaBatchPackV624 } from "./mainlineANebulaBatchViewV624";
import {
  auditNebulaBatchV624,
  exportNebulaAuditV624,
  planNebulaArtifactRetentionV624,
} from "./mainlineANebulaBatchAuditV624";

function pack(): NebulaBatchPackV624 {
  return structuredClone(data) as unknown as NebulaBatchPackV624;
}

describe("R64 real batch ledger audit", () => {
  it("connects every selected artifact and keeps rights on hold", () => {
    const report = auditNebulaBatchV624(pack());
    expect(report.counts.blockingFindings).toBe(0);
    expect(report.counts.rightsUncleared).toBe(6);
    expect(report.gates.find((gate) => gate.id === "rights-clearance")?.status).toBe("hold");
    expect(report.retention.length).toBeGreaterThanOrEqual(6);
    expect(report.cleanupMode).toBe("report-only-no-deletion");
    expect(JSON.parse(exportNebulaAuditV624(report))).toEqual(report);
  });

  it("does not turn a blocked rights row into clearance", () => {
    const input = pack();
    const changed = { ...input, rows: input.rows.map((row) => ({ ...row, rights: { ...row.rights, status: "blocked" } })) };
    const report = auditNebulaBatchV624(changed);
    expect(report.counts.rightsUncleared).toBe(6);
    expect(report.gates.find((gate) => gate.id === "rights-clearance")?.status).toBe("hold");
  });

  it("rejects fixtures forged as successful offline responses", () => {
    const input = pack();
    const changed = { ...input, rows: input.rows.map((row) => ({
      ...row, network: { ...row.network, attempts: row.network.attempts.map((attempt) => ({ ...attempt, requestExecuted: false })) },
    })) };
    const report = auditNebulaBatchV624(changed);
    expect(report.counts.blockingFindings).toBeGreaterThan(0);
    expect(report.findings.map((entry) => entry.code)).toContain("offline-response-claim");
    expect(report.retention.every((entry) => entry.action === "quarantine")).toBe(true);
  });

  it("rejects declared count and admission tampering", () => {
    const input = pack();
    const report = auditNebulaBatchV624({
      ...input,
      counts: { ...input.counts, captured: 99 },
      boundary: { ...input.boundary, scientificPayloadWriteback: true },
    });
    expect(report.findings.map((entry) => entry.code)).toEqual(expect.arrayContaining(["count-mismatch-captured", "batch-boundary-open"]));
    expect(report.gates.every((gate) => gate.status === "fail")).toBe(true);
  });

  it("retains evidence and quarantines conflicting references without deletion", () => {
    const input = pack();
    const row = input.rows.find((item) => item.network.artifact)!;
    const captured = row.network.attempts.find((attempt) => attempt.responseCaptured === 1)!;
    const changed = { ...row, network: { ...row.network, attempts: [
      ...row.network.attempts, { ...captured, attempt: 999, rawPageSha256: "0".repeat(64) },
    ] } };
    const plan = planNebulaArtifactRetentionV624([changed]);
    expect(plan.find((entry) => entry.path === captured.rawArtifactPath)?.action).toBe("quarantine");
    expect(plan.find((entry) => entry.path === captured.rawArtifactPath)?.references.length).toBeGreaterThan(1);
  });

  it("fails empty batches instead of passing zero of zero gates", () => {
    const input = pack();
    const report = auditNebulaBatchV624({ ...input, rows: [] });
    expect(report.findings.map((entry) => entry.code)).toContain("empty-batch");
    expect(report.gates.every((gate) => gate.status === "fail")).toBe(true);
  });
});
