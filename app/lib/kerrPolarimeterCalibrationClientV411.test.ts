import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPolarimeterCalibrationSummaryV411 } from "./kerrPolarimeterCalibrationV411";
import { getPolarimeterCalibrationSnapshotV411, loadPolarimeterCalibrationSummaryV411, resetPolarimeterCalibrationClientForTestsV411 } from "./kerrPolarimeterCalibrationClientV411";

afterEach(() => { vi.unstubAllGlobals(); resetPolarimeterCalibrationClientForTestsV411(); });
describe("v411 polarimeter calibration client", () => {
  it("single-flights a bounded fail-closed summary", async () => {
    const inspect = JSON.parse(readFileSync("dist/science/kerr-polarimeter-calibration-v411/inspect.json", "utf8"));
    const summary = createPolarimeterCalibrationSummaryV411(inspect);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ version: "v411-kerr-polarimeter-calibration-response-v1", available: true, reason: "ready", summary }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const first = loadPolarimeterCalibrationSummaryV411();
    const second = loadPolarimeterCalibrationSummaryV411();
    expect(second).toBe(first);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getPolarimeterCalibrationSnapshotV411()).toMatchObject({ status: "ready", requestCount: 1, summary: { measuredPack: { present: false }, admission: { authorityGranted: false } } });
  });
});
