import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  aggregateStructuredSourceLedgerV621,
  buildStructuredLedgerEntryV621,
  classifyStructuredBlockersV621,
  filterStructuredCandidatesV621,
  normalizeStructuredFieldsV621,
  scoreStructuredCandidateV621,
  structuredAdmissionLabelV621,
  structuredComponentClosureScoreV621,
  structuredEvidenceFingerprintV621,
  structuredFieldCompletenessV621,
  structuredSourceClosureScoreV621,
  summarizeStructuredCandidatesV621,
  transitionStructuredCandidateToHoldV621,
  validateStructuredCandidateBoundaryV621,
  structuredBlockerCountsV621,
  structuredCandidateHasLiveRawV621,
  structuredCandidateBlockerLabelsV621,
  structuredCandidateFieldDigestV621,
  structuredCandidateReadOnlyCloneV621,
  structuredLedgerSummaryTextV621,
  structuredQualityBandV621,
  structuredReviewStatusV621,
  structuredSourceLedgerFingerprintV621,
  structuredCandidatesDeterministicOrderV621,
  type StructuredCandidateV621,
} from "./mainlineABetaStellarStructuredEvidenceV621";

const digest = "a".repeat(64);
const bodyHash = createHash("sha256").update("live body").digest("hex");
const source = (id: string, role: "object" | "catalog" | "component" | "upstream" = "object") => ({ id, role, url: `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${id}`, label: `${id} source`, sha256: digest });

function candidate(overrides: Partial<StructuredCandidateV621> = {}): StructuredCandidateV621 {
  return {
    id: "acrux", queryIdentifier: "* alf01 Cru", state: "structured",
    raw: { captured: 1, transport: "https-html", sha256: bodyHash, responseBytes: 9, contentType: "text/html; charset=utf-8", sourceUrl: "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=acrux" },
    expectedSnapshotRecordDigest: digest, expectedProjectionRecordDigest: digest, snapshotRecordDigest: digest, projectionRecordDigest: digest,
    identity: { canonicalName: "* alf01 Cru", component: "A" },
    fields: { canonicalName: "* alf01 Cru", spectralType: "B0.5IV", parallaxMas: 10.1 },
    sourceRefs: [source("acrux"), source("catalog", "catalog")], componentRefs: [source("acrux-a", "component")],
    reviewDecision: "hold", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false,
    ...overrides,
  };
}

describe("Mainline A structured evidence V621", () => {
  it("normalizes field keys, trims text, and parses finite numbers", () => {
    expect(normalizeStructuredFieldsV621({ "Spectral Type": " B0.5IV ", "parallax_mas": "10.1", empty: "", nope: Infinity })).toEqual({ empty: null, parallaxmas: 10.1, spectraltype: "B0.5IV" });
  });

  it("scores a complete live candidate deterministically", () => {
    const value = candidate();
    const quality = scoreStructuredCandidateV621(value);
    expect(quality.score).toBe(100);
    expect(quality.blockers).toEqual([]);
    expect(quality.eligibleForStructuredReview).toBe(true);
    expect(structuredFieldCompletenessV621(value)).toBe(100);
    expect(structuredSourceClosureScoreV621(value)).toBe(100);
    expect(structuredComponentClosureScoreV621(value)).toBe(100);
    expect(structuredCandidateHasLiveRawV621(value)).toBe(true);
    expect(structuredReviewStatusV621(value)).toBe("ready-for-review");
    expect(structuredQualityBandV621(100)).toBe("strong");
  });

  it("classifies missing source, identity, component and digest blockers", () => {
    const value = candidate({ identity: { canonicalName: null, component: null }, sourceRefs: [], componentRefs: [], snapshotRecordDigest: "b".repeat(64) });
    expect(classifyStructuredBlockersV621(value)).toEqual(expect.arrayContaining(["identity-missing", "source-closure-missing", "component-closure-missing", "digest-mismatch"]));
    expect(scoreStructuredCandidateV621(value).score).toBeLessThan(60);
    expect(structuredCandidateBlockerLabelsV621(value).length).toBeGreaterThan(1);
    expect(structuredBlockerCountsV621([value])["identity-missing"]).toBe(1);
  });

  it("rejects fixture transport even with apparently complete fields", () => {
    const value = candidate({ raw: { ...candidate().raw, transport: "fixture-replay" } });
    expect(classifyStructuredBlockersV621(value)).toContain("fixture-response");
    expect(scoreStructuredCandidateV621(value).eligibleForStructuredReview).toBe(false);
  });

  it("aggregates source and component ledgers across candidates", () => {
    const result = aggregateStructuredSourceLedgerV621([candidate(), candidate({ id: "spica", queryIdentifier: "* alf Vir" })]);
    expect(result).toMatchObject({ total: 2, sourceRefs: 4, validSourceRefs: 4, componentRefs: 2, validComponentRefs: 2, closedSources: 2 });
    expect(structuredSourceLedgerFingerprintV621([candidate(), candidate({ id: "spica", queryIdentifier: "* alf Vir" })])).toMatch(/^[a-f0-9]{64}$/);
  });

  it("filters by identity and blocker text", () => {
    const blocked = candidate({ identity: { canonicalName: null, component: null }, sourceRefs: [] });
    expect(filterStructuredCandidatesV621([candidate(), blocked], "acrux")).toHaveLength(2);
    expect(filterStructuredCandidatesV621([candidate(), blocked], "identity-missing")).toHaveLength(1);
    expect(filterStructuredCandidatesV621([candidate(), blocked], "spica")).toHaveLength(0);
  });

  it("creates a stable ledger fingerprint and summary", () => {
    const first = buildStructuredLedgerEntryV621(candidate());
    const second = buildStructuredLedgerEntryV621(candidate());
    expect(first.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(structuredEvidenceFingerprintV621(candidate())).toMatch(/^[a-f0-9]{64}$/);
    expect(summarizeStructuredCandidatesV621([candidate(), candidate({ state: "raw-only" })])).toMatchObject({ total: 2, structured: 1, rawOnly: 1, blocked: 0, averageScore: 100, scientificPayloadWriteback: false });
    expect(structuredLedgerSummaryTextV621([candidate()])).toContain("1 candidates");
    expect(structuredCandidateFieldDigestV621(candidate())).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps transition read-only and forces hold/candidate boundaries", () => {
    const next = transitionStructuredCandidateToHoldV621(candidate(), "structured");
    expect(next).not.toBe(candidate());
    expect(next.reviewDecision).toBe("hold");
    expect(next.runtimeAdmission).toBe("candidate-only");
    expect(next.measurementAdmission).toBe("not-admitted");
    expect(next.scientificPayloadWriteback).toBe(false);
    expect(validateStructuredCandidateBoundaryV621(next)).toEqual([]);
    expect(structuredAdmissionLabelV621(next)).toContain("candidate-only");
    expect(structuredCandidateReadOnlyCloneV621(next)).toEqual(next);
    expect(structuredCandidatesDeterministicOrderV621([candidate({ id: "spica", queryIdentifier: "z" }), candidate()])[0].id).toBe("acrux");
  });

  it("fails boundary validation for forged admission values", () => {
    const forged = candidate({ reviewDecision: "cleared" as never, runtimeAdmission: "admitted" as never, scientificPayloadWriteback: true as never });
    expect(validateStructuredCandidateBoundaryV621(forged)).toEqual(expect.arrayContaining(["decision-opened", "runtime-admission-opened", "scientific-writeback-opened"]));
  });
});
