import ledgerJson from "../data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
import { describe, expect, it } from "vitest";
import {
  rawAttemptErrorLabelV620,
  rawAttemptFailedClosedV620,
  rawAttemptLedgerSummaryV620,
  rawAttemptTransportLabelV620,
  validateRawAttemptLedgerV620,
  validateRawAttemptV620,
  type StellarRawAttemptLedgerV620,
} from "./mainlineABetaStellarRawAttemptLedgerV620";

const ledger = ledgerJson as unknown as StellarRawAttemptLedgerV620;

describe("Mainline A V620 raw attempt ledger", () => {
  it("verifies four attempted stars and preserves the live capture count", () => {
    expect(validateRawAttemptLedgerV620(ledger)).toBe(true);
    expect(rawAttemptLedgerSummaryV620(ledger)).toMatchObject({ total: 4, attempted: 4, responseCaptured: ledger.counts.responseCaptured, failed: ledger.counts.failed });
    expect(ledger.records.map((record) => record.id)).toEqual(["acrux", "spica", "regulus", "polaris"]);
  });
  it("keeps failed attempts artifact-free", () => {
    for (const record of ledger.records) {
      expect(record.attempts).toHaveLength(1);
      if (record.responseCaptured === 0) expect(rawAttemptFailedClosedV620(record.attempts[0])).toBe(true);
      else expect(record.attempts[0].rawArtifactSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(validateRawAttemptV620(record.attempts[0])).toEqual([]);
      expect(rawAttemptTransportLabelV620(record)).toContain(record.responseCaptured ? "HTTPS 200" : "HTTPS 失败");
    }
  });
  it("exposes network-not-run as an explicit error classification", () => {
    expect(rawAttemptErrorLabelV620("network-not-run")).toContain("未执行");
  });
  it("fails closed when a failed attempt leaks an artifact", () => {
    const row = ledger.records[0];
    const attempt = { ...row.attempts[0], responseCaptured: 0 as const, rawArtifactPath: "x.raw", rawArtifactSha256: null, responseBytes: null };
    expect(validateRawAttemptV620(attempt).some((error) => error === "failed-artifact-leak")).toBe(true);
  });
  it("fails closed when boundary flags are opened", () => {
    expect(validateRawAttemptLedgerV620({ ...ledger, boundary: { ...ledger.boundary, scientificPayloadWriteback: true } })).toBe(false);
  });
});
