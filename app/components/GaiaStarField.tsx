"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import {
  type GaiaStarCatalogData,
  type GaiaStarRecord,
  gaiaStarToGalacticPc,
  gaiaColorToRgb,
} from "../data/gaiaStarCatalog";
import { MAJOR_GAIA_STARS } from "../data/majorGaiaStars";
import { NEARBY_STARS } from "../data/nearbyStars";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { STARFIELD_RENDER_PROFILES } from "../lib/deepUniverseProfile";
import { VISUAL_CALIBRATION } from "../lib/visualCalibration";

/** 1 parsec in scene units. */
const PC_TO_SCENE = (206265 * AU_TO_SCENE); // 1 pc = 206265 AU

/** Scale factor: galactic coordinates in pc -> scene units.
 *  unitScale = GALACTIC_SCALE * AU_TO_SCENE ≈ scene units per parsec.
 *  At scale=1.5, 1pc ≈ 78 scene units; 100pc ≈ 7800; 200pc ≈ 15600. */
const GALACTIC_SCALE = 1.5;

const MAX_INSTANCES = 1800;
const BALANCED_INSTANCES = 650;
/** Billboard half-size in scene units (scaled by instanceSize). */
const STAR_QUAD_HALF = 1.55;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function spectralColorIndex(spectralType: string): number {
  const first = spectralType.trim().charAt(0).toUpperCase();
  if (first === "O" || first === "B") return -0.2;
  if (first === "A") return 0.02;
  if (first === "F") return 0.34;
  if (first === "G") return 0.68;
  if (first === "K") return 1.15;
  if (first === "M") return 2.1;
  return 0.82;
}

function deterministicStarCatalog(count: number): GaiaStarCatalogData {
  const rand = seededRandom(VISUAL_CALIBRATION.stars.deterministicSeed);
  const stars: GaiaStarRecord[] = [];
  for (const star of MAJOR_GAIA_STARS) {
    stars.push({
      sourceId: `gaia-major-${star.id}`,
      raDeg: star.raDeg,
      decDeg: star.decDeg,
      parallaxMas: star.gaiaParallaxMas && star.gaiaParallaxMas > 0 ? star.gaiaParallaxMas : 1000 / 180,
      magG: star.visualMag,
      colorBpRp: star.gaiaBpRp ?? spectralColorIndex(star.name),
    });
  }
  for (const star of NEARBY_STARS) {
    stars.push({
      sourceId: `nearby-${star.id}`,
      raDeg: star.raHours * 15,
      decDeg: star.decDeg,
      parallaxMas: 1000 / Math.max(0.1, star.distancePc),
      magG: star.magV,
      colorBpRp: spectralColorIndex(star.spectralType),
    });
  }
  for (let i = stars.length; i < count; i++) {
    const planeBias = rand() < 0.68;
    const raDeg = rand() * 360;
    const sinDec = planeBias ? (rand() - 0.5) * 0.62 : 2 * rand() - 1;
    const decDeg = Math.asin(THREE.MathUtils.clamp(sinDec, -1, 1)) * 180 / Math.PI;
    const distancePc = 12 + Math.pow(rand(), 1.85) * (planeBias ? 680 : 360);
    const hot = rand() < 0.18;
    const cool = rand() < 0.42;
    const colorBpRp = hot ? -0.24 + rand() * 0.42 : cool ? 1.0 + rand() * 2.1 : 0.22 + rand() * 1.1;
    const magG = planeBias ? 3.8 + rand() * 5.2 : 2.6 + rand() * 4.8;
    stars.push({
      sourceId: `gaia-faint-tier-${i}`,
      raDeg,
      decDeg,
      parallaxMas: 1000 / distancePc,
      magG,
      colorBpRp,
    });
  }
  return { stars: stars.slice(0, count), capacity: count, count: Math.min(count, stars.length) };
}

function apparentMagnitudeIntensity(mag: number): number {
  const relative = Math.pow(10, -0.4 * (mag + 1.46));
  return THREE.MathUtils.clamp(Math.pow(relative, 0.36), 0.055, 0.88);
}

/**
 * Efficient star field renderer using THREE.InstancedMesh.
 * Renders Gaia DR3 stars (or placeholder catalog) as billboarded quads.
 * Mounts in all LOD tiers at low opacity; instancing keeps the extra star layer cheap.
 */
