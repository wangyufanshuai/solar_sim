import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getRelativityLifecycleEvidenceSnapshotV404,
  loadRelativityLifecycleEvidenceV404,
  resetRelativityLifecycleEvidenceClientForTestsV404,
} from "./relativityLifecycleEvidenceClientV404";

const summary = () => JSON.parse(JSON.stringify({
  version: "v404-atlas-observation-lifecycle-replay-summary-v1",
  generatedAt: "2026-07-29T00:00:00.000Z",
  status: "fixture-replay-summary-ready-browser-soak-not-run",
  source: {
    replayArtifactSha256: "a".repeat(64), replayArtifactFileSha256: "b".repeat(64),
    v403EvidenceSha256: "c".repeat(64), v403PointerSha256: "d".repeat(64),
  },
  replay: { cycleCount: 30, deterministicExecutionCount: 2, totalRequestCount: 114, successCount: 108, failureCount: 4, releasedPendingRequestCount: 2, baselineCycleCount: 30, maximumCacheEntryCount: 4, maximumCachedBytes: 22271, deterministicReplay: true, networkAttempted: false },
  stages: {
    constraints: { lifetimeRequestCount: 30, successCount: 27, failureCount: 1, releasedPendingCount: 2 },
    admission: { lifetimeRequestCount: 28, successCount: 27, failureCount: 1, releasedPendingCount: 0 },
    intake: { lifetimeRequestCount: 28, successCount: 27, failureCount: 1, releasedPendingCount: 0 },
    provenance: { lifetimeRequestCount: 28, successCount: 27, failureCount: 1, releasedPendingCount: 0 },
  },
  qualification: { fixtureReplayQualified: true, browserSoakQualified: false, productionLifecycleQualified: false, scientificAuthorityChanged: false, cycleDetailsExposed: false },
  summarySha256: "e".repeat(64),
}));

afterEach(() => { vi.unstubAllGlobals(); resetRelativityLifecycleEvidenceClientForTestsV404(); });

describe("v404 lifecycle summary client", () => {
  it("single-flights a bounded summary and stores no cycle array", async () => {
    const payload = JSON.stringify({ version: "v404-relativity-lifecycle-evidence-response-v1", available: true, reason: "ready", summary: summary() });
    const fetchMock = vi.fn(async () => new Response(payload, { status: 200, headers: { "Content-Length": String(new TextEncoder().encode(payload).byteLength) } }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadRelativityLifecycleEvidenceV404();
    const second = loadRelativityLifecycleEvidenceV404();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getRelativityLifecycleEvidenceSnapshotV404()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(getRelativityLifecycleEvidenceSnapshotV404().summary).not.toHaveProperty("cycles");
  });

  it("retains a fail-closed unavailable promise without automatic retry", async () => {
    const payload = JSON.stringify({ version: "v404-relativity-lifecycle-evidence-response-v1", available: false, reason: "lite-boundary", summary: null });
    const fetchMock = vi.fn(async () => new Response(payload, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(loadRelativityLifecycleEvidenceV404()).rejects.toThrow("lite-boundary");
    await expect(loadRelativityLifecycleEvidenceV404()).rejects.toThrow("lite-boundary");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getRelativityLifecycleEvidenceSnapshotV404()).toMatchObject({ status: "unavailable", reason: "lite-boundary", summary: null });
  });
});
