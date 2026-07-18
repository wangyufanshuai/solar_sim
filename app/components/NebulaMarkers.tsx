"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import type {
  AtlasCinematicCameraProfile,
  AtlasGaiaStarfieldEnhancementQualityTier,
} from "../lib/simulationDiagnosticsTypes";
import { NEBULAE } from "../data/nebulaCatalog";

const GALAXY_VISUAL_SCALE = 36;

const NEBULA_VERTEX = /* glsl */ `
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
  gl_PointSize = aSize * uPixelRatio * (36000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 10.0, 118.0);
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const NEBULA_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
varying float vPS;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float angle = atan(c.y, c.x);
  float filament = sin(angle * 5.0 + d * 24.0) * 0.5 + 0.5;
  float clump = sin((c.x + c.y) * 31.0) * sin((c.x - c.y) * 23.0) * 0.5 + 0.5;
  float core = exp(-d * d * 10.0);
  float veil = exp(-d * d * 2.1);
  float edge = smoothstep(0.5, 0.12, d);
  float texture = mix(0.58, 1.18, filament * 0.55 + clump * 0.45);
  float alpha = (core * 0.32 + veil * 0.52) * edge * texture * vIntensity * uOpacity;
  vec3 col = mix(vColor, vec3(0.88, 0.9, 0.96), 0.18) * (0.34 + core * 1.04 + veil * 0.3);
  gl_FragColor = vec4(col, alpha);
  #include <logdepthbuf_fragment>
}
`;

/** Convert galactic (l, b, distance) to scene XYZ */
function galacticToScene(lonDeg: number, latDeg: number, distPc: number): [number, number, number] {
  const l = (lonDeg * Math.PI) / 180;
  const b = (latDeg * Math.PI) / 180;
  const s = GALAXY_VISUAL_SCALE;
  // Sun at origin, X toward GC, Y up, Z toward galactic rotation
  const x = -distPc * Math.cos(b) * Math.cos(l) * s;
  const y = distPc * Math.sin(b) * s;
  const z = distPc * Math.cos(b) * Math.sin(l) * s;
  return [x, y, z];
}

export default function NebulaMarkers({
  floatingOriginRef,
  enabled = true,
  orbitAtlas = false,
  cinematicCameraProfile = "overview-atlas",
  qualityTier = "balanced",
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  enabled?: boolean;
  orbitAtlas?: boolean;
  cinematicCameraProfile?: AtlasCinematicCameraProfile;
  qualityTier?: AtlasGaiaStarfieldEnhancementQualityTier;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const { geometry, material } = useMemo(() => {
    const count = NEBULAE.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const intensities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const n = NEBULAE[i];
      const pos = galacticToScene(n.galLonDeg, n.galLatDeg, n.distancePc || 5000);
      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];

      const col = new THREE.Color(n.color);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i] = Math.max(14, Math.min(68, 13 + Math.sqrt(n.sizeArcmin) * 4.75));
      intensities[i] = Math.min(1.08, n.intensity * 0.76);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERTEX,
      fragmentShader: NEBULA_FRAGMENT,
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
    const pts = pointsRef.current;
    if (!pts) return;
    const tier = floatingOriginRef.current.lodTier;
    pts.visible = enabled && (orbitAtlas || tier !== "solar");
    const mat = pts.material as THREE.ShaderMaterial;
    const cinematicScale =
      cinematicCameraProfile === "selected-body-cinematic"
        ? 0.22
        : cinematicCameraProfile === "showcase-deep-space"
          ? 0.82
          : 1;
    const nebulaMobileScale = qualityTier === "mobile" ? 0.58 : 1;
    const nebulaDenseScale = qualityTier === "dense" ? 1.16 : 1.02;
    const baseOpacity = orbitAtlas ? 0.014 : tier === "solar" ? 0 : tier === "mid" ? 0.078 : 0.29;
    mat.uniforms.uOpacity.value = !enabled ? 0 : baseOpacity * cinematicScale * nebulaMobileScale * nebulaDenseScale;
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={-440} />
    </group>
  );
}
