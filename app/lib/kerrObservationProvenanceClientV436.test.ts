import { afterEach, describe, expect, it, vi } from "vitest";
import { getKerrObservationProvenanceSnapshotV436, loadKerrObservationProvenanceSummaryV436, resetKerrObservationProvenanceClientForTestsV436 } from "./kerrObservationProvenanceClientV436";
import { createKerrObservationSummaryV436 } from "./kerrObservationProvenanceV436";
import { readFileSync } from "node:fs";

afterEach(() => { vi.unstubAllGlobals(); resetKerrObservationProvenanceClientForTestsV436(); });
describe("v436 evidence client", () => {
  it("single-flights no-store summary and keeps dense incomplete", async () => {
    const oracle = JSON.parse(readFileSync("dist/science/kerr-observation-provenance-v436/observation-provenance-oracle.json", "utf8"));
    const summary = createKerrObservationSummaryV436(oracle);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v436-kerr-observation-provenance-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrObservationProvenanceSummaryV436();
    expect(loadKerrObservationProvenanceSummaryV436()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrObservationProvenanceSnapshotV436()).toMatchObject({ status: "ready", requestCount: 1, summary: { boundary: { denseAuthority: false } } });
  });
});
