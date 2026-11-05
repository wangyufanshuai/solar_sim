import { afterEach, describe, expect, it } from "vitest";
import { getAtlasResourceSnapshot } from "./atlasResourceLifecycle";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  getAtlasCalibrationHudModeTelemetryV506,
  resetAtlasCalibrationHudModeStoreForTestsV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "./atlasCalibrationHudModeStoreV506";

afterEach(() => resetAtlasCalibrationHudModeStoreForTestsV506());

describe("v506 shared calibration HUD mode store", () => {
  it("publishes one stable snapshot revision to all active detail subscribers", () => {
    const baseline = getAtlasResourceSnapshot().subscriptions;
    let firstCalls = 0;
    let secondCalls = 0;
    const releaseFirst = subscribeAtlasCalibrationHudModeV506(() => {
      firstCalls += 1;
    });
    const releaseSecond = subscribeAtlasCalibrationHudModeV506(() => {
      secondCalls += 1;
    });
    expect(getAtlasResourceSnapshot().subscriptions).toBe(baseline + 2);
    expect(getAtlasCalibrationHudModeTelemetryV506().listenerCount).toBe(2);

    const cinematic = setAtlasCalibrationHudModeV506("cinematic");
    expect(cinematic).toBe(getAtlasCalibrationHudModeSnapshotV506());
    expect(cinematic).toMatchObject({ mode: "cinematic", hudRevision: 1 });
    expect(firstCalls).toBe(1);
    expect(secondCalls).toBe(1);

    expect(setAtlasCalibrationHudModeV506("cinematic")).toBe(cinematic);
    expect(firstCalls).toBe(1);
    expect(secondCalls).toBe(1);

    releaseFirst();
    releaseSecond();
    releaseSecond();
    expect(getAtlasCalibrationHudModeTelemetryV506().listenerCount).toBe(0);
    expect(getAtlasResourceSnapshot().subscriptions).toBe(baseline);
  });

  it("keeps HUD revision separate from scene and science state", () => {
    const before = getAtlasCalibrationHudModeTelemetryV506();
    setAtlasCalibrationHudModeV506("cinematic");
    const after = getAtlasCalibrationHudModeTelemetryV506();
    expect(before.sceneRevisionDelta).toBe(0);
    expect(after).toMatchObject({
      mode: "cinematic",
      hudRevision: 1,
      sceneRevisionDelta: 0,
      scientificFieldMutationAllowed: false,
    });
  });
});
