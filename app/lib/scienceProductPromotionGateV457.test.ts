import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  auditAtlasScienceCinematicV7BoundaryV457,
  resolveAtlasScienceCinematicV7V457,
} from "./atlasScienceCinematicV7V457";
import {
  canonicalScienceProductPromotionPayloadV457,
  createScienceProductPromotionSummaryV457,
  evaluateScienceProductPromotionV457,
  parseScienceProductPromotionGateV457,
  SCIENCE_PRODUCT_GATE_IDS_V457,
  type ScienceProductGateEntryV457,
} from "./scienceProductPromotionGateV457";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-science-product-promotion-gate-v457/science-product-promotion-gate.json",
    "utf8",
  ),
);

describe("v457 science product promotion gate", () => {
  it("fails closed on every current blocker", () => {
    const parsed = parseScienceProductPromotionGateV457(artifact);
    const summary = createScienceProductPromotionSummaryV457(parsed);
    expect(summary.counts).toMatchObject({
      gateCount: 10,
      qualifiedCount: 2,
      blockerCount: 8,
      measuredDetectorReady: 0,
      denseShardsCompleted: 0,
    });
    expect(summary.decisions).toMatchObject({
      promotionAllowed: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      localShadowDefaultApplied: false,
    });
    expect(summary.decisions.blockerIds).toEqual([
      "measured-detector-inputs",
      "detector-pixel-values",
      "dense-aggregate",
      "selection-bias",
      "browser",
      "visual-matrix",
      "soak",
      "rtx-webgpu",
    ]);
  });

  it("opens only when the complete required inventory is qualified", () => {
    const allQualified = SCIENCE_PRODUCT_GATE_IDS_V457.map(
      (id): ScienceProductGateEntryV457 => ({
        id,
        label: id,
        status: "qualified",
        evidence: "independent qualification evidence",
        blocker: false,
      }),
    );
    expect(evaluateScienceProductPromotionV457(allQualified)).toMatchObject({
      promotionAllowed: true,
      fitsWriteAllowed: true,
      pngWriteAllowed: true,
      blockerIds: [],
    });
    expect(() => evaluateScienceProductPromotionV457(allQualified.slice(1))).toThrow(
      "v457-promotion-gate-inventory",
    );
  });

  it("keeps canonical SHA and V7 science/cinematic boundaries exact", () => {
    const parsed = parseScienceProductPromotionGateV457(artifact);
    expect(
      createHash("sha256")
        .update(canonicalScienceProductPromotionPayloadV457(parsed))
        .digest("hex"),
    ).toBe(parsed.artifactSha256);
    expect(resolveAtlasScienceCinematicV7V457("science")).toBe(
      resolveAtlasScienceCinematicV7V457("science"),
    );
    expect(resolveAtlasScienceCinematicV7V457("cinematic")).toBe(
      resolveAtlasScienceCinematicV7V457("cinematic"),
    );
    expect(auditAtlasScienceCinematicV7BoundaryV457()).toMatchObject({
      scienceLinearDisplay: true,
      scienceBloomDisabled: true,
      scienceGradeDisabled: true,
      scientificFieldMutation: false,
      localShadowOnly: true,
      defaultApplied: false,
    });
  });
});
