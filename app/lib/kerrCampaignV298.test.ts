import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isKerrDenseCampaignStateV298 } from "./kerrCampaignV298";

describe("v298 dense campaign planner", () => {
  it("initializes a deterministic no-shard state", () => {
    const state = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v298/campaign-state.json"), "utf8"));
    expect(isKerrDenseCampaignStateV298(state)).toBe(true);
    expect(state.status).toBe("incomplete-0-of-49");
    expect(state.completedShardCount).toBe(0);
    expect(state.runNextAvailable).toBe(false);
    expect(state.shards).toHaveLength(49);
    expect(state.shards.slice(0, 10).every((shard: { rayCount: number }) => shard.rayCount === 64)).toBe(true);
    expect(state.shards.slice(10).every((shard: { rayCount: number }) => shard.rayCount === 63)).toBe(true);
    let cursor = 0;
    for (const shard of state.shards as Array<{ rayStart: number; rayEndExclusive: number; rayCount: number }>) {
      expect(shard.rayStart).toBe(cursor);
      expect(shard.rayEndExclusive - shard.rayStart).toBe(shard.rayCount);
      cursor = shard.rayEndExclusive;
    }
    expect(cursor).toBe(3097);
  });
});
