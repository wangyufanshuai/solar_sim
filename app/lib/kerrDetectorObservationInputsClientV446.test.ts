import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrDetectorObservationInputSummaryV446 } from "./kerrDetectorObservationInputsV446";
import { getKerrDetectorObservationInputSnapshotV446, loadKerrDetectorObservationInputSummaryV446, resetKerrDetectorObservationInputsClientForTestsV446 } from "./kerrDetectorObservationInputsClientV446";
afterEach(() => { vi.unstubAllGlobals(); resetKerrDetectorObservationInputsClientForTestsV446(); });
describe("v446 observation input client", () => { it("single-flights the bounded staging summary", async () => { const summary = createKerrDetectorObservationInputSummaryV446(JSON.parse(readFileSync("dist/science/kerr-detector-observation-inputs-v446/observation-inputs-inspect.json", "utf8"))); const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v446-kerr-detector-observation-inputs-api-v1", available: true, reason: "ready", summary }))); vi.stubGlobal("fetch", fetchMock); const first = loadKerrDetectorObservationInputSummaryV446(); expect(loadKerrDetectorObservationInputSummaryV446()).toBe(first); await first; expect(fetchMock).toHaveBeenCalledTimes(1); expect(getKerrDetectorObservationInputSnapshotV446()).toMatchObject({ status: "ready", requestCount: 1, summary: { authorityJoinReady: false } }); }); });

describe("v596 browser boundary regression", () => {
  it("keeps the V446 client bundle free of Node runtime imports", () => {
    const source = readFileSync("app/lib/kerrDetectorObservationInputsClientV446.ts", "utf8");
    expect(source).not.toMatch(/from\s+["']node:/);
    expect(source).not.toContain("import { parseKerrDetectorObservationInputApiV446");
    expect(source).toContain("import type {");
    expect(source).toContain("parseKerrDetectorObservationInputApiClientV446");
  });
});
