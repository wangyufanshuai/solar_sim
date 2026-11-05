import { describe, expect, it } from "vitest";
import {
  classifyFetchFailureV623,
  classifyRecordV623,
  durationMsV623,
  imageUrlExtensionV623,
  ledgerCountsRecomputedV623,
  ledgerFingerprintV623,
  ledgerIssuesV623,
  ledgerMarkdownV623,
  ledgerOnlyCandidateBoundaryV623,
  ledgerReportV623,
  ledgerStatusV623,
  makeOfflineLedgerV623,
  normalizeContentTypeV623,
  requestFingerprintV623,
  retryPlanV623,
  type NebulaLedgerRecordV623,
} from "./mainlineANebulaAcquisitionLedgerV623";

const source = { path: "app/data/expansion.json", schema: "mainline-a-beta-nebula-expansion-v617" } as const;
const ledger = makeOfflineLedgerV623(["ring-nebula", "omega-nebula"], source, new Date("2026-09-14T00:00:00.000Z"));

describe("Mainline A nebula acquisition ledger V623", () => {
  it("creates deterministic offline records with closed boundaries", () => {
    expect(ledger.records).toHaveLength(2);
    expect(ledgerOnlyCandidateBoundaryV623(ledger)).toBe(true);
    expect(ledgerCountsRecomputedV623(ledger)).toMatchObject({ total: 2, attempted: 2, responseCaptured: 0, payloadPresent: 0 });
    expect(ledgerIssuesV623(ledger)).toEqual([]);
    expect(ledgerStatusV623(ledger)).toBe("pending");
  });

  it("reports retry and transport classifications", () => {
    expect(classifyFetchFailureV623({ timedOut: true })).toBe("timeout");
    expect(classifyFetchFailureV623({ error: new Error("ENOTFOUND") })).toBe("dns");
    expect(classifyFetchFailureV623({ status: 503 })).toBe("http");
    expect(retryPlanV623(ledger.records[0], new Date("2026-09-14T00:01:00.000Z")).reason).toBe("latest-attempt-not-retryable");
    expect(classifyRecordV623(ledger.records[0])).toBe("network-pending");
  });

  it("normalizes URL, MIME, time and fingerprints", () => {
    expect(imageUrlExtensionV623("https://images-assets.nasa.gov/image/PIA.jpg")).toBe("jpg");
    expect(normalizeContentTypeV623("image/jpeg; charset=binary")).toBe("image/jpeg");
    expect(durationMsV623("2026-09-14T00:00:00.000Z", "2026-09-14T00:00:00.250Z")).toBe(250);
    expect(requestFingerprintV623("https://images-assets.nasa.gov/image/PIA.jpg")).toHaveLength(64);
    expect(ledgerFingerprintV623(ledger)).toHaveLength(64);
  });

  it("emits report and markdown without enabling writeback", () => {
    const report = ledgerReportV623(ledger);
    expect(report.boundary.scientificPayloadWriteback).toBe(false);
    expect(report.retryPlan).toHaveLength(2);
    expect(ledgerMarkdownV623(ledger)).toContain("Mainline A Nebula Acquisition Ledger V623");
  });

  it("detects an opened admission boundary", () => {
    const changed = { ...ledger.records[0], runtimeAdmission: "runtime-admitted" } as unknown as NebulaLedgerRecordV623;
    const altered = { ...ledger, records: [changed, ledger.records[1]] };
    expect(ledgerIssuesV623(altered)).toContain("ring-nebula:admission-boundary-open");
    expect(ledgerStatusV623(altered)).toBe("invalid");
  });
});

