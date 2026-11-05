import { describe, expect, it } from "vitest";
import { MAINLINE_A_NEBULA_POLICY_V623, artifactPathV623, gateForRecordV623, policyAuditReportV623, policyUrlAllowedV623, sourcePolicyIssuesV623 } from "./mainlineANebulaAcquisitionPolicyV623";
import { makeOfflineLedgerV623, type NebulaLedgerRecordV623 } from "./mainlineANebulaAcquisitionLedgerV623";

const ledger = makeOfflineLedgerV623(["ring-nebula"], { path: "expansion.json", schema: "v617" }, new Date("2026-09-14T00:00:00Z"));
const record = ledger.records[0];

describe("Nebula acquisition policy V623", () => {
  it("allowlists only credential-free HTTPS image sources", () => {
    expect(policyUrlAllowedV623("https://images-assets.nasa.gov/image/PIA.jpg")).toBe(true);
    expect(policyUrlAllowedV623("http://images-assets.nasa.gov/image/PIA.jpg")).toBe(false);
    expect(policyUrlAllowedV623("https://images-assets.nasa.gov:8443/image/PIA.jpg")).toBe(false);
    expect(sourcePolicyIssuesV623("https://example.test/image/PIA.jpg")).toContain("host-not-allowlisted");
  });

  it("creates contained artifact paths and a held report", () => {
    expect(artifactPathV623("ring-nebula", "PIA-42", "jpg")).toBe("source-cache/v623/nebulae/raw/ring-nebula-PIA-42.jpg");
    const report = policyAuditReportV623([record]);
    expect(report.summary.payloadReady).toBe(0);
    expect(report.releaseGate.passed).toBe(false);
    expect(report.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("keeps runtime and science gates closed", () => {
    const gate = gateForRecordV623(record, MAINLINE_A_NEBULA_POLICY_V623);
    expect(gate.runtime).toBe(false);
    expect(gate.scienceWriteback).toBe(false);
  });

  it("rejects a record that opens runtime admission", () => {
    const opened = { ...record, runtimeAdmission: "runtime-admitted" } as unknown as NebulaLedgerRecordV623;
    const report = policyAuditReportV623([opened]);
    expect(report.boundary.candidateOnly).toBe(true);
    expect(report.issueCounts["runtime-admission-open"]).toBe(1);
  });
});
