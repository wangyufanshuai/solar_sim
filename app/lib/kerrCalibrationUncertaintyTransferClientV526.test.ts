import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrCalibrationUncertaintyTransferSnapshotV526,
  loadKerrCalibrationUncertaintyTransferSummaryV526,
  resetKerrCalibrationUncertaintyTransferClientForTestsV526,
  subscribeKerrCalibrationUncertaintyTransferV526,
} from "./kerrCalibrationUncertaintyTransferClientV526";
import { createKerrCalibrationUncertaintyTransferSummaryV526 } from "./kerrCalibrationUncertaintyTransferV526";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(readFileSync("dist/science/kerr-calibration-uncertainty-transfer-v526/transfer.json", "utf8"));
beforeEach(() => resetKerrCalibrationUncertaintyTransferClientForTestsV526());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrCalibrationUncertaintyTransferClientForTestsV526();
  vi.restoreAllMocks();
});
describe("v526 calibration uncertainty transfer client", () => {
  it("single-flights explicit consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrCalibrationUncertaintyTransferSummaryV526(artifact);
    const body = JSON.stringify({ version: "v526-kerr-calibration-uncertainty-transfer-api-v1", available: true, reason: "ready", summary });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [subscribeKerrCalibrationUncertaintyTransferV526(() => undefined), subscribeKerrCalibrationUncertaintyTransferV526(() => undefined)];
    try {
      const [first, second] = await Promise.all([loadKerrCalibrationUncertaintyTransferSummaryV526(), loadKerrCalibrationUncertaintyTransferSummaryV526()]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrCalibrationUncertaintyTransferSnapshotV526()).toMatchObject({ status: "ready", requestCount: 1, summary: first });
    } finally {
      releases.forEach((release) => release());
      releases.forEach((release) => release());
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });
  it("fails closed on oversized summary declarations", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{}", { status: 200, headers: { "Content-Length": String(129 * 1024) } })) as typeof fetch;
    await expect(loadKerrCalibrationUncertaintyTransferSummaryV526()).rejects.toThrow("response-too-large");
  });
});
