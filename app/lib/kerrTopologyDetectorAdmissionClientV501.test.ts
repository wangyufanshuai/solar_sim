import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  KERR_TOPOLOGY_DETECTOR_ADMISSION_API_VERSION_V501,
  createKerrTopologyDetectorAdmissionSummaryV501,
} from "./kerrTopologyDetectorAdmissionV501";
import {
  getKerrTopologyDetectorAdmissionSnapshotV501,
  getKerrTopologyDetectorAdmissionTelemetryV509,
  loadKerrTopologyDetectorAdmissionSummaryV501,
  resetKerrTopologyDetectorAdmissionClientForTestsV501,
  subscribeKerrTopologyDetectorAdmissionV501,
} from "./kerrTopologyDetectorAdmissionClientV501";

afterEach(() => {
  resetKerrTopologyDetectorAdmissionClientForTestsV501();
  vi.unstubAllGlobals();
});

describe("v501 admission client", () => {
  it("stays idle before intent and single-flights", async () => {
    const artifact = JSON.parse(
      readFileSync(
        "dist/science/kerr-topology-detector-admission-v501/admission-bridge.json",
        "utf8",
      ),
    );
    const summary = createKerrTopologyDetectorAdmissionSummaryV501(artifact);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          version: KERR_TOPOLOGY_DETECTOR_ADMISSION_API_VERSION_V501,
          available: true,
          reason: "ready",
          summary,
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(getKerrTopologyDetectorAdmissionSnapshotV501().requestCount).toBe(0);
    const first = loadKerrTopologyDetectorAdmissionSummaryV501();
    const second = loadKerrTopologyDetectorAdmissionSummaryV501();
    expect(first).toBe(second);
    await first;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tracks and releases evidence subscriptions idempotently", () => {
    const baseline = getAtlasResourceSnapshot().subscriptions;
    const release = subscribeKerrTopologyDetectorAdmissionV501(() => undefined);
    expect(getAtlasResourceSnapshot().subscriptions).toBe(baseline + 1);
    expect(getKerrTopologyDetectorAdmissionTelemetryV509().listenerCount).toBe(1);
    release();
    release();
    expect(getKerrTopologyDetectorAdmissionTelemetryV509().listenerCount).toBe(0);
    expect(getAtlasResourceSnapshot().subscriptions).toBe(baseline);
  });
});
