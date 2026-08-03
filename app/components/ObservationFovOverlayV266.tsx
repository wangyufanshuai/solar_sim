"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";

const FORWARD = new THREE.Vector3();

/** Camera-relative angular field frame. Presentation state only; no sceneRevision mutation. */
export default function ObservationFovOverlayV266() {
  const presentation = useAtlasRuntimeStore((snapshot) => snapshot.observerPresentation);
  const camera = useThree((state) => state.camera);
  const groupRef = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array([
      -0.5, -0.5, 0, 0.5, -0.5, 0,
      0.5, -0.5, 0, 0.5, 0.5, 0,
      0.5, 0.5, 0, -0.5, 0.5, 0,
      -0.5, 0.5, 0, -0.5, -0.5, 0,
    ]);
    const value = new THREE.BufferGeometry();
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return value;
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.visible = presentation.enabled && presentation.widthDeg > 0 && presentation.heightDeg > 0;
    if (!group.visible) return;
    const distance = Math.max(2, camera.near * 8);
    camera.getWorldDirection(FORWARD);
    group.position.copy(camera.position).addScaledVector(FORWARD, distance);
    group.quaternion.copy(camera.quaternion);
    group.rotateZ(THREE.MathUtils.degToRad(-presentation.rotationDeg));
    group.scale.set(
      2 * distance * Math.tan(THREE.MathUtils.degToRad(presentation.widthDeg) / 2),
      2 * distance * Math.tan(THREE.MathUtils.degToRad(presentation.heightDeg) / 2),
      1,
    );
  });

  return (
    <group ref={groupRef} name="atlas-observation-fov-v266" renderOrder={10_000}>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial color="#67e8f9" transparent opacity={0.85} depthTest={false} depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}
