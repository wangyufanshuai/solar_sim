import { describe, expect, it } from "vitest";
import {
  filterStellarSourceClosureV616,
  sourceClosureCompletionPercentV616,
  sourceClosureDecisionLabelV616,
  sourceClosureFreshCaptureLabelV616,
  sourceClosureCompletenessPercentV616,
  sourceClosureFingerprintV616,
  sourceClosureIdentityEqualV616,
  sourceClosurePatchCanBeReviewedV616,
  sourceClosureOpenGateLabelsV616,
  sourceClosurePatchFingerprintV616,
  sourceClosurePackSummaryLabelV616,
  sourceClosureBoundaryIsImmutableV616,
  sourceClosureCandidateCountV616,
  sourceClosureHasPendingCaptureV616,
  sourceClosureNeedsHumanReviewV616,
  sourceClosureRecordSummaryV616,
  sourceClosureMissingEvidenceCountV616,
  sourceClosureRecordIsSealedV616,
  sourceClosureAllCandidateOnlyV616,
  sourceClosureRequiredEvidenceLabelsV616,
  applyStellarSourceClosurePatchV616,
  stellarSourceClosureHasOpenGateV616,
  stellarSourceClosureMissingLabelsV616,
  stellarSourceClosureNextActionV616,
  stellarSourceClosureStatusLabelV616,
  stellarSourceClosureStatusToneV616,
  summarizeStellarSourceClosureV616,
  validateStellarSourceClosurePackV616,
  validateStellarSourceClosurePatchV616,
  type StellarSourceClosurePackV616,
} from "./mainlineABetaStellarSourceClosureV616";

const record = (id: string, missingEvidence: string[] = ["component-identity"] ) => ({
  id, queryIdentifier: `* ${id}`, sourcePageUrl: "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=x", snapshotSha256: "a".repeat(64), snapshotRecordDigest: "a".repeat(64), projectionRecordDigest: "b".repeat(64), resolutionClass: "system-only-component-ambiguous", completeness: { sourceIdentifier: true, queryResolved: true, positiveParallax: true, parallaxError: true, upstreamReference: true, componentIdentity: false }, requiredEvidence: ["component-identity"], missingEvidence, status: "fresh-capture-required" as const, reviewDecision: "hold" as const, runtimeAdmission: "candidate-only" as const, measurementAdmission: "not-admitted" as const, scientificPayloadWriteback: false as const, freshCapture: { sourceUrl: "https://simbad.cds.unistra.fr", capturedAt: null, captureSha256: null, reviewer: null },
});

const pack = (records = [record("spica"), record("regulus", ["positive-parallax", "upstream-reference"])]) => ({ schema: "mainline-a-beta-stellar-source-closure-v616", generatedAt: "2026-09-14T00:00:00Z", source: { snapshotPath: "snapshot.json", projectionPath: "projection.ts", snapshotSha256: "a".repeat(64), snapshotContentSha256: "b".repeat(64), projectionContentSha256: "c".repeat(64), serviceLicense: "ODbL-1.0", citation: "citation" }, counts: { total: records.length, freshCaptureRequired: records.length, missingEvidence: records.reduce((total, item) => total + item.missingEvidence.length, 0), candidateOnly: records.length }, boundary: { legalDecision: "not-granted", runtimeWrites: false, measurementWrites: false, scientificPayloadWriteback: false }, records }) as StellarSourceClosurePackV616;

