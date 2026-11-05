"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import { SPIRAL_ARMS, CENTRAL_BAR } from "../data/galacticStructure";

const DISK_STAR_COUNT = 12000;
const HALO_STAR_COUNT = 1600;
const NEBULA_COUNT = 64;
const GALAXY_VISUAL_SCALE = 36;

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-6);
  const v = Math.max(rand(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return a.clone().lerp(b, THREE.MathUtils.clamp(t, 0, 1));
}

const STAR_VERTEX = /* glsl */ `
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
  gl_PointSize = aSize * uPixelRatio * (26000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 0.32, 2.8);
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const STAR_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
varying float vPS;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float core = exp(-d * d * 20.0);
  float halo = exp(-d * d * 4.5) * 0.22;
  float sizeAlpha = smoothstep(0.42, 2.2, vPS);
  vec3 color = vColor * (0.55 + core * 1.15);
  gl_FragColor = vec4(color, (core + halo) * sizeAlpha * vIntensity * uOpacity);
  #include <logdepthbuf_fragment>
}
`;

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
  gl_PointSize = aSize * uPixelRatio * (28000.0 / dist);
  gl_PointSize = clamp(gl_PointSize, 12.0, 92.0);
  vPS = gl_PointSize;
  gl_Position = projectionMatrix * mv;
  #include <logdepthbuf_vertex>
}
`;

const NEBULA_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vIntensity;
uniform float uOpacity;
#include <logdepthbuf_pars_fragment>
float softNoise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
void main() {
  vec2 p = gl_PointCoord - 0.5;
  float d = length(p);
  if (d > 0.5) discard;
  float n = softNoise(gl_PointCoord * 17.0) * 0.22 + softNoise(gl_PointCoord * 41.0) * 0.12;
  float body = smoothstep(0.5, 0.08, d);
  float core = exp(-d * d * 7.5);
  float alpha = (body * 0.18 + core * 0.16 + n * body) * vIntensity * uOpacity;
  gl_FragColor = vec4(vColor, alpha);
  #include <logdepthbuf_fragment>
}
`;

