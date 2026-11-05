import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  acquireAtlasObservationEvidenceCacheScopeV402,
  getAtlasObservationEvidenceCacheSnapshotV401,
  getAtlasObservationEvidenceLifecycleSnapshotV402,
  loadAtlasObservationEvidenceStageV401,
  resetAtlasObservationEvidenceCacheForTestsV401,
} from "./atlasObservationEvidenceCacheV401";

const CONSTRAINT_ARTIFACT = JSON.parse(readFileSync("dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json", "utf8"));

afterEach(() => {
  vi.unstubAllGlobals();
  resetAtlasObservationEvidenceCacheForTestsV401();
});

describe("v402 observation evidence cache lifecycle", () => {
  it("releases payload bytes at scope exit while retaining the audit ledger", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ available: true, reason: "ready", artifact: CONSTRAINT_ARTIFACT }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const release = acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub");
    await loadAtlasObservationEvidenceStageV401("constraints");
    expect(getAtlasObservationEvidenceCacheSnapshotV401()).toMatchObject({ cacheEntryCount: 1, requestCount: 1 });
    expect(getAtlasObservationEvidenceCacheSnapshotV401().cachedBytes).toBeGreaterThan(0);
    release();
    await Promise.resolve();
    expect(getAtlasObservationEvidenceCacheSnapshotV401()).toMatchObject({ cacheEntryCount: 0, cachedBytes: 0, requestCount: 0 });
    expect(getAtlasObservationEvidenceLifecycleSnapshotV402()).toMatchObject({ activeScopeCount: 0, releaseCount: 1, lifetimeRequestCount: 1, cacheAtBaseline: true, auditRetainedAfterRelease: true });
    expect(getAtlasObservationEvidenceLifecycleSnapshotV402().stages.constraints).toMatchObject({ lifetimeRequestCount: 1, successCount: 1, failureCount: 0, releasedPendingCount: 0, lastTerminalStatus: "ready", lastReason: null });
  });

  it("aborts a pending request on final release without recording a scientific failure", async () => {
    const fetchMock = vi.fn((_input: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!(signal instanceof AbortSignal)) throw new Error("missing-v402-abort-signal");
      signal.addEventListener("abort", () => reject(new DOMException("scope released", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);
    const release = acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub");
    const pending = loadAtlasObservationEvidenceStageV401("constraints");
    release();
    await Promise.resolve();
    await expect(pending).rejects.toThrow("scope-released");
    expect(getAtlasObservationEvidenceCacheSnapshotV401()).toMatchObject({ cacheEntryCount: 0, cachedBytes: 0, requestCount: 0 });
    expect(getAtlasObservationEvidenceLifecycleSnapshotV402().stages.constraints).toMatchObject({ lifetimeRequestCount: 1, successCount: 0, failureCount: 0, releasedPendingCount: 1, lastTerminalStatus: "released-pending", lastReason: "scope-released" });
  });

  it("defers final release by one microtask so Strict Mode reacquire stays stable", async () => {
    const releaseFirst = acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub");
    releaseFirst();
    const releaseSecond = acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub");
    await Promise.resolve();
    expect(getAtlasObservationEvidenceLifecycleSnapshotV402()).toMatchObject({ activeScopeCount: 1, releaseCount: 0 });
    releaseFirst();
    releaseSecond();
    releaseSecond();
    await Promise.resolve();
    expect(getAtlasObservationEvidenceLifecycleSnapshotV402()).toMatchObject({ activeScopeCount: 0, releaseCount: 1, cacheAtBaseline: true });
  });
});
