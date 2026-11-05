import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "app/workers/celestialStarfieldV590.worker.ts"), "utf8");

describe("v590 Gaia worker boundary", () => {
  it("keeps catalog work off the React render thread and exposes release", () => {
    expect(source).toContain('type: "load" | "view"');
    expect(source).toContain('type: "release"');
    expect(source).toContain("activeAbort?.abort()");
    expect(source).toContain('postSnapshot(request.requestId, "released"');
  });

  it("keeps shared catalog initialization independent from transient camera requests", () => {
    expect(source).toContain("let fullInitializeAbort: AbortController | null = null");
    expect(source).toContain("let liteBundleAbort: AbortController | null = null");
    expect(source).toContain("await initializeFull()");
    expect(source).toContain("await loadLiteBundle()");
    expect(source).toContain("request.requestId !== activeRequestId");
  });

  it("transfers deterministic scientific-free presentation arrays", () => {
    expect(source).toContain("directions: Float32Array");
    expect(source).toContain("sourceIds: BigUint64Array");
    expect(source).toContain("constellationAnchorIndex: Int32Array");
    expect(source).toContain("presentationOnly: true");
    expect(source).not.toContain("Math.random");
  });

  it("uses view-wide stratified parents and leaves instead of nearest-only HEALPix tiles", () => {
    expect(source).toContain("selectStratifiedCatalogParentsV590");
    expect(source).toContain("selectStratifiedCatalogLeavesV590");
    expect(source).toContain("stratifiedParentLimitV590");
    expect(source).not.toContain("selectCatalogTilesForConeV8");
  });

  it("uses the admitted Gaia 46K catalog as a continuous base and the 10M Range catalog only as a real-star supplement", () => {
    expect(source).toContain("mergeFullWithLiteV590");
    expect(source).toContain("Math.min(lite.records.length, budget)");
    expect(source).toContain("Math.min(2_000, Math.max(0, budget - liteRecords.length))");
    expect(source).toContain("range-plus-gaia-lite-46000-hybrid-v590");
    expect(source).not.toContain("appendAnchors");
  });
});
