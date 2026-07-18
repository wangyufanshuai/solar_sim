"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import { BRIGHT_GALAXIES } from "../data/brightGalaxyCatalog";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type { AtlasCinematicCameraProfile } from "../lib/simulationDiagnosticsTypes";

const GALAXY_SHELL_DISTANCE_SCENE = 26_000;

const GALAXY_VERTEX = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aIntensity;
varying vec3 vColor;
varying float vIntensity;
uniform float uPixelRatio;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vColor = aColor;
  vIntensity = aIntensity;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 1.0);
  gl_PointSize = aSize * uPixelRatio * (26000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 4.0, 64.0);
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const GALAXY_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float disk = exp(-d * d * 9.0);
  float core = exp(-d * d * 34.0);
  float arms = sin(atan(c.y, c.x) * 2.0 + d * 18.0) * 0.5 + 0.5;
  float edge = smoothstep(0.5, 0.12, d);
  float alpha = (disk * 0.42 + core * 0.54 + arms * disk * 0.14) * edge * vIntensity * uOpacity;
  vec3 color = mix(vColor, vec3(0.82, 0.88, 1.0), 0.16) * (0.38 + disk * 0.48 + core * 1.05);
  gl_FragColor = vec4(color, alpha);
  #include <logdepthbuf_fragment>
}
`;

function raDecToScene(raHours: number, decDeg: number): [number, number, number] {
  const ra = (raHours * 15 * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  return [
    Math.cos(dec) * Math.cos(ra) * GALAXY_SHELL_DISTANCE_SCENE,
    Math.sin(dec) * GALAXY_SHELL_DISTANCE_SCENE,
    Math.cos(dec) * Math.sin(ra) * GALAXY_SHELL_DISTANCE_SCENE,
  ];
}

export default function BrightGalaxyMarkers({
  floatingOriginRef,
  enabled = true,
  orbitAtlas = false,
  cinematicCameraProfile = "overview-atlas",
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled?: boolean;
  orbitAtlas?: boolean;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const count = BRIGHT_GALAXIES.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const intensities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const galaxy = BRIGHT_GALAXIES[i]!;
      const pos = raDecToScene(galaxy.raHours, galaxy.decDeg);
      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];

      const color = new THREE.Color(galaxy.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.max(8, Math.min(36, 18 - galaxy.magV * 0.76 + Math.sqrt(galaxy.sizeArcmin) * 1.45));
      intensities[i] = galaxy.intensity * 0.78;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERTEX,
      fragmentShader: GALAXY_FRAGMENT,
      uniforms: {
        uPixelRatio: { value: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2) },
        uOpacity: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame(() => {
    const points = pointsRef.current;
    if (!points) return;
    const tier = floatingOriginRef.current.lodTier;
    points.visible = enabled && (orbitAtlas || tier !== "solar");
    const material = points.material as THREE.ShaderMaterial;
    const cinematicScale =
      cinematicCameraProfile === "selected-body-cinematic"
        ? 0.4
        : cinematicCameraProfile === "showcase-deep-space"
          ? 0.78
          : 1;
    const baseOpacity = orbitAtlas ? 0.014 : tier === "solar" ? 0 : tier === "mid" ? 0.12 : 0.31;
    material.uniforms.uOpacity.value = !enabled ? 0 : baseOpacity * cinematicScale;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={-438} />;
}
