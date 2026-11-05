import rawCaptureJson from "../data/mainlineABetaStellarRawCaptureV619.generated.json";
import { describe, expect, it } from "vitest";
import {
  filterRawCaptureRowsV619,
  rawCaptureAllCandidateOnlyV619,
  rawCaptureAllowedContentTypeV619,
  rawCaptureAttemptLabelV619,
  rawCaptureBoundaryLabelV619,
  rawCaptureCompletionPercentV619,
  rawCaptureImmutableDigestLabelV619,
  rawCaptureNextActionV619,
  rawCaptureOpenGateV619,
  rawCapturePlanFingerprintV619,
  rawCaptureRecordSummaryV619,
  rawCaptureRequiresStructuredReviewV619,
  rawCaptureResponseIntegrityLabelV619,
  rawCaptureRetryScheduleV619,
  rawCaptureSourceIsSafeV619,
  rawCaptureServiceLabelV619,
  rawCaptureFailureCountV619,
  rawCaptureStateLabelV619,
  rawCaptureSummaryV619,
  rawCaptureTransportLabelV619,
  validateRawCaptureMetadataV619,
  validateRawCapturePackV619,
  type StellarRawCapturePackV619,
} from "./mainlineABetaStellarRawCaptureV619";

const pack = rawCaptureJson as unknown as StellarRawCapturePackV619;

describe("Mainline A stellar raw capture V619", () => {
  it("keeps four pending raw capture plans and zero responses", () => {
    expect(validateRawCapturePackV619(pack)).toBe(true);
    expect(rawCaptureSummaryV619(pack)).toMatchObject({ total: 4, pending: 4, captured: 0, rawOnly: 0, structured: 0, blocked: 0 });
    expect(rawCaptureOpenGateV619(pack)).toBe(true);
    expect(rawCaptureCompletionPercentV619(pack)).toBe(0);
    expect(pack.records.map((record) => record.plan.id)).toEqual(["acrux", "spica", "regulus", "polaris"]);
  });

  it("filters plans and exposes safe source/transport metadata", () => {
    expect(filterRawCaptureRowsV619(pack)).toHaveLength(4);
    expect(filterRawCaptureRowsV619(pack, "alf Vir")).toHaveLength(1);
    expect(pack.records.every(rawCaptureSourceIsSafeV619)).toBe(true);
    expect(rawCaptureAllCandidateOnlyV619(pack)).toBe(true);
    expect(rawCaptureTransportLabelV619(pack.records[0])).toContain("待选择");
  });

  it("makes raw-only and structured review boundaries explicit", () => {
    const record = pack.records[0];
    expect(rawCaptureStateLabelV619(record.state)).toBe("等待原始捕获");
    expect(rawCaptureNextActionV619(record)).toContain("HTTPS");
    expect(rawCaptureRecordSummaryV619(record)).toContain("acrux");
    expect(rawCaptureBoundaryLabelV619(pack)).toContain("结构化准入关闭");
    expect(rawCaptureImmutableDigestLabelV619(record)).toContain("snapshot");
  });

  it("validates pending metadata and rejects opened or unsafe states", () => {
    expect(validateRawCaptureMetadataV619(pack.records[0])).toEqual([]);
    expect(validateRawCaptureMetadataV619({ ...pack.records[0], plan: { ...pack.records[0].plan, sourceUrl: "https://example.com" } })).toContain("source-not-simbad");
    expect(validateRawCaptureMetadataV619({ ...pack.records[0], state: "raw-only", transport: null })).toContain("transport-missing");
    expect(validateRawCaptureMetadataV619({ ...pack.records[0], runtimeAdmission: "admitted" } as never)).toContain("admission-boundary-opened");
  });

  it("fails closed for forged counts, boundary and response fields", () => {
    expect(validateRawCapturePackV619({ ...pack, counts: { ...pack.counts, pending: 3 } })).toBe(false);
    expect(validateRawCapturePackV619({ ...pack, boundary: { ...pack.boundary, structuredAutoAdmission: true } })).toBe(false);
    expect(validateRawCapturePackV619({ ...pack, records: [{ ...pack.records[0], rawResponse: "fake" }, ...pack.records.slice(1)] })).toBe(false);
  });

  it("keeps raw capture state separate from scientific payload admission", () => {
    for (const record of pack.records) {
      expect(record.plan.rawResponseRequired).toBe(true);
      expect(record.plan.structuredEvidenceRequired).toBe(true);
      expect(record.plan.scientificPayloadWriteback).toBe(false);
      expect(record.runtimeAdmission).toBe("candidate-only");
      expect(record.measurementAdmission).toBe("not-admitted");
      expect(record.rawResponse).toBeNull();
      expect(rawCaptureRetryScheduleV619(record)).toEqual([500, 1500]);
      expect(rawCaptureAttemptLabelV619(record)).toContain("0/2 attempts");
      expect(rawCaptureResponseIntegrityLabelV619(record)).toBe("raw body not captured");
      expect(rawCaptureRequiresStructuredReviewV619(record)).toBe(false);
    }
  });

  it("keeps transport and content-type policy explicit", () => {
    expect(rawCaptureAllowedContentTypeV619("text/html; charset=utf-8")).toBe(true);
    expect(rawCaptureAllowedContentTypeV619("application/json")).toBe(true);
    expect(rawCaptureAllowedContentTypeV619("image/png")).toBe(false);
    expect(rawCapturePlanFingerprintV619(pack.records[0])).toContain("mainline-a-v619-acrux");
    expect(rawCaptureServiceLabelV619(pack)).toContain("structured review required");
    expect(rawCaptureFailureCountV619(pack)).toBe(0);
    expect(rawCaptureStateLabelV619(pack.records[0].state)).toBe("等待原始捕获");
  });
});
