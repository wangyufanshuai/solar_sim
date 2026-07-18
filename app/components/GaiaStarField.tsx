"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import {
  gaiaStarToGalacticPc,
  gaiaOverlayColorToRgb,
  gaiaOverlayVisualBrightness,
  rankGaiaStarsForOverlay,
} from "../data/gaiaStarCatalog";
import {
  ensureGaiaCatalogLoaded,
  useGaiaCatalogSnapshot,
} from "../lib/gaiaCatalogStore";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";

/** 1 parsec in scene units. */
const PC_TO_SCENE = (206265 * AU_TO_SCENE); // 1 pc = 206265 AU

/** Scale factor: galactic coordinates in pc -> scene units.
 *  unitScale = GALACTIC_SCALE * AU_TO_SCENE ≈ scene units per parsec.
 *  At scale=1.5, 1pc ≈ 78 scene units; 100pc ≈ 7800; 200pc ≈ 15600. */
const GALACTIC_SCALE = 1.5;

export const GAIA_STARFIELD_RENDER_BUDGET = "v97-1000-1800-3000-preserved";
const MAX_INSTANCES = 1800;
/** Billboard half-size in scene units (scaled by instanceSize). */
const STAR_QUAD_HALF = 1.55;

/**
 * Efficient star field renderer using THREE.InstancedMesh.
 * Renders Gaia DR3 stars (or placeholder catalog) as billboarded quads.
 * Only mounts when LOD tier is mid or far to avoid GPU overhead in solar tier.
 */
export default function GaiaStarField({
  floatingOriginRef,
  renderEnabled = true,
  maxInstances = MAX_INSTANCES,
  opacityScale = 1,
  allowSolarTier = false,
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  renderEnabled?: boolean;
  maxInstances?: number;
  opacityScale?: number;
  allowSolarTier?: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const catalogSnapshot = useGaiaCatalogSnapshot();
  const [active, setActive] = useState(false);
  const dummyObj = useRef(new THREE.Object3D());

  useEffect(() => {
    void ensureGaiaCatalogLoaded();
  }, []);

  // The sky sphere already carries dense stars; keeping this off in solar
  // preserves interaction FPS while still allowing the source marker to load.
  useFrame(() => {
    const shouldMount = renderEnabled && (allowSolarTier || floatingOriginRef.current.lodTier !== "solar");
    if (shouldMount !== active) setActive(shouldMount);
  });

  const starData = useMemo(() => {
    const cat = catalogSnapshot.catalog;
    if (!cat) return null;

    const rankedStars = rankGaiaStarsForOverlay(cat.stars, maxInstances);
    const count = rankedStars.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const star = rankedStars[i]!;
      const [gx, gy, gz] = gaiaStarToGalacticPc(star);
      positions[i * 3] = gx;
      positions[i * 3 + 1] = gy;
      positions[i * 3 + 2] = gz;

      const brightness = gaiaOverlayVisualBrightness(star);
      const material = stellarMaterialProfile({
        id: star.sourceId,
        colorBpRp: star.colorBpRp,
        mag: star.magG,
        parallaxMas: star.parallaxMas,
      });
      sizes[i] = Math.max(0.14, Math.min(1.22, 0.66 + brightness * 0.44 + material.haloScale * 0.12));

      const [r, g, b] = gaiaOverlayColorToRgb(star.colorBpRp);
      const profileColor = new THREE.Color(material.color);
      colors[i * 3] = Math.min(1, (r * 0.55 + profileColor.r * 0.45) * brightness * material.coreIntensity);
      colors[i * 3 + 1] = Math.min(1, (g * 0.55 + profileColor.g * 0.45) * brightness * material.coreIntensity);
      colors[i * 3 + 2] = Math.min(1, (b * 0.55 + profileColor.b * 0.45) * brightness * material.coreIntensity);
    }

    return { positions, colors, sizes };
  }, [catalogSnapshot.catalog, maxInstances]);

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
          uOpacity: { value: 0.08 },
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
            float halo = 1.0 - smoothstep(0.0, 1.0, r2);
            float core = 1.0 - smoothstep(0.0, 0.18, r2);
            float diffraction = smoothstep(0.28, 0.34, r2) * (1.0 - smoothstep(0.34, 0.48, r2));
            vec3 col = vColor * (0.72 + core * 0.48) + vColor * diffraction * 0.18;
            float alpha = (halo * 0.58 + core * 0.55 + diffraction * 0.16) * uOpacity;
            gl_FragColor = vec4(col, alpha);
            #include <logdepthbuf_fragment>
          }
        `,
      }),
    []
  );

  const initialized = useRef(false);
  const cachedBasePositions = useRef<Float32Array | null>(null);
  const prevOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3(NaN, NaN, NaN));
  const prevOpacityTargetRef = useRef<number | null>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !starData) return;
    const mat = mesh.material as THREE.ShaderMaterial;
    const tier = floatingOriginRef.current.lodTier;
    const opacityTarget = (tier === "solar" ? 0.018 : tier === "mid" ? 0.04 : 0.08) * opacityScale;
    const previousGaiaUniformOpacityTarget = prevOpacityTargetRef.current;
    const currentOpacity = mat.uniforms.uOpacity.value as number;
    if (
      previousGaiaUniformOpacityTarget !== opacityTarget ||
      Math.abs(currentOpacity - opacityTarget) > 0.0005
    ) {
      mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(currentOpacity, opacityTarget, 0.06);
      prevOpacityTargetRef.current = opacityTarget;
    }

    if (!initialized.current) {
      initialized.current = true;
      const count = starData.positions.length / 3;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const instanceColor = new THREE.InstancedBufferAttribute(starData.colors, 3);
      instanceColor.setUsage(THREE.StaticDrawUsage);
      geometry.setAttribute("instanceColor", instanceColor);

      const instanceSize = new THREE.InstancedBufferAttribute(starData.sizes, 1);
      instanceSize.setUsage(THREE.StaticDrawUsage);
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

  // Don't mount InstancedMesh until mid/far tier
  if (!catalogSnapshot.catalog || !active) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, maxInstances]}
      frustumCulled={false}
      renderOrder={-490}
      count={0}
    />
  );
}
