import { describe, expect, it } from "vitest";
import { canAggregateKerrDenseCampaignV284 } from "./kerrCampaignV284";

describe("v284 dense campaign closure", () => {
  it("refuses partial aggregate", () => {
    expect(canAggregateKerrDenseCampaignV284({ completedShardCount: 1, rayCount: 64, executionCount: 512 })).toBe(false);
  });
  it("requires exact conservation before aggregate", () => {
    expect(canAggregateKerrDenseCampaignV284({ completedShardCount: 49, rayCount: 3097, executionCount: 24776 })).toBe(true);
  });
});
