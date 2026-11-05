import assert from "node:assert/strict";
import test from "node:test";
import { cameraPoseStable, inspectCameraLock, waitForActualCameraStable } from "./mainline-a-browser-camera-observation.mjs";

const pose = () => ({ selectedId: "nebula:m16", focusState: "locked", position: [1, 2, 3], target: [2, 3, 4], direction: [0, 0, 1],
  up: [0, 1, 0], quaternion: [0, 0, 0, 1], fov: 52, zoom: 1, targetDistance: 2000 });

test("a displayed selection is insufficient until actual focus and every pose marker are available", () => {
  assert.deepEqual(inspectCameraLock(pose(), "nebula:m16"), []);
  for (const change of [{ focusState: "transition" }, { focusState: null }, { selectedId: "nebula:m8" }, { position: null },
    { direction: [1, 2] }, { quaternion: [0, 0, NaN, 1] }, { fov: 0 }, { zoom: null }, { targetDistance: 0 }]) {
    assert.ok(inspectCameraLock({ ...pose(), ...change }, "nebula:m16").length);
  }
});

test("stability compares the whole pose against an anchor, preventing accumulated drift", () => {
  assert.equal(cameraPoseStable(pose(), { ...pose(), quaternion: [0, 0, 0, -1] }), true);
  assert.equal(cameraPoseStable(pose(), { ...pose(), position: [1.00001, 2, 3] }), true);
  for (const change of [{ position: [1.01, 2, 3] }, { target: [2, 3, 5] }, { direction: [0, 1, 0] },
    { fov: 53 }, { zoom: 2 }, { targetDistance: 2001 }, { focusState: "idle" }]) {
    assert.equal(cameraPoseStable(pose(), { ...pose(), ...change }), false);
  }
});

test("the waiter observes a transition and moving pose before accepting a stable lock", async () => {
  const observations = [{ ...pose(), focusState: "transition" }, { ...pose(), position: [100, 2, 3] }, pose(), pose(), pose(), pose()];
  const page = { evaluate: async () => observations.length > 1 ? observations.shift() : observations[0],
    waitForTimeout: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) };
  const result = await waitForActualCameraStable(page, "nebula:m16", { intervalMs: 2, stableMs: 5, timeoutMs: 100 });
  assert.equal(result.status, "actual-focus-locked-and-pose-stable"); assert.ok(result.samples.length >= 4);
  assert.equal(result.samples[0].focusState, "transition"); assert.deepEqual(result.samples[1].position, [100, 2, 3]);
  assert.deepEqual(result.final.position, [1, 2, 3]);
});

test("an unlocked timeout preserves sampled evidence instead of claiming a settled camera", async () => {
  const page = { evaluate: async () => ({ ...pose(), focusState: "transition" }),
    waitForTimeout: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) };
  await assert.rejects(waitForActualCameraStable(page, "nebula:m16", { intervalMs: 2, stableMs: 5, timeoutMs: 10 }),
    (error) => error.message.includes("actual-camera-stability-timeout") && error.cameraEvidence.samples.length > 0);
});
