import { describe, expect, it } from "vitest";
import { nebulaCandidateReviewRows, type NebulaReviewRow } from "./mainlineANebulaReviewV610";
import {
  RIGHTS_EVIDENCE_SCHEMA,
  assessNebulaRightsEvidence,
  assessNebulaRightsQueue,
  canClearNebulaRights,
  createPendingNebulaRightsEvidence,
  mergeNebulaRightsEvidence,
  recordNebulaRightsDecision,
  rightsEvidenceFingerprint,
  rightsEvidenceRiskLabel,
  rightsEvidenceCompletionPercent,
  rightsEvidenceDecisionLabel,
  rightsEvidenceQueueFingerprint,
  rightsEvidenceStatusLabel,
  isNebulaRightsEvidence,
  parseNebulaRightsEvidence,
  serializeNebulaRightsEvidence,
  summarizeNebulaRightsEvidence,
  type NebulaRightsEvidence,
} from "./mainlineANebulaRightsEvidenceV613";

const row = nebulaCandidateReviewRows()[0];

function completedEvidence(candidate: NebulaReviewRow = row): NebulaRightsEvidence {
  return {
    ...createPendingNebulaRightsEvidence(candidate),
    decision: "cleared",
    status: "verified",
    rightsPage: candidate.sourcePage,
    policyPage: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    evidencePath: "source-cache/v613/rights/PIA13112-policy.html",
    evidenceSha256: "b".repeat(64),
    reviewer: "rights-reviewer@example.test",
    reviewedAt: "2026-09-14T12:00:00.000Z",
    creditConfirmed: true,
    notes: "Item page and usage policy reviewed.",
  };
}

describe("Mainline A nebula rights evidence v613", () => {
  it("creates a pending record that cannot be mistaken for clearance", () => {
    const pending = createPendingNebulaRightsEvidence(row);
    const assessment = assessNebulaRightsEvidence(row, pending);
    expect(pending.schema).toBe(RIGHTS_EVIDENCE_SCHEMA);
    expect(pending.decision).toBe("unreviewed");
    expect(assessment.clearable).toBe(false);
    expect(assessment.risks).toEqual(expect.arrayContaining(["evidence-pending", "policy-page-missing", "reviewer-missing"]));
  });

  it("requires exact source identity and the canonical NASA policy URL", () => {
    const evidence = { ...completedEvidence(), sourceSha256: "c".repeat(64), sourceLicenseUrl: "https://example.test/cc-by" };
    const assessment = assessNebulaRightsEvidence(row, evidence);
    expect(assessment.clearable).toBe(false);
    expect(assessment.risks).toEqual(expect.arrayContaining(["source-identity-mismatch", "license-url-mismatch"]));
  });

  it("accepts a complete per-image evidence record as clearable only", () => {
    const evidence = completedEvidence();
    const assessment = assessNebulaRightsEvidence(row, evidence);
    expect(assessment.valid).toBe(true);
    expect(assessment.clearable).toBe(true);
    expect(canClearNebulaRights(row, evidence)).toBe(true);
  });

  it("rejects weak URLs, bad evidence hashes, missing reviewer and missing credit", () => {
    const evidence = { ...completedEvidence(), rightsPage: "http://example.test/image", policyPage: "http://example.test/policy", evidenceSha256: "bad", reviewer: null, reviewedAt: null, creditConfirmed: false };
    const assessment = assessNebulaRightsEvidence(row, evidence);
    expect(assessment.clearable).toBe(false);
    expect(assessment.risks).toEqual(expect.arrayContaining(["rights-page-not-https", "policy-page-not-https", "evidence-digest-invalid", "reviewer-missing", "reviewed-at-missing", "credit-confirmation-missing"]));
  });

  it("keeps rejected decisions visible and non-clearable", () => {
    const rejected = { ...completedEvidence(), decision: "rejected" as const, status: "rejected" as const };
    const assessment = assessNebulaRightsEvidence(row, rejected);
    expect(assessment.clearable).toBe(false);
    expect(assessment.risks).toContain("decision-rejected");
  });

  it("allows recording a complete cleared decision and rejects incomplete clearance", () => {
    const pending = createPendingNebulaRightsEvidence(row);
    expect(() => recordNebulaRightsDecision(row, pending, "cleared")).toThrow(/decision rejected/);
    const recorded = recordNebulaRightsDecision(row, completedEvidence(), "cleared");
    expect(recorded.status).toBe("verified");
    expect(recorded.decision).toBe("cleared");
  });

  it("preserves candidate-only and runtime boundaries after rights clearance", () => {
    const cleared = recordNebulaRightsDecision(row, completedEvidence(), "cleared");
    expect(row.runtimeAdmission).toBe("candidate-only");
    expect(row.candidateOnly).toBe(true);
    expect(cleared.candidateId).toBe(row.id);
  });

  it("assesses and summarizes a complete pending queue", () => {
    const rows = nebulaCandidateReviewRows();
    const evidence = rows.map(createPendingNebulaRightsEvidence);
    const assessments = assessNebulaRightsQueue(rows, evidence);
    const summary = summarizeNebulaRightsEvidence(assessments);
    expect(assessments).toHaveLength(18);
    expect(summary).toMatchObject({ total: 18, pending: 18, verified: 0, rejected: 0, clearable: 0, withRisks: 18, runtimeAdmissionClosed: 18 });
  });

  it("merges evidence by sealed row identity and rejects duplicates or unknown IDs", () => {
    const rows = nebulaCandidateReviewRows().slice(0, 2);
    const first = createPendingNebulaRightsEvidence(rows[0]);
    const second = createPendingNebulaRightsEvidence(rows[1]);
    expect(mergeNebulaRightsEvidence(rows, [first, second])).toHaveLength(2);
    expect(() => mergeNebulaRightsEvidence(rows, [first, first])).toThrow(/Duplicate/);
    expect(() => mergeNebulaRightsEvidence(rows, [{ ...first, candidateId: "unknown" }, second])).toThrow(/Unknown/);
  });

  it("uses stable fingerprints and human-readable risk labels", () => {
    const evidence = createPendingNebulaRightsEvidence(row);
    expect(rightsEvidenceFingerprint(evidence)).toBe(rightsEvidenceFingerprint({ ...evidence }));
    expect(rightsEvidenceRiskLabel("license-url-mismatch")).toContain("URL");
  });

  it("serializes and parses only the V613 evidence schema", () => {
    const evidence = createPendingNebulaRightsEvidence(row);
    const serialized = serializeNebulaRightsEvidence(evidence);
    expect(isNebulaRightsEvidence(JSON.parse(serialized))).toBe(true);
    expect(parseNebulaRightsEvidence(serialized)).toEqual(evidence);
    expect(() => parseNebulaRightsEvidence("{}")).toThrow(/schema invalid/);
  });

  it("reports decision/status labels and evidence completion without runtime claims", () => {
    const pending = createPendingNebulaRightsEvidence(row);
    const assessments = assessNebulaRightsQueue([row], [pending]);
    const summary = summarizeNebulaRightsEvidence(assessments);
    expect(rightsEvidenceDecisionLabel("unreviewed")).toContain("未");
    expect(rightsEvidenceStatusLabel("pending")).toContain("待");
    expect(rightsEvidenceCompletionPercent(summary)).toBe(0);
    expect(rightsEvidenceQueueFingerprint([pending])).toContain(row.id);
  });
});
