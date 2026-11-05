import captureJson from "../data/mainlineABetaStellarFreshCaptureV618.generated.json";
import { describe, expect, it } from "vitest";
import {
  freshCaptureAllCandidateOnlyV618,
  freshCaptureBoundaryLabelV618,
  freshCaptureCandidateIdsV618,
  freshCaptureCompletionPercentV618,
  freshCaptureNextActionV618,
  freshCaptureOpenGateV618,
  freshCaptureRecordSummaryV618,
  freshCaptureServiceLabelV618,
  freshCaptureSourceIsSafeV618,
  freshCaptureStateLabelV618,
  freshCaptureImmutableDigestLabelV618,
  freshCaptureRequestTransportLabelV618,
  freshCaptureSummaryV618,
  filterFreshCaptureRowsV618,
  validateFreshCapturePackV618,
  validateFreshCapturePatchV618,
  type StellarFreshCapturePackV618,
  type StellarFreshCapturePatchV618,
} from "./mainlineABetaStellarFreshCaptureV618";

const pack = captureJson as unknown as StellarFreshCapturePackV618;

describe("Mainline A stellar fresh capture V618", () => {
  it("keeps four SIMBAD requests required and zero responses captured", () => {
    expect(validateFreshCapturePackV618(pack)).toBe(true);
    expect(freshCaptureSummaryV618(pack)).toMatchObject({ total: 4, required: 4, captured: 0, runtimeAdmitted: 0, measurementAdmitted: 0 });
    expect(freshCaptureCandidateIdsV618(pack)).toEqual(["acrux", "spica", "regulus", "polaris"]);
    expect(freshCaptureOpenGateV618(pack)).toBe(true);
    expect(freshCaptureCompletionPercentV618(pack)).toBe(0);
  });

  it("filters request rows and keeps source boundaries explicit", () => {
    expect(filterFreshCaptureRowsV618(pack, { state: "required" })).toHaveLength(4);
    expect(filterFreshCaptureRowsV618(pack, { query: "alf01 Cru" })).toHaveLength(1);
    expect(pack.records.every(freshCaptureSourceIsSafeV618)).toBe(true);
    expect(freshCaptureAllCandidateOnlyV618(pack)).toBe(true);
    expect(freshCaptureServiceLabelV618(pack)).toContain("ODbL-1.0");
  });

  it("exposes actionable labels without implying closure", () => {
    const record = pack.records[0];
    expect(freshCaptureStateLabelV618(record.state)).toBe("等待采集");
    expect(freshCaptureNextActionV618(record)).toContain("HTTPS");
    expect(freshCaptureRecordSummaryV618(record)).toContain("acrux");
    expect(freshCaptureBoundaryLabelV618(pack)).toContain("0/4 响应");
  });

  it("rejects a patch that opens admission or misses required evidence", () => {
    const base = { id: "acrux", requestId: pack.records[0].request.requestId, sourcePageUrl: pack.records[0].request.sourceUrl, capturedAt: "2026-09-14T00:00:00.000Z", captureSha256: "a".repeat(64), reviewer: null, decision: "hold", resolutionClass: "exact-component", sourceRecordDigest: "b".repeat(64), parallaxMas: 3, errorMas: 0, bibcode: null, componentIdentityDecision: "confirmed", serviceLicense: "ODbL-1.0", citation: "Wenger et al. 2000", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false } as unknown as StellarFreshCapturePatchV618;
    expect(validateFreshCapturePatchV618(base)).toEqual(expect.arrayContaining(["parallax-error-invalid", "upstream-reference-missing"]));
    expect(validateFreshCapturePatchV618({ ...base, runtimeAdmission: "admitted" } as unknown as StellarFreshCapturePatchV618)).toContain("admission-boundary-opened");
  });

  it("rejects malformed capture pack state", () => {
    expect(validateFreshCapturePackV618({ ...pack, counts: { ...pack.counts, responseCaptured: 1 } })).toBe(false);
    expect(validateFreshCapturePackV618({ ...pack, boundary: { ...pack.boundary, scientificPayloadWriteback: true } })).toBe(false);
  });

  it("keeps every request bound to its immutable source projection", () => {
    for (const record of pack.records) {
      expect(record.request.expectedSnapshotRecordDigest).toMatch(/^[a-f0-9]{64}$/);
      expect(record.request.expectedProjectionRecordDigest).toMatch(/^[a-f0-9]{64}$/);
      expect(record.request.expectedSnapshotRecordDigest).toBe(record.request.expectedProjectionRecordDigest);
      expect(record.request.responseRequired).toBe(true);
      expect(record.request.scientificPayloadWriteback).toBe(false);
    }
  });

  it("rejects a future, malformed, or foreign component reference", () => {
    const base = { id: "spica", requestId: pack.records[1].request.requestId, sourcePageUrl: pack.records[1].request.sourceUrl, capturedAt: "2026-09-13T00:00:00.000Z", captureSha256: "a".repeat(64), reviewer: null, decision: "hold", resolutionClass: "system-only-component-ambiguous", sourceRecordDigest: "b".repeat(64), expectedSnapshotRecordDigest: "c".repeat(64), expectedProjectionRecordDigest: "d".repeat(64), parallaxMas: 3, errorMas: 0.2, bibcode: "2000A&AS..143....9W", componentIdentityDecision: "confirmed", componentSourceReference: "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=component", serviceLicense: "ODbL-1.0", citation: "Wenger et al. 2000", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false } as unknown as StellarFreshCapturePatchV618;
    expect(validateFreshCapturePatchV618({ ...base, capturedAt: "2099-01-01T00:00:00.000Z" })).toContain("captured-at-not-past-utc");
    expect(validateFreshCapturePatchV618({ ...base, componentSourceReference: "https://example.com/component" })).toContain("component-source-reference-invalid");
    expect(validateFreshCapturePatchV618({ ...base, componentIdentityDecision: "ambiguous" })).toContain("component-identity-unconfirmed");
  });

  it("keeps review and admission states separate", () => {
    const record = pack.records[0];
    expect(record.reviewDecision).toBe("hold");
    expect(record.runtimeAdmission).toBe("candidate-only");
    expect(record.measurementAdmission).toBe("not-admitted");
    expect(record.patch).toBeNull();
    expect(record.response).toBeNull();
    expect(freshCaptureImmutableDigestLabelV618(record)).toContain("snapshot");
    expect(freshCaptureRequestTransportLabelV618(record)).toContain("response required");
  });
});