function createGalaxyStars() {
  const rand = mulberry32(20260513);
  const count = DISK_STAR_COUNT + HALO_STAR_COUNT;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const intensities = new Float32Array(count);
  const blueWhite = new THREE.Color("#b8d4ff");
  const warmWhite = new THREE.Color("#fff3cc");
  const amber = new THREE.Color("#ffb46a");
  const dustyBlue = new THREE.Color("#7896c8");

  // Compute total star density for proportional allocation
  const totalDensity = SPIRAL_ARMS.reduce((s, a) => s + a.starDensity, 0);
  const armCounts = SPIRAL_ARMS.map(a => Math.round(DISK_STAR_COUNT * a.starDensity / totalDensity));
  // Adjust last arm to ensure exact total
  const allocated = armCounts.reduce((s, c) => s + c, 0);
  armCounts[armCounts.length - 1] += DISK_STAR_COUNT - allocated;

  // Allocate some stars to the central bar (~12%)
  const barCount = Math.round(DISK_STAR_COUNT * 0.12);
  const armTotal = DISK_STAR_COUNT - barCount;
  const armCountsAdj = armCounts.map(c => Math.round(c * armTotal / DISK_STAR_COUNT));
  const adjAllocated = armCountsAdj.reduce((s, c) => s + c, 0);
  armCountsAdj[armCountsAdj.length - 1] += armTotal - adjAllocated;

  let idx = 0;

  // Central bar stars
  const barScale = GALAXY_VISUAL_SCALE * 1.0;
  for (let i = 0; i < barCount; i++) {
    const bx = gaussian(rand) * CENTRAL_BAR.halfLengthPc * barScale;
    const bz = gaussian(rand) * CENTRAL_BAR.widthPc * 0.5 * barScale;
    const by = gaussian(rand) * CENTRAL_BAR.thicknessPc * 0.3 * barScale;
    // Rotate by position angle
    const cos_a = Math.cos(CENTRAL_BAR.positionAngleRad);
    const sin_a = Math.sin(CENTRAL_BAR.positionAngleRad);
    const rx = bx * cos_a - bz * sin_a;
    const rz = bx * sin_a + bz * cos_a;
    const o = idx * 3;
    positions[o] = rx;
    positions[o + 1] = by;
    positions[o + 2] = rz;
    const tempPick = rand();
    const c = tempPick < 0.5
      ? lerpColor(warmWhite, amber, rand() * 0.4)
      : lerpColor(warmWhite, dustyBlue, rand() * 0.3);
    colors[o] = c.r;
    colors[o + 1] = c.g;
    colors[o + 2] = c.b;
    sizes[idx] = 1.5 + Math.pow(rand(), 4.2) * 8.0;
    intensities[idx] = 0.2 + Math.pow(rand(), 2.5) * 0.8;
    idx++;
  }

  // Spiral arm stars
  for (let a = 0; a < SPIRAL_ARMS.length; a++) {
    const arm = SPIRAL_ARMS[a];
    const nStars = armCountsAdj[a]!;
    const scale = GALAXY_VISUAL_SCALE * 1.0;

    for (let i = 0; i < nStars; i++) {
      // Radius distribution: weighted toward inner regions
      const rFrac = Math.pow(rand(), 0.65);
      const radius = (arm.radiusMinPc + rFrac * (arm.radiusMaxPc - arm.radiusMinPc)) * scale;

      // Logarithmic spiral angle
      const R0 = arm.radiusMinPc * scale;
      const pitch = arm.pitchAngleRad;
      const spiralAngle = arm.startAngleRad + Math.log(Math.max(radius, R0) / Math.max(R0, 1)) / Math.tan(Math.max(pitch, 0.05));

      // Scatter perpendicular to arm
      const jitter = gaussian(rand) * arm.widthPc * scale * 0.5;
      const vertical = gaussian(rand) * arm.thicknessPc * scale * 0.3;
      const theta = spiralAngle + jitter / Math.max(radius, 1);

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      const y = vertical;
      const o = idx * 3;
      positions[o] = x;
      positions[o + 1] = y;
      positions[o + 2] = z;

      const tempPick = rand();
      let c: THREE.Color;
      if (arm.colorBias === "blue") {
        c = lerpColor(blueWhite, dustyBlue, rand() * 0.6);
      } else if (arm.colorBias === "warm") {
        c = tempPick < 0.5
          ? lerpColor(warmWhite, amber, rand() * 0.5)
          : lerpColor(warmWhite, blueWhite, rand() * 0.3);
      } else {
        c = tempPick < 0.34
          ? lerpColor(blueWhite, warmWhite, rand() * 0.55)
          : tempPick < 0.78
            ? lerpColor(warmWhite, amber, rand() * 0.34)
            : lerpColor(dustyBlue, blueWhite, rand() * 0.45);
      }
      colors[o] = c.r;
      colors[o + 1] = c.g;
      colors[o + 2] = c.b;
      sizes[idx] = 1.5 + Math.pow(rand(), 4.2) * 10.0;
      intensities[idx] = 0.18 + Math.pow(rand(), 3.0) * 0.82;
      idx++;
    }
  }

  // Halo stars
  for (let i = 0; i < HALO_STAR_COUNT; i++) {
    const idx2 = DISK_STAR_COUNT + i;
    const r = 35000 + Math.pow(rand(), 0.38) * 250000;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const flatten = 0.55 + rand() * 0.25;
    const o = idx2 * 3;
    positions[o] = Math.sin(phi) * Math.cos(theta) * r;
    positions[o + 1] = Math.cos(phi) * r * flatten;
    positions[o + 2] = Math.sin(phi) * Math.sin(theta) * r;
    const c = lerpColor(dustyBlue, warmWhite, rand() * 0.55);
    colors[o] = c.r;
    colors[o + 1] = c.g;
    colors[o + 2] = c.b;
    sizes[idx2] = 1.0 + Math.pow(rand(), 4.8) * 6.5;
    intensities[idx2] = 0.1 + Math.pow(rand(), 2.5) * 0.45;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
  return geometry;
}

function createNebulaClouds() {
  const rand = mulberry32(424242);
  const positions = new Float32Array(NEBULA_COUNT * 3);
  const colors = new Float32Array(NEBULA_COUNT * 3);
  const sizes = new Float32Array(NEBULA_COUNT);
  const intensities = new Float32Array(NEBULA_COUNT);
  const blue = new THREE.Color("#4f78bc");
  const teal = new THREE.Color("#5a9e9d");
  const gold = new THREE.Color("#b99555");
  const smoke = new THREE.Color("#a9b1bb");
  const pink = new THREE.Color("#bc6f8c");

  // Weight arms by star density for nebula placement
  const totalD = SPIRAL_ARMS.reduce((s, a) => s + a.starDensity, 0);
  const armCdf: number[] = [];
  let cum = 0;
  for (const a of SPIRAL_ARMS) { cum += a.starDensity / totalD; armCdf.push(cum); }

  for (let i = 0; i < NEBULA_COUNT; i++) {
    // Pick arm by density-weighted CDF
    const pick = rand();
    let armIdx = 0;
    for (let a = 0; a < armCdf.length; a++) { if (pick < armCdf[a]!) { armIdx = a; break; } }
    const arm = SPIRAL_ARMS[armIdx]!;

    const scale = GALAXY_VISUAL_SCALE * 1.0;
    const rFrac = Math.pow(rand(), 0.5);
    const radius = (arm.radiusMinPc + rFrac * (arm.radiusMaxPc - arm.radiusMinPc)) * scale;
    const R0 = arm.radiusMinPc * scale;
    const spiralAngle = arm.startAngleRad + Math.log(Math.max(radius, R0) / Math.max(R0, 1)) / Math.tan(Math.max(arm.pitchAngleRad, 0.05));
    const theta = spiralAngle + gaussian(rand) * 0.18;
    const o = i * 3;
    positions[o] = Math.cos(theta) * radius + gaussian(rand) * 5200;
    positions[o + 1] = gaussian(rand) * (1800 + radius * 0.012);
    positions[o + 2] = Math.sin(theta) * radius + gaussian(rand) * 5200;
    const c = rand() < 0.35 ? lerpColor(blue, smoke, rand()) : rand() < 0.55 ? lerpColor(teal, smoke, rand() * 0.5) : rand() < 0.75 ? lerpColor(pink, smoke, rand() * 0.6) : lerpColor(gold, smoke, rand() * 0.6);
    colors[o] = c.r;
    colors[o + 1] = c.g;
    colors[o + 2] = c.b;
    sizes[i] = 45 + Math.pow(rand(), 0.45) * 260;
    intensities[i] = 0.18 + rand() * 0.58;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aIntensity", new THREE.BufferAttribute(intensities, 1));
  return geometry;
}

export default function GalacticScaleField({
  floatingOriginRef,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const starMatRef = useRef<THREE.ShaderMaterial>(null);
  const nebulaMatRef = useRef<THREE.ShaderMaterial>(null);

  const starGeometry = useMemo(() => createGalaxyStars(), []);
  const nebulaGeometry = useMemo(() => createNebulaClouds(), []);

  const starMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERTEX,
        fragmentShader: STAR_FRAGMENT,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        uniforms: {
          uOpacity: { value: 0.006 },
          uPixelRatio: { value: 1 },
        },
      }),
    []
  );

  const nebulaMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NEBULA_VERTEX,
        fragmentShader: NEBULA_FRAGMENT,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        toneMapped: false,
        uniforms: {
          uOpacity: { value: 0 },
          uPixelRatio: { value: 1 },
        },
      }),
    []
  );

  useFrame(() => {
    const tier = floatingOriginRef.current.lodTier;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.35);
    const starTarget = tier === "far" ? 0.095 : tier === "mid" ? 0.032 : 0.0;
    const nebulaTarget = tier === "far" ? 0.022 : tier === "mid" ? 0.006 : 0.0;

    starMaterial.uniforms.uPixelRatio.value = dpr;
    nebulaMaterial.uniforms.uPixelRatio.value = dpr;
    starMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      starMaterial.uniforms.uOpacity.value,
      starTarget,
      0.045
    );
    nebulaMaterial.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      nebulaMaterial.uniforms.uOpacity.value,
      nebulaTarget,
      0.045
    );

    if (rootRef.current) {
      rootRef.current.visible = tier !== "solar" && starMaterial.uniforms.uOpacity.value > 0.012;
      rootRef.current.rotation.y += tier === "solar" ? 0 : 0.000002;
    }
  });

  return (
    <group
      ref={rootRef}
      rotation={[-0.18, 0.7, 0.08]}
      scale={[GALAXY_VISUAL_SCALE, GALAXY_VISUAL_SCALE, GALAXY_VISUAL_SCALE]}
      renderOrder={-506}
    >
      <points frustumCulled={false} renderOrder={-506}>
        <primitive object={nebulaGeometry} attach="geometry" />
        <primitive object={nebulaMaterial} attach="material" ref={nebulaMatRef} />
      </points>
      <points frustumCulled={false} renderOrder={-501}>
        <primitive object={starGeometry} attach="geometry" />
        <primitive object={starMaterial} attach="material" ref={starMatRef} />
      </points>
    </group>
  );
}
