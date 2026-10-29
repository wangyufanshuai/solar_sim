"use client";

import { acquireAtlasResource } from "./atlasResourceLifecycle";
import type { AtlasCalibrationHudModeV505 } from "./atlasCalibrationHudProfileV505";

export type AtlasCalibrationHudModeSnapshotV506 = Readonly<{
  version: "v506-atlas-calibration-hud-mode-store-v1";
  mode: AtlasCalibrationHudModeV505;
  hudRevision: number;
}>;

const listeners = new Set<() => void>();
let snapshot: AtlasCalibrationHudModeSnapshotV506 = Object.freeze({
  version: "v506-atlas-calibration-hud-mode-store-v1",
  mode: "science",
  hudRevision: 0,
});

export function getAtlasCalibrationHudModeSnapshotV506(): AtlasCalibrationHudModeSnapshotV506 {
  return snapshot;
}

export function subscribeAtlasCalibrationHudModeV506(listener: () => void): () => void {
  listeners.add(listener);
  const releaseResource = acquireAtlasResource(
    "subscription",
    "relativity-lab",
    "calibration-hud-mode-store",
    { owner: "calibration-hud-v506", estimatedBytes: 0 },
  );
  let released = false;
  return () => {
    if (released) return;
    released = true;
    listeners.delete(listener);
    releaseResource();
  };
}

export function setAtlasCalibrationHudModeV506(
  mode: AtlasCalibrationHudModeV505,
): AtlasCalibrationHudModeSnapshotV506 {
  if (mode === snapshot.mode) return snapshot;
  snapshot = Object.freeze({
    version: "v506-atlas-calibration-hud-mode-store-v1",
    mode,
    hudRevision: snapshot.hudRevision + 1,
  });
  listeners.forEach((listener) => listener());
  return snapshot;
}

export function getAtlasCalibrationHudModeTelemetryV506(): Readonly<{
  mode: AtlasCalibrationHudModeV505;
  hudRevision: number;
  listenerCount: number;
  sceneRevisionDelta: 0;
  scientificFieldMutationAllowed: false;
}> {
  return Object.freeze({
    mode: snapshot.mode,
    hudRevision: snapshot.hudRevision,
    listenerCount: listeners.size,
    sceneRevisionDelta: 0,
    scientificFieldMutationAllowed: false,
  });
}

export function resetAtlasCalibrationHudModeStoreForTestsV506(): void {
  if (listeners.size !== 0) throw new Error("v506-listener-leak-before-reset");
  snapshot = Object.freeze({
    version: "v506-atlas-calibration-hud-mode-store-v1",
    mode: "science",
    hudRevision: 0,
  });
}
