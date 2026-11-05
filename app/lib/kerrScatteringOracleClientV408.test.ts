import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrScatteringOracleSummaryV408 } from "./kerrScatteringOracleV408";
import { getKerrScatteringOracleSnapshotV408, loadKerrScatteringOracleSummaryV408, resetKerrScatteringOracleClientForTestsV408 } from "./kerrScatteringOracleClientV408";

afterEach(() => { vi.unstubAllGlobals(); resetKerrScatteringOracleClientForTestsV408(); });
describe("v408 scattering oracle client", () => {
  it("single-flights summary-only state without the 181-point envelope", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-scattering-oracle-v408/portable-envelope.json", "utf8"));
    const summary = createKerrScatteringOracleSummaryV408(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v408-kerr-scattering-oracle-response-v1", available: true, reason: "ready", summary }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrScatteringOracleSummaryV408();
    const second = loadKerrScatteringOracleSummaryV408();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrScatteringOracleSnapshotV408()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(getKerrScatteringOracleSnapshotV408().summary?.curveEnvelope).not.toHaveProperty("samples");
  });
});
