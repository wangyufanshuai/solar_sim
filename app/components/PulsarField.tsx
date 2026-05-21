"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { PULSARS } from "../data/pulsarCatalog";

const GALAXY_VISUAL_SCALE = 36;

/** Normalize all periods to a visible flash range (0.3 - 2 Hz visual) */
function visualSpeed(periodS: number): number {
  if (periodS < 0.01) return 1.5;       // millisecond → continuous shimmer
  if (periodS < 0.1) return 2.0 / Math.max(periodS * 40, 0.5);
  if (periodS < 1.0) return 1.0 / periodS;
  return Math.min(1.0 / periodS, 0.5);  // slow pulsars → visible flash
}

const PULSAR_VERTEX = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aIntensity;
attribute float aSpeed;
varying vec3 vColor;
varying float vIntensity;
varying float vSpeed;
varying float vPS;
uniform float uPixelRatio;
uniform float uTime;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vColor = aColor;
  vIntensity = aIntensity;
  vSpeed = aSpeed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 1.0);
  gl_PointSize = aSize * uPixelRatio * (22000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 2.0, 18.0);
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const PULSAR_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
varying float vSpeed;
varying float vPS;
uniform float uOpacity;
uniform float uTime;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;

  // Flash animation: sharp pulse
  float phase = fract(uTime * vSpeed);
  float flash = pow(max(0.0, 1.0 - phase * 3.5), 4.0);
  float base = 0.12;

  float core = exp(-d * d * 25.0);
  float halo = exp(-d * d * 3.5) * 0.3;
  float edge = smoothstep(0.5, 0.15, d);

  float brightness = (base + flash * 0.88) * vIntensity;
  gl_FragColor = vec4(vColor * (0.5 + core * 1.8 + flash * 1.2), (core + halo) * edge * brightness * uOpacity);
  #include <logdepthbuf_fragment>
}
`;

function galacticToScene(lonDeg: number, latDeg: number, distPc: number): [number, number, number] {
  const l = (lonDeg * Math.PI) / 180;
  const b = (latDeg * Math.PI) / 180;
  const s = GALAXY_VISUAL_SCALE;
  const x = -distPc * Math.cos(b) * Math.cos(l) * s;
  const y = distPc * Math.sin(b) * s;
  const z = distPc * Math.cos(b) * Math.sin(l) * s;
  return [x, y, z];
}

export default function PulsarField({
  floatingOriginRef,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const clockRef = useRef(0);

  const { geometry, material } = useMemo(() => {
    const count = PULSARS.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const intensities = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const p = PULSARS[i];
      const pos = galacticToScene(p.galLonDeg, p.galLatDeg, p.distancePc);
      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];

      const col = new THREE.Color(p.color);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = 6 + p.intensity * 8;
      intensities[i] = p.intensity;
      speeds[i] = visualSpeed(p.periodS);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: PULSAR_VERTEX,
      fragmentShader: PULSAR_FRAGMENT,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uOpacity: { value: 0.0 },
        uTime: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const tier = floatingOriginRef.current.lodTier;
    pts.visible = tier !== "solar";
    const mat = pts.material as THREE.ShaderMaterial;
    mat.uniforms.uOpacity.value = tier === "solar" ? 0 : tier === "mid" ? 0.5 : 0.85;

    clockRef.current += delta;
    mat.uniforms.uTime.value = clockRef.current;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={-435} />
  );
}
