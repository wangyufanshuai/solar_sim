import { describe, expect, it } from "vitest";
import {
  compareHeroArtEvidenceIdentityV615,
  heroArtEvidenceCheckSummaryV615,
  heroArtEvidenceCheckPassRateV615,
  heroArtEvidenceCountsConsistentV615,
  filterHeroArtEvidenceV615,
  heroArtEvidenceBlockerLabelsV615,
  heroArtEvidenceHasOpenGateV615,
  heroArtEvidenceIsSafeForPresentationV615,
  heroArtEvidenceStatusLabelV615,
  heroArtEvidenceStatusOrderV615,
  heroArtEvidenceStatusToneV615,
  heroArtEvidenceSummaryLabelV615,
  heroArtEvidenceNextGateV615,
  heroArtEvidenceGateLabelV615,
  heroArtEvidenceRecordFingerprintV615,
  heroArtEvidenceVisualProfileLabelV615,
  partitionHeroArtEvidenceV615,
  sortHeroArtEvidenceByGateV615,
  summarizeHeroArtEvidenceV615,
  validateHeroArtEvidencePackV615,
  type HeroArtEvidencePackV615,
} from "./mainlineABetaHeroArtEvidenceV615";

const record = (id: string, artStatus: "runtime-baseline" | "candidate-presentation" | "evidence-pending" = "runtime-baseline") => ({
  id, displayName: id, status: artStatus === "runtime-baseline" ? "runtime-baseline" as const : "candidate-only" as const, artStatus,
  runtimeAdmission: artStatus === "runtime-baseline" ? "admitted" as const : "candidate-only" as const,
  measurementAdmission: "not-admitted" as const, scientificPayloadWriteback: false as const,
  source: { heroPacketSha256: "a".repeat(64), presentationOnly: true, projectionRow: null },
  visualProfile: { shaderProfile: "hot-radiative-photosphere", coronaModel: "radiative-wind-corona", temperatureK: 5800, radiusSolar: 1, luminositySolar: 1, equatorialPolarRadiusRatio: 1, textureMode: "parameterized-photosphere" },
  checks: { identity: true, photometry: true, geometry: true, shader: true, corona: true, presentationBoundary: true, sourceReference: artStatus !== "evidence-pending" },
  blockers: artStatus === "evidence-pending" ? ["component-identity-ambiguous", "runtime-allowlist-closed"] : [],
});

const pack = (records = [record("a"), record("b", "candidate-presentation"), record("c", "evidence-pending")]) => ({
  schema: "mainline-a-beta-hero-art-evidence-pack-v615", generatedAt: "2026-09-14T00:00:00Z", heroCatalog: { path: "heroes.ts", packetSha256: "a".repeat(64), contentSha256: "b".repeat(64), count: 3 }, projection: { path: "projection.ts", contentSha256: "c".repeat(64), snapshotSha256: "d".repeat(64), sourceLicense: "ODbL-1.0", citation: "citation" },
  counts: { total: records.length, runtimeBaseline: records.filter((item) => item.status === "runtime-baseline").length, candidateOnly: records.filter((item) => item.status === "candidate-only").length, artReady: records.filter((item) => item.artStatus !== "evidence-pending").length, evidencePending: records.filter((item) => item.artStatus === "evidence-pending").length },
  presentationBoundary: { runtimeWrites: false, scienceWrites: false, sourceIsSynthetic: false, textureMode: "parameterized-photosphere" }, records,
}) as HeroArtEvidencePackV615;

