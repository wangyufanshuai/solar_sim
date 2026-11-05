import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import { acquireKerrScienceImageProbeV346, getKerrScienceImageProbeClientSnapshotV346, resetKerrScienceImageProbeClientV346ForTests } from "./kerrScienceImageProbeClientV346";
import { loadKerrScienceImageProbeV346 } from "./kerrScienceImageProbeServerV346";

const originalFetch = globalThis.fetch;
async function sha(bytes: Uint8Array): Promise<string> { const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer); return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join(""); }
beforeEach(() => resetKerrScienceImageProbeClientV346ForTests());
afterEach(() => { globalThis.fetch = originalFetch; resetKerrScienceImageProbeClientV346ForTests(); vi.restoreAllMocks(); });

describe("v346 science image probe client", () => {
  it("is intent-only, single-flight and returns to the resource baseline", async () => {
    const artifact = await loadKerrScienceImageProbeV346(); const body = new TextEncoder().encode(JSON.stringify(artifact)); const etag = await sha(body); const baseline = getAtlasResourceSnapshot(); let requests = 0;
    globalThis.fetch = vi.fn(async () => { requests += 1; return new Response(body, { status: 200, headers: { "content-type": "application/json", "content-length": String(body.byteLength), etag: `"${etag}"`, "x-atlas-science-probe": "v346" } }); });
    expect(getKerrScienceImageProbeClientSnapshotV346().fetchCount).toBe(0);
    const [first, second] = await Promise.all([acquireKerrScienceImageProbeV346(), acquireKerrScienceImageProbeV346()]);
    expect(requests).toBe(1); expect(getKerrScienceImageProbeClientSnapshotV346()).toMatchObject({ referenceCount: 2, fetchCount: 1 });
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot())).toMatchObject({ typedArrayCaches: 1, objectUrls: 0 });
    second.release(); first.release(); first.release();
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });
});
