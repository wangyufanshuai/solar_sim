import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isKerrDenseAggregateV298R1, isKerrDenseCampaignStateV298R1, isKerrDenseRayPlanV298R1, isKerrDenseShardScienceAuditV298R1 } from "./kerrCampaignV298R1";

describe("v298r1 executable dense campaign", () => {
  it("locks an exact deterministic 3097-ray plan", () => {
    const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/ray-plan.json"), "utf8"));
    expect(isKerrDenseRayPlanV298R1(plan)).toBe(true);
    expect(plan.rays.slice(0, 16).every((ray: { stratum: string }) => ray.stratum === "canonical")).toBe(true);
    expect(plan.rays.slice(16, 576).every((ray: { stratum: string }) => ray.stratum === "critical-band")).toBe(true);
    expect(plan.rays.slice(576, 1416).every((ray: { stratum: string }) => ray.stratum === "disk-band")).toBe(true);
    expect(plan.rays.slice(1416).every((ray: { stratum: string }) => ray.stratum === "uniform-field")).toBe(true);
  });

  it("keeps partial aggregate fail-closed", () => {
    const state = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/campaign-state.json"), "utf8"));
    expect(isKerrDenseCampaignStateV298R1(state)).toBe(true);
    expect(state.completedShardCount).toBeLessThanOrEqual(1);
    expect(state.partialAggregate).toBe(false);
    expect(state.aggregateAvailable).toBe(false);
    expect(state.formalProductPointer).toBe("v263");
    expect(state.defaultKernel).toBe("legacy-eih-1pn");
  });

  it("rejects state/published-index drift and accepts only a fully qualified aggregate envelope", () => {
    const state = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/campaign-state.json"), "utf8"));
    expect(isKerrDenseCampaignStateV298R1({ ...state, completedShardIndices: [0, 0] })).toBe(false);
    expect(isKerrDenseCampaignStateV298R1({ ...state, status: "incomplete-2-of-49" })).toBe(false);
    const aggregate = {
      version: "v298r1-kerr-dense-aggregate-v1",
      status: "complete",
      rayCount: 3097,
      executionCount: 24776,
      shardCount: 49,
      classCounts: { capture: 1, escape: 1, "disk-hit": 1 },
      applicablePolarizationExecutionCount: 1,
      unavailablePolarizationExecutionCount: 0,
      qualification: {
        qualified: true,
        classificationAgreement: 1,
        redshiftComparisonCount: 1,
        maxRedshiftFormulaDifference: 1e-4,
        maxReleaseEvpaDifferenceDeg: 1e-4,
        maxInternalEvpaDifferenceDeg: 1e-5,
        gates: { classificationAgreement: true, redshift: true, polarization: true },
      },
      partialAggregate: false,
      formalProductPointer: "v263",
      aggregateSha256: "a".repeat(64),
    };
    expect(isKerrDenseAggregateV298R1(aggregate)).toBe(true);
    expect(isKerrDenseAggregateV298R1({ ...aggregate, qualification: { ...aggregate.qualification, gates: { redshift: false } } })).toBe(false);
  });

  it("validates the immutable shard audit without treating it as an aggregate", () => {
    const audit = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298r1/audits/shard-00.science-audit.json"), "utf8"));
    expect(isKerrDenseShardScienceAuditV298R1(audit)).toBe(true);
    expect(audit).toMatchObject({
      status: "shard-structural-qualified",
      rayCount: 64,
      executionCount: 512,
      aggregateEligible: false,
      errorBudget: {
        independenceAssumption: "not-established",
        combinationPolicy: "componentwise-reporting-no-rss-no-cross-dimension-sum",
      },
    });
    expect(isKerrDenseShardScienceAuditV298R1({ ...audit, aggregateEligible: true })).toBe(false);
    const cli = readFileSync(resolve(process.cwd(), "scripts/atlas.mjs"), "utf8");
    expect(cli).toContain('action === "kerr-v298r1-audit-published"');
  });
});
