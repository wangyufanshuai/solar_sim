import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diffAtlasResourceSnapshotsV300, getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getKerrCalibrationExcitationDesignSnapshotV525,
  loadKerrCalibrationExcitationDesignSummaryV525,
  resetKerrCalibrationExcitationDesignClientForTestsV525,
  subscribeKerrCalibrationExcitationDesignV525,
} from "./kerrCalibrationExcitationDesignClientV525";
import { createKerrCalibrationExcitationDesignSummaryV525 } from "./kerrCalibrationExcitationDesignV525";

const originalFetch = globalThis.fetch;
const artifact = JSON.parse(readFileSync(
  "dist/science/kerr-calibration-excitation-design-v525/design.json",
  "utf8",
));
beforeEach(() => resetKerrCalibrationExcitationDesignClientForTestsV525());
afterEach(() => {
  globalThis.fetch = originalFetch;
  resetKerrCalibrationExcitationDesignClientForTestsV525();
  vi.restoreAllMocks();
});

describe("v525 calibration excitation design client", () => {
  it("single-flights explicit consumers and returns subscriptions to baseline", async () => {
    const summary = createKerrCalibrationExcitationDesignSummaryV525(artifact);
    const body = JSON.stringify({
      version: "v525-kerr-calibration-excitation-design-api-v1",
      available: true,
      reason: "ready",
      summary,
    });
    const fetchMock = vi.fn(async () => new Response(body, { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const baseline = getAtlasResourceSnapshot();
    const releases = [
      subscribeKerrCalibrationExcitationDesignV525(() => undefined),
      subscribeKerrCalibrationExcitationDesignV525(() => undefined),
    ];
    try {
      const [first, second] = await Promise.all([
        loadKerrCalibrationExcitationDesignSummaryV525(),
        loadKerrCalibrationExcitationDesignSummaryV525(),
      ]);
      expect(first).toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(getKerrCalibrationExcitationDesignSnapshotV525()).toMatchObject({
        status: "ready",
        requestCount: 1,
        summary: first,
      });
    } finally {
      releases.forEach((release) => release());
      releases.forEach((release) => release());
    }
    expect(diffAtlasResourceSnapshotsV300(baseline, getAtlasResourceSnapshot()).status).toBe("baseline");
  });

  it("fails closed on oversized summary declarations", async () => {
    globalThis.fetch = vi.fn(async () => new Response("{}", {
      status: 200,
      headers: { "Content-Length": String(129 * 1024) },
    })) as typeof fetch;
    await expect(loadKerrCalibrationExcitationDesignSummaryV525()).rejects.toThrow("response-too-large");
  });
});
