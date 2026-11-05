import { describe, expect, it } from "vitest";
import { loadAtlasLifecycleProvenanceDossierV405, resetAtlasLifecycleProvenanceDossierServerV405CacheForTests } from "./atlasLifecycleProvenanceDossierServerV405";

describe("v405 dossier server", () => {
  it("loads one canonical bounded dossier", async () => {
    resetAtlasLifecycleProvenanceDossierServerV405CacheForTests();
    const first = await loadAtlasLifecycleProvenanceDossierV405();
    const second = await loadAtlasLifecycleProvenanceDossierV405();
    expect(second).toBe(first);
    expect(first.responseBytes).toBeLessThan(128 * 1024);
    expect(first.dossier.lineage).toMatchObject({ nodeCount: 4, edgeCount: 3 });
    expect(first.dossier).not.toHaveProperty("cycles");
  });
});
