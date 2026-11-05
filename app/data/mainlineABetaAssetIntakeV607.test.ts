import { describe, expect, it } from "vitest";
import {
  MAINLINE_A_BETA_INTAKE_QUEUE,
  MAINLINE_A_BETA_INTAKE_TARGETS,
  admitMainlineABetaAssetV607,
  assertMainlineABetaQueueIntegrityV607,
  attachMainlineABetaImageV607,
  attachMainlineABetaRightsV607,
  canAdmitMainlineABetaAssetV607,
  captureMainlineABetaSourceV607,
  filterMainlineABetaAssetsV607,
  findMainlineABetaAssetV607,
  mergeMainlineABetaAssetUpdatesV607,
  normalizeMainlineABetaAssetV607,
  sortMainlineABetaAssetsV607,
  summarizeMainlineABetaIntakeV607,
  validateMainlineABetaAssetV607,
  type MainlineABetaAssetRecordV607,
} from "./mainlineABetaAssetIntakeV607";
import { MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE } from "./mainlineABetaHeroEvidenceIntakeV607";

const SOURCE = {
  sourceId: "simbad-snapshot-alpha",
  sourceUrl: "https://example.test/source",
  retrievedAt: "2026-09-13T00:00:00.000Z",
  sourceDigest: "a".repeat(64),
  evidencePath: "docs/release/v607/evidence/source.json",
} as const;

const RIGHTS = {
  license: "CC BY 4.0",
  rightsUrl: "https://creativecommons.org/licenses/by/4.0/",
  credit: "Example Observatory",
  reviewedAt: "2026-09-13T00:00:00.000Z",
  policyId: "example-policy-v1",
} as const;

const IMAGE = {
  localPath: "public/textures/mainline-a/beta/example.jpg",
  imageUrl: "https://cdn.example.test/example.jpg",
  byteSize: 120_000,
  sha256: "b".repeat(64),
  width: 2048,
  height: 1365,
} as const;

function completeRecord(id = "m17"): MainlineABetaAssetRecordV607 {
  const seed = findMainlineABetaAssetV607(id);
  if (!seed) throw new Error(`Missing fixture seed ${id}`);
  return attachMainlineABetaImageV607(
    attachMainlineABetaRightsV607(captureMainlineABetaSourceV607(seed, SOURCE), RIGHTS),
    IMAGE,
  );
}

