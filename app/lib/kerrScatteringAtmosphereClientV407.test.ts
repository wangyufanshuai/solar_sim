import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrScatteringAtmosphereSummaryV407 } from "./kerrScatteringAtmosphereV407";
import { getKerrScatteringAtmosphereSnapshotV407, loadKerrScatteringAtmosphereSummaryV407, resetKerrScatteringAtmosphereClientForTestsV407 } from "./kerrScatteringAtmosphereClientV407";

afterEach(() => { vi.unstubAllGlobals(); resetKerrScatteringAtmosphereClientForTestsV407(); });
describe("v407 scattering atmosphere client", () => {
  it("single-flights summary-only state without angle executions or 24 samples", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-scattering-atmosphere-v407/short-gate.json", "utf8"));
    const summary = createKerrScatteringAtmosphereSummaryV407(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v407-kerr-scattering-atmosphere-response-v1", available: true, reason: "ready", summary }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrScatteringAtmosphereSummaryV407();
    const second = loadKerrScatteringAtmosphereSummaryV407();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrScatteringAtmosphereSnapshotV407()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(getKerrScatteringAtmosphereSnapshotV407().summary).not.toHaveProperty("samples");
    expect(getKerrScatteringAtmosphereSnapshotV407().summary?.angleAudit).not.toHaveProperty("records");
  });
});
