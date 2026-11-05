import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isKerrCorrectedDenseCampaignStateV314 } from "./kerrCampaignV314";

describe("v314 corrected dense campaign initialization", () => {
  it("locks 3097 rays into 49 shards without consuming a shard attempt", () => {
    const state = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"));
    const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));
    expect(isKerrCorrectedDenseCampaignStateV314(state)).toBe(true);
    expect(plan).toMatchObject({ version: "v314-kerr-corrected-dense-ray-plan-v1", rayCount: 3097, shardCount: 49, executionsPerRay: 8, strata: { canonical: 16, criticalBand: 560, diskBand: 840, uniformField: 1681 } });
    expect(plan.rays).toHaveLength(3097);
    expect(plan.shards).toHaveLength(49);
    expect(plan.shards.every((shard: { rayCount: number }) => shard.rayCount <= 64)).toBe(true);
    expect(state).toMatchObject({ completedShardCount: 0, attemptConsumed: false, runNextAuthorized: false, runNextAvailable: false, aggregateAvailable: false, formalProductPointer: "v263" });
  });
});
