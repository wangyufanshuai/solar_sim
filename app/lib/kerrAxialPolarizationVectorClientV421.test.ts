import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrAxialPolarizationVectorSummaryV421 } from "./kerrAxialPolarizationVectorCatalogV421";
import { getKerrAxialPolarizationVectorSnapshotV421, loadKerrAxialPolarizationVectorSummaryV421, resetKerrAxialPolarizationVectorClientForTestsV421 } from "./kerrAxialPolarizationVectorClientV421";

afterEach(() => { vi.unstubAllGlobals(); resetKerrAxialPolarizationVectorClientForTestsV421(); });
describe("v421 axial-vector client", () => {
  it("single-flights a bounded four-vector summary", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-axial-polarization-vectors-v421/axial-vector-catalog.json", "utf8"));
    const summary = createKerrAxialPolarizationVectorSummaryV421(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v421-kerr-axial-polarization-vector-response-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrAxialPolarizationVectorSummaryV421();
    expect(loadKerrAxialPolarizationVectorSummaryV421()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrAxialPolarizationVectorSnapshotV421()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
