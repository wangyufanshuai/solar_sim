import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrHighEnergyResponseIntakeSummaryV428 } from "./kerrHighEnergyResponseIntakeV428";
import { getKerrHighEnergyResponseIntakeSnapshotV428, loadKerrHighEnergyResponseIntakeSummaryV428, resetKerrHighEnergyResponseIntakeClientForTestsV428 } from "./kerrHighEnergyResponseIntakeClientV428";

afterEach(() => { vi.unstubAllGlobals(); resetKerrHighEnergyResponseIntakeClientForTestsV428(); });
describe("v428 high-energy response intake client", () => {
  it("single-flights a bounded summary without normalized measurements", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-high-energy-response-intake-v428/intake-firewall.json", "utf8"));
    const summary = createKerrHighEnergyResponseIntakeSummaryV428(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v428-kerr-high-energy-response-intake-firewall-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrHighEnergyResponseIntakeSummaryV428();
    expect(loadKerrHighEnergyResponseIntakeSummaryV428()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrHighEnergyResponseIntakeSnapshotV428()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
