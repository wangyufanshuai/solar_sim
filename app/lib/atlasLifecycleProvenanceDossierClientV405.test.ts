import { afterEach, describe, expect, it, vi } from "vitest";
import { getAtlasLifecycleProvenanceDossierSnapshotV405, loadAtlasLifecycleProvenanceDossierV405, resetAtlasLifecycleProvenanceDossierClientForTestsV405 } from "./atlasLifecycleProvenanceDossierClientV405";
import { readFileSync } from "node:fs";

afterEach(() => { vi.unstubAllGlobals(); resetAtlasLifecycleProvenanceDossierClientForTestsV405(); });
describe("v405 dossier client", () => {
  it("single-flights one bounded dossier without retries", async () => {
    const dossier = JSON.parse(readFileSync("dist/science/atlas-evidence-observatory-v405/portable-dossier.json", "utf8"));
    const body = JSON.stringify({ version: "v405-atlas-lifecycle-dossier-response-v1", available: true, reason: "ready", dossier });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200, headers: { "Content-Length": String(new TextEncoder().encode(body).byteLength) } }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadAtlasLifecycleProvenanceDossierV405();
    const second = loadAtlasLifecycleProvenanceDossierV405();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAtlasLifecycleProvenanceDossierSnapshotV405()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(getAtlasLifecycleProvenanceDossierSnapshotV405().dossier).not.toHaveProperty("cycles");
  });
});
