"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";

const PARTICLE_COUNT = 1500;

function buildMilkyWayDust() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const color = new Float32Array(PARTICLE_COUNT * 3);
  const size = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = Math.random();
    const along = (t - 0.5) * 10800;
    const width = (Math.random() - 0.5) * (220 + Math.pow(Math.random(), 2.4) * 880);
    const depth = (Math.random() - 0.5) * 80;
    pos[i * 3] = along;
    pos[i * 3 + 1] = width;
    pos[i * 3 + 2] = depth;

    const lane = Math.abs(width) < 280 && Math.random() < 0.48;
    const bright = lane ? 0.025 + Math.random() * 0.045 : 0.09 + Math.random() * 0.22;
    const warm = Math.random() * 0.18;
    color[i * 3] = bright * (0.72 + warm);
    color[i * 3 + 1] = bright * (0.78 + warm);
    color[i * 3 + 2] = bright * (0.86 + Math.random() * 0.18);
    size[i] = lane
      ? 0.25 + Math.random() * 0.25
      : Math.pow(Math.random(), 2.8) * 0.65 + 0.2;
  }

  return { pos, color, size };
}

export default function NebulaMilkyWay() {
  const groupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const roll = useMemo(
    () => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -0.5),
    [],
  );

  const dust = useMemo(buildMilkyWayDust, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(dust.pos, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(dust.color, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(dust.size, 1));
    return g;
  }, [dust]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uOpacity: { value: 0.07 },
        },
        vertexShader: `
          attribute vec3 aColor;
          attribute float aSize;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vColor = aColor;
            vSize = aSize;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = clamp(aSize, 0.22, 0.9);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vec2 p = gl_PointCoord - 0.5;
            float d = length(p);
            if (d > 0.5) discard;
            float soft = exp(-d * d * 12.0);
            float alpha = soft * uOpacity * smoothstep(0.18, 0.8, vSize);
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
      }),
    [],
  );

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (g) g.traverse((o) => (o.raycast = () => {}));
    return () => {
      geom.dispose();
      mat.dispose();
    };
  }, [geom, mat]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    camera.getWorldDirection(dir);
    group.position.copy(camera.position).addScaledVector(dir, 7200);
    group.quaternion.copy(camera.quaternion).multiply(roll);
  }, -20);

  return (
    <group ref={groupRef} renderOrder={-520}>
      <points frustumCulled={false}>
        <primitive object={geom} attach="geometry" />
        <primitive object={mat} attach="material" />
      </points>
    </group>
  );
}
