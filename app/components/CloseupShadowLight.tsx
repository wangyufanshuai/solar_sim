"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { AU_TO_SCENE, SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";

export default function CloseupShadowLight({
  physicsRef,
  floatingOriginRef,
  selectedBodyIndex,
  quality,
}: {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  selectedBodyIndex: number | null;
  quality: "off" | "showcase" | "quality";
}) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef(new THREE.Object3D());
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    gl.shadowMap.enabled = quality !== "off" && selectedBodyIndex !== null;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const light = lightRef.current;
    if (light) {
      light.shadow.mapSize.setScalar(quality === "quality" ? 2048 : 1024);
      light.shadow.bias = -0.00015;
      light.shadow.normalBias = 0.018;
    }
  }, [gl, quality, selectedBodyIndex]);

  useFrame(() => {
    const light = lightRef.current;
    const physics = physicsRef.current;
    if (!light || !physics || selectedBodyIndex == null || selectedBodyIndex <= 0) {
      if (light) light.visible = false;
      return;
    }
    const offset = selectedBodyIndex * 3;
    const origin = floatingOriginRef.current.offsetAu;
    const target = targetRef.current.position.set(
      ((physics.posAu[offset] ?? 0) - origin[0]) * AU_TO_SCENE,
      ((physics.posAu[offset + 1] ?? 0) - origin[1]) * AU_TO_SCENE,
      ((physics.posAu[offset + 2] ?? 0) - origin[2]) * AU_TO_SCENE,
    );
    const sun = new THREE.Vector3(
      ((physics.posAu[0] ?? 0) - origin[0]) * AU_TO_SCENE,
      ((physics.posAu[1] ?? 0) - origin[1]) * AU_TO_SCENE,
      ((physics.posAu[2] ?? 0) - origin[2]) * AU_TO_SCENE,
    );
    const bodyRadius = SOLAR_SYSTEM_BODIES[selectedBodyIndex]?.radiusScene ?? 1;
    light.position.copy(target).add(sun.sub(target).normalize().multiplyScalar(Math.max(30, bodyRadius * 16)));
    light.target = targetRef.current;
    light.shadow.camera.left = -bodyRadius * 3;
    light.shadow.camera.right = bodyRadius * 3;
    light.shadow.camera.top = bodyRadius * 3;
    light.shadow.camera.bottom = -bodyRadius * 3;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = Math.max(80, bodyRadius * 40);
    light.shadow.camera.updateProjectionMatrix();
    light.visible = quality !== "off";
  });

  return (
    <>
      <primitive object={targetRef.current} />
      <directionalLight
        ref={lightRef}
        intensity={quality === "quality" ? 2.25 : 1.8}
        color="#fff2d6"
        castShadow
      />
    </>
  );
}
