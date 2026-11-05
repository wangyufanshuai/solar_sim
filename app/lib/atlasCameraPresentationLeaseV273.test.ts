import { afterEach, describe, expect, it } from "vitest";
import {
  atlasCameraPresentationCanWriteV273,
  getAtlasCameraPresentationLeaseV273,
  releaseAtlasCameraPresentationLeaseV273,
  requestAtlasCameraPresentationLeaseV273,
  resetAtlasCameraPresentationLeaseForTestsV273,
} from "./atlasCameraPresentationLeaseV273";

afterEach(resetAtlasCameraPresentationLeaseForTestsV273);

describe("v273 camera presentation lease", () => {
  it("enforces scene handoff > scale journey > focus lock > ordinary orbit", () => {
    const focus = requestAtlasCameraPresentationLeaseV273("focus-lock", 1, 10);
    expect(focus.active).toBe(true);
    const scale = requestAtlasCameraPresentationLeaseV273("scale-journey", 2, 11);
    expect(scale.active).toBe(true);
    expect(atlasCameraPresentationCanWriteV273("focus-lock")).toBe(false);
    const rejectedFocus = requestAtlasCameraPresentationLeaseV273("focus-lock", 3, 12);
    expect(rejectedFocus.active).toBe(false);
    const scene = requestAtlasCameraPresentationLeaseV273("scene-handoff", 4, 13);
    expect(scene.active).toBe(true);
    expect(requestAtlasCameraPresentationLeaseV273("scale-journey", 5, 14).active).toBe(false);
    expect(getAtlasCameraPresentationLeaseV273()?.owner).toBe("scene-handoff");
  });

  it("ignores stale releases after a higher-priority owner preempts a lease", () => {
    const focus = requestAtlasCameraPresentationLeaseV273("focus-lock", 1, 10);
    const scale = requestAtlasCameraPresentationLeaseV273("scale-journey", 2, 11);
    releaseAtlasCameraPresentationLeaseV273(focus);
    expect(getAtlasCameraPresentationLeaseV273()?.token).toBe(scale.token);
    releaseAtlasCameraPresentationLeaseV273(scale);
    expect(getAtlasCameraPresentationLeaseV273()).toBeNull();
  });
});
