import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureMainlineAObservationBookmarkM4,
  registerMainlineAObservationCameraBridgeM4,
  restoreMainlineAObservationBookmarkM4,
  type MainlineAObservationCameraBookmarkPayloadM4,
} from "./mainlineAObservationCameraBookmarkM4";

const cleanups: Array<() => void> = [];
afterEach(() => { while (cleanups.length) cleanups.pop()?.(); });
function provider() {
  const payload: MainlineAObservationCameraBookmarkPayloadM4 = {
    catalogId: "constellation:Ori", sceneMode: "atlas", sceneRevision: 3,
    scaleBand: "stellar", scaleRequestId: 4, focusRequestId: 7,
    pose: { position: [1, 2, 3], target: [4, 5, 6], up: [0, 1, 0], fov: 52, zoom: 1 },
  };
  const restore = vi.fn(() => true);
  const release = registerMainlineAObservationCameraBridgeM4({ capture: () => payload, restore });
  cleanups.push(release);
  return { payload, restore, release };
}

describe("M4 mounted camera bookmark capability", () => {
  it("copies and freezes the actual pose without retaining mutable bridge arrays", () => {
    const { payload } = provider();
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    expect(bookmark.pose).not.toBe(payload.pose);
    expect(bookmark.pose.position).not.toBe(payload.pose.position);
    expect(Object.isFrozen(bookmark)).toBe(true);
    expect(Object.isFrozen(bookmark.pose.position)).toBe(true);
    expect(restoreMainlineAObservationBookmarkM4(bookmark, 9)).toBe(true);
  });
  it("rejects copied/imported objects and invalid requests without calling the bridge", () => {
    const { restore } = provider();
    const bookmark = captureMainlineAObservationBookmarkM4()!;
    expect(restoreMainlineAObservationBookmarkM4({ ...bookmark }, 9)).toBe(false);
    expect(restoreMainlineAObservationBookmarkM4(bookmark, NaN)).toBe(false);
    expect(restoreMainlineAObservationBookmarkM4(bookmark, 0)).toBe(false);
    expect(restore).not.toHaveBeenCalled();
  });
  it("revokes old bridges and ignores their stale cleanup", () => {
    const first = provider();
    const old = captureMainlineAObservationBookmarkM4()!;
    const second = provider();
    const next = captureMainlineAObservationBookmarkM4()!;
    first.release();
    expect(restoreMainlineAObservationBookmarkM4(old, 9)).toBe(false);
    expect(restoreMainlineAObservationBookmarkM4(next, 9)).toBe(true);
    second.release();
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
    expect(restoreMainlineAObservationBookmarkM4(next, 9)).toBe(false);
  });
  it("does not issue a capability when capture rejects its current scene", () => {
    cleanups.push(registerMainlineAObservationCameraBridgeM4({ capture: () => null, restore: () => false }));
    expect(captureMainlineAObservationBookmarkM4()).toBeNull();
  });
});
