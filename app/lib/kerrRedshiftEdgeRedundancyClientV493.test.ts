import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KERR_REDSHIFT_EDGE_REDUNDANCY_API_VERSION_V493, createKerrRedshiftEdgeRedundancySummaryV493 } from "./kerrRedshiftEdgeRedundancyV493";
import { getKerrRedshiftEdgeRedundancySnapshotV493, loadKerrRedshiftEdgeRedundancySummaryV493, resetKerrRedshiftEdgeRedundancyClientForTestsV493 } from "./kerrRedshiftEdgeRedundancyClientV493";

afterEach(() => { resetKerrRedshiftEdgeRedundancyClientForTestsV493(); vi.unstubAllGlobals(); });

describe("v493 edge redundancy client", () => {
  it("stays idle before explicit intent and single-flights", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.json", "utf8"));
    const summary = createKerrRedshiftEdgeRedundancySummaryV493(artifact);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ version: KERR_REDSHIFT_EDGE_REDUNDANCY_API_VERSION_V493, available: true, reason: "ready", summary }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(getKerrRedshiftEdgeRedundancySnapshotV493().requestCount).toBe(0);
    const first = loadKerrRedshiftEdgeRedundancySummaryV493();
    const second = loadKerrRedshiftEdgeRedundancySummaryV493();
    expect(first).toBe(second);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
