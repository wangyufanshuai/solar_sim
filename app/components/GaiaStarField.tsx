"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import type { FloatingOriginState } from "../lib/floatingOrigin";
import {
  gaiaOverlayColorToRgb,
  rankGaiaStarsForOverlay,
  gaiaStarToGalacticPc,
  gaiaOverlayVisualBrightness,
  type GaiaStarCatalogData,
} from "../data/gaiaStarCatalog";
import {
  ensureGaiaCatalogLoaded,
  useGaiaCatalogSnapshot,
} from "../lib/gaiaCatalogStore";
import { buildGaiaStarfieldSectorIndex, selectGaiaStarfieldSectorIndices } from "../lib/gaiaStarfieldSector";
import { AU_TO_SCENE } from "../data/planetsJ2000";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import { acquireAtlasResource } from "../lib/atlasResourceLifecycle";

/** 1 parsec in scene units. */
const PC_TO_SCENE = 206265 * AU_TO_SCENE;
const GALACTIC_SCALE = 1.5;

export const GAIA_STARFIELD_RENDER_BUDGET = "v255-1000-4000-8000-sectorized";
const MAX_INSTANCES = 4000;
const STAR_QUAD_HALF = 1.55;

type GaiaRenderData = {
  sectorIndex: ReturnType<typeof buildGaiaStarfieldSectorIndex>;
  legacyRankedIndices: readonly number[];
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
};

const gaiaRenderBaseCache = new WeakMap<GaiaStarCatalogData, Omit<GaiaRenderData, "legacyRankedIndices">>();
const gaiaLegacyRankCache = new WeakMap<GaiaStarCatalogData, Map<number, readonly number[]>>();

/**
 * One InstancedMesh renders the active sector-selected subset. The full
 * catalog is converted once after the optional overlay loads; camera-sector
 * changes only rewrite the bounded instance attributes and matrices.
 */