describe("Mainline A Beta hero art evidence v615", () => {
  it("summarizes runtime baseline, candidate-only, and open gates", () => {
    const summary = summarizeHeroArtEvidenceV615(pack());
    expect(summary).toMatchObject({ total: 3, runtimeBaseline: 1, candidateOnly: 2, artReady: 2, evidencePending: 1, safePresentation: 2, openGates: 2 });
    expect(heroArtEvidenceSummaryLabelV615(summary)).toContain("1/3 runtime baseline");
  });

  it("filters by status, blocker, and visual fields", () => {
    const records = pack().records;
    expect(filterHeroArtEvidenceV615(records, { artStatus: "evidence-pending" })).toHaveLength(1);
    expect(filterHeroArtEvidenceV615(records, { blocker: "component-identity-ambiguous" })[0].id).toBe("c");
    expect(filterHeroArtEvidenceV615(records, { query: "radiative" })).toHaveLength(3);
  });

  it("keeps the presentation boundary and labels explicit", () => {
    const pending = pack().records[2];
    expect(heroArtEvidenceIsSafeForPresentationV615(pending)).toBe(false);
    expect(heroArtEvidenceHasOpenGateV615(pending)).toBe(true);
    expect(heroArtEvidenceStatusLabelV615("runtime-baseline")).toContain("基线");
    expect(heroArtEvidenceStatusToneV615("evidence-pending")).toBe("warning");
    expect(heroArtEvidenceBlockerLabelsV615(pending)).toContain("组件身份待确认");
  });

  it("sorts pending candidates first and compares source identity", () => {
    const ordered = sortHeroArtEvidenceByGateV615(pack().records);
    expect(ordered.map((item) => item.id)).toEqual(["c", "b", "a"]);
    expect(compareHeroArtEvidenceIdentityV615(ordered[0], { ...ordered[0] })).toBe(true);
    expect(compareHeroArtEvidenceIdentityV615(ordered[0], { ...ordered[0], id: "other" })).toBe(false);
  });

  it("rejects opened boundaries and unsafe records", () => {
    expect(validateHeroArtEvidencePackV615(pack())).toBeDefined();
    expect(() => validateHeroArtEvidencePackV615({ ...pack(), presentationBoundary: { ...pack().presentationBoundary, scienceWrites: true } })).toThrow(/boundary/);
    const unsafe = pack([record("unsafe", "runtime-baseline")]);
    unsafe.records[0].checks.identity = false;
    expect(() => validateHeroArtEvidencePackV615(unsafe)).toThrow(/unsafe/);
  });

  it("exposes stable check labels and profile formatting", () => {
    const pending = pack().records[2];
    expect(heroArtEvidenceCheckSummaryV615(pending).map((item) => item.label)).toContain("来源参考");
    expect(heroArtEvidenceVisualProfileLabelV615(pending)).toContain("K");
    expect(heroArtEvidenceNextGateV615(pending)).toBe("identity-review");
  });

  it("partitions the queue and keeps counts consistent", () => {
    const fixture = pack();
    const parts = partitionHeroArtEvidenceV615(fixture.records);
    expect(parts.baseline).toHaveLength(1);
    expect(parts.candidates).toHaveLength(2);
    expect(parts.pending).toHaveLength(1);
    expect(heroArtEvidenceCountsConsistentV615(fixture)).toBe(true);
  });

  it("creates deterministic record fingerprints for review receipts", () => {
    const first = pack().records[0];
    const second = { ...first, blockers: [...first.blockers].reverse(), checks: { ...first.checks } };
    expect(heroArtEvidenceRecordFingerprintV615(first)).toBe(heroArtEvidenceRecordFingerprintV615(second));
    expect(heroArtEvidenceRecordFingerprintV615(first)).toContain("a".repeat(64));
  });

  it("formats next gates and check completion as review metadata", () => {
    const pending = pack().records[2];
    expect(heroArtEvidenceGateLabelV615(heroArtEvidenceNextGateV615(pending))).toBe("身份复核");
    expect(heroArtEvidenceCheckPassRateV615(pending)).toBe(86);
    expect(heroArtEvidenceGateLabelV615("unknown-gate")).toBe("unknown-gate");
    expect(heroArtEvidenceStatusOrderV615("runtime-baseline")).toBeGreaterThan(heroArtEvidenceStatusOrderV615("evidence-pending"));
  });
});
