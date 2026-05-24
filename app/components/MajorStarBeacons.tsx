"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { MAJOR_GAIA_STARS } from "../data/majorGaiaStars";
import { gaiaColorToRgb } from "../data/gaiaStarCatalog";

const SPHERE_RADIUS = 8400;

const STAR_VERTEX = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
varying vec3 vColor;
varying float vSize;
uniform float uPixelRatio;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vColor = aColor;
  vSize = aSize;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const STAR_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vSize;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float core = exp(-d * d * 26.0);
  float halo = exp(-d * d * 3.2) * 0.36;
  float cross = pow(1.0 - min(1.0, abs(c.x) * 18.0), 2.0) + pow(1.0 - min(1.0, abs(c.y) * 18.0), 2.0);
  float edge = smoothstep(0.5, 0.08, d);
  float alpha = (core + halo + cross * 0.055) * edge * uOpacity;
  gl_FragColor = vec4(vColor * (0.58 + core * 1.85), alpha);
  #include <logdepthbuf_fragment>
}
`;

function raDegDecToXYZ(raDeg: number, decDeg: number, radius: number): [number, number, number] {
  const ra = (raDeg / 180) * Math.PI;
  const dec = (decDeg / 180) * Math.PI;
  return [
    radius * Math.cos(dec) * Math.cos(ra),
    radius * Math.sin(dec),
    -radius * Math.cos(dec) * Math.sin(ra),
  ];
}

export default function MajorStarBeacons({
  floatingOriginRef,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const lastTierRef = useRef<string | null>(null);

  const { geometry, material } = useMemo(() => {
    const stars = MAJOR_GAIA_STARS;
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);

    for (let i = 0; i < stars.length; i++) {
      const star = stars[i]!;
      const position = raDegDecToXYZ(star.raDeg, star.decDeg, SPHERE_RADIUS);
      positions.set(position, i * 3);
      const color = gaiaColorToRgb(star.gaiaBpRp ?? 0.45);
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
      sizes[i] = THREE.MathUtils.clamp(9.8 - star.visualMag * 1.65, 4.8, 12.5);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: {
        uPixelRatio: { value: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2) },
        uOpacity: { value: 0 },
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
    if (lastTierRef.current === tier) return;
    lastTierRef.current = tier;
    const mat = points.material as THREE.ShaderMaterial;
    mat.uniforms.uOpacity.value = tier === "solar" ? 0.26 : tier === "mid" ? 0.56 : 0.76;
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={-498} />
    </group>
  );
}
