"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { BRIGHT_STARS_TIER1, BRIGHT_STARS_TIER2 } from "../data/brightStarCatalog";

const SPHERE_RADIUS = 8000;

const VERTEX = /* glsl */ `
attribute float aSize;
attribute vec3 aStarColor;
varying vec3 vColor;
varying float vPS;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vColor = aStarColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize;
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vPS;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float edge = 1.0 - smoothstep(0.36, 0.5, d);
  float core = exp(-d * d * 18.0);
  float halo = exp(-d * d * 7.0) * 0.10;
  float alpha = 0.78 + core * 0.22 + halo;
  float sizeAlpha = smoothstep(1.4, 3.2, vPS);
  vec3 col = vColor * (1.25 + core * 0.95);
  gl_FragColor = vec4(col, alpha * edge * (0.72 + 0.28 * sizeAlpha) * uOpacity);
  #include <logdepthbuf_fragment>
}
`;

function raDecToXYZ(raHours: number, decDeg: number, radius: number): [number, number, number] {
  const ra = (raHours / 24) * Math.PI * 2;
  const dec = (decDeg / 180) * Math.PI;
  const x = radius * Math.cos(dec) * Math.cos(ra);
  const y = radius * Math.sin(dec);
  const z = -radius * Math.cos(dec) * Math.sin(ra);
  return [x, y, z];
}

export default function BrightStarCatalog({
  opacity = 1,
  tier2Loaded = false,
}: {
  opacity?: number;
  tier2Loaded?: boolean;
}) {
  const { size } = useThree();
  const dpr = size.width > 0 ? Math.min(window.devicePixelRatio, 2) : 1;

  const stars = useMemo(
    () => (tier2Loaded ? [...BRIGHT_STARS_TIER1, ...BRIGHT_STARS_TIER2] : BRIGHT_STARS_TIER1),
    [tier2Loaded],
  );

  const { geometry, material } = useMemo(() => {
    const count = stars.length;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const star = stars[i]!;
      const [x, y, z] = raDecToXYZ(star.raHours, star.decDeg, SPHERE_RADIUS);
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      colors[i * 3] = star.r;
      colors[i * 3 + 1] = star.g;
      colors[i * 3 + 2] = star.b;
      const bright = Math.max(0, (3.5 - star.magV) / 5.0);
      // Keep the curated catalogue legible after the V9 sky is downsampled to
      // the display.  Sub-pixel points disappear at common desktop sampling
      // phases; a restrained 3.8-8.6 px point remains sparse while preserving
      // the catalogue position, colour and magnitude ordering.
      sizes[i] = (3.8 + bright * 4.8) * dpr;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geom.setAttribute("aStarColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: opacity },
      },
    });

    return { geometry: geom, material: mat };
  }, [dpr, opacity, stars]);

  material.uniforms.uOpacity.value = opacity;

  return (
    <points frustumCulled={false} renderOrder={-502}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  );
}
