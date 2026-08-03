"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";

type LandmarkKind = "star" | "nebula" | "cluster" | "galaxy-core";

type Landmark = {
  name: string;
  subtitle: string;
  kind: LandmarkKind;
  position: [number, number, number];
  color: string;
  size: number;
  intensity: number;
  label: boolean;
};

const GALAXY_VISUAL_SCALE = 36;

const LANDMARKS: Landmark[] = [
  { name: "Sagittarius A*", subtitle: "银河中心", kind: "galaxy-core", position: [0, -300, 0], color: "#fff0b8", size: 24, intensity: 1.0, label: true },
  { name: "Sirius", subtitle: "天狼星", kind: "star", position: [-4200, 900, 5400], color: "#d9e6ff", size: 12, intensity: 0.78, label: true },
  { name: "Canopus", subtitle: "老人星", kind: "star", position: [-9200, -1800, 9800], color: "#ffe3b0", size: 13, intensity: 0.72, label: true },
  { name: "Arcturus", subtitle: "大角星", kind: "star", position: [7600, 2300, -4200], color: "#ffc36e", size: 11, intensity: 0.66, label: true },
  { name: "Vega", subtitle: "织女星", kind: "star", position: [10200, 3200, 6100], color: "#c7ddff", size: 11, intensity: 0.64, label: true },
  { name: "Betelgeuse", subtitle: "参宿四", kind: "star", position: [-14500, 1900, 11800], color: "#ff8d52", size: 15, intensity: 0.82, label: true },
  { name: "Rigel", subtitle: "参宿七", kind: "star", position: [-15800, -2100, 13200], color: "#abcaff", size: 14, intensity: 0.8, label: true },
  { name: "Deneb", subtitle: "天津四", kind: "star", position: [26000, 4200, 16500], color: "#dce8ff", size: 14, intensity: 0.76, label: true },
  { name: "Antares", subtitle: "心宿二", kind: "star", position: [18600, -2600, -9000], color: "#ff7249", size: 14, intensity: 0.72, label: true },
  { name: "Cygnus X", subtitle: "天鹅座恒星形成区", kind: "nebula", position: [31500, 2600, 18200], color: "#5f8ec8", size: 50, intensity: 0.62, label: true },
  { name: "Large Magellanic Cloud", subtitle: "大麦哲伦云", kind: "cluster", position: [-145000, -62000, 70000], color: "#b9cfff", size: 44, intensity: 0.5, label: true },
  { name: "Small Magellanic Cloud", subtitle: "小麦哲伦云", kind: "cluster", position: [-172000, -78000, 42000], color: "#c8d8ff", size: 34, intensity: 0.42, label: true },
];

const MARKER_VERTEX = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aIntensity;
varying vec3 vColor;
varying float vIntensity;
varying float vPS;
uniform float uPixelRatio;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vColor = aColor;
  vIntensity = aIntensity;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 1.0);
  gl_PointSize = aSize * uPixelRatio * (22000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 3.0, 54.0);
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const MARKER_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
varying float vPS;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float core = exp(-d * d * 18.0);
  float halo = exp(-d * d * 3.2) * 0.38;
  float edge = smoothstep(0.5, 0.2, d);
  gl_FragColor = vec4(vColor * (0.75 + core * 1.4), (core + halo) * edge * vIntensity * uOpacity);
  #include <logdepthbuf_fragment>
}
`;

export default function GalacticLandmarks({
  floatingOriginRef,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(LANDMARKS.length * 3);
    const colors = new Float32Array(LANDMARKS.length * 3);
    const sizes = new Float32Array(LANDMARKS.length);
    const intensities = new Float32Array(LANDMARKS.length);
    LANDMARKS.forEach((item, i) => {
      const o = i * 3;
      positions[o] = item.position[0];
      positions[o + 1] = item.position[1];
      positions[o + 2] = item.position[2];
      const c = new THREE.Color(item.color);
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
      sizes[i] = item.size;
      intensities[i] = item.intensity;
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: MARKER_VERTEX,
      fragmentShader: MARKER_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uOpacity: { value: 0.05 },
        uPixelRatio: { value: 1 },
      },
    });
    return { geometry: geom, material: mat };
  }, []);

  useFrame(() => {
    const tier = floatingOriginRef.current.lodTier;
    const markerTarget = tier === "far" ? 0.58 : tier === "mid" ? 0.18 : 0.0;
    material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      material.uniforms.uOpacity.value,
      markerTarget,
      0.05
    );
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  });

  return (
    <group
      renderOrder={-498}
      scale={[GALAXY_VISUAL_SCALE, GALAXY_VISUAL_SCALE, GALAXY_VISUAL_SCALE]}
    >
      <points frustumCulled={false} renderOrder={-498}>
        <primitive object={geometry} attach="geometry" />
        <primitive object={material} attach="material" />
      </points>
    </group>
  );
}
