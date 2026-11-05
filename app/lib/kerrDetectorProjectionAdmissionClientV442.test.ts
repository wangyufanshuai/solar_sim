import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrDetectorProjectionAdmissionSummaryV442 } from "./kerrDetectorProjectionAdmissionV442";
import { getKerrDetectorProjectionAdmissionSnapshotV442, loadKerrDetectorProjectionAdmissionSummaryV442, resetKerrDetectorProjectionAdmissionClientForTestsV442 } from "./kerrDetectorProjectionAdmissionClientV442";
afterEach(() => { vi.unstubAllGlobals(); resetKerrDetectorProjectionAdmissionClientForTestsV442(); });
describe("v442 admission client", () => {
  it("single-flights a summary-only request", async () => {
    const summary = createKerrDetectorProjectionAdmissionSummaryV442(JSON.parse(readFileSync("dist/science/kerr-detector-projection-admission-v442/detector-projection-admission.json", "utf8")));
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v442-kerr-detector-projection-admission-api-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrDetectorProjectionAdmissionSummaryV442();
    expect(loadKerrDetectorProjectionAdmissionSummaryV442()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrDetectorProjectionAdmissionSnapshotV442()).toMatchObject({ status: "ready", requestCount: 1, summary: { qualification: { admission: "blocked" } } });
  });
});
