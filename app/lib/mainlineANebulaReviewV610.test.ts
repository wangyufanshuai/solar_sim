import { describe, expect, it } from "vitest";
import {
  MAINLINE_A_NEBULA_ATLAS_CANDIDATES,
  MAINLINE_A_NEBULA_ATLAS_ENTRIES,
} from "./mainlineANebulaAtlasV609";
import {
  REVIEW_STATE_LABELS,
  REVIEW_STATES,
  canAdmitNebulaReview,
  canAdvanceNebulaReview,
  filterNebulaReviewRows,
  isNebulaReviewTerminal,
  nebulaCandidateReviewRows,
  nebulaReviewCompletion,
  nebulaReviewRiskCounts,
  nebulaReviewRows,
  nebulaReviewSummary,
  reviewRiskLabel,
  reviewStateIndex,
  reviewStateTransitionLabel,
  transitionNebulaReview,
  type NebulaReviewRow,
} from "./mainlineANebulaReviewV610";

function cleanCandidate(id = "candidate") : NebulaReviewRow {
  return {
    id,
    displayName: "Candidate",
    catalogName: "Candidate",
    sourceTarget: "candidate-nebula",
    sourcePage: "https://example.test/source",
    sourceImagePath: "source-cache/candidate.jpg",
    sourceCredit: "Example Observatory",
    sourceLicense: "CC BY 4.0",
    sourceSha256: "a".repeat(64),
    sourceBytes: 1024,
    sourceDimensions: { width: 1024, height: 768 },
    tier: "candidate",
    runtimeAdmission: "candidate-only",
    state: "visual-review",
    risks: [],
    candidateOnly: true,
    scienceAuthority: false,
  };
}

