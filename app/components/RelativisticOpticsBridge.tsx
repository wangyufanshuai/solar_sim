"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, type MutableRefObject } from "react";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { useRelativisticOpticsStateRef } from "../context/RelativisticOpticsContext";
import { effectiveLightSpeedScenePerRealSec, timeScaleVisualBoost } from "../lib/relativisticOptics";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";

const tmpLook = new THREE.Vector3();
const tmpAxis = new THREE.Vector3();
const tmpVelN = new THREE.Vector3();
const tmpQuatPrev = new THREE.Quaternion();
const tmpQuatDelta = new THREE.Quaternion();

type Props = {
  daysPerSecond: number;
  relativityEnabledRef: MutableRefObject<boolean>;
  viewSettings: SimulationViewSettings;
};

/**
 * Tracks camera linear/angular motion and scaled c for Doppler / searchlight / aberration.
 */
export default function RelativisticOpticsBridge({
  daysPerSecond,
  relativityEnabledRef,
  viewSettings,
}: Props) {
  const stateRef = useRelativisticOpticsStateRef();
  const { camera } = useThree();
  const prevCamPos = useRef(new THREE.Vector3());
  const prevCamQuat = useRef(new THREE.Quaternion());
  const initialized = useRef(false);

  useFrame((_, dt) => {
    if (!stateRef) return;
    const s = stateRef.current;
    const dps = Number.isFinite(daysPerSecond) ? Math.max(0, daysPerSecond) : 0;
    s.daysPerSecond = dps;
    s.relativityPhysicsOn = relativityEnabledRef.current;
    const show = viewSettings.showRelativisticOptics;
    const dtSafe = Math.max(dt, 1e-7);

    if (!initialized.current) {
      prevCamPos.current.copy(camera.position);
      prevCamQuat.current.copy(camera.quaternion);
      initialized.current = true;
      s.active = false;
      s.aberrationQuat.identity();
      return;
    }

    s.camVelScenePerReal.copy(camera.position).sub(prevCamPos.current);
    s.camVelScenePerReal.multiplyScalar(1 / dtSafe);
    prevCamPos.current.copy(camera.position);

    s.cEffScenePerReal = effectiveLightSpeedScenePerRealSec(AU_TO_SCENE, Math.max(dps, 1e-6));

    tmpQuatDelta.copy(prevCamQuat.current).invert().multiply(camera.quaternion);
    prevCamQuat.current.copy(camera.quaternion);
    const omega = (2 * Math.acos(THREE.MathUtils.clamp(tmpQuatDelta.w, -1, 1))) / dtSafe;

    const vLen = s.camVelScenePerReal.length();
    const betaLin = s.cEffScenePerReal > 1e-20 ? vLen / s.cEffScenePerReal : 0;
    const betaRot = 0;
    const dpsBoost = timeScaleVisualBoost(dps);

    camera.getWorldDirection(tmpLook);
    if (vLen > 1e-10) {
      tmpVelN.copy(s.camVelScenePerReal).multiplyScalar(1 / vLen);
      tmpAxis.crossVectors(tmpLook, tmpVelN);
    } else {
      tmpAxis.set(0, 1, 0);
    }
    if (tmpAxis.lengthSq() < 1e-12) tmpAxis.set(0, 1, 0);
    else tmpAxis.normalize();

    const aberrAngle = THREE.MathUtils.clamp(
      betaLin * 1.65 + betaRot * 0.55 + dpsBoost * 0.38,
      0,
      0.42,
    );

    const wantOptics =
      show &&
      (dps > 0.05 || s.relativityPhysicsOn) &&
      (betaLin + betaRot + dpsBoost > 0.004);
    s.active = wantOptics;

    if (!show || !wantOptics) {
      s.aberrationQuat.identity();
    } else {
      s.aberrationQuat.setFromAxisAngle(tmpAxis, aberrAngle);
    }
  });

  return null;
}
