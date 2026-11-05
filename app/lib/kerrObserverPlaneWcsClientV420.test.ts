import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrObserverPlaneWcsSummaryV420 } from "./kerrObserverPlaneWcsV420";
import { getKerrObserverPlaneWcsSnapshotV420, loadKerrObserverPlaneWcsSummaryV420, resetKerrObserverPlaneWcsClientForTestsV420 } from "./kerrObserverPlaneWcsClientV420";

afterEach(() => { vi.unstubAllGlobals(); resetKerrObserverPlaneWcsClientForTestsV420(); });
describe("v420 observer WCS client", () => {
  it("single-flights a bounded WCS and source summary", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json", "utf8"));
    const summary = createKerrObserverPlaneWcsSummaryV420(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v420-kerr-observer-plane-WCS-response-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrObserverPlaneWcsSummaryV420();
    expect(loadKerrObserverPlaneWcsSummaryV420()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrObserverPlaneWcsSnapshotV420()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
