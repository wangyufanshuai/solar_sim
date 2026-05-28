"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import {
  type GaiaStarCatalogData,
  gaiaStarToGalacticPc,
  gaiaColorToRgb,
  generatePlaceholderCatalog,
} from "../data/gaiaStarCatalog";
import { AU_TO_SCENE } from "../data/planetsJ2000";

/** 1 parsec in scene units. */
const PC_TO_SCENE = (206265 * AU_TO_SCENE); // 1 pc = 206265 AU

/** Scale factor: galactic coordinates in pc -> scene units.
 *  unitScale = GALACTIC_SCALE * AU_TO_SCENE ≈ scene units per parsec.
 *  At scale=1.5, 1pc ≈ 78 scene units; 100pc ≈ 7800; 200pc ≈ 15600. */
const GALACTIC_SCALE = 1.5;

const MAX_INSTANCES = 1800;
/** Billboard half-size in scene units (scaled by instanceSize). */
const STAR_QUAD_HALF = 1.55;

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
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [catalog, setCatalog] = useState<GaiaStarCatalogData | null>(null);
  const [active, setActive] = useState(false);
  const dummyObj = useRef(new THREE.Object3D());

  useEffect(() => {
    setCatalog(generatePlaceholderCatalog(MAX_INSTANCES));
    setActive(true);
  }, []);

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
      sizes[i] = Math.max(0.28, 0.28 + brightness * 1.15);

      const [r, g, b] = gaiaColorToRgb(star.colorBpRp);
      colors[i * 3] = (0.86 + r * 0.14) * brightness;
      colors[i * 3 + 1] = (0.88 + g * 0.12) * brightness;
      colors[i * 3 + 2] = (0.92 + b * 0.08) * brightness;
    }

    return { positions, colors, sizes };
  }, [catalog]);

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

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !starData) return;
    const mat = mesh.material as THREE.ShaderMaterial;
    const tier = floatingOriginRef.current.lodTier;
    if (lastTierRef.current !== tier) {
      lastTierRef.current = tier;
      mat.uniforms.uOpacity.value = tier === "solar" ? 0.032 : tier === "mid" ? 0.052 : 0.095;
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
