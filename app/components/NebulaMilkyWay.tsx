"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";

const PARTICLE_COUNT = 1800;
const SKY_RADIUS = 8200;

function galacticPosition(lonDeg: number, latDeg: number, radius: number) {
  const l = THREE.MathUtils.degToRad(lonDeg);
  const b = THREE.MathUtils.degToRad(latDeg);
  return new THREE.Vector3(
    -Math.cos(b) * Math.cos(l) * radius,
    Math.sin(b) * radius,
    Math.cos(b) * Math.sin(l) * radius,
  );
}

function buildMilkyWayDust() {
  const pos = new Float32Array(PARTICLE_COUNT * 3);
  const color = new Float32Array(PARTICLE_COUNT * 3);
  const size = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const lon = Math.random() * 360;
    const coreBand = Math.random() < 0.68;
    const spread = coreBand ? 4 + Math.pow(Math.random(), 2.2) * 8 : 12 + Math.random() * 16;
    const lat = (Math.random() - 0.5) * spread;
    const radius = SKY_RADIUS - Math.random() * 240;
    const p = galacticPosition(lon, lat, radius);
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;

    const lane = Math.abs(lat) < 2.2 && Math.random() < 0.5;
    const armBoost = 0.65 + 0.35 * Math.sin(THREE.MathUtils.degToRad(lon * 2.0 + 28));
    const bright = lane ? 0.012 + Math.random() * 0.035 : (0.055 + Math.random() * 0.16) * armBoost;
    const warm = Math.random() * 0.14;
    color[i * 3] = bright * (0.7 + warm);
    color[i * 3 + 1] = bright * (0.78 + warm);
    color[i * 3 + 2] = bright * (0.9 + Math.random() * 0.18);
    size[i] = lane ? 0.18 + Math.random() * 0.26 : 0.28 + Math.pow(Math.random(), 2.6) * 0.72;
  }

  return { pos, color, size };
}

export default function NebulaMilkyWay() {
  const groupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
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
          uOpacity: { value: VISUAL_CALIBRATION.galaxyDustOpacity },
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
            gl_PointSize = clamp(aSize, 0.18, 0.95);
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
            float soft = exp(-d * d * 13.0);
            float alpha = soft * uOpacity * smoothstep(0.16, 0.8, vSize);
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
    group.position.copy(camera.position);
  }, 1001);

  return (
    <group ref={groupRef} renderOrder={-520}>
      <points frustumCulled={false}>
        <primitive object={geom} attach="geometry" />
        <primitive object={mat} attach="material" />
      </points>
    </group>
  );
}