export default function GaiaStarField({
  floatingOriginRef,
  highQuality = false,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  highQuality?: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [catalog, setCatalog] = useState<GaiaStarCatalogData | null>(null);
  const [active, setActive] = useState(false);
  const dummyObj = useRef(new THREE.Object3D());
  const profile = highQuality ? STARFIELD_RENDER_PROFILES["atlas-deep-universe"] : STARFIELD_RENDER_PROFILES["milky-way"];

  useEffect(() => {
    const instanceCount = highQuality ? MAX_INSTANCES : BALANCED_INSTANCES;
    setCatalog(deterministicStarCatalog(instanceCount));
    setActive(true);
  }, [highQuality]);

  const starData = useMemo(() => {
    const cat = catalog;
    if (!cat) return null;

    const positions = new Float32Array(cat.count * 3);
    const colors = new Float32Array(cat.count * 3);
    const sizes = new Float32Array(cat.count);

    for (let i = 0; i < cat.count; i++) {
      const star = cat.stars[i]!;
      const [gx, gy, gz] = gaiaStarToGalacticPc(star);
      positions[i * 3] = gx;
      positions[i * 3 + 1] = gy;
      positions[i * 3 + 2] = gz;

      const brightness = apparentMagnitudeIntensity(star.magG);
      sizes[i] = Math.max(0.22, (0.26 + brightness * 1.05) * profile.haloScale);

      const [r, g, b] = gaiaColorToRgb(star.colorBpRp);
      const colorStrength = profile.colorIndexStrength;
      colors[i * 3] = (0.88 * (1 - colorStrength) + r * colorStrength) * brightness;
      colors[i * 3 + 1] = (0.9 * (1 - colorStrength) + g * colorStrength) * brightness;
      colors[i * 3 + 2] = (0.94 * (1 - colorStrength) + b * colorStrength) * brightness;
    }

    return { positions, colors, sizes };
  }, [catalog, profile.colorIndexStrength, profile.haloScale]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -0.5, -0.5, 0,
       0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5,  0.5, 0,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
        uniforms: {
          uHalfSize: { value: STAR_QUAD_HALF },
          uOpacity: { value: 0.09 },
        },
        vertexShader: `
          uniform float uHalfSize;
          varying vec2 vLocalPos;
          varying vec3 vColor;
          attribute vec3 instanceColor;
          attribute float instanceSize;
          #include <common>
          #include <logdepthbuf_pars_vertex>
          void main() {
            vColor = instanceColor;
            vLocalPos = position.xy;
            vec3 right = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
            vec3 up    = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
            float s = uHalfSize * instanceSize;
            vec3 worldOffset = (position.x * right + position.y * up) * s;
            vec4 mvPos = modelViewMatrix * vec4(instanceMatrix[3].xyz + worldOffset, 1.0);
            gl_Position = projectionMatrix * mvPos;
            #include <logdepthbuf_vertex>
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying vec2 vLocalPos;
          varying vec3 vColor;
          #include <logdepthbuf_pars_fragment>
          void main() {
            float r2 = dot(vLocalPos, vLocalPos) * 4.0;
            if (r2 > 1.0) discard;
            float alpha = 1.0 - smoothstep(0.0, 1.0, r2);
            gl_FragColor = vec4(vColor, alpha * 0.72 * uOpacity);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    []
  );

  const initialized = useRef(false);
  const cachedBasePositions = useRef<Float32Array | null>(null);
  const prevOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(NaN, NaN, NaN));
  const lastTierRef = useRef<string | null>(null);

  useEffect(() => {
    initialized.current = false;
    cachedBasePositions.current = null;
    prevOffsetRef.current.set(NaN, NaN, NaN);
    lastTierRef.current = null;
  }, [starData]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !starData) return;
    const mat = mesh.material as THREE.ShaderMaterial;
    const tier = floatingOriginRef.current.lodTier;
    if (lastTierRef.current !== tier) {
      lastTierRef.current = tier;
      mat.uniforms.uOpacity.value =
        tier === "solar"
          ? profile.opacityByLod.solar
          : tier === "mid"
            ? profile.opacityByLod.mid
            : profile.opacityByLod.far;
    }

    if (!initialized.current) {
      initialized.current = true;
      const count = starData.positions.length / 3;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const instanceColor = new THREE.InstancedBufferAttribute(starData.colors, 3);
      instanceColor.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("instanceColor", instanceColor);

      const instanceSize = new THREE.InstancedBufferAttribute(starData.sizes, 1);
      instanceSize.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("instanceSize", instanceSize);

      mesh.count = count;

      const unitScale = GALACTIC_SCALE * PC_TO_SCENE / 206265;
      const base = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        base[i * 3] = starData.positions[i * 3]! * unitScale;
        base[i * 3 + 1] = starData.positions[i * 3 + 1]! * unitScale;
        base[i * 3 + 2] = starData.positions[i * 3 + 2]! * unitScale;
      }
      cachedBasePositions.current = base;
    }

    // Skip matrix update if offset hasn't changed
    const ox = floatingOriginRef.current.offsetScene.x;
    const oy = floatingOriginRef.current.offsetScene.y;
    const oz = floatingOriginRef.current.offsetScene.z;
    const prev = prevOffsetRef.current;
    if (prev.x === ox && prev.y === oy && prev.z === oz && mesh.visible) return;
    prev.set(ox, oy, oz);

    const base = cachedBasePositions.current!;
    const count = base.length / 3;
    const dummy = dummyObj.current;

    for (let i = 0; i < count; i++) {
      const o = i * 3;
      dummy.position.set(base[o]! - ox, base[o + 1]! - oy, base[o + 2]! - oz);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!catalog || !active) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_INSTANCES]}
      frustumCulled={false}
      renderOrder={-490}
      count={0}
    />
  );
}
