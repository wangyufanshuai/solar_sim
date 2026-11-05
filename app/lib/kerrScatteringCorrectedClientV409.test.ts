import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrScatteringCorrectedSummaryV409 } from "./kerrScatteringCorrectedV409";
import { getKerrScatteringCorrectedSnapshotV409, loadKerrScatteringCorrectedSummaryV409, resetKerrScatteringCorrectedClientForTestsV409 } from "./kerrScatteringCorrectedClientV409";
afterEach(() => { vi.unstubAllGlobals(); resetKerrScatteringCorrectedClientForTestsV409(); });
describe("v409 corrected scattering client", () => {
  it("single-flights a four-ray summary without 24 samples", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-scattering-corrected-v409/sparse-stokes.json", "utf8"));
    const summary = createKerrScatteringCorrectedSummaryV409(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v409-kerr-sparse-stokes-correction-response-v1", available: true, reason: "ready", summary }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrScatteringCorrectedSummaryV409(); const second = loadKerrScatteringCorrectedSummaryV409(); expect(second).toBe(first); await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrScatteringCorrectedSnapshotV409()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(getKerrScatteringCorrectedSnapshotV409().summary).not.toHaveProperty("samples");
  });
});
