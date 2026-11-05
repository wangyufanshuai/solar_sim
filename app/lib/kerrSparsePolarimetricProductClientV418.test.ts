import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createKerrSparsePolarimetricSummaryV418,
} from "./kerrSparsePolarimetricProductV418";
import {
  getKerrSparsePolarimetricSnapshotV418,
  loadKerrSparsePolarimetricSummaryV418,
  resetKerrSparsePolarimetricClientForTestsV418,
} from "./kerrSparsePolarimetricProductClientV418";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrSparsePolarimetricClientForTestsV418();
});

describe("v418 sparse polarimetric client", () => {
  it("keeps its shared static import edge free of Node builtins", () => {
    const sources = [
      "app/lib/kerrSparsePolarimetricProductClientV418.ts",
      "app/lib/kerrSparsePolarimetricProductV418.ts",
      "app/lib/kerrPolarimeterNonlinearObservablesV417.ts",
      "app/lib/kerrSciencePhotonBandsV328.ts",
      "app/lib/sha256BrowserV566.ts",
    ].map((path) => [path, readFileSync(path, "utf8")] as const);
    expect(sources[0][1]).toContain('from "./kerrSparsePolarimetricProductV418"');
    expect(sources[1][1]).toContain('from "./sha256BrowserV566"');
    for (const [path, source] of sources) {
      expect(source, path).not.toMatch(/(?:from|require\()\s*["']node:/);
    }
  });

  it("single-flights the bounded four-row summary", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-sparse-polarimetric-product-v418/diagnostic-product.json", "utf8"));
    const summary = createKerrSparsePolarimetricSummaryV418(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      version: "v418-kerr-sparse-polarimetric-diagnostic-response-v1",
      available: true,
      reason: "ready",
      summary,
    })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrSparsePolarimetricSummaryV418();
    const second = loadKerrSparsePolarimetricSummaryV418();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrSparsePolarimetricSnapshotV418()).toMatchObject({ status: "ready", requestCount: 1 });
    expect(getKerrSparsePolarimetricSnapshotV418().summary?.rows).toHaveLength(4);
  });
});
