import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrHighEnergyLikelihoodStressSummaryV431 } from "./kerrHighEnergyLikelihoodStressV431";
import { getKerrHighEnergyLikelihoodStressSnapshotV431, loadKerrHighEnergyLikelihoodStressSummaryV431, resetKerrHighEnergyLikelihoodStressClientForTestsV431 } from "./kerrHighEnergyLikelihoodStressClientV431";

afterEach(() => { vi.unstubAllGlobals(); resetKerrHighEnergyLikelihoodStressClientForTestsV431(); });

describe("v431 likelihood stress client", () => {
  it("single-flights a bounded summary without holdout count arrays", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-high-energy-likelihood-stress-v431/likelihood-stress.json", "utf8"));
    const summary = createKerrHighEnergyLikelihoodStressSummaryV431(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v431-kerr-high-energy-likelihood-stress-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrHighEnergyLikelihoodStressSummaryV431();
    expect(loadKerrHighEnergyLikelihoodStressSummaryV431()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrHighEnergyLikelihoodStressSnapshotV431()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