describe("Mainline A stellar source closure v616", () => {
  it("summarizes pending captures and keeps gates open", () => {
    const fixture = pack();
    expect(summarizeStellarSourceClosureV616(fixture)).toMatchObject({ total: 2, freshCaptureRequired: 2, missingEvidence: 3, candidateOnly: 2, openGates: 2, completeRecords: 0 });
    expect(sourceClosureCompletionPercentV616(fixture)).toBe(0);
    expect(sourceClosureMissingEvidenceCountV616(fixture)).toBe(3);
    expect(sourceClosureAllCandidateOnlyV616(fixture)).toBe(true);
    expect(stellarSourceClosureHasOpenGateV616(fixture.records[0])).toBe(true);
  });

  it("filters missing evidence and query identifiers", () => {
    const records = pack().records;
    expect(filterStellarSourceClosureV616(records, { missingEvidence: "positive-parallax" })).toHaveLength(1);
    expect(filterStellarSourceClosureV616(records, { query: "spica" })).toHaveLength(1);
  });

  it("labels actions without granting legal or runtime admission", () => {
    const spica = pack().records[0];
    expect(stellarSourceClosureStatusLabelV616("fresh-capture-required")).toContain("采集");
    expect(stellarSourceClosureStatusToneV616("fresh-capture-required")).toBe("warning");
    expect(stellarSourceClosureMissingLabelsV616(spica)).toContain("组件身份");
    expect(stellarSourceClosureNextActionV616(spica)).toContain("组件身份");
  });

  it("validates boundary and compares source identity", () => {
    const fixture = pack();
    expect(validateStellarSourceClosurePackV616(fixture)).toBe(fixture);
    expect(sourceClosureIdentityEqualV616(fixture.records[0], { ...fixture.records[0] })).toBe(true);
    expect(sourceClosureFingerprintV616(fixture.records[0])).toContain("spica");
    expect(() => validateStellarSourceClosurePackV616({ ...fixture, boundary: { ...fixture.boundary, runtimeWrites: true } })).toThrow(/boundary/);
    const forged = structuredClone(fixture);
    forged.records[0].runtimeAdmission = "admitted";
    expect(() => validateStellarSourceClosurePackV616(forged)).toThrow(/admission/);
  });

  it("reports required evidence labels and completeness", () => {
    const spica = pack().records[0];
    expect(sourceClosureRequiredEvidenceLabelsV616(spica)).toEqual(["组件身份"]);
    expect(sourceClosureCompletenessPercentV616(spica)).toBe(83);
  });

  it("validates a fresh capture patch but keeps it in capture-review", () => {
    const spica = pack().records[0];
    const patch = { id: "spica", sourcePageUrl: "https://simbad.cds.unistra.fr/new", capturedAt: "2026-09-14T01:00:00Z", captureSha256: "e".repeat(64), reviewer: "reviewer-a", decision: "hold" as const, resolutionClass: "exact-component", sourceRecordDigest: "f".repeat(64), parallaxMas: 13, errorMas: 0.7, bibcode: "2007A&A...474..653V", componentIdentityDecision: "confirmed" as const };
    expect(validateStellarSourceClosurePatchV616(patch)).toEqual([]);
    expect(sourceClosurePatchCanBeReviewedV616(spica, patch)).toBe(true);
    const reviewed = applyStellarSourceClosurePatchV616(spica, patch);
    expect(reviewed.status).toBe("capture-review");
    expect(reviewed.reviewDecision).toBe("hold");
    expect(reviewed.runtimeAdmission).toBe("candidate-only");
    expect(reviewed.freshCapture.capturedAt).toBe(patch.capturedAt);
  });

  it("rejects unsafe source patches before any state transition", () => {
    const spica = pack().records[0];
    const bad = { id: "spica", sourcePageUrl: "http://insecure", capturedAt: "yesterday", captureSha256: "bad", reviewer: "", decision: "cleared" as const, resolutionClass: "system-only-component-ambiguous", sourceRecordDigest: "bad", parallaxMas: 0, errorMas: -1, bibcode: null, componentIdentityDecision: "ambiguous" as const };
    const errors = validateStellarSourceClosurePatchV616(bad);
    expect(errors).toEqual(expect.arrayContaining(["source-url-invalid", "capture-sha-invalid", "cleared-identity-unconfirmed", "parallax-invalid"]));
    expect(sourceClosurePatchCanBeReviewedV616(spica, bad)).toBe(false);
    expect(() => applyStellarSourceClosurePatchV616(spica, bad)).toThrow(/patch rejected/);
  });

  it("keeps receipt labels and seals deterministic", () => {
    const spica = pack().records[0];
    expect(sourceClosureDecisionLabelV616(spica.reviewDecision)).toBe("暂缓");
    expect(sourceClosureFreshCaptureLabelV616(spica)).toBe("尚未采集新快照");
    expect(sourceClosureRecordIsSealedV616(spica)).toBe(true);
    expect(sourceClosureRecordIsSealedV616({ ...spica, sourcePageUrl: "http://insecure" })).toBe(false);
    expect(sourceClosureOpenGateLabelsV616(spica)).toEqual(["source-evidence", "fresh-capture", "review-decision", "runtime-admission"]);
    expect(sourceClosureRecordSummaryV616(spica)).toContain("spica");
    expect(sourceClosurePackSummaryLabelV616(pack())).toContain("2 candidates");
    expect(sourceClosureBoundaryIsImmutableV616(pack())).toBe(true);
    expect(sourceClosureCandidateCountV616(pack())).toBe(2);
    expect(sourceClosureHasPendingCaptureV616(pack().records[0])).toBe(true);
    expect(sourceClosureNeedsHumanReviewV616(pack().records[0])).toBe(true);
  });

  it("fingerprints a valid patch without including mutable decision state", () => {
    const patch = { id: "spica", sourcePageUrl: "https://simbad.cds.unistra.fr/new", capturedAt: "2026-09-14T01:00:00Z", captureSha256: "e".repeat(64), reviewer: "reviewer-a", decision: "hold" as const, resolutionClass: "exact-component", sourceRecordDigest: "f".repeat(64), parallaxMas: 13, errorMas: 0.7, bibcode: "2007A&A...474..653V", componentIdentityDecision: "confirmed" as const };
    expect(sourceClosurePatchFingerprintV616(patch)).toContain("spica");
    expect(sourceClosurePatchFingerprintV616({ ...patch, decision: "rejected" })).not.toBe(sourceClosurePatchFingerprintV616(patch));
  });
});
