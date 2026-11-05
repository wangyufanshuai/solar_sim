import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrHighEnergyCountLikelihoodSummaryV430 } from "./kerrHighEnergyCountLikelihoodV430";
import { getKerrHighEnergyCountLikelihoodSnapshotV430, loadKerrHighEnergyCountLikelihoodSummaryV430, resetKerrHighEnergyCountLikelihoodClientForTestsV430 } from "./kerrHighEnergyCountLikelihoodClientV430";

afterEach(() => { vi.unstubAllGlobals(); resetKerrHighEnergyCountLikelihoodClientForTestsV430(); });

describe("v430 count-likelihood client", () => {
  it("single-flights a bounded summary without count or covariance arrays", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-high-energy-count-likelihood-v430/count-likelihood.json", "utf8"));
    const summary = createKerrHighEnergyCountLikelihoodSummaryV430(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v430-kerr-high-energy-count-likelihood-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrHighEnergyCountLikelihoodSummaryV430();
    expect(loadKerrHighEnergyCountLikelihoodSummaryV430()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrHighEnergyCountLikelihoodSnapshotV430()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