describe("Mainline A nebula review v610", () => {
  it("exports a stable review state vocabulary and labels", () => {
    expect(REVIEW_STATES).toEqual([
      "source-captured",
      "rights-review",
      "visual-review",
      "admission-ready",
      "blocked",
      "runtime-admitted",
    ]);
    for (const state of REVIEW_STATES) expect(REVIEW_STATE_LABELS[state]).toBeTruthy();
  });

  it("projects the complete atlas and preserves the 12/18 boundary", () => {
    const all = nebulaReviewRows();
    const candidates = nebulaCandidateReviewRows();
    expect(all).toHaveLength(MAINLINE_A_NEBULA_ATLAS_ENTRIES.length);
    expect(candidates).toHaveLength(MAINLINE_A_NEBULA_ATLAS_CANDIDATES.length);
    expect(all.filter((row) => row.runtimeAdmission === "current")).toHaveLength(12);
    expect(candidates.every((row) => row.candidateOnly && row.runtimeAdmission === "candidate-only")).toBe(true);
    expect(candidates.every((row) => row.scienceAuthority === false)).toBe(true);
  });

  it("marks NASA candidates as rights and visual review work", () => {
    const rows = nebulaCandidateReviewRows();
    expect(rows.every((row) => row.state === "rights-review")).toBe(true);
    expect(rows.every((row) => row.risks.includes("rights-unresolved"))).toBe(true);
    expect(rows.every((row) => row.risks.includes("candidate-only"))).toBe(true);
    expect(rows.every((row) => row.risks.includes("visual-review-required"))).toBe(true);
    expect(rows.every((row) => row.risks.includes("runtime-allowlist-closed"))).toBe(true);
  });

  it("returns summary counts without mutating input rows", () => {
    const rows = nebulaReviewRows();
    const before = rows.map((row) => row.state);
    const summary = nebulaReviewSummary(rows);
    expect(summary.total).toBe(30);
    expect(summary.candidateOnly).toBe(18);
    expect(summary.runtimeAdmitted).toBe(12);
    expect(summary.withRisks).toBe(18);
    expect(summary.rightsReview).toBe(18);
    expect(summary.byState.blocked).toBe(0);
    expect(rows.map((row) => row.state)).toEqual(before);
  });

  it("derives blocked state for malformed source evidence", () => {
    const row = nebulaReviewRows([{
      ...MAINLINE_A_NEBULA_ATLAS_CANDIDATES[0],
      sourcePage: null,
      sourceSha256: "bad",
      sourceDimensions: null,
    }])[0];
    expect(row.state).toBe("blocked");
    expect(row.risks).toEqual(expect.arrayContaining(["source-page-missing", "image-digest-invalid", "image-dimensions-invalid"]));
    expect(canAdvanceNebulaReview(row, "blocked")).toBe(true);
    expect(canAdvanceNebulaReview(row, "admission-ready")).toBe(false);
  });

  it("allows a clean candidate to reach review readiness but never runtime admission", () => {
    const row = cleanCandidate();
    expect(canAdvanceNebulaReview(row, "admission-ready")).toBe(true);
    const ready = transitionNebulaReview(row, "admission-ready");
    expect(ready.state).toBe("admission-ready");
    expect(canAdmitNebulaReview(ready)).toBe(false);
    expect(ready.runtimeAdmission).toBe("candidate-only");
    expect(ready.candidateOnly).toBe(true);
  });

  it("rejects non-sequential or unsafe transitions", () => {
    const row = nebulaCandidateReviewRows()[0];
    expect(canAdvanceNebulaReview(row, "source-captured")).toBe(false);
    expect(canAdvanceNebulaReview(row, "visual-review")).toBe(false);
    expect(() => transitionNebulaReview(row, "admission-ready")).toThrow(/transition rejected/);
    const rightsPending = { ...cleanCandidate(), state: "rights-review" as const, risks: ["rights-unresolved"] as const };
    expect(canAdvanceNebulaReview(rightsPending, "visual-review")).toBe(false);
  });

  it("keeps current runtime rows outside the candidate admission gate", () => {
    const current = nebulaReviewRows().find((row) => row.runtimeAdmission === "current");
    expect(current).toBeDefined();
    expect(current?.state).toBe("runtime-admitted");
    expect(canAdmitNebulaReview(current!)).toBe(false);
    expect(canAdvanceNebulaReview(current!, "runtime-admitted")).toBe(true);
  });

  it("provides human-readable risk labels for every risk", () => {
    const risks = new Set(nebulaReviewRows().flatMap((row) => row.risks));
    for (const risk of risks) expect(reviewRiskLabel(risk)).not.toBe(risk);
    expect(reviewRiskLabel("rights-unresolved")).toBe("权利未清");
  });

  it("supports stable state, risk, and text filters", () => {
    const rows = nebulaReviewRows();
    expect(filterNebulaReviewRows(rows, { state: "runtime-admitted" })).toHaveLength(12);
    expect(filterNebulaReviewRows(rows, { risk: "rights-unresolved" })).toHaveLength(18);
    expect(filterNebulaReviewRows(rows, { query: "heart" })).toHaveLength(1);
    expect(filterNebulaReviewRows(rows, { query: "DOES-NOT-EXIST" })).toHaveLength(0);
  });

  it("reports risk coverage and evidence completion separately", () => {
    const rows = nebulaReviewRows();
    const risks = nebulaReviewRiskCounts(rows);
    expect(risks["candidate-only"]).toBe(18);
    expect(risks["runtime-allowlist-closed"]).toBe(18);
    expect(nebulaReviewCompletion(rows)).toBe(40);
    expect(nebulaReviewCompletion([])).toBe(0);
  });

  it("keeps transition labels and terminal state ordering deterministic", () => {
    expect(reviewStateIndex("source-captured")).toBe(0);
    expect(reviewStateIndex("blocked")).toBe(-1);
    expect(reviewStateIndex("runtime-admitted")).toBe(4);
    expect(reviewStateTransitionLabel("rights-review", "visual-review")).toContain("视觉待复核");
    expect(reviewStateTransitionLabel("visual-review", "blocked")).toBe("记录阻塞原因");
    expect(isNebulaReviewTerminal("blocked")).toBe(true);
    expect(isNebulaReviewTerminal("rights-review")).toBe(false);
  });
});