export default function GaiaStarField({
  floatingOriginRef,
  renderEnabled = true,
  maxInstances = MAX_INSTANCES,
  opacityScale = 1,
  allowSolarTier = false,
  selectedSourceId = "",
}: {
  floatingOriginRef: MutableRefObject<FloatingOriginState>;
  renderEnabled?: boolean;
  maxInstances?: number;
  opacityScale?: number;
  allowSolarTier?: boolean;
  selectedSourceId?: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const catalogSnapshot = useGaiaCatalogSnapshot();
  const camera = useThree((state) => state.camera);
  const [active, setActive] = useState(false);
  const visualRendererProfile = useAtlasRuntimeStore(
    (snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile),
  );
  const catalogOpacityMultiplier = visualRendererProfile.catalogOpacityMultiplier
    * visualRendererProfile.groups.catalog.brightStarOpacity;
  useAtlasVisualRuntimeConsumerV300({
    profile: visualRendererProfile.id,
    group: "catalog",
    consumer: "GaiaStarField",
    tokenSignature: createAtlasVisualTokenSignatureV300(visualRendererProfile.groups.catalog),
  });
  const dummyObj = useRef(new THREE.Object3D());
  const cameraDirectionRef = useRef(new THREE.Vector3());
  const currentIndicesRef = useRef<number[]>([]);
  const selectionKeyRef = useRef("");
  const previousOffsetRef = useRef(new THREE.Vector3(NaN, NaN, NaN));
  const previousOpacityTargetRef = useRef<number | null>(null);

  useEffect(() => {
    if (active) void ensureGaiaCatalogLoaded();
  }, [active]);

  useFrame(() => {
    const shouldMount = renderEnabled && (allowSolarTier || floatingOriginRef.current.lodTier !== "solar");
    if (shouldMount !== active) setActive(shouldMount);
  });

  const renderData = useMemo<GaiaRenderData | null>(() => {
    const catalog = catalogSnapshot.catalog;
    if (!catalog) return null;
    const cat = catalog;
    let base = gaiaRenderBaseCache.get(cat);
    if (!base) {
      const sectorIndex = buildGaiaStarfieldSectorIndex(cat.stars);
      const count = sectorIndex.stars.length;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const unitScale = GALACTIC_SCALE * PC_TO_SCENE / 206265;
      for (let i = 0; i < count; i += 1) {
        const star = sectorIndex.stars[i]!;
        const [gx, gy, gz] = gaiaStarToGalacticPc(star);
        positions[i * 3] = gx * unitScale;
        positions[i * 3 + 1] = gy * unitScale;
        positions[i * 3 + 2] = gz * unitScale;
        const brightness = gaiaOverlayVisualBrightness(star);
        const material = stellarMaterialProfile({ id: star.sourceId, colorBpRp: star.colorBpRp, mag: star.magG, parallaxMas: star.parallaxMas });
        sizes[i] = Math.max(0.14, Math.min(1.22, 0.66 + brightness * 0.44 + material.haloScale * 0.12));
        const [r, g, b] = gaiaOverlayColorToRgb(star.colorBpRp);
        const profileColor = new THREE.Color(material.color);
        colors[i * 3] = Math.min(1, (r * 0.55 + profileColor.r * 0.45) * brightness * material.coreIntensity);
        colors[i * 3 + 1] = Math.min(1, (g * 0.55 + profileColor.g * 0.45) * brightness * material.coreIntensity);
        colors[i * 3 + 2] = Math.min(1, (b * 0.55 + profileColor.b * 0.45) * brightness * material.coreIntensity);
      }
      base = { sectorIndex, positions, colors, sizes };
      gaiaRenderBaseCache.set(cat, base);
    }
    let budgetCache = gaiaLegacyRankCache.get(cat);
    if (!budgetCache) {
      budgetCache = new Map();
      gaiaLegacyRankCache.set(cat, budgetCache);
    }
    let legacyRankedIndices = budgetCache.get(maxInstances);
    if (!legacyRankedIndices) {
      const legacyRanked = rankGaiaStarsForOverlay(cat.stars, maxInstances);
      const indexBySourceId = new Map(cat.stars.map((star, index) => [star.sourceId, index] as const));
      legacyRankedIndices = legacyRanked.map((star) => indexBySourceId.get(star.sourceId)).filter((index): index is number => index != null);
      budgetCache.set(maxInstances, legacyRankedIndices);
    }
    return { ...base, legacyRankedIndices };
  }, [catalogSnapshot.catalog, maxInstances]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      -0.5, -0.5, 0,
       0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5, -0.5, 0,
       0.5,  0.5, 0,
      -0.5,  0.5, 0,
    ]), 3));
    geo.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(new Float32Array(maxInstances * 3), 3));
    geo.setAttribute("instanceSize", new THREE.InstancedBufferAttribute(new Float32Array(maxInstances), 1));
    return geo;
  }, [maxInstances]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
        uniforms: { uHalfSize: { value: STAR_QUAD_HALF }, uOpacity: { value: 0.08 } },
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
            vec3 up = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);
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
    [],
  );

  useEffect(() => {
    selectionKeyRef.current = "";
    currentIndicesRef.current = [];
    previousOffsetRef.current.set(NaN, NaN, NaN);
  }, [renderData, maxInstances, selectedSourceId]);

  useEffect(() => {
    const estimatedBytes = (18 + maxInstances * 4 + maxInstances * 16) * Float32Array.BYTES_PER_ELEMENT;
    return acquireAtlasResource("gpu-buffer", "atlas", "catalog-bright-instanced-stars", {
      owner: "catalog",
      estimatedBytes,
    });
  }, [maxInstances]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !renderData) return;
    // Keep one InstancedMesh attached to the R3F tree for the lifetime of the
    // scene. Kerr/solar suppression only toggles visibility; unmounting and
    // remounting the mesh makes renderer object properties accumulate during
    // repeated scene-mode cycles.
    mesh.visible = active;
    if (!active) return;
    const tier = floatingOriginRef.current.lodTier;
    const distanceFalloffExponent = tier === "solar" ? 1 : tier === "mid" ? 0.5 : 0;
    const profileDistanceAttenuation = Math.pow(
      1 / Math.max(1e-6, visualRendererProfile.groups.catalog.distanceLuminanceFalloff),
      distanceFalloffExponent,
    );
    const opacityTarget = (tier === "solar" ? 0.018 : tier === "mid" ? 0.04 : 0.08)
      * opacityScale
      * catalogOpacityMultiplier
      * profileDistanceAttenuation;
    const currentOpacity = (mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value as number;
    if (previousOpacityTargetRef.current !== opacityTarget || Math.abs(currentOpacity - opacityTarget) > 0.0005) {
      (mesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value = THREE.MathUtils.lerp(currentOpacity, opacityTarget, 0.06);
      previousOpacityTargetRef.current = opacityTarget;
    }

    camera.getWorldDirection(cameraDirectionRef.current);
    const direction = cameraDirectionRef.current;
    const key = `${Math.round(direction.x * 12)}:${Math.round(direction.y * 12)}:${Math.round(direction.z * 12)}:${maxInstances}`;
    const selectionChanged = key !== selectionKeyRef.current;
    if (selectionChanged) {
      currentIndicesRef.current = selectGaiaStarfieldSectorIndices(
        renderData.sectorIndex,
        [direction.x, direction.y, direction.z],
        maxInstances,
        selectedSourceId,
      );
      if (currentIndicesRef.current.length < maxInstances) {
        const seen = new Set(currentIndicesRef.current);
        for (const starIndex of renderData.legacyRankedIndices) {
          if (seen.has(starIndex)) continue;
          seen.add(starIndex);
          currentIndicesRef.current.push(starIndex);
          if (currentIndicesRef.current.length >= maxInstances) break;
        }
      }
      selectionKeyRef.current = key;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const colors = geometry.getAttribute("instanceColor") as THREE.InstancedBufferAttribute;
      const sizes = geometry.getAttribute("instanceSize") as THREE.InstancedBufferAttribute;
      const colorArray = colors.array as Float32Array;
      const sizeArray = sizes.array as Float32Array;
      currentIndicesRef.current.forEach((starIndex, slot) => {
        colorArray[slot * 3] = renderData.colors[starIndex * 3]!;
        colorArray[slot * 3 + 1] = renderData.colors[starIndex * 3 + 1]!;
        colorArray[slot * 3 + 2] = renderData.colors[starIndex * 3 + 2]!;
        sizeArray[slot] = renderData.sizes[starIndex]!;
      });
      colors.needsUpdate = true;
      sizes.needsUpdate = true;
      mesh.count = currentIndicesRef.current.length;
    }

    const ox = floatingOriginRef.current.offsetScene.x;
    const oy = floatingOriginRef.current.offsetScene.y;
    const oz = floatingOriginRef.current.offsetScene.z;
    const previous = previousOffsetRef.current;
    if (!selectionChanged && previous.x === ox && previous.y === oy && previous.z === oz && mesh.visible) return;
    previous.set(ox, oy, oz);
    const dummy = dummyObj.current;
    currentIndicesRef.current.forEach((starIndex, slot) => {
      const offset = starIndex * 3;
      dummy.position.set(renderData.positions[offset]! - ox, renderData.positions[offset + 1]! - oy, renderData.positions[offset + 2]! - oz);
      dummy.updateMatrix();
      mesh.setMatrixAt(slot, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!catalogSnapshot.catalog) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, maxInstances]}
      frustumCulled={false}
      renderOrder={-490}
      count={0}
      visible={active}
    />
  );
}
