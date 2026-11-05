import { describe, expect, it } from "vitest";
import {
  MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611,
  buildMainlineABetaStellarReviewRowsV611,
  canAdmitMainlineABetaStellarReviewV611,
  canAdvanceMainlineABetaStellarReviewV611,
  filterMainlineABetaStellarReviewRowsV611,
  inspectMainlineABetaStellarReviewEvidenceV611,
  isMainlineABetaStellarReviewTerminalV611,
  isMainlineABetaStellarReviewSourceSealedV611,
  normalizeMainlineABetaStellarReviewRowV611,
  patchMainlineABetaStellarReviewRowV611,
  reviewRiskLabelV611,
  summarizeMainlineABetaStellarReviewV611,
  transitionMainlineABetaStellarReviewV611,
} from "./mainlineABetaStellarReviewV611";

describe("Mainline A R51 pending hero evidence review", () => {
  it("contains exactly the four unresolved hero identities", () => {
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.map((row) => row.id)).toEqual(["acrux", "spica", "regulus", "polaris"]);
    expect(buildMainlineABetaStellarReviewRowsV611()).toEqual(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611);
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.every((row) => row.runtimeAdmission === "candidate-only")).toBe(true);
  });

  it("separates Acrux missing reference data from component ambiguity", () => {
    const acrux = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((row) => row.id === "acrux");
    const spica = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((row) => row.id === "spica");
    expect(acrux?.state).toBe("blocked");
    expect(acrux?.risks).toEqual(expect.arrayContaining(["positive-parallax-missing", "upstream-reference-missing"]));
    expect(spica?.state).toBe("identity-review");
    expect(spica?.risks).toContain("component-identity-ambiguous");
    expect(spica?.risks).not.toContain("positive-parallax-missing");
  });

  it("keeps source replay and measurement boundaries visible on every row", () => {
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.every((row) => row.risks.includes("source-snapshot-replay"))).toBe(true);
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.every((row) => row.risks.includes("measurement-admission-closed"))).toBe(true);
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.every((row) => row.sciencePayloadWriteback === false && row.measurementAdmission === "not-admitted")).toBe(true);
  });

  it("summarizes blockers without counting candidates as admitted", () => {
    const summary = summarizeMainlineABetaStellarReviewV611();
    expect(summary).toMatchObject({ total: 4, blocked: 1, identityReview: 3, presentationReady: 0, runtimeAdmitted: 0 });
    expect(summary.riskCounts["component-identity-ambiguous"]).toBe(3);
    expect(summary.riskCounts["positive-parallax-missing"]).toBe(1);
  });

  it("supports state and query filters without changing row identity", () => {
    expect(filterMainlineABetaStellarReviewRowsV611(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611, { state: "identity-review" })).toHaveLength(3);
    expect(filterMainlineABetaStellarReviewRowsV611(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611, { risk: "upstream-reference-missing" }).map((row) => row.id)).toEqual(["acrux"]);
    expect(filterMainlineABetaStellarReviewRowsV611(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611, { query: "Polaris" }).map((row) => row.id)).toEqual(["polaris"]);
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[0].id).toBe("acrux");
  });

  it("keeps a complete-looking Acrux patch blocked until the projection is resealed", () => {
    const acrux = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((row) => row.id === "acrux");
    if (!acrux) throw new Error("Acrux fixture missing");
    const patched = patchMainlineABetaStellarReviewRowV611(acrux, {
      resolutionClass: "exact-component",
      parallaxMas: 10.2,
      errorMas: 0.3,
      bibcode: "2024A&A...000A...1X",
      simbadIdentifier: "* alf02 Cru",
      sourceRecordDigest: "f".repeat(64),
    });
    expect(patched.state).toBe("blocked");
    expect(patched.risks).toEqual(expect.arrayContaining(["source-snapshot-replay", "runtime-allowlist-closed", "source-patch-unsealed"]));
    expect(patched.risks).not.toContain("positive-parallax-missing");
    expect(patched.risks).not.toContain("upstream-reference-missing");
    expect(isMainlineABetaStellarReviewSourceSealedV611(patched)).toBe(false);
    expect(canAdmitMainlineABetaStellarReviewV611(patched)).toBe(false);
  });

  it("fails closed when a replacement source row has an invalid digest", () => {
    const polaris = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((row) => row.id === "polaris");
    if (!polaris) throw new Error("Polaris fixture missing");
    const invalid = patchMainlineABetaStellarReviewRowV611(polaris, { sourceRecordDigest: "not-a-sha256" });
    expect(invalid.state).toBe("blocked");
    expect(invalid.risks).toContain("source-digest-invalid");
    expect(canAdmitMainlineABetaStellarReviewV611(invalid)).toBe(false);
  });

  it("rejects patches for heroes outside the pending set", () => {
    const row = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[0];
    expect(() => patchMainlineABetaStellarReviewRowV611({ ...row, id: "vega" }, {})).toThrow(/Not an R51 pending hero/);
  });

  it("allows only sequential evidence transitions and never runtime admission", () => {
    const spica = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((row) => row.id === "spica");
    if (!spica) throw new Error("Spica fixture missing");
    expect(canAdvanceMainlineABetaStellarReviewV611(spica, "presentation-ready")).toBe(false);
    expect(canAdvanceMainlineABetaStellarReviewV611(spica, "runtime-admitted")).toBe(false);
    const ready = patchMainlineABetaStellarReviewRowV611(spica, { resolutionClass: "exact-component" });
    expect(ready.state).toBe("blocked");
    expect(ready.risks).toContain("source-patch-unsealed");
    expect(canAdvanceMainlineABetaStellarReviewV611(ready, "runtime-admitted")).toBe(false);
    expect(() => transitionMainlineABetaStellarReviewV611(ready, "runtime-admitted")).toThrow(/transition rejected/);
  });

  it("normalizes stale state and keeps the row immutable", () => {
    const row = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((candidate) => candidate.id === "regulus");
    if (!row) throw new Error("Regulus fixture missing");
    const normalized = normalizeMainlineABetaStellarReviewRowV611({ ...row, state: "presentation-ready" });
    expect(normalized.state).toBe("identity-review");
    expect(normalized).not.toBe(row);
    expect(row.state).toBe("identity-review");
  });

  it("labels every risk and marks only evidence-complete rows terminal", () => {
    for (const row of MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611) for (const risk of row.risks) expect(reviewRiskLabelV611(risk).length).toBeGreaterThan(0);
    expect(MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.every((row) => !isMainlineABetaStellarReviewTerminalV611(row.state))).toBe(true);
    expect(isMainlineABetaStellarReviewTerminalV611("presentation-ready")).toBe(true);
    expect(isMainlineABetaStellarReviewTerminalV611("runtime-admitted")).toBe(true);
  });

  it("rejects a forged runtime state during normalization", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[1];
    const forged = normalizeMainlineABetaStellarReviewRowV611({
      ...source,
      state: "runtime-admitted",
      runtimeAdmission: "candidate-only",
      measurementAdmission: "not-admitted",
    });
    expect(forged.state).toBe(source.state);
    expect(forged.runtimeAdmission).toBe("candidate-only");
    expect(forged.measurementAdmission).toBe("not-admitted");
    expect(canAdmitMainlineABetaStellarReviewV611(forged)).toBe(false);
  });

  it("does not treat a stale state as a valid no-op transition", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[0];
    const stale = { ...source, state: "identity-review" as const };
    expect(canAdvanceMainlineABetaStellarReviewV611(stale, "identity-review")).toBe(false);
    expect(() => transitionMainlineABetaStellarReviewV611(stale, "identity-review")).toThrow(/transition rejected/);
  });

  it("reports all independent source integrity dimensions", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[0];
    const report = inspectMainlineABetaStellarReviewEvidenceV611(source);
    expect(report).toMatchObject({
      id: "acrux",
      matchesSealedProjection: true,
      digestFormatValid: true,
      snapshotSealMatches: true,
      sourceFieldsComplete: false,
      state: "blocked",
    });
    expect(report.risks).toContain("positive-parallax-missing");
  });

  it("marks a digest-only edit as unsealed even when its format is valid", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[1];
    const edited = normalizeMainlineABetaStellarReviewRowV611({ ...source, sourceRecordDigest: "a".repeat(64) });
    const report = inspectMainlineABetaStellarReviewEvidenceV611(edited);
    expect(report.digestFormatValid).toBe(true);
    expect(report.matchesSealedProjection).toBe(false);
    expect(report.risks).toContain("source-patch-unsealed");
    expect(edited.state).toBe("blocked");
  });

  it("blocks a row whose snapshot seal was replaced", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[1];
    const edited = normalizeMainlineABetaStellarReviewRowV611({ ...source, snapshotSha256: "f".repeat(64) });
    const report = inspectMainlineABetaStellarReviewEvidenceV611(edited);
    expect(report.snapshotSealMatches).toBe(false);
    expect(report.risks).toContain("source-snapshot-seal-invalid");
    expect(edited.state).toBe("blocked");
    expect(canAdmitMainlineABetaStellarReviewV611(edited)).toBe(false);
  });

  it("does not allow transition to presentation-ready from an unsealed identity row", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611.find((row) => row.id === "spica");
    if (!source) throw new Error("Spica fixture missing");
    const edited = normalizeMainlineABetaStellarReviewRowV611({
      ...source,
      state: "identity-review",
      resolutionClass: source.resolutionClass,
      simbadIdentifier: "* alf02 Vir",
    });
    expect(edited.state).toBe("blocked");
    expect(canAdvanceMainlineABetaStellarReviewV611(edited, "presentation-ready")).toBe(false);
  });

  it("rebuilds transition output with candidate-only admission flags", () => {
    const source = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611[1];
    expect(transitionMainlineABetaStellarReviewV611(source, source.state)).toMatchObject({
      id: source.id,
      state: source.state,
      runtimeAdmission: "candidate-only",
      measurementAdmission: "not-admitted",
      sciencePayloadWriteback: false,
    });
  });
});