describe("Mainline A Beta intake queue", () => {
  it("tracks the complete pending Beta backlog without runtime admission", () => {
    expect(MAINLINE_A_BETA_INTAKE_QUEUE).toHaveLength(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length + 12);
    expect(MAINLINE_A_BETA_INTAKE_TARGETS).toEqual({ heroStars: 24, constellations: 12, nebulae: 24, pendingHeroStars: MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length, pendingNebulae: 12 });
    expect(MAINLINE_A_BETA_INTAKE_QUEUE.filter((record) => record.kind === "hero-star")).toHaveLength(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length);
    expect(MAINLINE_A_BETA_INTAKE_QUEUE.filter((record) => record.kind === "nebula")).toHaveLength(12);
    expect(MAINLINE_A_BETA_INTAKE_QUEUE.every((record) => record.admission === "not-admitted")).toBe(true);
  });

  it("keeps queue ids unique and ordered", () => {
    assertMainlineABetaQueueIntegrityV607();
    const orders = MAINLINE_A_BETA_INTAKE_QUEUE.map((record) => record.queueOrder);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("fails closed when source evidence is absent", () => {
    const record = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    expect(record.status).toBe("awaiting-source");
    expect(record.blockingReasons).toContain("source-snapshot-required");
    expect(canAdmitMainlineABetaAssetV607(record)).toBe(false);
    expect(validateMainlineABetaAssetV607(record)).toContain("source-snapshot-required");
  });

  it("requires all source fields before advancing to rights review", () => {
    const seed = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    const invalid = captureMainlineABetaSourceV607(seed, { ...SOURCE, sourceDigest: "bad" });
    expect(invalid.status).toBe("awaiting-source");
    expect(invalid.blockingReasons).toContain("source-sha256-required");
    const valid = captureMainlineABetaSourceV607(seed, SOURCE);
    expect(valid.status).toBe("source-captured");
    expect(valid.blockingReasons).toContain("per-image-rights-review-required");
  });

  it("requires rights evidence and image manifest independently", () => {
    const withSource = captureMainlineABetaSourceV607(MAINLINE_A_BETA_INTAKE_QUEUE[0], SOURCE);
    const withRights = attachMainlineABetaRightsV607(withSource, RIGHTS);
    expect(withRights.status).toBe("rights-cleared");
    expect(withRights.blockingReasons).toContain("local-manifest-required");
    const withImage = attachMainlineABetaImageV607(withRights, IMAGE);
    expect(withImage.status).toBe("rights-cleared");
    expect(withImage.blockingReasons).toEqual([]);
    expect(canAdmitMainlineABetaAssetV607(withImage)).toBe(true);
  });

  it("rejects weak or malformed image manifests", () => {
    const withRights = attachMainlineABetaRightsV607(
      captureMainlineABetaSourceV607(MAINLINE_A_BETA_INTAKE_QUEUE[0], SOURCE),
      RIGHTS,
    );
    const invalid = attachMainlineABetaImageV607(withRights, { ...IMAGE, width: 32, sha256: "bad" });
    expect(invalid.blockingReasons).toEqual(expect.arrayContaining(["image-width-too-small", "image-sha256-required"]));
    expect(canAdmitMainlineABetaAssetV607(invalid)).toBe(false);
  });

  it("admits only a fully evidenced record", () => {
    const admitted = admitMainlineABetaAssetV607(completeRecord());
    expect(admitted.admission).toBe("admitted");
    expect(admitted.status).toBe("runtime-admitted");
    expect(admitted.blockingReasons).toEqual([]);
    expect(() => admitMainlineABetaAssetV607(MAINLINE_A_BETA_INTAKE_QUEUE[0])).toThrow(/Cannot admit/);
  });

  it("normalizes stale status fields from evidence state", () => {
    const record = completeRecord();
    const stale = normalizeMainlineABetaAssetV607({ ...record, status: "awaiting-source" });
    expect(stale.status).toBe("rights-cleared");
    const staleAdmitted = normalizeMainlineABetaAssetV607({ ...record, admission: "admitted", status: "awaiting-source" });
    expect(staleAdmitted.status).toBe("runtime-admitted");
  });

  it("supports deterministic filtering by kind, status, admission, and search", () => {
    expect(filterMainlineABetaAssetsV607(MAINLINE_A_BETA_INTAKE_QUEUE, { kind: "hero-star" })).toHaveLength(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length);
    expect(filterMainlineABetaAssetsV607(MAINLINE_A_BETA_INTAKE_QUEUE, { kind: "nebula" })).toHaveLength(12);
    expect(filterMainlineABetaAssetsV607(MAINLINE_A_BETA_INTAKE_QUEUE, { status: "awaiting-source" })).toHaveLength(MAINLINE_A_BETA_INTAKE_QUEUE.length);
    expect(filterMainlineABetaAssetsV607(MAINLINE_A_BETA_INTAKE_QUEUE, { search: "M17" })).toHaveLength(1);
    expect(filterMainlineABetaAssetsV607(MAINLINE_A_BETA_INTAKE_QUEUE, { search: "does-not-exist" })).toHaveLength(0);
  });

  it("summarizes queue state without confusing pending and admitted counts", () => {
    const summary = summarizeMainlineABetaIntakeV607(MAINLINE_A_BETA_INTAKE_QUEUE);
    expect(summary).toMatchObject({ total: MAINLINE_A_BETA_INTAKE_QUEUE.length, admitted: 0, blocked: MAINLINE_A_BETA_INTAKE_QUEUE.length, readyForReview: 0 });
    expect(summary.byKind).toEqual({ "hero-star": MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length, nebula: 12 });
    expect(summary.byStatus["awaiting-source"]).toBe(MAINLINE_A_BETA_INTAKE_QUEUE.length);
  });

  it("updates summary after one safe admission", () => {
    const admitted = admitMainlineABetaAssetV607(completeRecord());
    const merged = mergeMainlineABetaAssetUpdatesV607(MAINLINE_A_BETA_INTAKE_QUEUE, [admitted]);
    const summary = summarizeMainlineABetaIntakeV607(merged);
    expect(summary.admitted).toBe(1);
    expect(summary.blocked).toBe(MAINLINE_A_BETA_INTAKE_QUEUE.length - 1);
    expect(summary.byStatus["runtime-admitted"]).toBe(1);
  });

  it("preserves deterministic queue ordering during merges", () => {
    const first = admitMainlineABetaAssetV607(completeRecord("m17"));
    const second = admitMainlineABetaAssetV607(completeRecord("ic434"));
    const merged = mergeMainlineABetaAssetUpdatesV607(MAINLINE_A_BETA_INTAKE_QUEUE, [second, first]);
    expect(merged.slice(0, 2).map((record) => record.id)).toEqual(MAINLINE_A_BETA_INTAKE_QUEUE.slice(0, 2).map((record) => record.id));
    expect(sortMainlineABetaAssetsV607(merged).map((record) => record.queueOrder)).toEqual(merged.map((record) => record.queueOrder));
    expect(merged.find((record) => record.id === "m17")?.status).toBe("runtime-admitted");
  });

  it("does not mutate the canonical queue when records are advanced", () => {
    const original = findMainlineABetaAssetV607("m17");
    if (!original) throw new Error("Missing m17");
    admitMainlineABetaAssetV607(completeRecord("m17"));
    expect(findMainlineABetaAssetV607("m17")).toEqual(original);
  });

  it("keeps invalid admitted records unsafe", () => {
    const unsafe = { ...MAINLINE_A_BETA_INTAKE_QUEUE[0], admission: "admitted" as const, status: "runtime-admitted" as const };
    expect(() => assertMainlineABetaQueueIntegrityV607([unsafe])).toThrow(/Unsafe admitted/);
  });

  it("downgrades an admitted record when evidence is later removed", () => {
    const admitted = admitMainlineABetaAssetV607(completeRecord());
    const evidenceRemoved = normalizeMainlineABetaAssetV607({ ...admitted, image: null });
    expect(evidenceRemoved.admission).toBe("not-admitted");
    expect(evidenceRemoved.status).toBe("rights-cleared");
    expect(evidenceRemoved.blockingReasons).toContain("local-manifest-required");
    expect(validateMainlineABetaAssetV607(evidenceRemoved)).toContain("local-manifest-required");
  });

  it("rejects malformed admitted identity instead of trusting the flag", () => {
    const admitted = admitMainlineABetaAssetV607(completeRecord());
    const malformed = normalizeMainlineABetaAssetV607({ ...admitted, id: "", displayName: "" });
    expect(malformed.admission).toBe("not-admitted");
    expect(malformed.blockingReasons).toEqual(expect.arrayContaining(["asset-id-required", "asset-display-name-required"]));
    expect(canAdmitMainlineABetaAssetV607(malformed)).toBe(false);
  });

  it("rejects malformed status and admission values at the queue boundary", () => {
    const seed = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    expect(() => assertMainlineABetaQueueIntegrityV607([
      { ...seed, status: "published" as never },
    ])).toThrow(/Invalid Beta intake status/);
    expect(() => assertMainlineABetaQueueIntegrityV607([
      { ...seed, admission: "admitted-later" as never },
    ])).toThrow(/Invalid Beta intake admission/);
  });

  it("rejects malformed blocker collections instead of throwing a runtime type error", () => {
    const seed = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    expect(() => assertMainlineABetaQueueIntegrityV607([
      { ...seed, blockingReasons: undefined as never },
    ])).toThrow(/Invalid Beta intake blockers/);
  });

  it("rejects a non-admitted record whose blockers were incorrectly cleared", () => {
    const seed = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    expect(() => assertMainlineABetaQueueIntegrityV607([
      { ...seed, blockingReasons: [] },
    ])).toThrow(/Missing Beta intake blocker/);
  });

  it("rejects unknown, duplicate, and metadata-mismatched merge updates", () => {
    const seed = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    expect(() => mergeMainlineABetaAssetUpdatesV607(MAINLINE_A_BETA_INTAKE_QUEUE, [{ ...completeRecord(), id: "missing" }])).toThrow(/Unknown Beta intake update id/);
    expect(() => mergeMainlineABetaAssetUpdatesV607(MAINLINE_A_BETA_INTAKE_QUEUE, [completeRecord(), completeRecord()])).toThrow(/Duplicate Beta intake update id/);
    expect(() => mergeMainlineABetaAssetUpdatesV607(MAINLINE_A_BETA_INTAKE_QUEUE, [{ ...completeRecord(seed.id), displayName: "spoofed" }])).toThrow(/label mismatch/);
  });

  it("rejects duplicate base queue orders before applying updates", () => {
    const first = MAINLINE_A_BETA_INTAKE_QUEUE[0];
    const second = MAINLINE_A_BETA_INTAKE_QUEUE[1];
    expect(() => mergeMainlineABetaAssetUpdatesV607(MAINLINE_A_BETA_INTAKE_QUEUE, [])).not.toThrow();
    expect(() => mergeMainlineABetaAssetUpdatesV607([{ ...first }, { ...second, queueOrder: first.queueOrder }], [])).toThrow(/Duplicate Beta queue order in base/);
  });
});
