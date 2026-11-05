import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v300 final-heavy resource preflight contract", () => {
  it("refuses to consume an attempt before the dense campaign is complete", () => {
    const runner = readFileSync("scripts/run-resource-preflight-v275r1.mjs", "utf8");
    const readiness = runner.indexOf("if (V300_HEAVY && !v300CampaignReadiness?.ready)");
    const termination = runner.indexOf("const terminationOutcomes = await terminateProjectProcesses");
    const sampling = runner.indexOf("for (let index = 1; index <= ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1");
    expect(readiness).toBeGreaterThan(0);
    expect(readiness).toBeLessThan(termination);
    expect(readiness).toBeLessThan(sampling);
    expect(runner).toContain("v300 heavy resource attempt not consumed");
    expect(runner).toContain('state.status !== "complete"');
    expect(runner).toContain("state.completedShardCount !== 49");
    expect(runner).toContain("aggregateIdentityMatches");
  });

  it("keeps inspect read-only and exposes a dedicated immutable evidence identity", () => {
    const runner = readFileSync("scripts/run-resource-preflight-v275r1.mjs", "utf8");
    const cli = readFileSync("scripts/atlas.mjs", "utf8");
    expect(runner).toContain('"v300-heavy-resource-stability-v1"');
    expect(runner.indexOf("if (inspectOnly)")).toBeLessThan(runner.indexOf("terminateProjectProcesses(initialProcesses)"));
    expect(cli).toContain('action === "resource-v300-heavy"');
    expect(cli).toContain('"--attempt", "v300-heavy"');
  });
});
