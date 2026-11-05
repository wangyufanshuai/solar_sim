import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  resetAtlasCalibrationHudModeStoreForTestsV506,
  setAtlasCalibrationHudModeV506,
} from "./atlasCalibrationHudModeStoreV506";
import {
  getAtlasCalibrationEvidenceTelemetryV508,
  getAtlasCalibrationPreflightSnapshotV508,
  getAtlasCalibrationReadinessSnapshotV508,
  loadAtlasCalibrationPreflightV508,
  loadAtlasCalibrationReadinessV508,
  resetAtlasCalibrationEvidenceClientForTestsV508,
  subscribeAtlasCalibrationPreflightV508,
  subscribeAtlasCalibrationReadinessV508,
} from "./atlasCalibrationEvidenceClientV508";
import {
  createKerrMeasuredCalibrationReadinessSummaryV503,
  KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
} from "./kerrMeasuredCalibrationReadinessV503";
import {
  createKerrMeasuredCalibrationPreflightSummaryV504,
  KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
} from "./kerrMeasuredCalibrationPreflightV504";

const readinessSummary = createKerrMeasuredCalibrationReadinessSummaryV503(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-measured-calibration-readiness-v503/readiness.json",
      "utf8",
    ),
  ),
);
const preflightSummary = createKerrMeasuredCalibrationPreflightSummaryV504(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-measured-calibration-preflight-v504/preflight.json",
      "utf8",
    ),
  ),
);

afterEach(() => {
  resetAtlasCalibrationEvidenceClientForTestsV508();
  resetAtlasCalibrationHudModeStoreForTestsV506();
  vi.unstubAllGlobals();
});

describe("v508 calibration evidence client replay", () => {
  it("persists two single-flight summaries across detail unmounts and mode changes", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      const body = url.includes("v503")
        ? {
            version: KERR_MEASURED_CALIBRATION_READINESS_API_VERSION_V503,
            available: true,
            reason: "ready",
            summary: readinessSummary,
          }
        : {
            version: KERR_MEASURED_CALIBRATION_PREFLIGHT_API_VERSION_V504,
            available: true,
            reason: "ready",
            summary: preflightSummary,
          };
      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const baselineSubscriptions = getAtlasResourceSnapshot().subscriptions;

    const releaseReadiness = subscribeAtlasCalibrationReadinessV508(() => undefined);
    const readinessFirst = loadAtlasCalibrationReadinessV508();
    const readinessSecond = loadAtlasCalibrationReadinessV508();
    expect(readinessFirst).toBe(readinessSecond);
    const loadedReadiness = await readinessFirst;
    expect(loadedReadiness.decision.admitted).toBe(false);
    releaseReadiness();

    setAtlasCalibrationHudModeV506("cinematic");
    expect(getAtlasCalibrationHudModeSnapshotV506().mode).toBe("cinematic");

    const releasePreflight = subscribeAtlasCalibrationPreflightV508(() => undefined);
    const loadedPreflight = await loadAtlasCalibrationPreflightV508();
    expect(loadedPreflight.decision.measuredDetectorAuthorityGranted).toBe(false);
    releasePreflight();

    const releaseReadinessAgain = subscribeAtlasCalibrationReadinessV508(() => undefined);
    expect(getAtlasCalibrationReadinessSnapshotV508().summary).toBe(loadedReadiness);
    expect(await loadAtlasCalibrationReadinessV508()).toBe(loadedReadiness);
    releaseReadinessAgain();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getAtlasCalibrationPreflightSnapshotV508().summary).toBe(loadedPreflight);
    expect(getAtlasCalibrationEvidenceTelemetryV508()).toMatchObject({
      readiness: { requestCount: 1, status: "ready", hasSummary: true },
      preflight: { requestCount: 1, status: "ready", hasSummary: true },
      totalListenerCount: 0,
      totalRequestCount: 2,
      sceneRevisionDelta: 0,
      scientificFieldMutationAllowed: false,
    });
    expect(getAtlasResourceSnapshot().subscriptions).toBe(baselineSubscriptions);
  });

  it("fails closed on oversized evidence and never retries implicitly", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "Content-Length": String(128 * 1024 + 1) },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const first = loadAtlasCalibrationPreflightV508();
    await expect(first).rejects.toThrow("response-too-large");
    const second = loadAtlasCalibrationPreflightV508();
    expect(second).toBe(first);
    await expect(second).rejects.toThrow("response-too-large");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getAtlasCalibrationPreflightSnapshotV508()).toMatchObject({
      status: "unavailable",
      reason: "response-too-large",
      requestCount: 1,
      summary: null,
    });
  });
});
