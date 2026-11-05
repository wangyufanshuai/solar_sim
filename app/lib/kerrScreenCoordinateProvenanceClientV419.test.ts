import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createKerrScreenCoordinateSummaryV419 } from "./kerrScreenCoordinateProvenanceV419";
import { getKerrScreenCoordinateSnapshotV419, loadKerrScreenCoordinateSummaryV419, resetKerrScreenCoordinateClientForTestsV419 } from "./kerrScreenCoordinateProvenanceClientV419";

afterEach(() => { vi.unstubAllGlobals(); resetKerrScreenCoordinateClientForTestsV419(); });
describe("v419 screen-coordinate client", () => {
  it("keeps its shared static import edge free of Node builtins", () => {
    const sources = [
      "app/lib/kerrScreenCoordinateProvenanceClientV419.ts",
      "app/lib/kerrScreenCoordinateProvenanceV419.ts",
      "app/lib/kerrSparsePolarimetricProductV418.ts",
      "app/lib/sha256BrowserV566.ts",
    ].map((path) => [path, readFileSync(path, "utf8")] as const);
    expect(sources[0][1]).toContain('from "./kerrScreenCoordinateProvenanceV419"');
    expect(sources[1][1]).toContain('from "./sha256BrowserV566"');
    for (const [path, source] of sources) {
      expect(source, path).not.toMatch(/(?:from|require\()\s*["']node:/);
    }
  });

  it("single-flights a bounded four-row coordinate summary", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json", "utf8"));
    const summary = createKerrScreenCoordinateSummaryV419(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v419-kerr-screen-coordinate-provenance-response-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrScreenCoordinateSummaryV419();
    expect(loadKerrScreenCoordinateSummaryV419()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrScreenCoordinateSnapshotV419()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
