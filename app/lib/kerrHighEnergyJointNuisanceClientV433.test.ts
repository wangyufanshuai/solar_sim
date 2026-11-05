import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrHighEnergyJointNuisanceSummaryV433 } from "./kerrHighEnergyJointNuisanceV433";
import { getKerrHighEnergyJointNuisanceSnapshotV433, loadKerrHighEnergyJointNuisanceSummaryV433, resetKerrHighEnergyJointNuisanceClientForTestsV433 } from "./kerrHighEnergyJointNuisanceClientV433";

afterEach(() => { vi.unstubAllGlobals(); resetKerrHighEnergyJointNuisanceClientForTestsV433(); });

describe("v433 joint nuisance client", () => {
  it("single-flights a bounded summary without covariance matrices", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-high-energy-joint-nuisance-v433/joint-nuisance.json", "utf8"));
    const summary = createKerrHighEnergyJointNuisanceSummaryV433(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v433-kerr-high-energy-joint-nuisance-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrHighEnergyJointNuisanceSummaryV433();
    expect(loadKerrHighEnergyJointNuisanceSummaryV433()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrHighEnergyJointNuisanceSnapshotV433()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(JSON.stringify(getKerrHighEnergyJointNuisanceSnapshotV433())).not.toContain("jointCovariance");
  });
});
