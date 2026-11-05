import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrHighEnergyResponseAcquisitionSummaryV427 } from "./kerrHighEnergyResponseAcquisitionPackV427";
import { getKerrHighEnergyResponseAcquisitionSnapshotV427, loadKerrHighEnergyResponseAcquisitionSummaryV427, resetKerrHighEnergyResponseAcquisitionClientForTestsV427 } from "./kerrHighEnergyResponseAcquisitionPackClientV427";

afterEach(() => { vi.unstubAllGlobals(); resetKerrHighEnergyResponseAcquisitionClientForTestsV427(); });
describe("v427 high-energy response acquisition client", () => {
  it("single-flights a bounded summary without fixture or measurement tables", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-high-energy-response-acquisition-pack-v427/acquisition-pack.json", "utf8"));
    const summary = createKerrHighEnergyResponseAcquisitionSummaryV427(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v427-kerr-high-energy-response-acquisition-pack-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrHighEnergyResponseAcquisitionSummaryV427();
    expect(loadKerrHighEnergyResponseAcquisitionSummaryV427()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrHighEnergyResponseAcquisitionSnapshotV427()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
