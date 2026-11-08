import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { interpolateSkyCameraPose, skyTransitionTurnRad } from "./skyCameraTransition";

const forwardAt = (t: number, s: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]) => {
  const target = new THREE.Vector3();
  const camera = new THREE.Vector3();
  interpolateSkyCameraPose(s[0], s[1], s[2], s[3], t, target, camera);
  return { target, camera, forward: target.clone().sub(camera).normalize() };
};

describe("sky camera transition (A4)", () => {
  // The measured pre-fix case: a constellation view whose offset points the other way round.
  const scene: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(500, 0, 9400), new THREE.Vector3(430, -80, 3746),
    new THREE.Vector3(1000, -900, -9400), new THREE.Vector3(900, -676, -8289),
  ];

  it("hits both end poses exactly", () => {
    const start = forwardAt(0, scene);
    const end = forwardAt(1, scene);
    expect(start.camera.distanceTo(scene[1])).toBeLessThan(1e-6);
    expect(end.camera.distanceTo(scene[3])).toBeLessThan(1e-6);
    expect(end.target.distanceTo(scene[2])).toBeLessThan(1e-9);
  });

  it("turns the camera offset at a constant angular rate", () => {
    const offsetAngle = (t: number) => {
      const pose = forwardAt(t, scene);
      const offset = pose.camera.clone().sub(pose.target).normalize();
      const start = scene[1].clone().sub(scene[0]).normalize();
      return offset.angleTo(start);
    };
    const total = offsetAngle(1);
    for (const t of [0.25, 0.5, 0.75]) expect(offsetAngle(t)).toBeCloseTo(total * t, 6);
  });

  it("interpolates the offset length geometrically", () => {
    const pose = forwardAt(0.5, scene);
    const expected = Math.sqrt(scene[1].distanceTo(scene[0]) * scene[3].distanceTo(scene[2]));
    expect(pose.camera.distanceTo(pose.target)).toBeCloseTo(expected, 6);
  });

  it("measures the turn between the current and destination view", () => {
    const turn = skyTransitionTurnRad(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
    expect(turn).toBeCloseTo(Math.PI / 2, 12);
  });
});
