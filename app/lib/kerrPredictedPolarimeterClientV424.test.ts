import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createKerrPredictedPolarimeterSummaryV424 } from "./kerrPredictedPolarimeterV424";
import {
  getKerrPredictedPolarimeterSnapshotV424,
  loadKerrPredictedPolarimeterSummaryV424,
  resetKerrPredictedPolarimeterClientForTestsV424,
} from "./kerrPredictedPolarimeterClientV424";

afterEach(() => {
  vi.unstubAllGlobals();
  resetKerrPredictedPolarimeterClientForTestsV424();
});
describe("v424 predicted polarimeter client", () => {
  it("single-flights the bounded reference-frequency summary", async () => {
    const artifact = JSON.parse(readFileSync("dist/science/kerr-predicted-polarimeter-v424/predicted-ideal-dual-beam.json", "utf8"));
    const summary = createKerrPredictedPolarimeterSummaryV424(artifact);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v424-kerr-predicted-ideal-dual-beam-modulation-response-v1", available: true, reason: "ready", summary })));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadKerrPredictedPolarimeterSummaryV424();
    expect(loadKerrPredictedPolarimeterSummaryV424()).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getKerrPredictedPolarimeterSnapshotV424()).toMatchObject({ status: "ready", requestCount: 1 });
  });
});
